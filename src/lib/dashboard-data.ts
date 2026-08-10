/**
 * ============================================
 * Dashboard 静态数据层
 * ============================================
 * 这个文件是 Dashboard 所有数据的"仓库"。
 * 后面的每个组件都从这里 import 类型和数据，不自己存数据。
 *
 * 为什么要把数据和组件分开？
 * - 数据改了只动这一个文件，不用翻组件代码
 * - 类型定义集中，拼错字段名 TypeScript 会报错
 * - 以后接 Supabase 真实数据时，只需把这个文件里的静态数组换成 API 调用
 */

/* ============================================================
 * 第一部分：类型定义
 * 这些 interface/type 定义了数据的"形状"。
 * 类比：就像 C++ 的 struct，Python 的 dataclass。
 * ============================================================ */

/** 作文状态 — 只有这 3 种合法值 */
export type EssayStatus = 'draft' | 'review' | 'published';

/** 作文标签 key — 和数据库存储的英文 key 一致 */
export type EssayTag = 'kaoyan' | 'gaokao' | 'cet4' | 'cet6' | 'other';

/** 标签 key → 中文显示名 */
export const tagLabels: Record<EssayTag, string> = {
  kaoyan: '考研大作文',
  gaokao: '高考作文',
  cet4: 'CET-4',
  cet6: 'CET-6',
  other: '自由写作',
};

/** 热力图等级 — 空字符串表示无活动，l1~l4 表示 4 个活动强度 */
export type HeatmapLevel = '' | 'l1' | 'l2' | 'l3' | 'l4';

/** 导航菜单项 */
export interface NavItem {
  label: string;           // 显示文字，如 "我的工坊"
  icon: string;            // 单字符图标，如 "H"、"+"
  href: string;            // 点击后跳转的路由路径
  active?: boolean;        // 是否当前页（高亮显示）
  badge?: number;          // 红色徽章数字（如批改请求 2 条）
  disabled?: boolean;      // 是否置灰不可点
  disabledLabel?: string;  // 置灰时显示的标签，如 "Phase 2"
}

/** 导航分组（工坊/协作/发现） */
export interface NavGroup {
  title: string;           // 分组标题，如 "工坊"
  items: NavItem[];
}

/** 侧边栏底部用户信息 */
export interface DashboardUser {
  name: string;            // 显示名称
  avatar: string;          // 头像缩写（2 个大写字母）
  subtitle: string;        // 副标题，如 "考研英语 · Day 47"
}

/** 统计卡片数据 */
export interface StatCardData {
  label: string;           // 卡片标题，如 "我的作文"
  value: number;           // 大数字
  sub: string;             // 副标题，如 "3 篇草稿"
  colorClass: string;      // 大数字的 Tailwind 颜色类名，如 "" 或 "text-purple"
}

/** 仪表盘作文列表项（比全局 Essay 类型精简，只含展示所需字段） */
export interface DashboardEssay {
  id: string;
  title: string;
  status: EssayStatus;
  tag: EssayTag;
  wordCount: number;
  updatedAt: string;            // ISO 时间戳，由调用方格式化
  href: string;                 // 点击后跳转的路由
}

/** 活动记录的一个片段（用于控制加粗） */
export interface ActivitySegment {
  text: string;
  bold: boolean;
}

/** 活动记录 */
export interface Activity {
  segments: ActivitySegment[];
  time: string;
}

/** 学习目标 */
export interface LearningGoal {
  description: string;    // 如 "本周写 3 篇大作文"
  current: number;        // 已完成数
  total: number;          // 目标数
}


/* ============================================================
 * 第二部分：展示配置数据
 * navGroups 保留为静态数据（导航结构固定）。
 * 统计数据、作文列表、活动记录由 Dashboard 页面从 Supabase
 * 查询后通过 props 传入子组件。
 * ============================================================ */

/** 侧边栏导航 — 三组：工坊 / 协作 / 发现 */
export const navGroups: NavGroup[] = [
  {
    title: '工坊',
    items: [
      { label: '我的工坊', icon: 'H', href: '/dashboard', active: true },
      { label: '新建作文', icon: '+', href: '/editor' },
    ],
  },
  {
    title: '协作',
    items: [
      { label: '作品详情', icon: 'D', href: '/dashboard' },
      { label: '批改请求', icon: 'R', href: '#', disabled: true, disabledLabel: 'Step 8' },
    ],
  },
  {
    title: '发现',
    items: [
      { label: '广场', icon: 'G', href: '#', disabled: true, disabledLabel: 'Phase 2.5' },
      { label: '真题句子库', icon: 'B', href: '#', disabled: true, disabledLabel: 'Phase 2' },
    ],
  },
];

/** 4 个统计卡片配置（label + colorClass 固定，value/sub 动态） */
export const statCardConfig: { label: string; colorClass: string }[] = [
  { label: '我的作文', colorClass: '' },
  { label: '收到批改', colorClass: 'text-purple' },
  { label: '被 Star', colorClass: 'text-teal' },
  { label: '连续天数', colorClass: 'text-green' },
];


/* ============================================================
 * 第三部分：展示映射
 * 把状态/标签映射到 Tailwind 颜色类名。
 * 放在数据文件里而不是组件里，因为这是"数据→展示"的映射关系。
 * ============================================================ */

/** 作文状态 → 圆点颜色 + 中文标签 */
export const statusConfig: Record<EssayStatus, { dotClass: string; label: string }> = {
  draft:     { dotClass: 'bg-gray-400',  label: '草稿' },
  review:    { dotClass: 'bg-amber',     label: '审核中' },
  published: { dotClass: 'bg-green',    label: '已发布' },
};

/** 作文标签 → 背景色 + 文字色（key 和数据库存储一致） */
export const tagConfig: Record<EssayTag, { bgClass: string; textClass: string }> = {
  kaoyan: { bgClass: 'bg-primary-light', textClass: 'text-primary' },
  gaokao: { bgClass: 'bg-purple-light',  textClass: 'text-purple' },
  cet4:   { bgClass: 'bg-teal-light',   textClass: 'text-teal' },
  cet6:   { bgClass: 'bg-amber-light',  textClass: 'text-amber' },
  other:   { bgClass: 'bg-gray-100',     textClass: 'text-gray-600' },
};

/** 热力图等级 → 背景色（来自原型 CSS：空=#F3F4F6，l1~l4=蓝色渐变） */
export const heatmapLevelConfig: Record<HeatmapLevel, string> = {
  '':  'bg-[#F3F4F6]',
  l1:  'bg-[#BBE0F8]',
  l2:  'bg-[#7BBEF0]',
  l3:  'bg-[#378ADD]',
  l4:  'bg-[#185FA5]',
};

/**
 * 贡献热力图 — 26 周 × 7 天 = 182 格
 * TODO: Phase 2 接入真实活动数据后替换此静态数组
 */
export const heatmapLevels: HeatmapLevel[] = [
  '', '', 'l1', '', 'l2', '', 'l1', '', '', 'l3', 'l2', '', 'l1', '', 'l4', 'l3', 'l2', '', 'l1', '', 'l2', 'l3', '', 'l1', '', 'l4',
  '', '', 'l1', 'l2', '', 'l3', '', '', 'l1', '', 'l2', 'l3', 'l4', '', 'l2', '', 'l1', '', 'l3', '', '', 'l2', 'l1', '', 'l3', 'l4',
  'l2', '', 'l1', '', '', 'l2', 'l3', '', 'l1', '', 'l4', 'l3', '', 'l2', 'l1', '', '', 'l3', '', 'l2', 'l1', '', 'l4', '', 'l3', 'l2',
  '', '', 'l1', '', 'l2', 'l3', '', 'l4', '', 'l1', 'l2', '', 'l3', '', '', 'l2', 'l1', 'l3', '', 'l4', 'l2', '', 'l1', '', 'l3', '',
  'l2', 'l4', '', 'l1', '', 'l3', 'l2', '', '', 'l4', '', 'l1', 'l2', 'l3', '', '', 'l2', 'l1', '', 'l3', 'l4', '', 'l2', '', 'l1', '',
  'l3', '', 'l2', 'l4', '', 'l1', '', 'l3', 'l2', '', '', 'l4', 'l1', '', 'l2', 'l3', '', 'l4', '', 'l2', 'l1', '', 'l3', '', 'l4', 'l2',
  '', 'l1', 'l3', '', '', 'l2', 'l4', 'l1', '', 'l3', '', 'l2', '', 'l1', 'l4', 'l3', '', 'l2', '', 'l1', '', 'l3', 'l4', 'l2', '', '',
];
