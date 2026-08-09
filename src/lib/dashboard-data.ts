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

/** 作文标签 — 只有这 4 种合法值 */
export type EssayTag = '考研大作文' | '高考作文' | '翻译练习' | '自由写作';

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
  wordCount: number | string;  // 数字（如 248）或字符串（如 "中译英"）
  dateText: string;            // 已格式化的日期文本，如 "3 天前"
  href: string;                // 点击后跳转的路由
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
 * 第二部分：静态数据
 * 以下数据全部从原型 EngForge_原型.html 1:1 搬运。
 * 以后接 Supabase 后，这些数组会被替换成数据库查询结果。
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
      { label: '作品详情', icon: 'D', href: '/detail' },
      { label: '批改请求', icon: 'R', href: '/review', badge: 2 },
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

/** 侧边栏底部用户信息 */
export const dashboardUser: DashboardUser = {
  name: '李同学',
  avatar: 'LY',
  subtitle: '考研英语 · Day 47',
};

/** 4 个统计卡片 — 数值和副标题来自原型 */
export const statCards: StatCardData[] = [
  { label: '我的作文', value: 12, sub: '3 篇草稿', colorClass: '' },
  { label: '收到批改', value: 28, sub: '2 条待处理', colorClass: 'text-purple' },
  { label: '被 Star', value: 15, sub: '来自 4 位同学', colorClass: 'text-teal' },
  { label: '连续天数', value: 47, sub: '历史最长 47', colorClass: 'text-green' },
];

/** 作品列表 — 5 篇作文，数据来自原型 essayList 变量 */
export const dashboardEssays: DashboardEssay[] = [
  {
    id: 'essay-1',
    title: 'The Impact of Social Media on Interpersonal Communication',
    status: 'published',
    tag: '考研大作文',
    wordCount: 248,
    dateText: '3 天前',
    href: '/detail',
  },
  {
    id: 'essay-2',
    title: 'On the Importance of Lifelong Learning in Modern Society',
    status: 'review',
    tag: '考研大作文',
    wordCount: 215,
    dateText: '2 条 PR 待审',
    href: '/review',
  },
  {
    id: 'essay-3',
    title: 'Environmental Protection: Individual Responsibility vs Government Action',
    status: 'published',
    tag: '高考作文',
    wordCount: 180,
    dateText: '1 周前',
    href: '/detail',
  },
  {
    id: 'essay-4',
    title: 'The Role of Artificial Intelligence in Education (草稿)',
    status: 'draft',
    tag: '考研大作文',
    wordCount: 87,
    dateText: '昨天编辑',
    href: '/detail',
  },
  {
    id: 'essay-5',
    title: '翻译练习：中国文化走出去 (Translation Practice)',
    status: 'published',
    tag: '翻译练习',
    wordCount: '中译英',
    dateText: '2 周前',
    href: '/detail',
  },
];

/** 最近活动 — 5 条记录，segments 控制哪些部分加粗 */
export const activities: Activity[] = [
  {
    segments: [
      { text: '王同学', bold: true },
      { text: ' 向你的作文发起了 PR 批改', bold: false },
    ],
    time: '2 小时前',
  },
  {
    segments: [
      { text: '张同学', bold: true },
      { text: ' Star 了你的 "Environmental Protection"', bold: false },
    ],
    time: '5 小时前',
  },
  {
    segments: [
      { text: '你完成了 ', bold: false },
      { text: '第 3 版', bold: true },
      { text: ' 修改 "Social Media Impact"', bold: false },
    ],
    time: '昨天',
  },
  {
    segments: [
      { text: '赵同学', bold: true },
      { text: ' 评论了你的翻译练习', bold: false },
    ],
    time: '2 天前',
  },
  {
    segments: [
      { text: '你 Fork 了 ', bold: false },
      { text: '范文仓库', bold: true },
      { text: ' 的 "Climate Change Essay"', bold: false },
    ],
    time: '3 天前',
  },
];

/**
 * 贡献热力图 — 26 周 × 7 天 = 182 格
 * 数据直接从原型 JS 的 levels 数组 1:1 搬运
 * '' = 无活动，l1~l4 = 4 个活动强度等级
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

/** 学习目标 */
export const learningGoal: LearningGoal = {
  description: '本周写 3 篇大作文',
  current: 2,
  total: 3,
};


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

/** 作文标签 → 背景色 + 文字色 */
export const tagConfig: Record<EssayTag, { bgClass: string; textClass: string }> = {
  '考研大作文': { bgClass: 'bg-primary-light', textClass: 'text-primary' },
  '高考作文':   { bgClass: 'bg-purple-light',  textClass: 'text-purple' },
  '翻译练习':   { bgClass: 'bg-teal-light',   textClass: 'text-teal' },
  '自由写作':   { bgClass: 'bg-amber-light',  textClass: 'text-amber' },
};

/** 热力图等级 → 背景色（来自原型 CSS：空=#F3F4F6，l1~l4=蓝色渐变） */
export const heatmapLevelConfig: Record<HeatmapLevel, string> = {
  '':  'bg-[#F3F4F6]',
  l1:  'bg-[#BBE0F8]',
  l2:  'bg-[#7BBEF0]',
  l3:  'bg-[#378ADD]',
  l4:  'bg-[#185FA5]',
};
