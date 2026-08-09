/**
 * 认证辅助函数
 *
 * 在服务端组件中获取当前登录用户 + profile 数据。
 * 返回 null 表示未登录。
 */

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  avatarInitials: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 查 profile（触发器 handle_new_user 已在注册时自动创建）
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // @supabase/ssr 类型推断在 maybeSingle() 链上退化为 never，显式标注
  const profile = (data ?? null) as ProfileRow | null;

  return {
    id: user.id,
    email: user.email ?? "",
    username: profile?.username ?? user.email?.split("@")[0] ?? "",
    avatarInitials: profile?.avatar_initials ?? "U",
  };
}

/**
 * 强制要求登录。未登录返回 null（由调用方处理跳转）。
 * 返回 SessionUser 表示已登录。
 */
export async function requireSessionUser(): Promise<SessionUser | null> {
  return getSessionUser();
}
