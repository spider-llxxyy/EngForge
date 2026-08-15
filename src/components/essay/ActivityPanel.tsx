/**
 * ActivityPanel — 最近活动 + 学习目标
 *
 * 渲染 notifications 表最近 20 条通知（由 Dashboard 页面查询后传入）。
 * 按通知类型映射图标 + 强调色，带相对时间和未读标记；
 * link_url 有值时整条可点击跳转。
 *
 * 为什么是服务端组件？— 纯展示无交互，无需客户端 JS。
 */

import Link from "next/link";
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
import type { ActivityItem } from "@/lib/dashboard-data";

/** 通知类型 → 图标 + 强调色（Bento Neutral：primary / green / amber） */
const typeConfig: Record<string, { icon: LucideIcon; bgClass: string; textClass: string }> = {
  pr_received: { icon: GitPullRequest, bgClass: "bg-primary-light", textClass: "text-primary" },
  pr_merged: { icon: GitMerge, bgClass: "bg-green-light", textClass: "text-green" },
  pr_closed: { icon: GitPullRequestClosed, bgClass: "bg-zinc-100", textClass: "text-zinc-500" },
  fork: { icon: GitFork, bgClass: "bg-primary-light", textClass: "text-primary" },
  star: { icon: Star, bgClass: "bg-amber-light", textClass: "text-amber" },
  invite: { icon: Mail, bgClass: "bg-primary-light", textClass: "text-primary" },
  member_joined: { icon: UserPlus, bgClass: "bg-green-light", textClass: "text-green" },
};

const defaultConfig = { icon: Bell, bgClass: "bg-zinc-100", textClass: "text-zinc-500" };

/** ISO 时间 → 中文相对时间 */
function formatRelative(iso: string): string {
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

/** 单条活动记录 */
function ActivityRow({ activity }: { activity: ActivityItem }) {
  const config = typeConfig[activity.type] ?? defaultConfig;
  const Icon = config.icon;

  const inner = (
    <div className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50">
      {/* 类型图标 */}
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bgClass} ${config.textClass}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      {/* 文案 + 时间 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {/* 未读 → 蓝点标记 */}
          {!activity.isRead && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          )}
          <span
            className={`truncate text-[13px] font-medium ${
              activity.isRead ? "text-zinc-600" : "text-zinc-950"
            }`}
          >
            {activity.title}
          </span>
        </div>
        {activity.content && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{activity.content}</p>
        )}
      </div>

      <span className="shrink-0 self-center text-[11px] text-zinc-400">
        {formatRelative(activity.createdAt)}
      </span>
    </div>
  );

  // link_url 有值 → 整条可点击
  if (activity.linkUrl) {
    return (
      <Link href={activity.linkUrl} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

interface ActivityPanelProps {
  activities: ActivityItem[];
}

export function ActivityPanel({ activities }: ActivityPanelProps) {
  return (
    <div className="space-y-4">
      {/* 最近活动 */}
      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-[15px] font-semibold text-zinc-950">最近活动</h3>
        </div>

        {activities.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
            <p className="text-sm text-zinc-400">暂无活动</p>
            <p className="mt-1 text-xs text-zinc-300">
              发布作文、收到批改后会显示在这里
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* 学习目标 */}
      <div className="rounded-card bg-white p-5 shadow-card">
        <h4 className="mb-3 text-[13px] font-semibold text-zinc-700">
          学习目标
        </h4>
        <p className="text-[13px] text-zinc-400">即将上线</p>
      </div>
    </div>
  );
}
