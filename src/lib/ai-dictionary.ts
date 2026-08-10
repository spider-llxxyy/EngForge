/**
 * AI 标注词库 — 客户端词库扫描
 *
 * Phase 1 保留原型中的客户端词库方案：扫描编辑器文本中的
 * 口语化/低阶词汇，给出书面化替换建议。
 *
 * Phase 3 会替换为 LLM API 实时标注。
 *
 * 词库来源：EngForge_原型.html 中的 WORD_SUGGESTIONS，1:1 搬运。
 */

/** 标注等级：l1 = 建议改进，l2 = 可选优化 */
export type AiLevel = "l1" | "l2";

/** 词库条目 */
export interface AiEntry {
  /** 标注等级 */
  type: AiLevel;
  /** 替换建议列表 */
  suggestions: string[];
  /** 标注原因（显示给用户） */
  reason: string;
}

/**
 * 词库 — key 是小写英文单词，value 是标注信息。
 *
 * 11 个词条，覆盖英语写作中最常见的口语化表达。
 * 匹配时大小写不敏感（扫描时统一转小写比较）。
 */
export const WORD_SUGGESTIONS: Record<string, AiEntry> = {
  good: {
    type: "l1",
    suggestions: ["beneficial", "advantageous", "positive"],
    reason: "口语化表达，建议使用更正式的形容词",
  },
  great: {
    type: "l2",
    suggestions: ["exceptional", "remarkable", "unparalleled"],
    reason: "可用更精准的词汇提升表达层次",
  },
  very: {
    type: "l1",
    suggestions: ["extremely", "profoundly", "exceedingly"],
    reason: '"very" 是典型的口语填充词',
  },
  really: {
    type: "l1",
    suggestions: ["truly", "genuinely", "particularly"],
    reason: "建议使用更书面化的副词",
  },
  important: {
    type: "l2",
    suggestions: ["crucial", "vital", "essential", "paramount"],
    reason: "可用更高阶词汇",
  },
  bad: {
    type: "l1",
    suggestions: ["detrimental", "harmful", "adverse"],
    reason: "过于笼统和口语化",
  },
  things: {
    type: "l1",
    suggestions: ["aspects", "elements", "factors"],
    reason: "指代不清，建议用具体名词",
  },
  bring: {
    type: "l2",
    suggestions: ["generate", "produce", "foster"],
    reason: "可用更书面化的动词",
  },
  people: {
    type: "l2",
    suggestions: ["individuals", "citizens", "the public"],
    reason: "可用更具体的指代",
  },
  brings: {
    type: "l2",
    suggestions: ["unites", "draws", "connects"],
    reason: "更地道的搭配表达",
  },
  creates: {
    type: "l2",
    suggestions: ["generates", "produces", "forms"],
    reason: "可用更书面化的动词",
  },
};

/**
 * 扫描纯文本，返回所有匹配词库的标注。
 *
 * @param text 编辑器纯文本
 * @returns 标注列表，每条包含原词、词库信息、出现位置
 */
export interface AiAnnotation {
  /** 原文中的词（保持原始大小写） */
  word: string;
  /** 小写 key，用于查词库 */
  key: string;
  /** 词库条目 */
  entry: AiEntry;
  /** 在纯文本中的起始位置 */
  offset: number;
}

export function scanText(text: string): AiAnnotation[] {
  if (!text) return [];

  const annotations: AiAnnotation[] = [];
  // 匹配英文单词（含缩写）
  const regex = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const key = word.toLowerCase();

    if (WORD_SUGGESTIONS[key]) {
      annotations.push({
        word,
        key,
        entry: WORD_SUGGESTIONS[key],
        offset: match.index,
      });
    }
  }

  return annotations;
}
