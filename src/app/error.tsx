"use client";

/**
 * Root Error Boundary
 *
 * 捕获 root layout 子树中未被更低层 error.tsx 捕获的错误。
 * 这是最后的兜底——如果这里也触发，用户会看到 Next.js 默认错误页。
 *
 * 必须 "use client"：error.tsx 需要接收 error + reset 并处理交互。
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    // 上报错误到监控服务（Phase 2 接 Sentry）
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-light">
          <AlertTriangle className="h-8 w-8 text-red" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-zinc-950">
          出了点问题
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          页面加载时发生了错误。你可以尝试重新加载，或者返回首页。
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            <RotateCcw className="h-4 w-4" />
            重试
          </button>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            返回首页
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-zinc-400">
            错误码：{error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
