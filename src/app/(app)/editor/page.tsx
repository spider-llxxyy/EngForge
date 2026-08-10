/**
 * 新建作文页面 — /editor
 *
 * Server Component：认证由 (app)/layout.tsx 处理（未登录 redirect /login）。
 * 此页面直接渲染 EditorClient，mode="new"。
 *
 * EditorClient 负责全部交互逻辑：
 * 元数据表单 + TipTap 编辑器 + 草稿自动保存 + 发布 → 创建 essay + v1
 */

import { EditorClient } from "@/components/editor/EditorClient";

export default function NewEssayPage() {
  return <EditorClient mode="new" />;
}
