/**
 * PrDiffView — 行级差异渲染器
 *
 * 解析 pull_requests.diff_text（JSON 字符串），
 * 逐行渲染：removed(红色背景)、added(绿色背景)、context(灰色)。
 *
 * 这是纯展示组件，不需要客户端交互，不加 "use client"。
 */

import { parseDiffText } from "@/lib/diff";

interface PrDiffViewProps {
  diffText: string;
}

export function PrDiffView({ diffText }: PrDiffViewProps) {
  const lines = parseDiffText(diffText);

  if (lines.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-zinc-400">
        无差异内容
      </div>
    );
  }

  return (
    <div className="overflow-x-auto font-mono text-sm">
      {lines.map((line, idx) => {
        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        const bgClass =
          line.type === "added"
            ? "bg-[#ECFDF5]"
            : line.type === "removed"
              ? "bg-[#FEF2F2]"
              : "";
        const textClass =
          line.type === "added"
            ? "text-[#059669]"
            : line.type === "removed"
              ? "text-[#B91C1C]"
              : "text-zinc-600";
        const prefixClass =
          line.type === "added"
            ? "text-[#059669]"
            : line.type === "removed"
              ? "text-[#B91C1C]"
              : "text-zinc-300";

        return (
          <div
            key={idx}
            className={`flex ${bgClass}`}
          >
            <span
              className={`w-8 flex-shrink-0 select-none px-2 text-right ${prefixClass}`}
            >
              {prefix}
            </span>
            <span className={`flex-1 whitespace-pre-wrap px-3 py-0.5 ${textClass}`}>
              {line.text || "\u00A0"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
