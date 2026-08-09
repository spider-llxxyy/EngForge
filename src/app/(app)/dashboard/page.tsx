/**
 * Dashboard 页面 — 我的工坊
 *
 * TopBar（标题 + 新建按钮 + 用户菜单）已移至 (app)/layout.tsx，
 * 此页面只负责内容区域：Banner + 问候语 + 统计 + Grid。
 */

import { StatsCards } from "@/components/essay/StatsCards";
import { EssayList } from "@/components/essay/EssayList";
import { Heatmap } from "@/components/essay/Heatmap";
import { ActivityPanel } from "@/components/essay/ActivityPanel";

export default function DashboardPage() {
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
            早上好，李同学
          </h2>
          <p className="text-sm text-gray-500">
            你已经连续学习 47 天，今天写一篇吧
          </p>
        </div>
        <div className="shrink-0">
          <StatsCards />
        </div>
      </div>

      {/* 两栏布局 */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <EssayList />
          <Heatmap />
        </div>
        <ActivityPanel />
      </div>
    </div>
  );
}
