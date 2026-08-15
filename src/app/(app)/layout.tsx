/**
 * (app)/layout.tsx — 应用内页面共享布局
 *
 * 异步服务端组件：获取当前用户 session + 未读通知数，
 * 渲染 Sidebar + TopBar（含通知铃铛）+ 页面内容。
 * 未登录时 redirect 到 /login（middleware 的安全网）。
 */

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await getSessionUser();

  // 安全网：middleware 已拦截未登录请求，此处双重保险
  if (!user) {
    redirect("/login");
  }

  // 未读通知数（count 查询不取数据，开销极小；失败静默降级为 0）
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  const unreadCount = count ?? 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-zinc-50">
        <TopBar user={user} unreadCount={unreadCount} />
        {children}
      </main>
    </div>
  );
}
