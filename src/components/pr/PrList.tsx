/**
 * PrList — PR 列表组件
 *
 * 在 Detail 页的"批改记录" tab 中展示该作文的所有 PR。
 * 按状态分组：待审阅（open）/ 已合并（merged）/ 已关闭（closed）。
 *
 * 有编辑权限的协作者显示"提交批改"按钮。
 */

import Link from "next/link";
import { GitPullRequest, Plus } from "lucide-react";

export interface PrSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  creator: {
    username: string;
    avatar_initials: string;
  } | null;
}

interface PrListProps {
  essayId: string;
  prs: PrSummary[];
  canEdit: boolean;
}

/** PR 状态 → 中文标签 + 图标颜色 */
const statusConfig: Record<
  string,
  { label: string; dotClass: string; iconClass: string }
> = {
  open: {
    label: "待审阅",
    dotClass: "bg-amber",
    iconClass: "text-amber",
  },
  merged: {
    label: "已合并",
    dotClass: "bg-green",
    iconClass: "text-green",
  },
  closed: {
    label: "已关闭",
    dotClass: "bg-zinc-400",
    iconClass: "text-zinc-400",
  },
};

/** 格式化日期 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PrList({ essayId, prs, canEdit }: PrListProps) {
  // 按状态分组
  const openPRs = prs.filter((p) => p.status === "open");
  const mergedPRs = prs.filter((p) => p.status === "merged");
  const closedPRs = prs.filter((p) => p.status === "closed");

  const groups: { label: string; items: PrSummary[] }[] = [
    { label: "待审阅", items: openPRs },
    { label: "已合并", items: mergedPRs },
    { label: "已关闭", items: closedPRs },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* 提交批改按钮 */}
      {canEdit && (
        <div className="flex justify-end">
          <Link
            href={`/essays/${essayId}/prs/new`}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            提交批改
          </Link>
        </div>
      )}

      {/* 空状态 */}
      {prs.length === 0 && (
        <div className="rounded-card bg-white p-8 text-center text-sm text-zinc-400 shadow-card">
          <GitPullRequest className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          {canEdit
            ? "还没有批改请求，提交一个批改试试吧"
            : "还没有批改请求"}
        </div>
      )}

      {/* PR 分组列表 */}
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {group.label}（{group.items.length}）
          </h3>
          <div className="overflow-hidden rounded-card bg-white shadow-card">
            {group.items.map((pr, idx) => {
              const status = statusConfig[pr.status] ?? statusConfig.open;
              return (
                <Link
                  key={pr.id}
                  href={`/essays/${essayId}/prs/${pr.id}`}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 ${
                    idx > 0 ? "border-t border-zinc-100" : ""
                  }`}
                >
                  {/* 状态圆点 */}
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${status.dotClass}`}
                  />

                  {/* 标题 + 创建者 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950">
                      {pr.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      {pr.creator && (
                        <span className="flex items-center gap-1">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-medium text-white">
                            {pr.creator.avatar_initials}
                          </span>
                          {pr.creator.username}
                        </span>
                      )}
                      <span>{formatDate(pr.createdAt)}</span>
                    </div>
                  </div>

                  {/* 状态标签 */}
                  <span className={`text-xs font-medium ${status.iconClass}`}>
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
