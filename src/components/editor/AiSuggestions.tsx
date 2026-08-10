"use client";

/**
 * AiSuggestions — AI 标注建议面板
 *
 * 功能：
 * 1. 接收编辑器的纯文本，实时扫描匹配词库
 * 2. 显示标注列表（原词 + 等级标签 + 建议替换 chips）
 * 3. 点击建议 chip → 调用 onReplace 回调 → 编辑器内替换文本
 *
 * Phase 1 使用客户端词库（ai-dictionary.ts），Phase 3 替换为 LLM API。
 */

import { useMemo } from "react";
import { scanText } from "@/lib/ai-dictionary";
import type { AiLevel } from "@/lib/ai-dictionary";

interface AiSuggestionsProps {
  /** 编辑器当前纯文本 */
  text: string;
  /** 替换回调：在编辑器中将原词替换为建议词 */
  onReplace: (originalWord: string, suggestion: string) => void;
}

/** 等级标签配置 */
const LEVEL_CONFIG: Record<AiLevel, { label: string; bgClass: string; textClass: string }> = {
  l1: { label: "建议改进", bgClass: "bg-amber-light", textClass: "text-amber" },
  l2: { label: "可选优化", bgClass: "bg-teal-light", textClass: "text-teal" },
};

export function AiSuggestions({ text, onReplace }: AiSuggestionsProps) {
  // 扫描文本，获取所有标注
  const annotations = useMemo(() => scanText(text), [text]);

  // 统计唯一词条数（同一词出现多次只算一条）
  const uniqueWords = useMemo(() => {
    const seen = new Set<string>();
    annotations.forEach((a) => seen.add(a.key));
    return seen.size;
  }, [annotations]);

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">AI 标注</span>
          {uniqueWords > 0 && (
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary">
              {uniqueWords} 个词
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-400">客户端词库</span>
      </div>

      {/* 标注列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {annotations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
            <span className="mb-2 text-3xl">✓</span>
            <span>暂无标注建议</span>
            <span className="mt-1 text-xs">写得不错！继续加油。</span>
          </div>
        ) : (
          <div className="space-y-3">
            {annotations.map((ann, idx) => {
              const levelCfg = LEVEL_CONFIG[ann.entry.type];
              return (
                <div
                  key={`${ann.key}-${ann.offset}-${idx}`}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  {/* 原词 + 等级标签 */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {ann.word}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${levelCfg.bgClass} ${levelCfg.textClass}`}
                    >
                      {levelCfg.label}
                    </span>
                  </div>

                  {/* 原因 */}
                  <p className="mb-2 text-xs text-gray-500">{ann.entry.reason}</p>

                  {/* 建议 chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {ann.entry.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => onReplace(ann.word, suggestion)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
                      >
                        <span className="text-gray-400">→</span>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div className="border-t border-gray-200 px-4 py-2.5 text-[11px] text-gray-400">
        Phase 1 客户端词库 · Phase 3 将接入 LLM 实时标注
      </div>
    </div>
  );
}
