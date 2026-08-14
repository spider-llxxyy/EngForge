/**
 * 404 页面
 *
 * 当用户访问不存在的路由时展示。
 * 替代 Next.js 默认的 404 页面，保持品牌一致性。
 */

import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-10">
      <div className="w-full max-w-[480px] rounded-xl bg-white px-12 py-14 text-center shadow-card">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle">
          <Compass className="h-8 w-8 text-primary" />
        </div>

        <h1 className="mb-2 text-5xl font-extrabold text-zinc-950">404</h1>
        <p className="mb-1 text-lg font-semibold text-zinc-700">
          找不到这个页面
        </p>
        <p className="mb-8 text-sm text-zinc-500">
          你访问的链接可能已失效，或者页面已被移除。
        </p>

        <div className="flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            返回工坊
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-50 hover:border-zinc-300"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}
