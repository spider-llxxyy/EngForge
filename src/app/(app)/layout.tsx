/**
 * ============================================
 * (app)/layout.tsx — 应用内页面共享布局
 * ============================================
 *
 * 这是 Next.js 的「嵌套布局」概念。整个项目有两个 layout：
 *
 * 1. src/app/layout.tsx     ← 根布局（所有页面的外壳）
 *    包含 <html>、<body>、全局字体、全局 CSS
 *    所有页面都被它包裹，包括 Landing
 *
 * 2. src/app/(app)/layout.tsx  ← 你现在看的这个
 *    包含 Sidebar + 主内容区域
 *    只有 (app)/ 目录下的页面才被它包裹
 *
 * 嵌套顺序：根 layout → (app) layout → 具体页面
 *
 * 为什么用 (app) 路由组？
 * -----------------------
 * Next.js 的「路由组」用括号 ( ) 包裹文件夹名：
 *   src/app/(app)/dashboard/page.tsx  →  URL 是 /dashboard（不是 /app/dashboard）
 *   src/app/(app)/editor/page.tsx     →  URL 是 /editor
 *
 * 括号文件夹名不会出现在 URL 里——它的唯一作用是：
 * 让一组页面共享同一个 layout，但不影响 URL 路径。
 *
 * 这样 Landing 页面（在 src/app/page.tsx）不会被 Sidebar 包裹，
 * 而 Dashboard / Editor / Detail / Review（在 (app)/ 下）都有 Sidebar。
 */

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * children 的类型是 ReactNode — React 里"任何可渲染的内容"。
 * 包括 JSX 元素、字符串、数组、null 等。
 * 每个页面的 page.tsx 返回的 JSX 都可以作为 children 传进来。
 */
interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    /**
     * 最外层 flex 容器 — 横向排列
     * 左边是 Sidebar（固定宽度 240px），右边是主内容区（flex-1 占满剩余）
     * min-h-screen 确保至少占满整个浏览器视口高度
     */
    <div className="flex min-h-screen">
      {/* 左侧导航栏 — 所有应用内页面共享 */}
      <Sidebar />

      {/**
       * 右侧主内容区
       * flex-1 让它占满 Sidebar 右边的所有空间
       * overflow-y-auto 让内容超出时可以滚动，Sidebar 保持固定
       * bg-gray-50 浅灰背景，对应原型 .main-area 的 background: var(--gray-50)
       */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/**
         * children 就是每个页面的内容。
         * 比如在 /dashboard 页面，children 是 dashboard/page.tsx 返回的 JSX。
         * 每个页面自己负责渲染 top-bar（面包屑 + 操作按钮）和 content-area。
         */}
        {children}
      </main>
    </div>
  );
}
