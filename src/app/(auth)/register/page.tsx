"use client";

/**
 * 注册页面
 *
 * 邮箱 + 密码 + 用户名注册，调用 supabase.auth.signUp。
 * 用户名通过 options.data 传入，触发器 handle_new_user 从 raw_user_meta_data 提取。
 * 注册成功后自动登录并跳转 /dashboard（需关闭 Supabase 邮箱确认）。
 *
 * 错误处理：
 * - 429 速率限制：显示中文提示 + 按钮冷却 60 秒
 * - 其他错误：通过 formatAuthError 映射为友好中文提示
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, isRateLimited } from "@/lib/auth-errors";

/** 冷却时长（秒）— 注册失败后按钮锁定的时间 */
const COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(formatAuthError(error));
      setLoading(false);

      // 429 速率限制：启动冷却倒计时
      if (isRateLimited(error)) {
        startCooldown();
      }
      return;
    }

    // 如果邮箱确认开启，data.session 为 null，需要提示用户查邮件
    if (!data.session) {
      setSuccess("注册成功！请查收确认邮件后登录。");
      setLoading(false);
      // 停留在此页，用户确认后点登录
      return;
    }

    // 邮箱确认关闭 → 已自动登录
    router.push("/dashboard");
    router.refresh();
  }

  // 按钮文案
  const buttonText = () => {
    if (loading) return "注册中...";
    if (cooldown > 0) return `请等待 ${cooldown}s`;
    return "注册";
  };

  // 按钮是否禁用
  const buttonDisabled = loading || cooldown > 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">创建账号</h1>
      <p className="mb-6 text-sm text-gray-500">
        加入 EngForge，用 GitHub 的方式学英语
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
            用户名
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={2}
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="你的昵称"
            disabled={cooldown > 0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg bg-green/10 px-3 py-2 text-sm text-green">
            {success}
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

      <p className="mt-6 text-center text-sm text-gray-500">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}
