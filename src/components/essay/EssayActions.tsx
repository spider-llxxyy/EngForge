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
      router.push(`/essays/${result.newEssayId}`);
    } else {
      setForkError(result.error ?? "Fork 失败");
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
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            编辑
          </Link>
        )}

        {/* Fork */}
        {!isOwner && (
          <button
            onClick={handleFork}
            disabled={forking}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
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
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>{starred ? "\u2605" : "\u2606"}</span>
          {currentStarCount}
        </button>
      </div>

      {forkError && (
        <span className="text-xs text-red">{forkError}</span>
      )}
    </div>
  );
}
