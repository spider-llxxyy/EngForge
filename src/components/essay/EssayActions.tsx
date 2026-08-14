"use client";

/**
 * EssayActions — Fork / Star / 编辑 按钮组
 *
 * - 编辑：仅 owner 或 editor 成员可见，跳转 /editor/[essayId]
 * - Fork：非 owner 可见，调 forkEssay server action
 * - Star：所有人可见，调 toggleStar server action
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, GitFork, Star } from "lucide-react";
import { forkEssay, toggleStar } from "@/lib/essay-actions";

interface EssayActionsProps {
  essayId: string;
  isOwner: boolean;
  isStarred: boolean;
  canEdit: boolean;
  starCount: number;
}

export function EssayActions({
  essayId,
  isOwner,
  isStarred,
  canEdit,
  starCount,
}: EssayActionsProps) {
  const router = useRouter();
  const [forking, setForking] = useState(false);
  const [forkError, setForkError] = useState("");
  const [starred, setStarred] = useState(isStarred);
  const [currentStarCount, setCurrentStarCount] = useState(starCount);
  const [starring, setStarring] = useState(false);

  async function handleFork() {
    if (forking) return;
    setForking(true);
    setForkError("");

    const result = await forkEssay(essayId);

    if (result.success && result.newEssayId) {
      toast.success("Fork 成功", {
        description: "已创建到你的工坊，正在跳转...",
      });
      router.push(`/essays/${result.newEssayId}`);
    } else {
      setForkError(result.error ?? "Fork 失败");
      toast.error("Fork 失败", {
        description: result.error ?? "请稍后重试",
      });
      setForking(false);
    }
  }

  async function handleStar() {
    if (starring) return;
    setStarring(true);

    const result = await toggleStar(essayId);

    if (result.success) {
      setStarred(result.starred ?? false);
      setCurrentStarCount((prev) => (result.starred ? prev + 1 : prev - 1));
      toast.success(result.starred ? "已收藏" : "已取消收藏");
    } else {
      toast.error("操作失败，请重试");
    }
    setStarring(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {/* 编辑 */}
        {canEdit && (
          <Link
            href={`/editor/${essayId}`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            编辑
          </Link>
        )}

        {/* Fork */}
        {!isOwner && (
          <button
            onClick={handleFork}
            disabled={forking}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <GitFork className="h-3.5 w-3.5" />
            {forking ? "Fork 中..." : "Fork"}
          </button>
        )}

        {/* Star */}
        <button
          onClick={handleStar}
          disabled={starring}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            starred
              ? "border-amber/40 bg-amber/10 text-amber"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${starred ? "fill-current" : ""}`} />
          {currentStarCount}
        </button>
      </div>

      {forkError && (
        <span className="text-xs text-red">{forkError}</span>
      )}
    </div>
  );
}
