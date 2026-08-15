/**
 * PR 编辑器页 — Server Component
 *
 * 协作者（editor 成员）在此页面编辑批改内容并提交 PR。
 *
 * 权限：只有 essay 的 editor 成员或 owner 才能创建 PR。
 * 普通访客或 viewer 成员会被 redirect 到详情页。
 *
 * 数据流：
 * 1. 查 essay（RLS 闸口）
 * 2. 查 essay_members 确认当前用户有 editor/owner 权限
 * 3. 查当前版本内容（预载到 TipTap 编辑器）
 * 4. 渲染 PrEditorClient
 */

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { PrEditorClient } from "./PrEditorClient";
import type { Json } from "@/types/database";

export default async function NewPrPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const { essayId } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // 查 essay 基本信息
  const essayResult = await supabase
    .from("essays")
    .select("id, title, author_id, current_version")
    .eq("id", essayId)
    .single();
  const essay = (essayResult.data ?? null) as {
    id: string;
    title: string;
    author_id: string;
    current_version: number;
  } | null;

  if (!essay) {
    notFound();
  }

  // 查成员身份
  const memberResult = await supabase
    .from("essay_members")
    .select("role")
    .eq("essay_id", essayId)
    .eq("user_id", user!.id)
    .maybeSingle();
  const membership = (memberResult.data ?? null) as { role: string } | null;

  const isOwner = essay.author_id === user!.id;
  const canEdit = isOwner || membership?.role === "editor";

  if (!canEdit) {
    // 无权创建 PR，redirect 回详情页
    redirect(`/essays/${essayId}`);
  }

  // 查当前版本内容（预载到编辑器）
  const versionResult = await supabase
    .from("essay_versions")
    .select("content, plain_text, word_count")
    .eq("essay_id", essayId)
    .eq("version_number", essay.current_version)
    .single();
  const version = (versionResult.data ?? null) as {
    content: Json;
    plain_text: string;
    word_count: number;
  } | null;

  return (
    <PrEditorClient
      essayId={essayId}
      essayTitle={essay.title}
      initialContent={version?.content ?? null}
    />
  );
}
