/**
 * ============================================
 * EssayList — 我的作品列表面板
 * ============================================
 * 包含面板头部（"我的作品" + "+ 新建"按钮）和 5 篇作文列表。
 * 每篇作文展示：状态圆点、标题、标签、词数/日期。
 *
 * 设计来源：原型 EngForge_原型.html 的 .panel + .comp-item 结构
 *
 * 为什么是服务端组件？
 * — 这个组件只做展示，不需要响应用户交互（点击跳转由 Link 处理），
 *   不需要 useState/useEffect 等 Hook，所以不加 "use client"。
 */

import Link from "next/link";

import {
  dashboardEssays,
  statusConfig,
  tagConfig,
  type DashboardEssay,
} from "@/lib/dashboard-data";

/* ============================================================
 * 子组件：EssayListItem
 * ============================================================
 * 单篇作文的行。
 * 拆成子组件是为了：
 * 1. 让父组件只管遍历，子组件只管渲染一行
 * 2. 每个组件的 JSX 不会太长，方便阅读和维护
 */

interface EssayListItemProps {
  essay: DashboardEssay;
}

function EssayListItem({ essay }: EssayListItemProps) {
  // 从映射表取出状态圆点颜色和标签配色
  // statusConfig 和 tagConfig 在 dashboard-data.ts 里定义
  const status = statusConfig[essay.status];
  const tag = tagConfig[essay.tag];

  // 词数显示逻辑：数字加"词"后缀，字符串（如"中译英"）直接显示
  // 原型 JS 逻辑：e.wordCount + (typeof e.wordCount === 'number' ? ' 词' : '')
  const wordCountText =
    typeof essay.wordCount === "number"
      ? `${essay.wordCount} 词`
      : essay.wordCount;

  return (
    <Link
      href={essay.href}
      className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-gray-50"
    >
      {/* 状态圆点 — 8px 圆点，颜色由 statusConfig 映射 */}
      <span
        className={`h-2 w-2 flex-shrink-0 rounded-full ${status.dotClass}`}
        aria-label={status.label}
      />

      {/* 作文信息区 — flex-1 占满剩余宽度，min-w-0 防止文字溢出 */}
      <div className="min-w-0 flex-1">
        {/* 标题 — 单行省略，超长文字用 ... 截断 */}
        <p className="mb-0.5 truncate text-sm font-medium text-gray-700">
          {essay.title}
        </p>

        {/* 元数据行 — 标签 + 词数 + 日期 */}
        <div className="flex gap-3 text-xs text-gray-500">
          {/* 标签 — 背景色 + 文字色由 tagConfig 映射 */}
          <span
            className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${tag.bgClass} ${tag.textClass}`}
          >
            {essay.tag}
          </span>

          <span>{wordCountText}</span>
          <span>{essay.dateText}</span>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
 * 父组件：EssayList
 * ============================================================
 * 整个面板。包含面板头部和列表区域。
 */

export function EssayList() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/*
       * 面板头部 — flex 布局，标题在左，按钮在右
       * 原型 .panel-header: padding 16px 20px, border-bottom, flex justify-between
       */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h3 className="text-[15px] font-semibold text-gray-800">我的作品</h3>

        {/* "+ 新建" 按钮 — 对应原型 .btn-sm */}
        <Link
          href="/editor"
          className="rounded border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          + 新建
        </Link>
      </div>

      {/*
       * 列表区域 — 遍历 dashboardEssays 数组渲染
       * 原型 .panel-body: padding 8px 0
       * 这里用 py-2 对应原型 padding 8px 0
       */}
      <div className="py-2">
        {dashboardEssays.map((essay) => (
          <EssayListItem key={essay.id} essay={essay} />
        ))}
      </div>
    </div>
  );
}
