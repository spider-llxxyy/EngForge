/**
 * VersionHistory — 版本历史时间线
 *
 * 竖向时间线布局，每个版本项显示：
 * - 版本号 + 标记（当前/最新）
 * - 修改说明 (change_summary)
 * - 创建日期 + 词数
 *
 * 纯展示组件，无客户端交互。
 */

import type { VersionData } from "./DetailClient";

interface VersionHistoryProps {
  versions: VersionData[];
  currentVersion: number;
}

export function VersionHistory({ versions, currentVersion }: VersionHistoryProps) {
  // 倒序展示（最新在上）
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="relative">
        {/* 竖线 */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-zinc-200" />

        <div className="space-y-6">
          {sorted.map((v) => {
            const isCurrent = v.version_number === currentVersion;
            const isLatest = v.version_number === sorted[0].version_number;

            return (
              <div key={v.version_number} className="relative pl-8">
                {/* 圆点 */}
                <div
                  className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${
                    isCurrent
                      ? "border-primary bg-primary"
                      : "border-zinc-200 bg-white"
                  }`}
                />

                {/* 内容 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-950">
                    v{v.version_number}
                  </span>
                  {isCurrent && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                      当前
                    </span>
                  )}
                  {isLatest && !isCurrent && (
                    <span className="rounded bg-green/10 px-1.5 py-0.5 text-xs text-green">
                      最新
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  {v.change_summary || "无修改说明"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {v.created_at} · {v.word_count} 词
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
