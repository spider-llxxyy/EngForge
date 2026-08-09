/**
 * ============================================
 * StatsCards — Dashboard 顶部 4 个统计卡片
 * ============================================
 *
 * 这是 Dashboard 页面最上方的一行 4 个小卡片：
 *   我的作文(12) | 收到批改(28) | 被 Star(15) | 连续天数(47)
 *
 * 数据从 dashboard-data.ts 的 statCards 数组读取，
 * 这个组件只负责"把数据渲染成卡片"，不自己存数据。
 *
 * 为什么是服务端组件（没有 "use client"）？
 * ------------------------------------
 * 这个组件不需要任何交互——不需要点击、不需要状态、不需要 Hook。
 * 它只是把数据渲染成 HTML，所以保持默认的服务端组件就行。
 * 服务端组件在服务器上渲染成 HTML 发给浏览器，更快更轻。
 *
 * 类比：服务端组件像"印刷好的报纸"，客户端组件像"可互动的触摸屏"。
 * 报纸（服务端组件）看就行，触摸屏（客户端组件）能点能滑。
 */

import { statCards } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

/* ============================================================
 * 单个统计卡片子组件
 * ------------------------------------------------------------
 * 把单个卡片抽成子组件，父组件只管"遍历数组"。
 * 职责分离：父组件负责数据循环，子组件负责渲染一张卡片。
 * ============================================================ */

interface StatCardProps {
  /** 卡片标题，如 "我的作文" */
  label: string;
  /** 大数字，如 12 */
  value: number;
  /** 副标题，如 "3 篇草稿" */
  sub: string;
  /**
   * 大数字的颜色类名。
   * 空字符串表示默认色（深灰），"text-purple" / "text-teal" / "text-green" 表示品牌色。
   * 这个值从数据层的 colorClass 字段来。
   */
  colorClass: string;
}

function StatCard({ label, value, sub, colorClass }: StatCardProps) {
  return (
    /**
     * 单个卡片容器
     * bg-white — 白色背景
     * border border-gray-200 — 1px 浅灰边框（对应原型 border: 1px solid var(--gray-200)）
     * rounded-card — 自定义圆角（globals.css 里定义了 --radius-card: 10px）
     * p-[18px_20px] — 内边距，上下 18px 左右 20px（对应原型 padding: 18px 20px）
     * shadow-card — 自定义阴影（globals.css 里定义了 --shadow-card）
     */
    <div className="rounded-card border border-gray-200 bg-white p-[18px_20px] shadow-card">
      {/**
       * 卡片标题 — 小字灰色
       * text-xs — 12px（对应原型 font-size: 12px）
       * text-gray-500 — 灰色（对应原型 color: var(--gray-500)）
       * mb-1.5 — 下边距 6px（对应原型 margin-bottom: 6px）
       */}
      <div className="mb-1.5 text-xs text-gray-500">{label}</div>

      {/**
       * 大数字 — 28px 粗体
       * text-[28px] — 28px 字号（对应原型 font-size: 28px）
       * font-bold — 700 字重（对应原型 font-weight: 700）
       * text-gray-900 — 默认深色（对应原型 color: var(--gray-900)）
       *
       * cn() 动态拼接颜色：
       * - colorClass 为空字符串时，cn() 会自动跳过它，只保留 text-gray-900
       * - colorClass 为 "text-purple" 时，后写的覆盖前面的 text-gray-900
       *   （Tailwind 的后写的类名覆盖先写的，CSS 优先级相同时看顺序）
       */}
      <div className={cn("text-[28px] font-bold text-gray-900", colorClass)}>
        {value}
      </div>

      {/**
       * 副标题 — 更小的灰色字
       * text-xs — 12px
       * text-gray-400 — 比标题更浅的灰色（对应原型 color: var(--gray-400)）
       * mt-0.5 — 上边距 2px（对应原型 margin-top: 2px）
       */}
      <div className="mt-0.5 text-xs text-gray-400">{sub}</div>
    </div>
  );
}

/* ============================================================
 * 主组件：StatsCards
 * 渲染一行 4 个统计卡片
 * ============================================================ */

export function StatsCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {statCards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          sub={card.sub}
          colorClass={card.colorClass}
        />
      ))}
    </div>
  );
}
