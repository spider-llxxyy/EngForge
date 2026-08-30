/**
 * EssayList — 我的作文列表面板
 *
 * 数据由 Dashboard 页面通过 props 传入。
 * 空列表时显示引导用户新建作文的空状态。
 */

import Link from "next/link";
import { Plus } from "lucide-react";

import {
  statusConfig,
  tagConfig,
  tagLabels,
  type DashboardEssay,
} from "@/lib/dashboard-data";

interface EssayListItemProps {
  essay: DashboardEssay;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 7) return new Date(iso).toLocaleDateString("zh-CN");
  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return "刚刚";
}

function EssayListItem({ essay }: EssayListItemProps) {
  const status = statusConfig[essay.status];
  const tag = tagConfig[essay.tag];
  const tagLabel = tagLabels[essay.tag];

  return (
    <Link
      href={essay.href}
      className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-zinc-50"
    >
      {/* 状态圆点 */}
      <span
        className={`h-2 w-2 flex-shrink-0 rounded-full ${status.dotClass}`}
        aria-label={status.label}
      />

      {/* 作文信息 */}
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 truncate text-sm font-medium text-zinc-700">
          {essay.title}
        </p>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span
            className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${tag.bgClass} ${tag.textClass}`}
          >
            {tagLabel} v{essay.versionNumber}
          </span>
          <span>{essay.wordCount} 词</span>
          <span>{formatRelativeTime(essay.updatedAt)}</span>
          {/* 状态 pill */}
          {essay.statusPill && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${essay.statusPill.className}`}
            >
              {essay.statusPill.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface EssayListProps {
  essays: DashboardEssay[];
}

export function EssayList({ essays }: EssayListProps) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      {/* 面板头部 */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <h3 className="text-[15px] font-semibold text-zinc-950">我的作文</h3>
        <Link
          href="/editor"
          className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <Plus className="h-3.5 w-3.5" />
          新建作文
        </Link>
      </div>

      {/* 列表区域 */}
      <div className="py-2">
        {essays.length > 0 ? (
          essays.map((essay) => (
            <EssayListItem key={essay.id} essay={essay} />
          ))
        ) : (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <p className="mb-1 text-sm text-zinc-500">暂无作文</p>
            <p className="mb-4 text-xs text-zinc-400">
              点击「新建作文」开始你的第一篇练习
            </p>
            <Link
              href="/editor"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              新建作文
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
