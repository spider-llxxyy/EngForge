"use client";

/**
 * InviteManager — 邀请码管理弹窗
 *
 * Owner 在 DetailSidebar 点击「邀请批改」打开此弹窗。
 * 功能：生成新邀请码 / 查看活跃码列表（使用次数/有效期）/ 复制 / 撤销。
 *
 * 查询邀请码用浏览器 client（invitations SELECT RLS = USING(true)，
 * 但弹窗只在 isOwner 时渲染，owner 看到的是自己的码）。
 * 生成/撤销走 Server Action（RPC 内部校验 ownership / RLS 校验 created_by）。
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy, Check, X, Plus, Loader2, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateInviteCode, revokeInviteCode } from "@/lib/essay-actions";

interface InviteRow {
  id: string;
  code: string;
  used_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

interface InviteManagerProps {
  essayId: string;
}

export function InviteManager({ essayId }: InviteManagerProps) {
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 打开弹窗或手动刷新时拉取活跃邀请码列表
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("invitations")
      .select("id, code, used_count, max_uses, expires_at, created_at")
      .eq("essay_id", essayId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setCodes((data as InviteRow[] | null) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, essayId, refreshTrigger]);

  function handleOpen() {
    setOpen(true);
    setLoading(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateInviteCode(essayId);
    if (result.success && result.code) {
      toast.success("邀请码已生成", { description: result.code });
      setLoading(true);
      setRefreshTrigger((n) => n + 1);
    } else {
      toast.error(result.error ?? "生成失败");
    }
    setGenerating(false);
  }

  async function handleRevoke(code: string) {
    setRevokingCode(code);
    const result = await revokeInviteCode(code);
    if (result.success) {
      toast.success("邀请码已撤销");
      setLoading(true);
      setRefreshTrigger((n) => n + 1);
    } else {
      toast.error(result.error ?? "撤销失败");
    }
    setRevokingCode(null);
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatExpiry(iso: string | null): string {
    if (!iso) return "永久";
    const d = new Date(iso);
    if (d < new Date()) return "已过期";
    return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="mt-3 w-full rounded-lg border border-dashed border-primary/30 px-3 py-2 text-xs text-primary transition-colors hover:bg-primary-subtle"
      >
        <span className="flex items-center justify-center gap-1.5">
          <Ticket className="h-3.5 w-3.5" />
          邀请批改
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-white p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-950">邀请批改</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {generating ? "生成中..." : "生成新邀请码"}
            </button>

            {/* Existing codes */}
            <div className="space-y-2">
              {loading ? (
                <div className="py-4 text-center text-sm text-zinc-400">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-zinc-300" />
                  加载中...
                </div>
              ) : codes.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-400">
                  暂无活跃邀请码
                </p>
              ) : (
                codes.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-zinc-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-sm font-semibold tracking-wider text-primary">
                        {row.code}
                      </code>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(row.code)}
                          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                        >
                          {copiedCode === row.code ? (
                            <Check className="h-3.5 w-3.5 text-green" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRevoke(row.code)}
                          disabled={revokingCode === row.code}
                          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red disabled:opacity-50"
                        >
                          {revokingCode === row.code ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                      <span>
                        已用 {row.used_count}
                        {row.max_uses ? `/${row.max_uses}` : ""}
                      </span>
                      <span>·</span>
                      <span>{formatExpiry(row.expires_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              将邀请码发给同学，他们输入后即可成为这篇作文的编辑，可以提交批改（PR）。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
