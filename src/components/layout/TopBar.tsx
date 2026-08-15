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
import { Plus } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { JoinByCode } from "@/components/essay/JoinByCode";
import type { SessionUser } from "@/lib/auth";

interface TopBarProps {
  user: SessionUser;
  /** 服务端查询的未读通知数（避免铃铛徽章首帧闪烁） */
  unreadCount: number;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "我的工坊",
  "/editor": "作文编辑器",
};

export function TopBar({ user, unreadCount }: TopBarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname]
    ?? (pathname.startsWith("/editor") ? "作文编辑器"
      : pathname.includes("/prs/") ? "批改请求"
      : pathname.startsWith("/essays") ? "作品详情"
      : "EngForge");
  const showNewEssay = pathname === "/dashboard";

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-8 py-3">
      {/* 左：页面标题 */}
      <span className="text-base font-semibold text-zinc-950">
        {title}
      </span>

      {/* 右：操作按钮 + 用户菜单 */}
      <div className="flex items-center gap-4">
        {showNewEssay && (
          <Link
            href="/editor"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-3.5 w-3.5" />
            新建作文
          </Link>
        )}
        <NotificationBell userId={user.id} initialUnread={unreadCount} />
        <JoinByCode />
        <UserMenu user={user} />
      </div>
    </div>
  );
}
