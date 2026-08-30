/**
 * Dashboard 页面 — 我的工坊
 *
 * Server Component：在服务端查询 Supabase 获取当前用户的真实数据，
 * 通过 props 传给子组件（StatsCards / EssayList / Heatmap / ActivityPanel）。
 *
 * 热力图：把 essays.created_at + essay_versions.created_at 按周聚合
 * 成 24 格（2 行 × 12 列）的等级数组。
 * 活动面板：notifications 表最近 20 条。
 */

import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { StatsCards } from "@/components/essay/StatsCards";
import { EssayList } from "@/components/essay/EssayList";
import { Heatmap } from "@/components/essay/Heatmap";
import { ActivityPanel } from "@/components/essay/ActivityPanel";
import type { DashboardEssay, EssayTag, ActivityItem, HeatmapLevel } from "@/lib/dashboard-data";

// ──────────────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────────────

/** 把 DB 的 tag 字符串映射为 EssayTag 类型，未知值降级为 other */
function mapTag(tag: string): EssayTag {
  const valid: EssayTag[] = ["kaoyan", "gaokao", "cet4", "cet6", "other"];
  return (valid as string[]).includes(tag) ? (tag as EssayTag) : "other";
}

/* ── 热力图聚合（周粒度） ──────────────────────── */

/** 东八区偏移量 — 用户是中国用户，按北京时间分桶 */
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_TOTAL_WEEKS = 24;  // 2 行 × 12 列 = 24 周

/** Date → 东八区 "YYYY-MM-DD" 日期 key */
function dateKey(date: Date): string {
  return new Date(date.getTime() + UTC8_OFFSET_MS).toISOString().slice(0, 10);
}

/** 今天 0 点（东八区口径） */
function todayStart(): Date {
  const shifted = new Date(new Date().getTime() + UTC8_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - UTC8_OFFSET_MS);
}

/** 当周活动数 → 颜色等级：0→空，1~3 递增，≥4 封顶 */
function countToLevel(count: number): HeatmapLevel {
  if (count >= 4) return "l4";
  if (count >= 1) return (`l${count}` as HeatmapLevel);
  return "";
}

/**
 * 把按天的计数聚合成周粒度热力图等级数组。
 * 24 格（2 行 × 12 列），按行填充：
 * levels[0] = 23 周前（最旧），levels[23] = 本周（最新）。
 * 每格代表连续 7 天的活动总量。
 */
function buildWeeklyHeatmapLevels(countsByDate: Map<string, number>): HeatmapLevel[] {
  const today = todayStart();
  const levels: HeatmapLevel[] = [];

  for (let week = 0; week < HEATMAP_TOTAL_WEEKS; week++) {
    // Week 0 = oldest (23 weeks ago), Week 23 = current week
    const startDaysAgo = (HEATMAP_TOTAL_WEEKS - 1 - week) * 7;

    let weekCount = 0;
    for (let day = 0; day < 7; day++) {
      const date = new Date(today.getTime() - (startDaysAgo + day) * DAY_MS);
      weekCount += countsByDate.get(dateKey(date)) ?? 0;
    }

    levels.push(countToLevel(weekCount));
  }

  return levels;
}

/**
 * 本周活动总数 + 连续活跃周数。
 * 规则：从本周往回数连续有活动的周数；本周还没活动则从上周起算。
 */
function computeWeeklyStats(countsByDate: Map<string, number>): { thisWeekCount: number; weeklyStreak: number } {
  const today = todayStart();

  // 计算本周的活动数
  let thisWeekCount = 0;
  for (let day = 0; day < 7; day++) {
    const date = new Date(today.getTime() - day * DAY_MS);
    thisWeekCount += countsByDate.get(dateKey(date)) ?? 0;
  }

  // 计算连续周数（从本周或上周开始）
  const startWeek = thisWeekCount > 0 ? 0 : 1;
  let weeklyStreak = 0;

  for (let week = startWeek; week < HEATMAP_TOTAL_WEEKS; week++) {
    const startDaysAgo = week * 7;
    let weekCount = 0;
    for (let day = 0; day < 7; day++) {
      const date = new Date(today.getTime() - (startDaysAgo + day) * DAY_MS);
      weekCount += countsByDate.get(dateKey(date)) ?? 0;
    }
    if (weekCount > 0) {
      weeklyStreak++;
    } else {
      break;
    }
  }

  return { thisWeekCount, weeklyStreak };
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

  // 2. 查询当前用户的作文（按更新时间倒序；created_at 同时用于热力图聚合）
  const essaysResult = await supabase
    .from("essays")
    .select("id, title, tags, word_count, star_count, current_version, updated_at, created_at")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  const rawEssays = (essaysResult.data ?? []) as Array<{
    id: string;
    title: string;
    tags: string[];
    word_count: number;
    star_count: number;
    current_version: number;
    updated_at: string;
    created_at: string;
  }>;

  // 3. 热力图窗口起点（24 周 × 7 天 = 168 天前），用于过滤版本表查询
  const heatmapWindowStart = new Date(
    todayStart().getTime() - (HEATMAP_TOTAL_WEEKS * 7 - 1) * DAY_MS
  );

  // 4. 三个独立查询并行执行：收到 PR / 提交 PR / 版本活动日期 / 最近通知
  const [receivedPrsResult, submittedPrsResult, versionsResult, notificationsResult] = await Promise.all([
    // 收到的 PR（open 状态，在我名下的作文上）— 取 essay_id 用于 per-essay 统计
    rawEssays.length > 0
      ? supabase
          .from("pull_requests")
          .select("id, essay_id")
          .in("essay_id", rawEssays.map((e) => e.id))
          .eq("status", "open")
      : Promise.resolve({ data: [], count: 0, error: null }),
    // 提交的 PR（我创建的，任何状态）— 只需 count
    supabase
      .from("pull_requests")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id),
    // 我创建的所有版本（含发布/修改/Fork 复制），只取时间
    supabase
      .from("essay_versions")
      .select("created_at")
      .eq("created_by", user.id)
      .gte("created_at", heatmapWindowStart.toISOString()),
    // 最近 20 条通知
    supabase
      .from("notifications")
      .select("id, type, title, content, link_url, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // 收到 PR 总数 + per-essay 计数
  const receivedPrsData = (receivedPrsResult.data ?? []) as Array<{ id: string; essay_id: string }>;
  const receivedPrCount = receivedPrsData.length;
  const openPrsByEssay = new Map<string, number>();
  receivedPrsData.forEach((pr) => {
    openPrsByEssay.set(pr.essay_id, (openPrsByEssay.get(pr.essay_id) ?? 0) + 1);
  });

  // 提交 PR 总数
  const submittedPrCount = submittedPrsResult.count ?? 0;

  // 5. 聚合热力图：作文创建数 + 版本创建数，按东八区日期分桶
  const countsByDate = new Map<string, number>();
  const bump = (iso: string) => {
    const key = dateKey(new Date(iso));
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  };
  rawEssays.forEach((e) => bump(e.created_at));
  const versionDates = (versionsResult.data ?? []) as Array<{ created_at: string }>;
  versionDates.forEach((v) => bump(v.created_at));
  const heatmapLevels = buildWeeklyHeatmapLevels(countsByDate);
  const { thisWeekCount, weeklyStreak } = computeWeeklyStats(countsByDate);

  // 热力图底部统计文案
  const summaryText = thisWeekCount > 0
    ? `本周 ${thisWeekCount} 篇 · 连续 ${weeklyStreak} 周有产出`
    : weeklyStreak > 0
      ? `本周暂无 · 连续 ${weeklyStreak} 周有产出`
      : "本周暂无";

  // 6. 通知 → ActivityItem
  const rawNotifications = (notificationsResult.data ?? []) as Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    link_url: string | null;
    is_read: boolean;
    created_at: string;
  }>;
  const activities: ActivityItem[] = rawNotifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    content: n.content,
    linkUrl: n.link_url,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));

  // 7. 转换为 DashboardEssay 格式（含版本号 + 状态 pill）
  const essays: DashboardEssay[] = rawEssays.map((e) => {
    const openPrCount = openPrsByEssay.get(e.id) ?? 0;
    return {
      id: e.id,
      title: e.title,
      status: "published" as const,
      tag: mapTag(e.tags?.[0] ?? "other"),
      wordCount: e.word_count ?? 0,
      updatedAt: e.updated_at,
      href: `/essays/${e.id}`,
      versionNumber: e.current_version ?? 1,
      statusPill: openPrCount > 0
        ? {
            label: `${openPrCount} 条新批改`,
            className: "bg-amber-light text-amber",
          }
        : undefined,
    };
  });

  // 8. 计算统计数据（顺序：我的作文 / 收到批改 / 提交批改 / 被收藏）
  const essayCount = essays.length;
  const totalStars = rawEssays.reduce((sum, e) => sum + (e.star_count ?? 0), 0);

  const stats = [
    { value: essayCount, sub: essayCount > 0 ? "已发布" : "去写第一篇" },
    { value: receivedPrCount, sub: receivedPrCount > 0 ? "待处理" : "暂无" },
    { value: submittedPrCount, sub: submittedPrCount > 0 ? "已提交" : "暂无" },
    { value: totalStars, sub: totalStars > 0 ? "被收藏" : "暂无" },
  ];

  // 9. 问候语（按时间段）
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  return (
    <div className="max-w-[1200px] px-8 py-7">
      {/* 邀请制工坊模式 Banner — Bento 卡片 + primary-subtle 底 */}
      <div className="mb-6 flex items-center gap-3 rounded-card bg-primary-subtle px-5 py-4 shadow-card">
        <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
        <div className="flex-1 text-[13px] text-zinc-600">
          <span className="mb-0.5 block font-semibold text-zinc-950">邀请制工坊模式</span>
          你的作文默认私密，除非你手动设为公开，否则任何人（包括广场）都看不到。
        </div>
      </div>

      {/* 问候语 + 统计卡片 */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-zinc-950">
            {greeting}，{user.username}
          </h2>
          <p className="text-sm text-zinc-500">
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
          <Heatmap levels={heatmapLevels} summaryText={summaryText} />
        </div>
        <ActivityPanel activities={activities} />
      </div>
    </div>
  );
}
