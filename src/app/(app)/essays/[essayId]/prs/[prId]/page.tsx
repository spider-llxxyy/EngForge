/**
 * PR 审阅页 — Server Component
 *
 * 展示 PR 详情：标题、状态、创建者→方向、描述、行级 diff。
 * 如果当前用户是 essay owner 且 PR 状态为 open，显示合并/关闭按钮。
 *
 * 数据流：
 * 1. 查 PR 记录（RLS 闸口：只有创建者或 essay 成员可见）
 * 2. 查创建者 profile
 * 3. 查 essay（获取 author_id 判断是否 owner）
 * 4. 渲染 PrDiffView + PrActions
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { PrDiffView } from "@/components/pr/PrDiffView";
import { PrActions } from "@/components/pr/PrActions";

/** 格式化日期 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** PR 状态 → 中文标签 + 颜色 */
const statusConfig: Record<string, { label: string; class: string }> = {
  open: { label: "待审阅", class: "bg-amber-light text-amber" },
  merged: { label: "已合并", class: "bg-green-light text-green" },
  closed: { label: "已关闭", class: "bg-zinc-100 text-zinc-500" },
};

export default async function PrDetailPage({
  params,
}: {
  params: Promise<{ essayId: string; prId: string }>;
}) {
  const { essayId, prId } = await params;
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const supabase = await createClient();

  // 查 PR 记录（RLS 闸口）
  const prResult = await supabase
    .from("pull_requests")
    .select(
      "id, essay_id, title, description, diff_text, status, created_by, merged_by, created_at, merged_at"
    )
    .eq("id", prId)
    .single();
  const pr = (prResult.data ?? null) as {
    id: string;
    essay_id: string;
    title: string;
    description: string;
    diff_text: string;
    status: string;
    created_by: string;
    merged_by: string | null;
    created_at: string;
    merged_at: string | null;
  } | null;

  if (!pr) {
    notFound();
  }

  // 查 essay（获取 author_id 判断是否 owner + 标题）
  const essayResult = await supabase
    .from("essays")
    .select("id, title, author_id")
    .eq("id", pr.essay_id)
    .single();
  const essay = (essayResult.data ?? null) as {
    id: string;
    title: string;
    author_id: string;
  } | null;

  const isOwner = essay?.author_id === user!.id;
  const isCreator = pr.created_by === user!.id;

  // 查创建者 profile
  const creatorResult = await supabase
    .from("profiles")
    .select("username, avatar_initials")
    .eq("id", pr.created_by)
    .single();
  const creator = (creatorResult.data ?? null) as {
    username: string;
    avatar_initials: string;
  } | null;

  const status = statusConfig[pr.status] ?? statusConfig.open;

  return (
    <div className="px-8 py-6">
      {/* 面包屑 */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-primary">
          我的工坊
        </Link>
        <span>/</span>
        <Link
          href={`/essays/${essayId}`}
          className="hover:text-primary"
        >
          {essay?.title ?? "作文"}
        </Link>
        <span>/</span>
        <span className="text-zinc-950">批改请求</span>
      </nav>

      {/* PR 头部 */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-950">{pr.title}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}
              >
                {status.label}
              </span>
            </div>

            {/* 创建者 → 方向 */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              {creator && (
                <span className="flex items-center gap-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                    {creator.avatar_initials}
                  </span>
                  {creator.username}
                </span>
              )}
              <span>提交于 {formatDate(pr.created_at)}</span>
              {pr.merged_at && (
                <span>合并于 {formatDate(pr.merged_at)}</span>
              )}
            </div>
          </div>
        </div>

        {/* 描述 */}
        {pr.description && (
          <div className="mt-4 rounded-card bg-white p-4 shadow-card">
            <p className="whitespace-pre-wrap text-sm text-zinc-700">
              {pr.description}
            </p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {pr.status === "open" && (isOwner || isCreator) && (
        <div className="mb-6">
          <PrActions
            prId={pr.id}
            essayId={essayId}
            isOwner={isOwner}
            isCreator={isCreator}
            prTitle={pr.title}
          />
        </div>
      )}

      {/* Diff 视图 */}
      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="border-b border-zinc-200 px-4 py-2.5">
          <span className="text-sm font-medium text-zinc-700">
            内容差异
          </span>
        </div>
        <PrDiffView diffText={pr.diff_text} />
      </div>
    </div>
  );
}
