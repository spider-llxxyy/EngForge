/**
 * (auth) 路由组共享布局 — 登录/注册页面
 *
 * 按 Ardot 设计稿（Login 2:250 / Register 2:269）实现：
 * zinc-50 背景 + 400px 居中白色卡片 + 超轻阴影，无 Sidebar。
 */

import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      {/* Logo — 图标 + 文字，点击回首页 */}
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
          E
        </span>
        <span className="text-xl font-semibold text-zinc-950">EngForge</span>
      </Link>

      {/* 卡片容器 */}
      <div className="w-full max-w-[400px] rounded-xl bg-white p-10 shadow-card">
        {children}
      </div>
    </div>
  );
}
