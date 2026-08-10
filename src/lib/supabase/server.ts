/**
 * Server Supabase Client
 *
 * 在服务端组件、Server Actions、Route Handlers 中使用。
 * 从 Next.js cookies() 读取并写入认证 session。
 *
 * 用法：
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('essays').select('*')
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * 显式标注返回类型为 SupabaseClient<Database>。
 *
 * @supabase/ssr 的 createServerClient 泛型推断在 insert() / rpc() 链上
 * 会退化为 never，导致编译报错。显式标注返回类型可解决此问题。
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll 在服务端组件中调用时会抛错（只读 cookies）。
            // 这是正常的——中间件会处理 cookie 刷新。
          }
        },
      },
    }
  )
}
