/**
 * Supabase Auth 错误 → 用户友好的中文提示
 *
 * Supabase 返回的 error 对象有两个关键字段：
 * - error.status: HTTP 状态码（429 = 速率限制, 400 = 参数错误, 等）
 * - error.message: 英文原始信息（如 "Email rate limit exceeded"）
 *
 * 这个工具把常见的错误映射成中文，让用户看得懂。
 */

/** 注册/登录失败的错误提示（已映射为中文） */
export function formatAuthError(error: {
  status?: number;
  message: string;
}): string {
  const { status, message } = error;

  // 429 速率限制 — 最常见，用户操作太频繁
  if (status === 429 || message.toLowerCase().includes("rate limit")) {
    return "操作过于频繁，请等待 1 小时后再试。这是 Supabase 免费版的速率限制（每小时 3-4 次注册）。";
  }

  // 邮箱相关
  if (message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already been registered")) {
    return "该邮箱已注册，请直接登录。";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "邮箱尚未确认，请检查邮箱中的确认链接。";
  }

  // 密码相关
  if (message.toLowerCase().includes("password should be at least")) {
    return "密码长度不足，至少需要 6 位字符。";
  }
  if (message.toLowerCase().includes("invalid credentials") || message.toLowerCase().includes("invalid login")) {
    return "邮箱或密码错误。";
  }

  // 邮箱格式
  if (message.toLowerCase().includes("invalid email") || message.toLowerCase().includes("unable to validate email")) {
    return "邮箱格式不正确。";
  }

  // 用户被封禁
  if (message.toLowerCase().includes("user not found")) {
    return "该邮箱尚未注册。";
  }

  // 网络错误
  if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network")) {
    return "网络连接失败，请检查网络后重试。";
  }

  // 兜底：显示原始信息（方便调试）
  return message;
}

/** 429 速率限制特殊处理：返回是否需要冷却 */
export function isRateLimited(error: { status?: number; message: string }): boolean {
  return error.status === 429 || error.message.toLowerCase().includes("rate limit");
}
