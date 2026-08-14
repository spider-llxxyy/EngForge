"use client";

/**
 * UserMenu — 右上角用户菜单
 *
 * 点击头像 → 下拉菜单（退出登录）。
 * 退出调用 supabase.auth.signOut()，然后跳转 /login。
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/lib/auth";

interface UserMenuProps {
  user: SessionUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      {/* 头像按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-zinc-100"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
          {user.avatarInitials}
        </div>
        <span className="text-sm font-medium text-zinc-700">
          {user.username}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {/* 邮箱（只读展示） */}
          <div className="border-b border-zinc-100 px-4 py-2">
            <p className="text-xs text-zinc-400">已登录</p>
            <p className="truncate text-sm font-medium text-zinc-700">
              {user.email}
            </p>
          </div>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-zinc-400" />
            {loading ? "退出中..." : "退出登录"}
          </button>
        </div>
      )}
    </div>
  );
}
