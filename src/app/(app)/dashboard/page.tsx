/**
 * Dashboard 页面 — 我的工坊
 *
 * Server Component：在服务端查询 Supabase 获取当前用户的真实数据，
 * 通过 props 传给子组件（StatsCards / EssayList / ActivityPanel）。
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { StatsCards } from "@/components/essay/StatsCards";
import { EssayList } from "@/components/essay/EssayList";
import { Heatmap } from "@/components/essay/Heatmap";
import { ActivityPanel } from "@/components/essay/ActivityPanel";
import type { DashboardEssay, EssayTag } from "@/lib/dashboard-data";

// ──────────────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────────────

/** 把 DB 的 tag 字符串映射为 EssayTag 类型，未知值降级为 other */
function mapTag(tag: string): EssayTag {
  const valid: EssayTag[] = ["kaoyan", "gaokao", "cet4", "cet6", "other"];
  return (valid as string[]).includes(tag) ? (tag as EssayTag) : "other";
}

// ──────────────────────────────────────────────
// 页面组件
// ──────────────────────────────────────────────

export default async function DashboardPage() {
  // 1. 验证登录
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // 2. 查询当前用户的作文（按更新时间倒序）
  const essaysResult = await supabase
    .from("essays")
    .select("id, title, tags, word_count, star_count, updated_at")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  const rawEssays = (essaysResult.data ?? []) as Array<{
    id: string;
    title: string;
    tags: string[];
    word_count: number;
    star_count: number;
    updated_at: string;
  }>;

  // 3. 转换为 DashboardEssay 格式
  const essays: DashboardEssay[] = rawEssays.map((e) => ({
    id: e.id,
    title: e.title,
    status: "published" as const,
    tag: mapTag(e.tags?.[0] ?? "other"),
    wordCount: e.word_count ?? 0,
    updatedAt: e.updated_at,
    href: `/essays/${e.id}`,
  }));

  // 4. 计算统计数据
  const essayCount = essays.length;
  const totalStars = rawEssays.reduce((sum, e) => sum + (e.star_count ?? 0), 0);

  // 查询收到的 PR 数（open 状态）
  const prResult = await supabase
    .from("pull_requests")
    .select("id", { count: "exact", head: true })
    .in(
      "essay_id",
      rawEssays.map((e) => e.id),
    )
    .eq("status", "open");
  const prCount = prResult.count ?? 0;

  const stats = [
    { value: essayCount, sub: essayCount > 0 ? "已发布" : "去写第一篇" },
    { value: prCount, sub: prCount > 0 ? "待处理" : "暂无" },
    { value: totalStars, sub: totalStars > 0 ? "被收藏" : "暂无" },
    { value: 0, sub: "即将上线" },
  ];

  // 5. 问候语（按时间段）
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  return (
    <div className="max-w-[1200px] px-8 py-7">
      {/* 邀请制工坊模式 Banner */}
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary-light to-purple-light px-5 py-4">
        <span className="text-2xl">I</span>
        <div className="flex-1 text-[13px] text-gray-700">
          <span className="mb-0.5 block font-semibold">邀请制工坊模式</span>
          你的作文默认私密，除非你手动设为公开，否则任何人（包括广场）都看不到。
        </div>
      </div>

      {/* 问候语 + 统计卡片 */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-gray-900">
            {greeting}，{user.username}
          </h2>
          <p className="text-sm text-gray-500">
            {essayCount > 0
              ? `你有 ${essayCount} 篇作文，继续加油`
              : "欢迎来到 EngForge，开始写第一篇作文吧"}
          </p>
        </div>
        <div className="shrink-0">
          <StatsCards stats={stats} />
        </div>
      </div>

      {/* 两栏布局 */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <EssayList essays={essays} />
          <Heatmap />
        </div>
        <ActivityPanel />
      </div>
    </div>
  );
}
