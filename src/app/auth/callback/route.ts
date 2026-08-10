/**
 * 邮箱确认回调路由
 *
 * Supabase 邮箱确认链接会重定向到 /auth/callback?code=xxx。
 * 此路由用 code 换取 session，然后跳转 /dashboard。
 *
 * 可能的 URL 参数组合：
 * 1. ?code=xxx              — 正常流程：用 code 换 session
 * 2. ?error=xxx&error_code=yyy&error_description=zzz — Supabase 返回错误
 * 3. 无参数                   — 直接跳转首页
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/** 把 Supabase 回调错误码映射为中文提示 */
function mapCallbackError(
  errorCode: string | null,
  errorDescription: string | null
): string {
  // 优先用 error_code 做精确匹配
  if (errorCode === "otp_expired") {
    return "确认链接已过期，请重新注册或直接登录。";
  }
  if (errorCode === "access_denied") {
    return "邮箱确认被拒绝，请重新注册。";
  }
  if (errorCode === "user_banned") {
    return "账号已被封禁，请联系管理员。";
  }

  // 降级：用 error_description（英文原文）
  if (errorDescription) {
    return errorDescription;
  }

  return "邮箱确认失败，请重新注册。";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorCode = requestUrl.searchParams.get("error_code");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Supabase 在 URL 中返回错误（如 OTP 过期、access_denied）
  if (errorParam || errorCode || errorDescription) {
    const message = mapCallbackError(errorCode, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, requestUrl.origin)
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // 服务端组件 cookies 只读，忽略
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // code_verifier 丢失或 code 过期 → 跳转登录页并提示
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent("邮箱确认失败，请直接登录。如果无法登录，请重新注册。")}`,
          requestUrl.origin
        )
      );
    }
  }

  // 成功 → 跳转到 Dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
