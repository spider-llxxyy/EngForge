/**
 * Dashboard 页面 — 我的工坊
 *
 * Server Component：在服务端查询 Supabase 获取当前用户的真实数据，
 * 通过 props 传给子组件（StatsCards / EssayList / Heatmap / ActivityPanel）。
 *
 * 热力图：把 essays.created_at + essay_versions.created_at 按天聚合
 * 成 182 格（26 周 × 7 天）的等级数组。
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

/* ── 热力图聚合 ──────────────────────────────── */

/** 东八区偏移量 — 用户是中国用户，按北京时间分桶 */
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_WEEKS = 26;
const HEATMAP_DAYS = 7;

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

/** 当天活动数 → 颜色等级：0→空，1~3 递增，≥4 封顶 */
function countToLevel(count: number): HeatmapLevel {
  if (count >= 4) return "l4";
  if (count >= 1) return (`l${count}` as HeatmapLevel);
  return "";
}

/**
 * 把按天的计数聚合成热力图等级数组。
 * 网格 26 列（周）× 7 行（天），数组按行填充：
 * levels[day * 26 + week] = 第 week 周的第 day 天。
 * 最后一个格子是今天。
 */
function buildHeatmapLevels(countsByDate: Map<string, number>): HeatmapLevel[] {
  const windowStart = new Date(todayStart().getTime() - (HEATMAP_WEEKS * HEATMAP_DAYS - 1) * DAY_MS);
  const levels: HeatmapLevel[] = [];

  for (let day = 0; day < HEATMAP_DAYS; day++) {
    for (let week = 0; week < HEATMAP_WEEKS; week++) {
      const date = new Date(windowStart.getTime() + (week * HEATMAP_DAYS + day) * DAY_MS);
      levels.push(countToLevel(countsByDate.get(dateKey(date)) ?? 0));
    }
  }

  return levels;
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
    .select("id, title, tags, word_count, star_count, updated_at, created_at")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  const rawEssays = (essaysResult.data ?? []) as Array<{
    id: string;
    title: string;
    tags: string[];
    word_count: number;
    star_count: number;
    updated_at: string;
    created_at: string;
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

  // 4. 热力图窗口起点（182 天前的 0 点），用于过滤版本表查询
  const heatmapWindowStart = new Date(
    todayStart().getTime() - (HEATMAP_WEEKS * HEATMAP_DAYS - 1) * DAY_MS
  );

  // 5. 三个独立查询并行执行：PR 数 / 版本活动日期 / 最近通知
  const [prResult, versionsResult, notificationsResult] = await Promise.all([
    // 收到的 PR 数（open 状态）
    rawEssays.length > 0
      ? supabase
          .from("pull_requests")
          .select("id", { count: "exact", head: true })
          .in(
            "essay_id",
            rawEssays.map((e) => e.id),
          )
          .eq("status", "open")
      : Promise.resolve({ count: 0, data: null, error: null }),
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

  const prCount = prResult.count ?? 0;

  // 6. 聚合热力图：作文创建数 + 版本创建数，按东八区日期分桶
  const countsByDate = new Map<string, number>();
  const bump = (iso: string) => {
    const key = dateKey(new Date(iso));
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  };
  rawEssays.forEach((e) => bump(e.created_at));
  const versionDates = (versionsResult.data ?? []) as Array<{ created_at: string }>;
  versionDates.forEach((v) => bump(v.created_at));
  const heatmapLevels = buildHeatmapLevels(countsByDate);

  // 7. 通知 → ActivityItem
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

  // 8. 计算统计数据
  const essayCount = essays.length;
  const totalStars = rawEssays.reduce((sum, e) => sum + (e.star_count ?? 0), 0);

  const stats = [
    { value: essayCount, sub: essayCount > 0 ? "已发布" : "去写第一篇" },
    { value: prCount, sub: prCount > 0 ? "待处理" : "暂无" },
    { value: totalStars, sub: totalStars > 0 ? "被收藏" : "暂无" },
    { value: 0, sub: "即将上线" },
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
          <Heatmap levels={heatmapLevels} />
        </div>
        <ActivityPanel activities={activities} />
      </div>
    </div>
  );
}
