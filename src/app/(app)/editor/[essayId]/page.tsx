/**
 * 编辑已有作文页面 — /editor/[essayId]
 *
 * Server Component：
 * 1. 从 URL 参数获取 essayId
 * 2. 加载 essay 元数据 + 最新版本内容
 * 3. 检查当前用户是否有编辑权限（必须是 essay_members）
 * 4. 传递初始数据给 EditorClient，mode="edit"
 *
 * 权限说明：
 * - RLS 自动过滤：非成员无法查看 private/invite 作文
 * - 公开作文任何人可看，但只有 owner/editor 可发布新版本
 * - 此页面在 UI 层提前拦截：非成员显示"无编辑权限"
 */

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { EditorClient } from "@/components/editor/EditorClient";
import { notFound } from "next/navigation";
import type { EssayVisibility } from "@/types";
import type { Database } from "@/types/database";

type EssayRow = Database["public"]["Tables"]["essays"]["Row"];

export default async function EditEssayPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const { essayId } = await params;
  const supabase = await createClient();
  const user = await getSessionUser();

  // ── 加载 essay 元数据 ──
  // @supabase/ssr 类型推断在 maybeSingle() 链上退化为 never，显式标注
  const { data: essayData } = await supabase
    .from("essays")
    .select("*")
    .eq("id", essayId)
    .maybeSingle();
  const essay = (essayData ?? null) as EssayRow | null;

  // 作文不存在或 RLS 阻止访问 → 404
  if (!essay) {
    notFound();
  }

  // ── 检查编辑权限 ──
  // 查询当前用户是否是 essay_members（RLS 允许用户查看自己的成员记录）
  let canEdit = false;
  if (user) {
    const { data: memberData } = await supabase
      .from("essay_members")
      .select("role")
      .eq("essay_id", essayId)
      .eq("user_id", user.id)
      .maybeSingle();
    const membership = (memberData ?? null) as { role: string } | null;

    canEdit = membership?.role === "owner" || membership?.role === "editor";
  }

  if (!canEdit) {
    return (
      <div className="flex h-[calc(100vh-49px)] flex-col items-center justify-center text-center">
        <span className="mb-3 text-4xl">🔒</span>
        <p className="text-lg font-medium text-gray-700">无编辑权限</p>
        <p className="mt-1 text-sm text-gray-400">
          只有作文的协作者才能编辑内容
        </p>
      </div>
    );
  }

  // ── 加载最新版本内容 ──
  const { data: versionData } = await supabase
    .from("essay_versions")
    .select("content")
    .eq("essay_id", essayId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (versionData ?? null) as { content: unknown } | null;

  return (
    <EditorClient
      mode="edit"
      essayId={essayId}
      initialTitle={essay.title}
      initialTags={essay.tags}
      initialVisibility={essay.visibility as EssayVisibility}
      initialContent={version?.content}
    />
  );
}
