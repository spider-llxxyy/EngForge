"use client";

/**
 * App Group Error Boundary
 *
 * 捕获 (app) 路由组内的错误（Dashboard / Editor / Detail 页面）。
 * 与 root error.tsx 不同，这里保持应用内布局风格，
 * 用户可以返回 Dashboard 而不是被踢到首页。
 */

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-8 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-light">
          <AlertTriangle className="h-7 w-7 text-red" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-zinc-950">
          页面加载失败
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          数据加载时出了点问题。可以重试，或返回工坊首页。
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
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            返回工坊
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
