"use client";

/**
 * ============================================
 * Sidebar — 左侧导航栏（Bento Neutral 浅色版）
 * ============================================
 *
 * 按 Ardot 设计稿（Dashboard Frame 2:3）实现：
 * 白底 + zinc-200 右边框，Pill 风格导航项
 * （active = primary-subtle 底 + primary 字），底部用户卡片。
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
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  GitPullRequest,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/dashboard-data";
import type { NavItem } from "@/lib/dashboard-data";
import type { SessionUser } from "@/lib/auth";

/** 图标名称 → lucide-react 组件的映射 */
const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "file-plus": FilePlus,
  "file-text": FileText,
  "git-pull-request": GitPullRequest,
  "star": Star,
};

/* ============================================================
 * 子组件：单个导航项
 * ============================================================ */

interface NavItemLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavItemLink({ item, isActive }: NavItemLinkProps) {
  /**
   * 分支 1：disabled 的项目
   * 渲染成 <div> 而不是 <Link>，因为不能跳转
   */
  if (item.disabled) {
    const Icon = ICON_MAP[item.icon] ?? FileText;
    return (
      <div className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 opacity-60">
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span>{item.label}</span>
        {item.disabledLabel && (
          <span className="ml-auto text-[10px] text-zinc-400">
            {item.disabledLabel}
          </span>
        )}
      </div>
    );
  }

  /**
   * 分支 2：可点击的导航项（Pill 风格）
   * - active：primary-subtle 底 + primary 字
   * - 非 active：zinc-600 字 + hover 浅灰底
   */
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary-subtle font-semibold text-primary"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
      )}
    >
      {(() => {
        const Icon = ICON_MAP[item.icon] ?? FileText;
        return <Icon className="h-[18px] w-[18px] shrink-0" />;
      })()}
      <span>{item.label}</span>

      {/* 红色徽章 — 只有 badge 有值时才渲染 */}
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
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
      {/* ── Logo 区域 ── */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-bold text-white">
          E
        </span>
        <span className="text-lg font-semibold text-zinc-950">EngForge</span>
      </div>

      {/* ── 导航区域 ── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-2 pt-4 text-[11px] font-medium tracking-wide text-zinc-400">
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

      {/* ── 底部用户卡片 ── */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-2.5 rounded-lg bg-zinc-100 p-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {user.avatarInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-zinc-950">
              {user.username}
            </p>
            <p className="truncate text-[10px] text-zinc-500">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
