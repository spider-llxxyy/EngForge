/**
 * ============================================
 * Heatmap — 贡献热力图
 * ============================================
 * 26 周 × 7 天 = 182 个方格，5 个颜色等级。
 * 底部图例："少 → 多"。
 *
 * 设计来源：原型 EngForge_原型.html 的 .heatmap-grid + .heatmap-cell 结构
 * 数据来源：levels prop（182 项），由 Dashboard 页面在服务端从
 * essays + essay_versions 表按天聚合后传入。
 *
 * 网格布局说明（与数组顺序对应）：
 * 网格 26 列 × 7 行，数组按行填充 → levels[day * 26 + week]。
 * 每一列是一个连续的周，每一行是周内的第几天，
 * 最后一个格子（day=6, week=25）是今天。
 *
 * 为什么是服务端组件？
 * — 无交互无状态，整个热力图在服务器上渲染成 HTML，
 *   不需要客户端 JS。
 */

import { heatmapLevelConfig } from "@/lib/dashboard-data";
import type { HeatmapLevel } from "@/lib/dashboard-data";

interface HeatmapProps {
  /** 182 项热力图等级，levels[day * 26 + week] */
  levels: HeatmapLevel[];
}

/* ============================================================
 * 子组件：HeatmapLegend — 底部图例
 * ============================================================
 * "少 ▢▢▢▢▢ 多" — 展示 5 个颜色等级的含义。
 * 拆成子组件是为了让父组件的 JSX 更短、更清晰。
 */

function HeatmapLegend() {
  // 从映射表取 5 个等级的颜色类名，用 [key] 索引访问
  const legendLevels = ["", "l1", "l2", "l3", "l4"] as const;

  return (
    <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-zinc-500">
      <span>少</span>
      {legendLevels.map((level) => (
        <span
          key={level || "empty"}
          className={`h-3 w-3 rounded-sm ${heatmapLevelConfig[level]}`}
        />
      ))}
      <span>多</span>
    </div>
  );
}

/* ============================================================
 * 父组件：Heatmap — 整个热力图面板
 * ============================================================
 * 面板头（"贡献热力图" + "过去 26 周"）+ 网格 + 图例
 */

export function Heatmap({ levels }: HeatmapProps) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      {/* 面板头部 — 标题在左，副标题在右 */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <h3 className="text-[15px] font-semibold text-zinc-950">贡献热力图</h3>
        <span className="text-xs text-zinc-500">过去 26 周</span>
      </div>

      {/*
       * 热力图网格区域
       * 原型 .heatmap-container: padding 20px
       * 原型 .heatmap-grid: display grid, grid-template-columns: repeat(26, 1fr), gap 3px
       *
       * Tailwind v4 的 grid-cols-26 不是默认支持的值（默认只到 12），
       * 所以用方括号语法 grid-cols-[repeat(26,minmax(0,1fr))] 自定义。
       * 这等价于 CSS: grid-template-columns: repeat(26, minmax(0, 1fr))
       */}
      <div className="p-5">
        <div className="grid grid-cols-[repeat(26,minmax(0,1fr))] gap-[3px]">
          {/*
           * 遍历 182 个格子，每项渲染一个方格
           * aspect-square — 正方形（宽高相等），对应原型 aspect-ratio: 1
           * rounded-sm — 小圆角，对应原型 border-radius: 2px
           * 颜色由 heatmapLevelConfig[level] 映射决定
           */}
          {levels.map((level, index) => (
            <span
              key={index}
              className={`aspect-square rounded-sm ${heatmapLevelConfig[level]}`}
            />
          ))}
        </div>

        <HeatmapLegend />
      </div>
    </div>
  );
}
