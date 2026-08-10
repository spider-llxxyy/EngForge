/**
 * 邮箱确认回调路由
 *
 * Supabase 邮箱确认链接会重定向到 /auth/callback?code=xxx。
 * 此路由用 code 换取 session，然后跳转 /dashboard。
 * 如果交换失败（如 code_verifier 丢失），跳转 /login 并带错误提示。
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Supabase 可能在 URL 中直接返回错误
  if (errorDescription) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription)}`, requestUrl.origin)
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
