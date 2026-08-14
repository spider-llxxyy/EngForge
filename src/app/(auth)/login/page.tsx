"use client";

/**
 * 登录页面
 *
 * 邮箱 + 密码登录，调用 supabase.auth.signInWithPassword。
 * 登录成功后跳转到 redirect 参数指定的页面（默认 /dashboard）。
 *
 * 错误处理：
 * - 429 速率限制：显示中文提示 + 按钮冷却 60 秒
 * - 其他错误：通过 formatAuthError 映射为友好中文提示
 * - URL 中的 error 参数（来自回调路由）：直接显示
 */

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, isRateLimited, withAuthTimeout } from "@/lib/auth-errors";

/** 冷却时长（秒）— 登录失败后按钮锁定的时间 */
const COOLDOWN_SECONDS = 60;

/**
 * 页面外壳：useSearchParams() 必须包在 Suspense 内，
 * 否则静态预渲染（next build）会报错。
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-zinc-400">加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") || ""
  );
  const [verifiedMsg, setVerifiedMsg] = useState(
    searchParams.get("verified") ? "邮箱已确认，请直接登录。" : ""
  );

  // 冷却倒计时（秒），> 0 时按钮禁用
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  /** 启动冷却倒计时 */
  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 冷却中或加载中：拒绝提交
    if (cooldown > 0 || loading) return;

    setLoading(true);
    setError("");
    setVerifiedMsg("");

    const supabase = createClient();
    const { error } = await withAuthTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      })
    );

    if (error) {
      setError(formatAuthError(error));
      setLoading(false);

      // 429 速率限制：启动冷却倒计时
      if (isRateLimited(error)) {
        startCooldown();
      }
      return;
    }

    // 刷新服务端组件（layout 会重新获取 session）
    router.push(redirectTo);
    router.refresh();
  }

  // 按钮文案
  const buttonText = () => {
    if (loading) return "登录中...";
    if (cooldown > 0) return `请等待 ${cooldown}s`;
    return "登录";
  };

  // 按钮是否禁用
  const buttonDisabled = loading || cooldown > 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-zinc-950">欢迎回来</h1>
      <p className="mb-6 text-sm text-zinc-500">
        登录你的 EngForge 工坊
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={cooldown > 0}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary-light disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
            密码
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            disabled={cooldown > 0}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary-light disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red">
            {error}
          </p>
        )}

        {verifiedMsg && !error && (
          <p className="rounded-lg bg-green/10 px-3 py-2 text-sm text-green">
            {verifiedMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={buttonDisabled}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buttonText()}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          注册
        </Link>
      </p>
    </div>
  );
}
