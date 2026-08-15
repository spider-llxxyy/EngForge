"use client";

/**
 * PrEditorClient — PR 编辑器客户端组件
 *
 * 协作者在此编辑批改内容，预载当前版本到 TipTap 编辑器，
 * 填写 PR 标题和描述后提交，调用 createPullRequest Server Action。
 *
 * 复用 EditorToolbar（TipTap 工具栏），但不复用 EditorClient
 * （后者绑定了 essay 元数据表单、localStorage 草稿、AI 面板等逻辑）。
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { createPullRequest } from "@/lib/essay-actions";
import { extractPlainText, countWords } from "@/lib/word-count";
import type { Json } from "@/types/database";

interface PrEditorClientProps {
  essayId: string;
  essayTitle: string;
  initialContent: unknown; // TipTap JSON
}

export function PrEditorClient({
  essayId,
  essayTitle,
  initialContent,
}: PrEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prTitle, setPrTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plainText, setPlainText] = useState("");

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

  const wordCount = useMemo(() => countWords(plainText), [plainText]);

  const handleSubmit = () => {
    if (!editor) return;

    if (!prTitle.trim()) {
      toast.error("请输入批改标题");
      return;
    }

    const content = editor.getJSON() as Json;
    const text = extractPlainText(content);
    const wc = countWords(text);

    if (wc === 0) {
      toast.error("批改内容不能为空");
      return;
    }

    startTransition(async () => {
      const result = await createPullRequest({
        essayId,
        title: prTitle,
        description,
        content,
        plainText: text,
        wordCount: wc,
      });

      if (result.success && result.prId) {
        toast.success("批改请求已提交");
        router.push(`/essays/${essayId}/prs/${result.prId}`);
      } else {
        toast.error("提交失败", {
          description: result.error ?? "请稍后重试",
        });
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col">
      {/* 顶部：返回链接 + PR 信息 */}
      <div className="border-b border-zinc-200 bg-white px-8 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/essays/${essayId}`}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            返回详情
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-sm text-zinc-500">提交批改</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          批改作文「{essayTitle}」
        </p>
      </div>

      {/* PR 标题 + 描述 */}
      <div className="border-b border-zinc-200 bg-white px-8 py-4">
        <input
          type="text"
          value={prTitle}
          onChange={(e) => setPrTitle(e.target.value)}
          placeholder="批改标题（如：改善第二段论证逻辑）..."
          className="w-full text-lg font-semibold text-zinc-950 outline-none placeholder:text-zinc-300"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="批改说明（可选）：简要说明你修改了什么、为什么..."
          rows={2}
          className="mt-2 w-full resize-none text-sm text-zinc-700 outline-none placeholder:text-zinc-300"
        />

        {/* 底部操作行 */}
        <div className="mt-3 flex items-center gap-4">
          <span className="text-sm text-zinc-400">{wordCount} 词</span>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="ml-auto rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "提交中..." : "提交批改请求"}
          </button>
        </div>
      </div>

      {/* 编辑器 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <EditorToolbar editor={editor} />
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto max-w-[760px] px-12 py-8">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
