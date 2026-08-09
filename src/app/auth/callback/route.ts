/**
 * 邮箱确认回调路由
 *
 * Supabase 邮箱确认链接会重定向到 /auth/callback?code=xxx。
 * 此路由用 code 换取 session，然后跳转 /dashboard。
 * 如果 Supabase 关闭了邮箱确认，此路由不会被触发。
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

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

    await supabase.auth.exchangeCodeForSession(code);
  }

  // 跳转到 Dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
