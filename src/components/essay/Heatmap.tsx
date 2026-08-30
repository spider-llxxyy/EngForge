/**
 * ============================================
 * Heatmap — 写作节奏（周粒度热力图）
 * ============================================
 * 2 行 × 12 列 = 24 个方格，5 个颜色等级。
 * 底部图例："少 → 多" + 本周统计。
 *
 * 数据来源：levels prop（24 项），由 Dashboard 页面在服务端从
 * essays + essay_versions 表按周聚合后传入。
 *
 * 为什么是服务端组件？
 * — 无交互无状态，整个热力图在服务器上渲染成 HTML，
 *   不需要客户端 JS。
 */

import { heatmapLevelConfig } from "@/lib/dashboard-data";
import type { HeatmapLevel } from "@/lib/dashboard-data";

interface HeatmapProps {
  /** 24 项热力图等级（2 行 × 12 列，按行填充） */
  levels: HeatmapLevel[];
  /** 底部统计文案，如"本周 2 篇 · 连续 4 周有产出" */
  summaryText?: string;
}

/* ============================================================
 * 子组件：HeatmapLegend — 底部图例
 * ============================================================
 * "少 ▢▢▢▢▢ 多" + 右侧统计文案 — 展示 5 个颜色等级的含义。
 * 拆成子组件是为了让父组件的 JSX 更短、更清晰。
 */

function HeatmapLegend({ summaryText }: { summaryText?: string }) {
  // 从映射表取 5 个等级的颜色类名，用 [key] 索引访问
  const legendLevels = ["", "l1", "l2", "l3", "l4"] as const;

  return (
    <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
      <div className="flex items-center gap-1">
        <span>少</span>
        {legendLevels.map((level) => (
          <span
            key={level || "empty"}
            className={`h-3 w-3 rounded-sm ${heatmapLevelConfig[level]}`}
          />
        ))}
        <span>多</span>
      </div>
      {summaryText && <span>{summaryText}</span>}
    </div>
  );
}

/* ============================================================
 * 父组件：Heatmap — 整个热力图面板
 * ============================================================
 * 面板头（"写作节奏" + "近 24 周 · 每格为一周"）+ 网格 + 图例
 */

export function Heatmap({ levels, summaryText }: HeatmapProps) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      {/* 面板头部 — 标题在左，副标题在右 */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <h3 className="text-[15px] font-semibold text-zinc-950">写作节奏</h3>
        <span className="text-xs text-zinc-500">近 24 周 · 每格为一周</span>
      </div>

      {/*
       * 热力图网格区域
       * 2 行 × 12 列 = 24 格，周粒度
       * gap-[6px] — 比日粒度的 gap-[3px] 更大，视觉上更透气
       * rounded-md — 格子更大，圆角也稍大
       */}
      <div className="p-5">
        <div className="grid grid-cols-12 gap-[6px]">
          {/*
           * 遍历 24 个格子，每项渲染一个方格
           * aspect-square — 正方形（宽高相等）
           * rounded-md — 中圆角
           * 颜色由 heatmapLevelConfig[level] 映射决定
           */}
          {levels.map((level, index) => (
            <span
              key={index}
              className={`aspect-square rounded-md ${heatmapLevelConfig[level]}`}
            />
          ))}
        </div>

        <HeatmapLegend summaryText={summaryText} />
      </div>
    </div>
  );
}
