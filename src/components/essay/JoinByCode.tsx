"use client";

/**
 * JoinByCode — 凭邀请码加入协作
 *
 * TopBar 右侧的 Ticket 图标按钮。
 * 点击打开 modal，输入邀请码 → 调 joinByInviteCode SA
 * → 成功跳转 /essays/{essayId} / 失败 toast。
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket, X, Loader2 } from "lucide-react";
import { joinByInviteCode } from "@/lib/essay-actions";

export function JoinByCode() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleJoin() {
    if (!code.trim()) {
      toast.error("请输入邀请码");
      return;
    }
    startTransition(async () => {
      const result = await joinByInviteCode(code.trim());
      if (result.success && result.essayId) {
        toast.success("加入成功", {
          description: "正在跳转到作文详情页...",
        });
        setOpen(false);
        setCode("");
        router.push(`/essays/${result.essayId}`);
      } else {
        toast.error(result.error ?? "加入失败");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        title="凭邀请码加入协作"
      >
        <Ticket className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="w-[380px] rounded-card bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-950">
                凭邀请码加入协作
              </h3>
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handleJoin();
                }
              }}
              placeholder="输入邀请码"
              disabled={isPending}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm tracking-wider text-zinc-950 placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-400 focus:border-primary focus:outline-none"
            />

            <button
              onClick={handleJoin}
              disabled={isPending || !code.trim()}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加入中...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4" />
                  加入协作
                </>
              )}
            </button>

            <p className="mt-3 text-xs text-zinc-400">
              输入同学分享的邀请码，即可成为该作文的编辑，参与批改协作。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
