/**
 * TipTap JSON → HTML 只读渲染（带 XSS 防护）
 *
 * 在 Server Component 中调用，把 essay_versions.content (TipTap JSON)
 * 转成 HTML 字符串，经过 DOMPurify sanitize 后返回。
 * 前端用 dangerouslySetInnerHTML 展示——此时 HTML 已被消毒，安全。
 *
 * 为什么需要 sanitize？
 * - generateHTML 本身不注入恶意代码，但如果 DB 中的 TipTap JSON 被篡改
 *   （例如直接操作数据库、SQL 注入、Supabase 管理面板修改），
 *   可能产生包含 <script> / onerror 等危险标签的 HTML。
 * - isomorphic-dompurify 在服务端 strip 掉所有危险标签和属性，
 *   只保留安全的 HTML 结构（p/h1/h2/ul/ol/blockquote/code/pre 等）。
 *
 * extensions 必须和编辑器（EditorClient.tsx）保持一致，
 * 否则某些节点类型无法正确序列化。
 */

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/react";
import DOMPurify from "isomorphic-dompurify";

/**
 * 允许的 HTML 标签白名单——和 TipTap StarterKit 输出的标签对齐。
 * 不在白名单中的标签会被 DOMPurify 移除。
 */
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "strong", "em", "s", "u",
  "span", "div",
];

/**
 * 允许的 HTML 属性白名单——几乎不需要任何属性。
 * TipTap 生成的 HTML 是纯结构标签，不含 class/style 等。
 */
const ALLOWED_ATTR: string[] = [];

/**
 * 把 TipTap JSON 文档转为经过 sanitize 的 HTML 字符串。
 *
 * @param content — essay_versions.content 字段（TipTap JSON）
 * @returns 安全的 HTML 字符串，可直接 dangerouslySetInnerHTML
 */
export function renderContentToHTML(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "<p></p>";
  }

  try {
    const rawHTML = generateHTML(content as JSONContent, [StarterKit]);

    // sanitize：strip 所有 <script> / onerror / javascript: 等危险内容
    const cleanHTML = DOMPurify.sanitize(rawHTML, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      // 额外安全选项
      FORBID_TAGS: ["style", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
    });

    return cleanHTML;
  } catch (err) {
    console.error("Failed to render TipTap content:", err);
    return "<p>内容渲染失败</p>";
  }
}
