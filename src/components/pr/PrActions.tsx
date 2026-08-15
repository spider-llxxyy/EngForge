"use client";

/**
 * PrActions — PR 操作按钮（合并 / 关闭）
 *
 * 权限规则：
 * - 合并：只有 essay owner 可以合并
 * - 关闭：owner 或 PR 创建者可以关闭
 *
 * 合并前弹出确认 modal，防止误操作。
 * 操作成功后 router.refresh() 刷新页面数据。
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GitMerge, X } from "lucide-react";
import { mergePr, closePr } from "@/lib/essay-actions";

interface PrActionsProps {
  prId: string;
  essayId: string;
  isOwner: boolean;
  isCreator: boolean;
  prTitle: string;
}

export function PrActions({
  prId,
  essayId,
  isOwner,
  isCreator,
  prTitle,
}: PrActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMergeModal, setShowMergeModal] = useState(false);

  const handleMerge = () => {
    startTransition(async () => {
      const result = await mergePr(prId);
      if (result.success) {
        toast.success("批改已合并", {
          description: "作文已更新到合并后的版本",
        });
        router.push(`/essays/${essayId}`);
      } else {
        toast.error("合并失败", {
          description: result.error ?? "请稍后重试",
        });
      }
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      const result = await closePr(prId);
      if (result.success) {
        toast.success("批改请求已关闭");
        router.refresh();
      } else {
        toast.error("关闭失败", {
          description: result.error ?? "请稍后重试",
        });
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {isOwner && (
          <button
            onClick={() => setShowMergeModal(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-md bg-green px-4 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitMerge className="h-4 w-4" />
            合并批改
          </button>
        )}
        {(isOwner || isCreator) && (
          <button
            onClick={handleClose}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            关闭
          </button>
        )}
      </div>

      {/* 合并确认 Modal */}
      {showMergeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => !isPending && setShowMergeModal(false)}
        >
          <div
            className="w-[420px] rounded-card bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-950">
              确认合并批改
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              确定要合并「{prTitle}」吗？合并后会基于批改内容创建新版本，
              并将作文的当前版本更新为合并后的版本。此操作不可撤销。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowMergeModal(false)}
                disabled={isPending}
                className="rounded-md border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleMerge();
                  setShowMergeModal(false);
                }}
                disabled={isPending}
                className="rounded-md bg-green px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "合并中..." : "确认合并"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
