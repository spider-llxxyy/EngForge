/**
 * 英文单词计数工具
 *
 * 英语作文场景：按英文单词计数（不是字符数）。
 * 缩写（it's, don't）算一个词。
 * 纯中文、标点、数字不计入。
 */

/**
 * 从纯文本中计算英文单词数。
 * 匹配规则：连续字母序列，允许中间有撇号（缩写）。
 *
 * @example
 *   countWords("It's a good day.") → 4
 *   countWords("你好 world") → 1
 *   countWords("") → 0
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g);
  return matches ? matches.length : 0;
}

/**
 * 从 TipTap JSON 内容中提取纯文本，再计算单词数。
 *
 * TipTap 的 JSON 是 ProseMirror 文档结构：
 *   { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] }
 *
 * 这个函数递归遍历所有节点，拼接 text 节点的 text 字段。
 */
export function countWordsFromTiptap(doc: unknown): number {
  const text = extractPlainText(doc);
  return countWords(text);
}

/**
 * 递归提取 TipTap 文档的纯文本。
 * 用于：1) 单词计数  2) 存入 essay_versions.plain_text
 */
export function extractPlainText(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";

  const node = doc as { type?: string; text?: string; content?: unknown[] };

  // text 节点：直接返回 text 字段
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  // doc / paragraph / heading 等容器节点：递归拼接子节点
  if (Array.isArray(node.content)) {
    return node.content
      .map((child) => extractPlainText(child))
      .join(node.type === "paragraph" || node.type === "heading" ? "\n" : "");
  }

  return "";
}
