/**
 * Supabase Auth 错误 → 用户友好的中文提示
 *
 * Supabase 返回的 error 对象有两个关键字段：
 * - error.status: HTTP 状态码（429 = 速率限制, 400 = 参数错误, 408 = 超时, 等）
 * - error.message: 英文原始信息（如 "Email rate limit exceeded"）
 *
 * 这个工具把常见的错误映射成中文，让用户看得懂。
 * 同时提供 withAuthTimeout 超时包装，防止网络 hang 导致 UI 卡死。
 */

/** 请求超时（毫秒） */
const AUTH_TIMEOUT_MS = 10_000;

/** 超时后返回的模拟 error 对象 */
const TIMEOUT_ERROR = {
  status: 408,
  message: "__TIMEOUT__",
};

/**
 * 给 auth 请求加超时保护。
 * 超时后返回一个模拟的 error 对象（status=408），
 * 这样调用方可以走统一的 error 处理逻辑，不会卡死。
 */
export function withAuthTimeout<T>(promise: Promise<T>): Promise<T> {
  const timeoutResult = {
    data: null,
    error: TIMEOUT_ERROR,
  } as unknown as T;

  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(timeoutResult), AUTH_TIMEOUT_MS);
    }),
  ]);
}

/** 注册/登录失败的错误提示（已映射为中文） */
export function formatAuthError(error: {
  status?: number;
  message: string;
}): string {
  const { status, message } = error;

  // 超时（我们自己生成的模拟错误）
  if (status === 408 || message === "__TIMEOUT__") {
    return "网络请求超时，请检查网络连接后重试。";
  }

  // 429 速率限制 — 最常见，用户操作太频繁
  if (status === 429 || message.toLowerCase().includes("rate limit")) {
    return "操作过于频繁，请等待 1 小时后再试。这是 Supabase 免费版的速率限制（每小时 3-4 次注册）。";
  }

  // 邮箱相关
  if (
    message.toLowerCase().includes("already registered") ||
    message.toLowerCase().includes("already been registered")
  ) {
    return "该邮箱已注册，请直接登录。";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "该邮箱尚未确认。请检查邮箱中的确认链接，或联系管理员手动确认后重试。";
  }

  // 密码相关
  if (message.toLowerCase().includes("password should be at least")) {
    return "密码长度不足，至少需要 6 位字符。";
  }
  if (
    message.toLowerCase().includes("invalid credentials") ||
    message.toLowerCase().includes("invalid login")
  ) {
    return "邮箱或密码错误。";
  }

  // 邮箱格式
  if (
    message.toLowerCase().includes("invalid email") ||
    message.toLowerCase().includes("unable to validate email")
  ) {
    return "邮箱格式不正确。";
  }

  // 用户被封禁
  if (message.toLowerCase().includes("user not found")) {
    return "该邮箱尚未注册。";
  }

  // 网络错误
  if (
    message.toLowerCase().includes("fetch") ||
    message.toLowerCase().includes("network")
  ) {
    return "网络连接失败，请检查网络后重试。";
  }

  // 兜底：显示原始信息（方便调试）
  return message;
}

/** 429 速率限制特殊处理：返回是否需要冷却 */
export function isRateLimited(error: {
  status?: number;
  message: string;
}): boolean {
  return (
    error.status === 429 || error.message.toLowerCase().includes("rate limit")
  );
}
