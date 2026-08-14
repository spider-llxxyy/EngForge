/**
 * StatsCards — Dashboard 顶部 4 个统计卡片
 *
 * 数据由 Dashboard 页面通过 props 传入（从 Supabase 查询）。
 * statCardConfig 提供 label 和 colorClass 的固定配置。
 */

import { statCardConfig } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  colorClass: string;
}

function StatCard({ label, value, sub, colorClass }: StatCardProps) {
  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <div className="mb-1.5 text-xs text-zinc-500">{label}</div>
      <div className={cn("text-[28px] font-bold text-zinc-950", colorClass)}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>
    </div>
  );
}

interface StatsCardsProps {
  /** 4 个统计值：[作文数, 批改数, Star数, 连续天数] */
  stats: { value: number; sub: string }[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {statCardConfig.map((card, i) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={stats[i]?.value ?? 0}
          sub={stats[i]?.sub ?? ""}
          colorClass={card.colorClass}
        />
      ))}
    </div>
  );
}
