/**
 * Browser Supabase Client
 *
 * 在客户端组件中使用（"use client" 的文件）。
 * 自动从浏览器 cookie 读取认证 session。
 *
 * 用法：
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *   const { data } = await supabase.from('essays').select('*')
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
