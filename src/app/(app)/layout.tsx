/**
 * (app)/layout.tsx — 应用内页面共享布局
 *
 * 异步服务端组件：获取当前用户 session，
 * 渲染 Sidebar + TopBar + 页面内容。
 * 未登录时 redirect 到 /login（middleware 的安全网）。
 */

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { getSessionUser } from "@/lib/auth";

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await getSessionUser();

  // 安全网：middleware 已拦截未登录请求，此处双重保险
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-zinc-50">
        <TopBar user={user} />
        {children}
      </main>
    </div>
  );
}
