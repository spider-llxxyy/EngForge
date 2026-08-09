/**
 * ============================================
 * Dashboard 页面 — 我的工坊
 * ============================================
 *
 * 这是整个 Dashboard 页面的"组装车间"。
 * 之前做的 6 个组件（StatsCards / EssayList / Heatmap / ActivityPanel）
 * 都在这里被拼装成完整的页面。
 *
 * 页面结构（从上到下）：
 *
 * ┌──────────────────────────────────────────────────┐
 * │ Top Bar：面包屑"我的工坊" + "+ 新建作文"按钮       │
 * ├──────────────────────────────────────────────────┤
 * │ Content Area（max-width: 1200px）                  │
 * │  ┌────────────────────────────────────────────┐  │
 * │  │ 邀请制工坊模式 Banner                        │  │
 * │  ├────────────────────────────────────────────┤  │
 * │  │ Dash Header：问候语 + 4 个统计卡片           │  │
 * │  ├────────────────────────────────────────────┤  │
 * │  │ Dash Grid（1fr | 320px）                     │  │
 * │  │ ┌──────────────────┐ ┌──────────────────┐  │  │
 * │  │ │ EssayList        │ │ ActivityPanel    │  │  │
 * │  │ │ (我的作品)        │ │ (最近活动+目标)   │  │  │
 * │  │ ├──────────────────┤ │                  │  │  │
 * │  │ │ Heatmap          │ │                  │  │  │
 * │  │ │ (贡献热力图)      │ │                  │  │  │
 * │  │ └──────────────────┘ └──────────────────┘  │  │
 * │  └────────────────────────────────────────────┘  │
 * └──────────────────────────────────────────────────┘
 *
 * 为什么是服务端组件？
 * — 页面本身不需要交互，所有子组件也是服务端组件。
 *   整个页面在服务器上渲染成 HTML 一次性发给浏览器，加载快。
 *
 * Next.js App Router 约定：
 * — 文件路径 src/app/(app)/dashboard/page.tsx → URL /dashboard
 * — 页面组件必须 export default function
 * — (app) 是路由组，不出现在 URL 里
 */

import Link from "next/link";

import { StatsCards } from "@/components/essay/StatsCards";
import { EssayList } from "@/components/essay/EssayList";
import { Heatmap } from "@/components/essay/Heatmap";
import { ActivityPanel } from "@/components/essay/ActivityPanel";

export default function DashboardPage() {
  return (
    <>
      {/* ================================================================
       * Top Bar — 顶部导航条
       * ================================================================
       * 白色背景，底部 1px 边框，左右两端对齐（justify-between）。
       * 左边：面包屑"我的工坊"（当前页加粗）
       * 右边："+ 新建作文"按钮（点击跳转到 /editor 编辑器页面）
       *
       * 原型 .top-bar: padding 12px 32px, flex, justify-between
       * → py-3 (12px) + px-8 (32px) + flex + justify-between
       */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-3">
        {/* 面包屑 — 当前页名，加粗深色 */}
        <span className="text-sm font-semibold text-gray-900">
          我的工坊
        </span>

        {/*
         * "+ 新建作文" 按钮
         * — 用 <Link> 而不是 <button>，因为它是页面跳转（到 /editor）
         * — 样式对应原型 .btn-sm：灰边框白底，hover 变浅灰
         * — 原型是 .btn-sm（非 primary），所以用灰色边框不用蓝色填充
         */}
        <Link
          href="/editor"
          className="rounded border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          + 新建作文
        </Link>
      </div>

      {/* ================================================================
       * Content Area — 主内容区域
       * ================================================================
       * 原型 .content-area: padding 28px 32px, max-width 1200px
       * → py-7 (28px) + px-8 (32px) + max-w-[1200px]
       *
       * 不加 mx-auto（居中），因为 Sidebar 在左边，内容从左对齐。
       */}
      <div className="max-w-[1200px] px-8 py-7">
        {/* ============================================================
         * 邀请制工坊模式 Banner
         * ============================================================
         * 渐变背景（蓝→紫），圆角，内边距 16px 20px。
         * 原型 .invite-banner: linear-gradient(135deg, primary-light, purple-light)
         *
         * Tailwind 渐变语法：
         * — bg-gradient-to-br = 向右下方向渐变（对应 135deg）
         * — from-primary-light = 起始色（浅蓝）
         * — to-purple-light = 结束色（浅紫）
         * — 这两个颜色在 globals.css 的 @theme 里定义
         */}
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary-light to-purple-light px-5 py-4">
          {/* 图标 — 一个字母 "I" 放大显示 */}
          <span className="text-2xl">I</span>

          {/*
           * 文字区 — flex-1 占满剩余宽度
           * 原型 .invite-banner-text: flex 1, font-size 13px, color gray-700
           * — <strong> 用 block 让标题和描述分成两行
           */}
          <div className="flex-1 text-[13px] text-gray-700">
            <span className="mb-0.5 block font-semibold">邀请制工坊模式</span>
            你的作文默认私密，除非你手动设为公开，否则任何人（包括广场）都看不到。
          </div>
        </div>

        {/* ============================================================
         * Dash Header — 问候语 + 统计卡片
         * ============================================================
         * 左右两端对齐：左边问候语，右边 4 个统计卡片。
         * 原型 .dash-header: flex, justify-between, align-items flex-start, mb 28px
         * → flex + justify-between + items-start + mb-7 (28px)
         */}
        <div className="mb-7 flex items-start justify-between">
          {/* 问候语 — 大标题 + 副标题 */}
          <div>
            {/*
             * h2 — 24px 粗体，对应原型 .dash-title h2
             * Tailwind text-2xl = 24px, font-bold = 700
             */}
            <h2 className="mb-1 text-2xl font-bold text-gray-900">
              早上好，李同学
            </h2>
            {/* 副标题 — 14px 灰色 */}
            <p className="text-sm text-gray-500">
              你已经连续学习 47 天，今天写一篇吧
            </p>
          </div>

          {/*
           * 统计卡片组 — 4 个卡片横排
           * shrink-0 防止 flex 布局压缩卡片宽度
           *（flex 子元素默认可以被压缩，加了 shrink-0 就保持原始尺寸）
           */}
          <div className="shrink-0">
            <StatsCards />
          </div>
        </div>

        {/* ============================================================
         * Dash Grid — 两栏布局
         * ============================================================
         * 左栏占 1fr（弹性宽度），右栏固定 320px，间距 24px。
         * 原型 .dash-grid: grid, grid-template-columns 1fr 320px, gap 24px
         *
         * Tailwind 方括号语法：
         * — grid-cols-[1fr_320px] = grid-template-columns: 1fr 320px
         * — 下划线 _ 代表空格（CSS 值之间的分隔符）
         * — gap-6 = 24px（6 × 4px = 24px）
         */}
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* ===== 左栏：作品列表 + 热力图 ===== */}
          {/*
           * space-y-6 = 子元素之间 24px 间距
           *（对应原型 EssayList 面板的 margin-bottom: 24px）
           */}
          <div className="space-y-6">
            <EssayList />
            <Heatmap />
          </div>

          {/* ===== 右栏：活动面板 + 学习目标 ===== */}
          {/*
           * ActivityPanel 内部已用 space-y-4 管理两个子面板的间距，
           * 这里不需要再加间距类。
           */}
          <ActivityPanel />
        </div>
      </div>
    </>
  );
}
