"use client";

/**
 * DetailSidebar — 详情页右侧栏
 *
 * 两个卡片：
 * 1. 协作者：成员列表 + 邀请按钮（owner 可见，InviteManager）+ 移除成员（owner 可见）
 * 2. 数据统计：Fork / Star / 版本数
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, BarChart3, UserMinus } from "lucide-react";
import type { MemberData } from "./DetailClient";
import { InviteManager } from "./InviteManager";
import { removeMember } from "@/lib/essay-actions";

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
  essayId,
}: DetailSidebarProps) {
  const router = useRouter();
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function handleRemove(userId: string) {
    setRemoving(true);
    const result = await removeMember(essayId, userId);
    if (result.success) {
      toast.success("成员已移除");
      setConfirmingUserId(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "移除失败");
    }
    setRemoving(false);
  }

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
              <div key={m.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                    {m.avatar_initials}
                  </span>
                  <span className="text-sm text-zinc-700">{m.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">
                    {roleLabels[m.role] ?? m.role}
                  </span>
                  {isOwner && m.role !== "owner" && (
                    <>
                      {confirmingUserId === m.user_id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRemove(m.user_id)}
                            disabled={removing}
                            className="text-xs text-red hover:opacity-70"
                          >
                            {removing ? "移除中..." : "确认移除"}
                          </button>
                          <button
                            onClick={() => setConfirmingUserId(null)}
                            disabled={removing}
                            className="text-xs text-zinc-400 hover:text-zinc-600"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingUserId(m.user_id)}
                          className="rounded p-1 text-zinc-300 transition-colors hover:text-red"
                          title="移除成员"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">暂无协作者信息</p>
        )}

        {/* 邀请按钮 */}
        {isOwner && <InviteManager essayId={essayId} />}
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
