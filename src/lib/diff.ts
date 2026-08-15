/**
 * 行级 Diff 生成器（基于 LCS 算法）
 *
 * 用于 PR 系统：对比 base 版本和 head 版本的纯文本，
 * 生成行级增/删/上下文差异，存入 pull_requests.diff_text 字段。
 *
 * 为什么自己实现而不装 diff 库？
 * - 英文作文通常几百词、几十行，O(n*m) 的 LCS 足够快
 * - 零新依赖，减少 bundle 体积
 * - diff 格式是自定义 JSON，前端 PrDiffView 直接解析
 *
 * 存储格式：JSON 字符串数组
 * [{type:"context",text:"..."}, {type:"removed",text:"..."}, {type:"added",text:"..."}]
 */

/** 一行差异 */
export interface DiffLine {
  type: "context" | "removed" | "added";
  text: string;
}

/**
 * 生成 diff 文本（JSON 字符串）
 *
 * @param baseText — base 版本的纯文本（当前版本）
 * @param headText — head 版本的纯文本（PR 提交的版本）
 * @returns JSON 字符串，可直接存入 diff_text 字段
 */
export function generateDiffText(baseText: string, headText: string): string {
  const baseLines = baseText.split("\n");
  const headLines = headText.split("\n");

  const diff = lcsDiff(baseLines, headLines);
  return JSON.stringify(diff);
}

/**
 * 解析 diff 文本为 DiffLine 数组
 *
 * @param diffText — pull_requests.diff_text 字段
 * @returns DiffLine[]，供 PrDiffView 渲染
 */
export function parseDiffText(diffText: string): DiffLine[] {
  if (!diffText) return [];
  try {
    const parsed = JSON.parse(diffText);
    if (!Array.isArray(parsed)) return [];
    return parsed as DiffLine[];
  } catch {
    return [];
  }
}

/**
 * LCS 行级 diff
 *
 * 算法：
 * 1. 构建 LCS（最长公共子序列）表
 * 2. 回溯：base 和 head 都没走 → context
 *           base 走了 head 没走 → removed
 *           head 走了 base 没走 → added
 */
function lcsDiff(base: string[], head: string[]): DiffLine[] {
  const m = base.length;
  const n = head.length;

  // 构建 LCS 表（+1 是因为空序列）
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (base[i - 1] === head[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯生成 diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && base[i - 1] === head[j - 1]) {
      // 共同行 → context
      result.unshift({ type: "context", text: base[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // head 独有 → added
      result.unshift({ type: "added", text: head[j - 1] });
      j--;
    } else {
      // base 独有 → removed
      result.unshift({ type: "removed", text: base[i - 1] });
      i--;
    }
  }

  return result;
}

/**
 * 统计 diff 中的增删行数
 * 用于 PR 列表摘要显示
 */
export function summarizeDiff(diffText: string): {
  added: number;
  removed: number;
} {
  const lines = parseDiffText(diffText);
  return {
    added: lines.filter((l) => l.type === "added").length,
    removed: lines.filter((l) => l.type === "removed").length,
  };
}
