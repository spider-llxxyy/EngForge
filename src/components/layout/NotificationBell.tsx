"use client";

/**
 * NotificationBell — 站内通知铃铛
 *
 * - 徽章：未读数（99 封顶），初始值由 layout 服务端查询传入，避免首帧闪烁
 * - 下拉面板：最近 10 条通知，点单条 → 标记已读 + 跳转 link_url；「全部已读」一键清零
 * - 实时：Supabase Realtime 订阅 notifications 表 INSERT（filter 当前用户），
 *   新通知到达 → 未读数 +1 + sonner toast（可点击跳转）
 * - 标记已读用浏览器 client 直接 UPDATE：RLS 限定 user_id = auth.uid()，
 *   本人只能改自己的通知，无越权面（无需绕 Server Action 往返）
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { typeConfig, defaultTypeConfig, formatRelative } from "@/lib/notification-config";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  content: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
  initialUnread: number;
}

export function NotificationBell({ userId, initialUnread }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  // open 的最新值供 Realtime 回调判断（回调闭包会捕获旧 state）
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // ── 打开面板时拉取最近 10 条 ──
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    createClient()
      .from("notifications")
      .select("id, type, title, content, link_url, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!cancelled) {
          setItems((data as NotificationRow[] | null) ?? []);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  // ── Realtime 订阅：新通知 INSERT → 徽章 +1 + toast ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`notifications:${userId}`);

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as unknown as NotificationRow;
        setUnread((u) => u + 1);
        // 面板开着 → 顶部插入这条；收起 → 弹 toast 提示
        if (openRef.current) {
          setItems((prev) => (prev ? [row, ...prev].slice(0, 10) : [row]));
        } else {
          toast(row.title, {
            description: row.content || undefined,
            action: row.link_url
              ? {
                  label: "查看",
                  onClick: () => router.push(row.link_url!),
                }
              : undefined,
          });
        }
      }
    );

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  // ── 标记单条已读 ──
  async function markRead(notification: NotificationRow) {
    // 先跳转再标记（乐观更新本地状态），避免等待网络
    if (notification.link_url) {
      router.push(notification.link_url);
    }
    if (notification.is_read) return;
    setUnread((u) => Math.max(0, u - 1));
    setItems((prev) =>
      prev ? prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)) : prev
    );
    const supabase = createClient();
    // as never：@supabase/ssr 在 update() 链退化为 never（既有技术债务，见 TECH_DEBT）
    await supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("id", notification.id);
  }

  // ── 全部已读 ──
  async function markAllRead() {
    if (unread === 0 || markingAll) return;
    setMarkingAll(true);
    setUnread(0);
    setItems((prev) => (prev ? prev.map((n) => ({ ...n, is_read: true })) : prev));
    const supabase = createClient();
    // as never：同上，update() 链类型退化
    await supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("user_id", userId)
      .eq("is_read", false);
    setMarkingAll(false);
  }

  return (
    <div className="relative">
      {/* 铃铛按钮 */}
      <button
        type="button"
        aria-label="通知"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* 下拉面板 */}
      {open && (
        <>
          {/* 透明遮罩：点击面板外关闭 */}
          <button
            type="button"
            aria-label="关闭通知面板"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-card bg-white shadow-card">
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <span className="text-[13px] font-semibold text-zinc-950">通知</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-dark disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  全部已读
                </button>
              )}
            </div>

            {/* 列表 */}
            {items === null ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-400">加载中…</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <p className="text-sm text-zinc-400">暂无通知</p>
                <p className="mt-1 text-xs text-zinc-300">
                  收到批改、Fork、收藏时会显示在这里
                </p>
              </div>
            ) : (
              <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
                {items.map((n) => {
                  const config = typeConfig[n.type] ?? defaultTypeConfig;
                  const Icon = config.icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markRead(n)}
                      className="flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${config.bgClass} ${config.textClass}`}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {!n.is_read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                          <span
                            className={`truncate text-[13px] font-medium ${
                              n.is_read ? "text-zinc-500" : "text-zinc-950"
                            }`}
                          >
                            {n.title}
                          </span>
                        </span>
                        {n.content && (
                          <span className="mt-0.5 block truncate text-xs text-zinc-400">
                            {n.content}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 self-center text-[11px] text-zinc-400">
                        {formatRelative(n.created_at)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
