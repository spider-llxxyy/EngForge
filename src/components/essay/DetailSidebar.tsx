"use client";

/**
 * DetailSidebar — 详情页右侧栏
 *
 * 两个卡片：
 * 1. 协作者：成员列表 + 邀请按钮（owner 可见，Step 10 接入）
 * 2. 数据统计：Fork / Star / 版本数
 */

import { Users, BarChart3 } from "lucide-react";
import type { MemberData } from "./DetailClient";

interface DetailSidebarProps {
  members: MemberData[];
  forkCount: number;
  starCount: number;
  versionCount: number;
  isOwner: boolean;
  essayId: string;
}

const roleLabels: Record<string, string> = {
  owner: "作者",
  editor: "编辑",
  viewer: "查看",
};

export function DetailSidebar({
  members,
  forkCount,
  starCount,
  versionCount,
  isOwner,
}: DetailSidebarProps) {
  return (
    <div className="space-y-4">
      {/* 协作者卡片 */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-950">
          <Users className="h-4 w-4 text-zinc-400" />
          协作者
        </h3>
        {members.length > 0 ? (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.username} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                    {m.avatar_initials}
                  </span>
                  <span className="text-sm text-zinc-700">{m.username}</span>
                </div>
                <span className="text-xs text-zinc-400">
                  {roleLabels[m.role] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">暂无协作者信息</p>
        )}

        {/* 邀请按钮（Step 10 接入） */}
        {isOwner && (
          <button
            disabled
            className="mt-3 w-full rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-400"
          >
            邀请批改（Step 10）
          </button>
        )}
      </div>

      {/* 数据统计卡片 */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-950">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          数据
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-zinc-950">{starCount}</div>
            <div className="text-xs text-zinc-500">Star</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-950">{forkCount}</div>
            <div className="text-xs text-zinc-500">Fork</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-950">{versionCount}</div>
            <div className="text-xs text-zinc-500">版本</div>
          </div>
        </div>
      </div>
    </div>
  );
}
