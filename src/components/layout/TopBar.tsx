"use client";

/**
 * TopBar — 顶栏
 *
 * 左：页面标题（根据 pathname 映射）
 * 右：+ 新建作文 按钮（仅 Dashboard 显示）+ UserMenu
 *
 * 接收 user 作为 prop（由 layout 异步获取后传入）。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/UserMenu";
import type { SessionUser } from "@/lib/auth";

interface TopBarProps {
  user: SessionUser;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "我的工坊",
  "/editor": "作文编辑器",
};

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname]
    ?? (pathname.startsWith("/editor") ? "作文编辑器"
      : pathname.startsWith("/essays") ? "作品详情"
      : "EngForge");
  const showNewEssay = pathname === "/dashboard";

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-3">
      {/* 左：页面标题 */}
      <span className="text-sm font-semibold text-gray-900">
        {title}
      </span>

      {/* 右：操作按钮 + 用户菜单 */}
      <div className="flex items-center gap-4">
        {showNewEssay && (
          <Link
            href="/editor"
            className="rounded border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            + 新建作文
          </Link>
        )}
        <UserMenu user={user} />
      </div>
    </div>
  );
}
