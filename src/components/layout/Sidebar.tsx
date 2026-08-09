"use client";

/**
 * ============================================
 * Sidebar — 左侧深色导航栏
 * ============================================
 *
 * 这是所有"应用内页面"（Dashboard / Editor / Detail / Review）
 * 共享的侧边栏组件。放在 (app)/layout.tsx 里，所有应用内页面
 * 自动获得侧边栏，不需要每个页面单独引入。
 *
 * 为什么是 "use client"（客户端组件）？
 * ------------------------------------
 * Next.js App Router 默认所有组件都是"服务端组件"——
 * 在服务器上渲染成 HTML 再发给浏览器，不能使用 React Hooks。
 *
 * 但这个组件需要用 usePathname() 这个 Hook——它返回当前 URL 路径，
 * 让侧边栏知道"你现在在哪个页面"，从而高亮对应的菜单项。
 * 用了 Hook 就必须声明 "use client"，告诉 Next.js：
 * "这个组件需要在浏览器里运行，不要只在服务端渲染。"
 *
 * 类比：服务端组件像"餐厅后厨提前做好的菜"，客户端组件像"当面现做的铁板烧"。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/dashboard-data";
import type { NavItem } from "@/lib/dashboard-data";
import type { SessionUser } from "@/lib/auth";

/* ============================================================
 * 子组件：单个导航项
 * ------------------------------------------------------------
 * 为什么要把单个导航项抽成子组件？
 * - 逻辑隔离：active/disabled/badge 三种状态各有不同的渲染逻辑
 * - 复用性：每个导航项都走同一段代码，改一处全改
 * - 可读性：父组件只管"遍历分组"，子组件只管"渲染一项"
 *
 * Props 的类型定义：
 * - item: NavItem — 从数据层定义的类型，保证字段名拼不错
 * - isActive: boolean — 由父组件通过 usePathname 计算后传入
 * ============================================================ */

interface NavItemLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavItemLink({ item, isActive }: NavItemLinkProps) {
  /**
   * 分支 1：disabled 的项目
   * 原型用 style="opacity:0.5;cursor:not-allowed"
   * 渲染成 <div> 而不是 <Link>，因为不能跳转
   */
  if (item.disabled) {
    return (
      <div className="flex cursor-not-allowed items-center gap-2.5 px-3 py-2 text-sm text-gray-300 opacity-50">
        <span className="w-[18px] text-center text-base">{item.icon}</span>
        <span>{item.label}</span>
        {item.disabledLabel && (
          <span className="ml-auto text-[10px] text-gray-500">
            {item.disabledLabel}
          </span>
        )}
      </div>
    );
  }

  /**
   * 分支 2：可点击的导航项
   * 用 Next.js 的 <Link> 组件做跳转（不是 <a> 标签）
   * Link 做了"预取"优化——鼠标悬停时就预加载目标页面，点击后秒开
   *
   * className 用 cn() 动态拼接：
   * - 基础样式（所有状态共用）：flex 布局 + 间距 + 圆角 + 过渡动画
   * - active 状态：蓝色背景 + 白字
   * - 非 active 状态：灰色字 + hover 变亮
   */
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-white"
          : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {/* 图标 — 固定宽度，保证所有图标的文字左对齐 */}
      <span className="w-[18px] text-center text-base">{item.icon}</span>
      <span>{item.label}</span>

      {/* 红色徽章 — 只有 badge 有值时才渲染 */}
      {/* ml-auto 把徽章推到最右边，和原型 margin-left:auto 一致 */}
      {item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-red px-1.5 py-px text-[10px] font-medium text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ============================================================
 * 主组件：Sidebar
 * ============================================================ */

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col bg-gray-900 text-gray-300">
      {/* ── Logo 区域 ── */}
      <div className="border-b border-white/[0.08] px-6 py-5 text-xl font-extrabold text-white">
        Eng<span className="text-primary">Forge</span>
      </div>

      {/* ── 导航区域 ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-2 pt-4 text-[11px] uppercase tracking-wide text-gray-500">
              {group.title}
            </div>
            {group.items.map((item) => (
              <NavItemLink
                key={item.label}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── 底部用户信息 ── */}
      <div className="flex items-center gap-2.5 border-t border-white/[0.08] px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple text-[13px] font-semibold text-white">
          {user.avatarInitials}
        </div>
        <div className="text-[13px]">
          <strong className="block font-medium text-white">
            {user.username}
          </strong>
          <span className="text-xs text-gray-500">
            {user.email}
          </span>
        </div>
      </div>
    </aside>
  );
}
