"use client";

/**
 * ============================================
 * EditorClient — 作文编辑器客户端组件
 * ============================================
 *
 * 这是编辑器的核心组件，包含：
 * 1. TipTap 富文本编辑器（通过 useEditor hook 创建）
 * 2. 元数据表单（标题、标签、可见性）
 * 3. localStorage 草稿自动保存（debounce 2s）
 * 4. 草稿恢复提示
 * 5. 发布逻辑（调用 Server Action → 创建 essay + v1 / 新版本）
 * 6. AI 标注面板（实时扫描 + 点击替换）
 * 7. 英文字数统计
 *
 * 两种模式：
 * - mode="new"  → 新建作文，发布时创建 essay + v1
 * - mode="edit" → 编辑已有作文，发布时创建新版本
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  useState,
  useEffect,
  useTransition,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { EditorToolbar } from "./EditorToolbar";
import { AiSuggestions } from "./AiSuggestions";
import { publishNewEssay, publishNewVersion } from "@/lib/essay-actions";
import { extractPlainText, countWords } from "@/lib/word-count";
import type { Json } from "@/types/database";
import type { EssayVisibility } from "@/types";

// ──────────────────────────────────────────────
// 常量
// ──────────────────────────────────────────────

/** 标签选项（值为存入数据库的 key，label 为显示文字） */
const TAG_OPTIONS: { value: string; label: string }[] = [
  { value: "kaoyan", label: "考研大作文" },
  { value: "gaokao", label: "高考作文" },
  { value: "cet4", label: "CET-4" },
  { value: "cet6", label: "CET-6" },
  { value: "other", label: "自由写作" },
];

/** 可见性选项 */
const VISIBILITY_OPTIONS: { value: EssayVisibility; label: string; desc: string }[] = [
  { value: "private", label: "私密", desc: "仅自己可见" },
  { value: "invite", label: "邀请可见", desc: "凭邀请码加入" },
  { value: "public", label: "公开", desc: "所有人可见" },
];

/** localStorage 草稿 key 前缀 */
const DRAFT_KEY_PREFIX = "engforge-draft-";

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface EditorClientProps {
  mode: "new" | "edit";
  essayId?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialVisibility?: EssayVisibility;
  initialContent?: unknown; // TipTap JSON 文档
}

// ──────────────────────────────────────────────
// 组件
// ──────────────────────────────────────────────

export function EditorClient({
  mode,
  essayId,
  initialTitle = "",
  initialTags = ["kaoyan"],
  initialVisibility = "private",
  initialContent,
}: EditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── 元数据状态 ──
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [visibility, setVisibility] = useState<EssayVisibility>(initialVisibility);

  // ── 编辑器文本状态 ──
  const [plainText, setPlainText] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);

  const draftKey = DRAFT_KEY_PREFIX + (essayId ?? "new");

  // ── 草稿检测（lazy initializer，避免在 effect 中调用 setState）──
  // 在组件首次渲染时检查 localStorage，如果有草稿则直接设为初始状态
  const [draftCheck] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return null;
      const draft = JSON.parse(saved);
      const hasContent =
        draft.title ||
        (draft.content &&
          JSON.stringify(draft.content) !==
            '{"type":"doc","content":[{"type":"paragraph"}]}');
      if (hasContent) {
        return { savedAt: draft.savedAt as string };
      }
    } catch {
      // 草稿损坏，忽略
    }
    return null;
  });

  // ── 草稿状态 ──
  const [showDraftNotice, setShowDraftNotice] = useState(!!draftCheck);
  const [draftTime, setDraftTime] = useState<string | null>(
    draftCheck?.savedAt ?? null
  );

  // ── TipTap 编辑器 ──
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: "tiptap-content",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor }) => {
      const text = extractPlainText(editor.getJSON());
      setPlainText(text);
    },
  });

  // ── 字数统计 ──
  const wordCount = useMemo(() => countWords(plainText), [plainText]);

  // ── 草稿自动保存（debounce 2s）──
  // 监听 title / tags / visibility / plainText 变化
  // plainText 变化意味着编辑器内容变化（onUpdate 触发）
  useEffect(() => {
    if (!editor) return;

    // 初次挂载时不立即保存（避免覆盖已有草稿）
    const timer = setTimeout(() => {
      const draft = {
        title,
        tags,
        visibility,
        content: editor.getJSON(),
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftTime(draft.savedAt);
      } catch {
        // localStorage 满或不可用，静默失败
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [editor, title, tags, visibility, plainText, draftKey]);

  // ── 恢复草稿 ──
  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const draft = JSON.parse(saved);
      setTitle(draft.title ?? "");
      setTags(draft.tags ?? ["kaoyan"]);
      setVisibility(draft.visibility ?? "private");
      if (draft.content && editor) {
        editor.commands.setContent(draft.content);
        setPlainText(extractPlainText(draft.content));
      }
    } catch {
      // 忽略
    }
    setShowDraftNotice(false);
  };

  // ── 丢弃草稿 ──
  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setShowDraftNotice(false);
    setDraftTime(null);
  };

  // ── 发布 ──
  const handlePublish = () => {
    if (!editor) return;
    setPublishError(null);

    if (!title.trim()) {
      setPublishError("请输入作文标题");
      return;
    }

    const content = editor.getJSON() as Json;
    const text = extractPlainText(content);
    const wc = countWords(text);

    if (wc === 0) {
      setPublishError("作文内容不能为空");
      return;
    }

    startTransition(async () => {
      let result;
      if (mode === "new") {
        result = await publishNewEssay({
          title,
          tags,
          visibility,
          content,
          plainText: text,
          wordCount: wc,
        });
      } else {
        result = await publishNewVersion({
          essayId: essayId!,
          content,
          plainText: text,
          wordCount: wc,
        });
      }

      if (result.success) {
        // 清除草稿
        localStorage.removeItem(draftKey);
        router.push("/dashboard");
      } else {
        setPublishError(result.error ?? "发布失败，请重试");
      }
    });
  };

  // ── AI 替换：在编辑器中替换第一个匹配的原词 ──
  const handleAiReplace = (originalWord: string, suggestion: string) => {
    if (!editor) return;

    const { state, view } = editor;
    const { tr } = state;
    let replaced = false;
    const lowerOriginal = originalWord.toLowerCase();

    // 遍历文档中的文本节点，找到第一个匹配
    state.doc.descendants((node, pos) => {
      if (replaced) return false;
      if (node.isText && node.text) {
        const text = node.text;
        const index = text.toLowerCase().indexOf(lowerOriginal);
        if (index !== -1) {
          const from = pos + index;
          const to = from + originalWord.length;
          tr.insertText(suggestion, from, to);
          replaced = true;
          return false;
        }
      }
      return true;
    });

    if (replaced) {
      view.dispatch(tr);
      // 更新纯文本（触发 AI 面板重新扫描）
      setPlainText(extractPlainText(editor.getJSON()));
    }
  };

  // ── 格式化草稿时间 ──
  const draftTimeText = draftTime
    ? new Date(draftTime).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col">
      {/* ── 草稿恢复提示 ── */}
      {showDraftNotice && (
        <div className="flex items-center justify-between bg-amber-light px-8 py-2 text-sm">
          <span className="text-amber">
            检测到 {draftTimeText} 的未保存草稿，是否恢复？
          </span>
          <div className="flex gap-2">
            <button
              onClick={restoreDraft}
              className="rounded bg-amber px-3 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              恢复草稿
            </button>
            <button
              onClick={discardDraft}
              className="rounded border border-amber/30 bg-white px-3 py-1 text-xs text-amber hover:bg-amber-light"
            >
              丢弃
            </button>
          </div>
        </div>
      )}

      {/* ── 元数据栏 ── */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        {/* 标题输入 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="作文标题..."
          className="w-full text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300"
        />

        {/* 元数据操作行 */}
        <div className="mt-3 flex items-center gap-4">
          {/* 标签选择 */}
          <select
            value={tags[0] ?? "kaoyan"}
            onChange={(e) => setTags([e.target.value])}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-primary"
          >
            {TAG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* 可见性 */}
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as EssayVisibility)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-primary"
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} · {opt.desc}
              </option>
            ))}
          </select>

          {/* 字数统计 */}
          <span className="text-sm text-gray-400">
            {wordCount} 词
          </span>

          {/* 草稿状态 */}
          {draftTime && !showDraftNotice && (
            <span className="text-xs text-gray-400">
              已自动保存 {draftTimeText}
            </span>
          )}

          {/* 发布按钮 */}
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="ml-auto rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? "发布中..."
              : mode === "new"
                ? "发布"
                : "发布新版本"}
          </button>
        </div>
      </div>

      {/* ── 编辑器 + AI 面板 ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左：工具栏 + 编辑器 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <EditorToolbar editor={editor} />
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="mx-auto max-w-[760px] px-12 py-8">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* 右：AI 标注面板 */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white">
          <AiSuggestions text={plainText} onReplace={handleAiReplace} />
        </div>
      </div>

      {/* ── 发布错误提示 ── */}
      {publishError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-red px-4 py-2.5 text-sm text-white shadow-lg">
          {publishError}
          <button
            onClick={() => setPublishError(null)}
            className="ml-3 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
