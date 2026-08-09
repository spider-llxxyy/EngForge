/**
 * (auth) 路由组共享布局 — 登录/注册页面
 *
 * 居中卡片布局，无 Sidebar。与 (app) 路由组隔离。
 */

import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-light to-purple-light px-4">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 text-2xl font-extrabold text-gray-900"
      >
        Eng<span className="text-primary">Forge</span>
      </Link>

      {/* 卡片容器 */}
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        {children}
      </div>
    </div>
  );
}
