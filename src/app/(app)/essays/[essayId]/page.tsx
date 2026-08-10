/**
 * 作文详情页 — Server Component
 *
 * 查询 essay + 全部版本 + 作者 + 成员 + 收藏状态，
 * 在服务端把每个版本的 TipTap JSON 渲染成 HTML，
 * 传给 DetailClient 客户端组件做版本切换和交互。
 *
 * RLS 保证只有 owner / member / public 可见性才能查到数据。
 */

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { renderContentToHTML } from "@/lib/render-content";
import { tagLabels } from "@/lib/dashboard-data";
import type { Json } from "@/types/database";
import { DetailClient } from "@/components/essay/DetailClient";

/** 格式化日期 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 可见性 → 中文 */
const visibilityLabels: Record<string, string> = {
  private: "私有",
  invite: "邀请可见",
  public: "公开",
};

export default async function EssayDetailPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const { essayId } = await params;
  const user = await getSessionUser();
  const supabase = await createClient();

  // ── 1. 查询作文 ──
  const essayResult = await supabase
    .from("essays")
    .select(
      "id, author_id, title, tags, visibility, forked_from, fork_count, star_count, current_version, latest_version, word_count, created_at"
    )
    .eq("id", essayId)
    .single();
  const essay = (essayResult.data ?? null) as {
    id: string;
    author_id: string;
    title: string;
    tags: string[];
    visibility: string;
    forked_from: string | null;
    fork_count: number;
    star_count: number;
    current_version: number;
    latest_version: number;
    word_count: number;
    created_at: string;
  } | null;

  if (!essay) {
    notFound();
  }

  // ── 2. 查询作者 profile ──
  const authorResult = await supabase
    .from("profiles")
    .select("username, avatar_initials")
    .eq("id", essay.author_id)
    .single();
  const author = (authorResult.data ?? null) as {
    username: string;
    avatar_initials: string;
  } | null;

  // ── 3. 查询所有版本 ──
  const versionsResult = await supabase
    .from("essay_versions")
    .select(
      "version_number, content, plain_text, word_count, change_summary, created_at, created_by"
    )
    .eq("essay_id", essayId)
    .order("version_number", { ascending: true });
  const rawVersions = (versionsResult.data ?? []) as Array<{
    version_number: number;
    content: Json;
    plain_text: string;
    word_count: number;
    change_summary: string;
    created_at: string;
    created_by: string;
  }>;

  // 为每个版本渲染 HTML
  const versions = rawVersions.map((v) => ({
    version_number: v.version_number,
    html: renderContentToHTML(v.content),
    change_summary: v.change_summary,
    created_at: formatDate(v.created_at),
    word_count: v.word_count,
  }));

  // ── 4. 查询当前用户的成员身份（判断 canEdit）──
  const memberResult = await supabase
    .from("essay_members")
    .select("role")
    .eq("essay_id", essayId)
    .eq("user_id", user!.id)
    .maybeSingle();
  const myMembership = (memberResult.data ?? null) as { role: string } | null;

  const isOwner = essay.author_id === user!.id;
  const canEdit = isOwner || myMembership?.role === "editor";

  // ── 5. 查询收藏状态 ──
  const starResult = await supabase
    .from("stars")
    .select("id")
    .eq("user_id", user!.id)
    .eq("essay_id", essayId)
    .maybeSingle();
  const isStarred = !!(starResult.data as { id: string } | null);

  // ── 6. 查询成员列表（RLS: 只有 author 能看到全部）──
  const membersResult = await supabase
    .from("essay_members")
    .select("user_id, role, profiles:profiles!essay_members_user_id_fkey(username, avatar_initials)")
    .eq("essay_id", essayId)
    .order("created_at", { ascending: true });
  const rawMembers = (membersResult.data ?? []) as Array<{
    user_id: string;
    role: string;
    profiles: { username: string; avatar_initials: string } | null;
  }>;
  const members = rawMembers
    .filter((m) => m.profiles)
    .map((m) => ({
      username: m.profiles!.username,
      avatar_initials: m.profiles!.avatar_initials,
      role: m.role,
    }));

  // ── 7. 查询 fork 来源标题 ──
  let forkedFromTitle: string | null = null;
  if (essay.forked_from) {
    const forkResult = await supabase
      .from("essays")
      .select("title")
      .eq("id", essay.forked_from)
      .single();
    forkedFromTitle = ((forkResult.data as { title: string } | null)?.title) ?? null;
  }

  // ── 8. 传递给客户端组件 ──
  return (
    <DetailClient
      essay={{
        id: essay.id,
        title: essay.title,
        tags: essay.tags,
        visibility: essay.visibility,
        visibilityLabel: visibilityLabels[essay.visibility] ?? essay.visibility,
        fork_count: essay.fork_count,
        star_count: essay.star_count,
        current_version: essay.current_version,
        latest_version: essay.latest_version,
        word_count: essay.word_count,
        created_at: formatDate(essay.created_at),
        forked_from: essay.forked_from,
        forked_from_title: forkedFromTitle,
      }}
      author={{
        username: author?.username ?? "未知用户",
        avatar_initials: author?.avatar_initials ?? "?",
      }}
      versions={versions}
      isStarred={isStarred}
      isOwner={isOwner}
      canEdit={canEdit}
      members={members}
      tagLabels={tagLabels}
    />
  );
}
