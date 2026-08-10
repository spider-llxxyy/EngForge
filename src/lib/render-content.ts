/**
 * TipTap JSON → HTML 只读渲染
 *
 * 在 Server Component 中调用，把 essay_versions.content (TipTap JSON)
 * 转成 HTML 字符串，前端用 dangerouslySetInnerHTML 展示。
 * 不需要在客户端初始化编辑器实例，性能好。
 *
 * extensions 必须和编辑器（EditorClient.tsx）保持一致，
 * 否则某些节点类型无法正确序列化。
 */

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/react";

/**
 * 把 TipTap JSON 文档转为 HTML 字符串。
 *
 * @param content — essay_versions.content 字段（TipTap JSON）
 * @returns HTML 字符串，可直接 dangerouslySetInnerHTML
 */
export function renderContentToHTML(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "<p></p>";
  }

  try {
    return generateHTML(content as JSONContent, [StarterKit]);
  } catch (err) {
    console.error("Failed to render TipTap content:", err);
    return "<p>内容渲染失败</p>";
  }
}
