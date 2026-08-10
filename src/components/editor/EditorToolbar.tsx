"use client";

/**
 * EditorToolbar — TipTap 工具栏
 *
 * 提供基础排版按钮：加粗、斜体、标题、列表、引用、撤销/重做。
 * 按钮状态根据编辑器当前激活的标记自动高亮。
 *
 * 所有功能来自 StarterKit 自带扩展，不需要额外安装。
 */

import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

/** 工具按钮定义 */
interface ToolButton {
  action: string;
  label: string;
  title: string;
  className?: string;
}

interface ToolDivider {
  divider: true;
}

const TOOLBAR_ITEMS: (ToolButton | ToolDivider)[] = [
  { action: "bold", label: "B", title: "加粗 (Ctrl+B)", className: "font-bold" },
  { action: "italic", label: "I", title: "斜体 (Ctrl+I)", className: "italic" },
  { divider: true },
  { action: "heading1", label: "H1", title: "一级标题" },
  { action: "heading2", label: "H2", title: "二级标题" },
  { divider: true },
  { action: "bulletList", label: "•", title: "无序列表" },
  { action: "orderedList", label: "1.", title: "有序列表" },
  { action: "blockquote", label: "❝", title: "引用" },
  { divider: true },
  { action: "undo", label: "↶", title: "撤销 (Ctrl+Z)" },
  { action: "redo", label: "↷", title: "重做 (Ctrl+Y)" },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return <div className="h-[42px] border-b border-gray-200" />;
  }

  /** 执行编辑器命令 */
  const runCommand = (action: string) => {
    const chain = editor.chain().focus();
    switch (action) {
      case "bold":
        chain.toggleBold().run();
        break;
      case "italic":
        chain.toggleItalic().run();
        break;
      case "heading1":
        chain.toggleHeading({ level: 1 }).run();
        break;
      case "heading2":
        chain.toggleHeading({ level: 2 }).run();
        break;
      case "bulletList":
        chain.toggleBulletList().run();
        break;
      case "orderedList":
        chain.toggleOrderedList().run();
        break;
      case "blockquote":
        chain.toggleBlockquote().run();
        break;
      case "undo":
        chain.undo().run();
        break;
      case "redo":
        chain.redo().run();
        break;
    }
  };

  /** 检查按钮是否激活（高亮） */
  const isButtonActive = (action: string): boolean => {
    switch (action) {
      case "bold":
        return editor.isActive("bold");
      case "italic":
        return editor.isActive("italic");
      case "heading1":
        return editor.isActive("heading", { level: 1 });
      case "heading2":
        return editor.isActive("heading", { level: 2 });
      case "bulletList":
        return editor.isActive("bulletList");
      case "orderedList":
        return editor.isActive("orderedList");
      case "blockquote":
        return editor.isActive("blockquote");
      default:
        return false;
    }
  };

  return (
    <div className="flex items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-3 py-1.5">
      {TOOLBAR_ITEMS.map((item, idx) => {
        if ("divider" in item) {
          return (
            <div key={idx} className="mx-1.5 h-5 w-px bg-gray-200" />
          );
        }

        const active = isButtonActive(item.action);

        return (
          <button
            key={idx}
            type="button"
            onClick={() => runCommand(item.action)}
            title={item.title}
            className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors ${
              active
                ? "bg-primary-light text-primary"
                : "text-gray-600 hover:bg-gray-200"
            } ${item.className ?? ""}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
