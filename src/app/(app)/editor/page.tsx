/**
 * 新建作文页面 — /editor
 *
 * Server Component：认证由 (app)/layout.tsx 处理（未登录 redirect /login）。
 * 此页面直接渲染 EditorClient，mode="new"。
 *
 * EditorClient 负责全部交互逻辑：
 * 元数据表单 + TipTap 编辑器 + 草稿自动保存 + 发布 → 创建 essay + v1
 */

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { EditorClient } from "@/components/editor/EditorClient";

export default async function NewEssayPage() {
  // 认证由 (app)/layout.tsx 兜底，这里再取一次用户 ID 用于草稿隔离
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <EditorClient mode="new" userId={user.id} />;
}
