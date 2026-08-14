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
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  type LucideIcon,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

/** 工具按钮定义 */
interface ToolButton {
  action: string;
  icon: LucideIcon;
  title: string;
}

interface ToolDivider {
  divider: true;
}

const TOOLBAR_ITEMS: (ToolButton | ToolDivider)[] = [
  { action: "bold", icon: Bold, title: "加粗 (Ctrl+B)" },
  { action: "italic", icon: Italic, title: "斜体 (Ctrl+I)" },
  { divider: true },
  { action: "heading1", icon: Heading1, title: "一级标题" },
  { action: "heading2", icon: Heading2, title: "二级标题" },
  { divider: true },
  { action: "bulletList", icon: List, title: "无序列表" },
  { action: "orderedList", icon: ListOrdered, title: "有序列表" },
  { action: "blockquote", icon: Quote, title: "引用" },
  { divider: true },
  { action: "undo", icon: Undo2, title: "撤销 (Ctrl+Z)" },
  { action: "redo", icon: Redo2, title: "重做 (Ctrl+Y)" },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return <div className="h-[42px] border-b border-zinc-200" />;
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
    <div className="flex items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5">
      {TOOLBAR_ITEMS.map((item, idx) => {
        if ("divider" in item) {
          return (
            <div key={idx} className="mx-1.5 h-5 w-px bg-zinc-200" />
          );
        }

        const active = isButtonActive(item.action);
        const Icon = item.icon;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => runCommand(item.action)}
            title={item.title}
            className={`flex h-8 min-w-8 items-center justify-center rounded px-2 transition-colors ${
              active
                ? "bg-primary-light text-primary"
                : "text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
