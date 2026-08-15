/**
 * notification-config — 通知的共享展示配置
 *
 * 从 ActivityPanel 抽出，供「最近活动」面板与 TopBar 铃铛下拉共用：
 * - typeConfig: 通知类型 → lucide 图标 + 强调色（Bento Neutral: primary / green / amber）
 * - formatRelative: ISO 时间 → 中文相对时间
 */

import {
  Bell,
  GitFork,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  Mail,
  Star,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

/** 通知类型 → 图标 + 强调色 */
export const typeConfig: Record<string, { icon: LucideIcon; bgClass: string; textClass: string }> = {
  pr_received: { icon: GitPullRequest, bgClass: "bg-primary-light", textClass: "text-primary" },
  pr_merged: { icon: GitMerge, bgClass: "bg-green-light", textClass: "text-green" },
  pr_closed: { icon: GitPullRequestClosed, bgClass: "bg-zinc-100", textClass: "text-zinc-500" },
  fork: { icon: GitFork, bgClass: "bg-primary-light", textClass: "text-primary" },
  star: { icon: Star, bgClass: "bg-amber-light", textClass: "text-amber" },
  invite: { icon: Mail, bgClass: "bg-primary-light", textClass: "text-primary" },
  member_joined: { icon: UserPlus, bgClass: "bg-green-light", textClass: "text-green" },
};

export const defaultTypeConfig = { icon: Bell, bgClass: "bg-zinc-100", textClass: "text-zinc-500" };

/** ISO 时间 → 中文相对时间 */
export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}
