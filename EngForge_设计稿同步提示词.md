# EngForge 设计稿同步提示词

> **用途**：将 Ardot 画布（fileId: 714864718971032）DC-002 原型重构的设计稿同步到 Next.js 代码。
>
> **使用方式**：在开发模式下将本文件作为 prompt 输入，按模块逐个执行。
>
> **画布画板清单**：13:3 Landing / 13:6 Dashboard / 13:7 Editor / 13:8 Detail / 13:9 批改审阅 / 13:10 三态规范

---

## 一、全局设计 Token（已存在于 `src/app/globals.css`，无需修改）

代码中已定义的 Tailwind v4 `@theme inline` token，与画布完全一致，直接引用即可：

```
/* 中性色 — 直接用 Tailwind zinc 灰阶 */
zinc-50  #FAFAFA  → 背景
zinc-100 #F4F4F5  → 次背景/工具栏按钮底
zinc-200 #E4E4E7  → 边框
zinc-400 #A1A1AA  → 占位符/弱化文字
zinc-500 #71717A  → 次文字/面包屑
zinc-600 #52525B  → 正文次色
zinc-700 #3F3F46  → 正文主色（英文正文）
zinc-950 #0A0A0B  → 标题主色

/* 强调色 */
--color-primary:        #3B82F6  /* 主蓝 — 按钮/链接/active */
--color-primary-dark:   #2563EB  /* 深蓝 — hover */
--color-primary-light:  #DBEAFE  /* 浅蓝 — 标签底 */
--color-primary-subtle: #EFF6FF  /* 极浅蓝 — active 项底/标签底 */
--color-green:          #10B981  /* 绿 — 成功/采纳 */
--color-green-dark:     #059669  /* 深绿 — diff 新增文字 */
--color-green-light:    #D1FAE5  /* 浅绿底 — diff 新增行 */
--color-amber:           #F59E0B  /* 琥珀 — 待办/待审阅 */
--color-amber-dark:     #D97706  /* 深琥珀 */
--color-amber-light:    #FEF3C7  /* 浅琥珀底 — 待审阅标签 */
--color-red:            #EF4444  /* 红 — 错误 */
--color-red-light:      #FEE2E2  /* 浅红底 */

/* diff 专用色（画布 13:9 批改审阅） */
红底删除行 bg:  #FEF2F2   文字: #B91C1C
绿底新增行 bg:  #ECFDF5   文字: #059669
上下文灰行:     #A1A1AA   无背景

/* 圆角 */
--radius-card: 12px  → 所有卡片用 rounded-card

/* 阴影 */
--shadow-card: 0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)
→ 所有白卡用 shadow-card
```

**代码中使用方式**：`bg-primary`、`text-primary`、`bg-primary-subtle`、`rounded-card`、`shadow-card` 等 Tailwind 类名。

---

## 二、降皮词汇表（全局替换规则）

设计稿全面替换了技术术语，代码必须同步。以下是从「代码现状」到「设计稿」的映射：

| 代码现状 | 设计稿用词 | 涉及文件 |
|---|---|---|
| Fork / Fork 借鉴 | **借鉴** | page.tsx, EssayActions.tsx, DetailClient.tsx, notification-config.ts |
| PR / PR 互改 / 批改请求 | **批改** (动作) / **批改记录** (列表) | page.tsx, dashboard-data.ts, PrList.tsx, TopBar.tsx |
| Star / Star 收藏 / 被 Star | **收藏** / **被收藏** | page.tsx, dashboard-data.ts, EssayActions.tsx, notification-config.ts |
| 复刻 | **借鉴** | page.tsx (ProductPreview) |
| Fork 自 | **借鉴自** | DetailClient.tsx |
| Fork 中... / Fork 成功 / Fork 失败 | **借鉴中...** / **借鉴成功** / **借鉴失败** | EssayActions.tsx |
| 贡献热力图 | **写作节奏** | Heatmap.tsx |
| 过去 26 周 | **近 24 周 · 每格为一周** | Heatmap.tsx |
| 我的作品 (面板标题) | **我的作文** | EssayList.tsx |
| 最近活动 (面板标题) | **近期批改** | ActivityPanel.tsx |
| 用 GitHub 的方式学英语 | 删除此比喻 | page.tsx (Footer) |
| 免费注册 / 开始写作 / 免费开始 | **开始使用** | page.tsx (所有 CTA) |

---

## 三、逐文件修改指令

### 3.1 `src/app/page.tsx` — Landing 页（画板 13:3）

**这是改动最大的文件**。当前代码使用旧文案和旧结构，需要全面重写。

#### 3.1.1 Navbar CTA（第 112-118 行）

```diff
- <Link href="/register" className="...bg-primary...text-white...">
-   免费注册
- </Link>
+ <Link href="/register" className="...bg-primary...text-white...">
+   开始使用
+ </Link>
```

#### 3.1.2 Hero 区（第 122-161 行）— 全部重写

**当前代码**：
- 标题："用 GitHub 的方式\n学英语写作"
- 副标题："版本可追溯，改动可对比，批改可沉淀——\n把开源协作的精髓写进每一次练习。"
- CTA Primary："开始写作" → 改为 **"开始使用"**
- CTA Secondary："登录" → **删除整个 Secondary 按钮**
- Hero 背景：`bg-white` → 改为 `bg-zinc-50`（#FAFAFA）

**改为**：
```tsx
{/* ── Hero：左文案 + 右产品预览 ── */}
<section className="flex flex-col items-center gap-16 bg-zinc-50 px-16 py-20 lg:flex-row">
  {/* 左：文案 */}
  <div className="flex max-w-[680px] flex-col gap-6">
    {/* 定位徽章 — 不变 */}
    <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1.5 text-xs font-semibold text-primary">
      <Sparkles className="h-3.5 w-3.5" />
      考研英语 · 上海高考
    </span>

    {/* 标题 — 口语化，一行显示 */}
    <h1 className="text-[40px] font-bold leading-[1.3] tracking-tight text-zinc-950">
      写一遍不够？那就写十遍，每次都留痕
    </h1>

    {/* 副标题 — 去掉代码比喻，落在"进步"利益点 */}
    <p className="text-base leading-[1.7] text-zinc-600">
      每篇作文都有完整的版本历史——改了一笔就存一个版本，同学帮你批改的内容也能合并进来。想看进步轨迹？翻版本历史就行。
    </p>

    {/* 只留一个 CTA，删除 Secondary */}
    <div className="mt-2">
      <Link
        href="/register"
        className="rounded-lg bg-primary px-9 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        开始使用
      </Link>
    </div>
  </div>

  {/* 右：产品预览 — 见下方 3.1.3 */}
  <ProductPreview />
</section>
```

**关键变化**：
1. `max-w-[560px]` → `max-w-[680px]`（标题一行显示）
2. 删除 Secondary `<Link href="/login">` 按钮
3. `bg-white` → `bg-zinc-50`
4. 标题 `text-[44px]` → `text-[40px]`（画布 40px）
5. 删除标题里的 `<br />`，整句一行
6. 副标题 `leading-relaxed` → `leading-[1.7]`（对应画布 lineHeight 1.7）

#### 3.1.3 ProductPreview（第 44-79 行）— 文案更新

```diff
- <span className="...">考研</span>
+ <span className="...">考研</span>  {/* 保持不变，画布也是考研 */}

- <p className="text-xs text-zinc-500">32 词 · 2 小时前 · 3 次复刻</p>
+ <p className="text-xs text-zinc-500">32 词 · 2 小时前 · 3 次借鉴</p>

- <p className="text-[13px] text-zinc-600">陈同学 复刻了你的作文</p>
+ <p className="text-[13px] text-zinc-600">陈同学 借鉴了你的作文</p>
```

**新增 AI 标注预览卡片**（画布 Hero Preview 中有此元素）：
在 ProductPreview 的 `</div>` 前新增一个卡片：
```tsx
{/* 预览 4：AI 替换建议 */}
<div className="flex items-center gap-2 rounded-lg bg-white p-3.5 shadow-card">
  <span className="text-[13px] text-zinc-600">
    替换建议：<span className="text-red line-through">depicted</span>
    {" → "}
    <span className="font-semibold text-primary">illustrated / portrayed</span>
  </span>
</div>
```

#### 3.1.4 FEATURES 数组（第 19-41 行）— 全部重写

```diff
const FEATURES = [
  {
-   icon: GitFork,
-   title: "Fork 借鉴",
-   desc: "一键复制高分范文到自己的工坊，在原文基础上修改练习。",
-   iconBg: "bg-primary-subtle",
-   iconColor: "text-primary",
+   icon: FilePlus,       // 或保留 GitFork 但改 label
+   title: "写作 · 发布",
+   desc: "打开编辑器就能写，写完自动存为第一个版本。之后每次修改都会生成新版本，随时回看、随时恢复。",
+   iconBg: "bg-primary-subtle",
+   iconColor: "text-primary",
  },
  {
-   icon: GitPullRequest,
-   title: "PR 互改",
-   desc: "邀请同学互相批改作文，生成新版本，追踪每一步改进。",
-   iconBg: "bg-amber-light",
-   iconColor: "text-amber",
+   icon: GitPullRequest,  // 图标保留，语义改为"批改"
+   title: "邀请批改",
+   desc: "生成邀请码发给同学，对方就能进入你的作文提交批改——逐句对照，改了哪里一目了然。",
+   iconBg: "bg-amber-light",
+   iconColor: "text-amber",
  },
  {
-   icon: Star,
-   title: "Star 收藏",
-   desc: "收藏值得反复读的范文，随时回看拆解学习。",
-   iconBg: "bg-green-light",
-   iconColor: "text-green",
+   icon: Star,
+   title: "采纳 · 借鉴",
+   desc: "满意的批改一键采纳，自动生成新版本；看到好范文可以借鉴一份到自己账号继续改。",
+   iconBg: "bg-green-light",
+   iconColor: "text-green",
  },
];
```

**同时修改 Features 区标题**（第 165 行）：
```diff
- <h2 className="mb-10 text-center text-[32px] font-bold text-zinc-950">
-   三个动作，掌握英语写作
- </h2>
+ <h2 className="mb-10 text-center text-[32px] font-bold text-zinc-950">
+   三步，把作文从初稿改到满意
+ </h2>
```

**Features 卡片间距**：画布中卡片 padding 为 28px，当前代码是 `p-7`（28px），一致，无需改。

#### 3.1.5 CTA Band（第 195-212 行）

```diff
- <h2 className="text-[28px] font-semibold text-zinc-950">
-   从第一篇开始，让每次写作都有迹可循。
- </h2>
+ <h2 className="text-[28px] font-semibold text-zinc-950">
+   第一篇作文，现在就能开始
+ </h2>
```

```diff
- className="...bg-primary...text-white...">
-   免费注册
- </Link>
+ className="...bg-primary...text-white...">
+   开始使用
+ </Link>
```

```diff
- <p className="flex items-center gap-1.5 text-sm text-zinc-500">
-   <GitPullRequestArrow className="h-4 w-4 text-primary" />
-   邀请制内测中，注册后即可创建你的工坊
- </p>
```
→ 可保留此行，但把"创建你的工坊"改为"开始写作"。

#### 3.1.6 Footer（第 214-225 行）

```diff
- <p className="text-xs text-zinc-500">
-   © 2026 EngForge. 用 GitHub 的方式学英语。
- </p>
+ <p className="text-xs text-zinc-500">
+   © 2026 EngForge. 写一遍不够，就写十遍。
+ </p>
```

#### 3.1.7 import 清理

删除不再使用的 import：
```diff
- import {
-   GitFork,
-   GitPullRequest,
-   Star,
-   Sparkles,
-   TrendingUp,
-   GitPullRequestArrow,
- } from "lucide-react";
+ import {
+   FilePlus,      // 新增，用于 Step 1 图标（或保留 GitFork）
+   GitPullRequest,
+   Star,
+   Sparkles,
+   TrendingUp,
+ } from "lucide-react";
```
> 注意：如果保留 GitFork 作为"借鉴"图标，则不需要换。GitPullRequestArrow 如果删除 CTA 底部提示行则可以去掉。

---

### 3.2 `src/lib/dashboard-data.ts` — Dashboard 数据层

#### 3.2.1 navGroups（第 109-131 行）

设计稿侧边栏导航为：
- 我的工坊（active）
- 我的收藏
- 批改请求（Phase 2 标签）

**改为**：
```typescript
export const navGroups: NavGroup[] = [
  {
    title: '工坊',
    items: [
      { label: '我的工坊', icon: 'layout-dashboard', href: '/dashboard', active: true },
      { label: '我的收藏', icon: 'star', href: '#', disabled: true, disabledLabel: 'Phase 2' },
    ],
  },
  {
    title: '协作',
    items: [
      { label: '作品详情', icon: 'file-text', href: '/dashboard' },
      { label: '批改请求', icon: 'git-pull-request', href: '#', disabled: true, disabledLabel: 'Phase 2' },
    ],
  },
  // 删除「发现」组（广场 + 真题句子库在设计稿中不存在）
];
```

**同时更新 ICON_MAP**（Sidebar.tsx 第 42-49 行）：
```typescript
const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "file-plus": FilePlus,
  "file-text": FileText,
  "git-pull-request": GitPullRequest,
  "star": Star,           // 新增
  // 删除 "globe": Globe, "book-open": BookOpen
};
```
> Sidebar.tsx 的 import 中需要新增 `Star`，删除 `Globe`、`BookOpen`。

#### 3.2.2 statCardConfig（第 134-139 行）

```diff
export const statCardConfig: { label: string; colorClass: string }[] = [
  { label: '我的作文', colorClass: '' },
  { label: '收到批改', colorClass: 'text-primary' },
- { label: '被 Star', colorClass: 'text-green' },
+ { label: '被收藏', colorClass: 'text-green' },
- { label: '连续天数', colorClass: 'text-amber' },
+ { label: '提交批改', colorClass: 'text-amber' },
];
```

> 注意：设计稿四个统计卡分别是「我的作文 12」「收到批改 8」「提交批改 5」「被收藏 23」。顺序也变了（被收藏从第三移到第四）。

如果 statCardConfig 的顺序变化会影响 dashboard/page.tsx 中的数据查询，需要同步调整 stats 数组的顺序。

#### 3.2.3 statusConfig（第 149-153 行）

当前：
```typescript
draft:     { dotClass: 'bg-gray-400',  label: '草稿' },
review:    { dotClass: 'bg-amber',     label: '审核中' },
published: { dotClass: 'bg-green',    label: '已发布' },
```

设计稿中作文列表不显示状态圆点，而是显示版本号和来源标签（如"v3"、"借鉴自王同学"）。如果保留状态圆点，建议：
```diff
- review:    { dotClass: 'bg-amber',     label: '审核中' },
+ review:    { dotClass: 'bg-amber',     label: '待审阅' },
```

---

### 3.3 `src/components/layout/Sidebar.tsx`

**导航项 active 样式** — 当前代码：
```tsx
isActive
  ? "bg-primary-subtle font-semibold text-primary"
  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
```
与设计稿一致，**不需要修改样式**。

**底部用户卡片** — 设计稿显示"李同学"+ 考研英语标签。当前代码显示 username + email。**保持不变**，因为这是运行时数据。

---

### 3.4 `src/components/essay/StatsCards.tsx`

设计稿统计卡结构：
- 标题（上方小字）
- 大数字
- 副标题（下方小字，带颜色：green / amber / blue）

当前代码结构一致，**不需要修改组件结构**。只需确保 dashboard-data.ts 中的 statCardConfig 标签正确（见 3.2.2）。

---

### 3.5 `src/components/essay/EssayList.tsx`

#### 面板标题（第 78 行）
```diff
- <h3 className="text-[15px] font-semibold text-zinc-950">我的作品</h3>
+ <h3 className="text-[15px] font-semibold text-zinc-950">我的作文</h3>
```

#### "新建"按钮（第 80-85 行）
设计稿中按钮文案为"新建作文"，当前是"新建"：
```diff
- <Plus className="h-3.5 w-3.5" />
- 新建
+ <Plus className="h-3.5 w-3.5" />
+ 新建作文
```

#### 列表项增强（设计稿有版本号和来源标签）

设计稿中每个作文列表项显示：
- 标题（如"城市交通拥堵成因分析"）
- 标签 pill（如"图表作文 v3"）
- 时间（如"2 小时前"）
- 状态 pill（如"2 条新批改" amber / "批改已采纳" green / "3 人协作" / "借鉴自王同学"）

当前代码只显示标题 + 标签 + 词数 + 时间。需要**新增版本号和状态 pill**：

```tsx
// 在 EssayListItem 组件中，标签后面新增：
<div className="flex gap-3 text-xs text-zinc-500">
  <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${tag.bgClass} ${tag.textClass}`}>
    {tagLabel} v{essay.versionNumber}
  </span>
  <span>{essay.wordCount} 词</span>
  <span>{formatRelativeTime(essay.updatedAt)}</span>
</div>
{/* 状态 pill — 新增 */}
{essay.statusPill && (
  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${essay.statusPill.className}`}>
    {essay.statusPill.label}
  </span>
)}
```

> 这需要扩展 `DashboardEssay` 类型，新增 `versionNumber: number` 和 `statusPill?: { label: string; className: string }` 字段。

---

### 3.6 `src/components/essay/Heatmap.tsx`

#### 标题和副标题（第 66-68 行）
```diff
- <h3 className="text-[15px] font-semibold text-zinc-950">贡献热力图</h3>
- <span className="text-xs text-zinc-500">过去 26 周</span>
+ <h3 className="text-[15px] font-semibold text-zinc-950">写作节奏</h3>
+ <span className="text-xs text-zinc-500">近 24 周 · 每格为一周</span>
```

#### 周粒度改造（重要！）

设计稿热力图是**周粒度**（2 行 × 12 列 = 24 格），不是日粒度（7 行 × 26 列 = 182 格）。

当前代码是日粒度：
```tsx
// 26 列 × 7 行 = 182 格
<div className="grid grid-cols-[repeat(26,minmax(0,1fr))] gap-[3px]">
  {levels.map((level, index) => (
    <span className={`aspect-square rounded-sm ${heatmapLevelConfig[level]}`} />
  ))}
</div>
```

**需要改为周粒度**：
```tsx
// 2 行 × 12 列 = 24 格
<div className="grid grid-cols-12 gap-[6px]">
  {levels.map((level, index) => (
    <span className={`aspect-square rounded-md ${heatmapLevelConfig[level]}`} />
  ))}
</div>
```

**HeatmapProps 类型**：
```diff
interface HeatmapProps {
- /** 182 项热力图等级，levels[day * 26 + week] */
- levels: HeatmapLevel[];
+ /** 24 项热力图等级（2 行 × 12 列，按行填充） */
+ levels: HeatmapLevel[];
}
```

**dashboard/page.tsx 中的数据聚合**也要改：从按天聚合改为按周聚合，输出 24 个 level。

**底部图例**新增连续天数文案（设计稿）：
```tsx
{/* HeatmapLegend 新增 */}
<div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
  <div className="flex items-center gap-1">
    <span>少</span>
    {legendLevels.map(...)}
    <span>多</span>
  </div>
  <span>本周 2 篇 · 连续 4 周有产出</span>
</div>
```

---

### 3.7 `src/components/essay/ActivityPanel.tsx`

#### 面板标题（第 76 行）
```diff
- <h3 className="text-[15px] font-semibold text-zinc-950">最近活动</h3>
+ <h3 className="text-[15px] font-semibold text-zinc-950">近期批改</h3>
```

#### 学习目标卡片（第 97-102 行）
设计稿中这个位置是"写作节奏"热力图，已经移到 Heatmap 组件。如果 ActivityPanel 中还保留学习目标卡片，可以改为其他内容或删除。建议**暂时保留**，后续 Phase 2 再调整。

---

### 3.8 `src/components/essay/EssayActions.tsx`

#### Fork 按钮（第 95-103 行）
```diff
- <button onClick={handleFork} disabled={forking} className="...">
-   <GitFork className="h-3.5 w-3.5" />
-   {forking ? "Fork 中..." : "Fork"}
- </button>
+ <button onClick={handleFork} disabled={forking} className="...">
+   <GitFork className="h-3.5 w-3.5" />
+   {forking ? "借鉴中..." : "借鉴"}
+ </button>
```

#### Fork 成功/失败 toast（第 48-57 行）
```diff
- toast.success("Fork 成功", {
+ toast.success("借鉴成功", {
    description: "已创建到你的工坊，正在跳转...",
  });
```
```diff
- toast.error("Fork 失败", {
+ toast.error("借鉴失败", {
    description: result.error ?? "请稍后重试",
  });
```
```diff
- setForkError(result.error ?? "Fork 失败");
+ setForkError(result.error ?? "借鉴失败");
```

#### Star 按钮（第 107-118 行）
设计稿中 Star 按钮只显示数字（收藏数），不显示"收藏"文字。当前代码已经是这样，**不需要修改**。

> 图标 `GitFork` 可以保留（lucide-react 的 fork 图标语义清晰），也可以换成 `CopyPlus` 或 `FileCopy`。建议保留以维持视觉一致性。

---

### 3.9 `src/components/essay/DetailClient.tsx`

#### Fork 来源文案（第 131-139 行）
```diff
- <p className="mt-1 text-sm text-zinc-500">
-   Fork 自{" "}
-   <Link href={`/essays/${essay.forked_from}`} className="text-primary hover:underline">
-     {essay.forked_from_title}
-   </Link>
- </p>
+ <p className="mt-1 text-sm text-zinc-500">
+   借鉴自{" "}
+   <Link href={`/essays/${essay.forked_from}`} className="text-primary hover:underline">
+     {essay.forked_from_title}
+   </Link>
+ </p>
```

#### Tab 标签（第 107-111 行）
当前：
```tsx
{ key: "content", label: "内容" },
{ key: "history", label: `版本历史 (${versions.length})` },
{ key: "reviews", label: `批改记录${prs.length > 0 ? ` (${prs.length})` : ""}` },
```
与设计稿一致，**不需要修改**。

#### 版本号显示（第 167 行）
```diff
- <span>当前 v{essay.current_version}</span>
```
可改为显示版本 pill（设计稿样式）：
```tsx
<span className="rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-medium text-primary">
  v{essay.current_version}
</span>
```

---

### 3.10 `src/lib/notification-config.ts`

通知文案不在这个文件里（这里是图标+颜色映射），但通知标题在数据库触发器中生成。如果需要改通知文案（如"xxx fork 了你的作文" → "xxx 借鉴了你的作文"），需要修改 `supabase/migrations/0001_initial_schema.sql` 中的触发器函数。

**当前文件不需要修改**——图标映射（fork → GitFork 图标，star → Star 图标）可以保留，因为图标是视觉元素而非文案。

---

### 3.11 `src/components/pr/PrDiffView.tsx`

设计稿（13:9 批改审阅）的 diff 颜色：
- 删除行：bg `#FEF2F2`，文字 `#B91C1C`
- 新增行：bg `#ECFDF5`，文字 `#059669`
- 上下文行：文字 `#A1A1AA`

当前代码使用 Tailwind 默认色：
```diff
- const bgClass = line.type === "added" ? "bg-green-50" : line.type === "removed" ? "bg-red-50" : "";
+ const bgClass = line.type === "added" ? "bg-[#ECFDF5]" : line.type === "removed" ? "bg-[#FEF2F2]" : "";

- const textClass = line.type === "added" ? "text-green-800" : line.type === "removed" ? "text-red-800" : "text-zinc-600";
+ const textClass = line.type === "added" ? "text-[#059669]" : line.type === "removed" ? "text-[#B91C1C]" : "text-zinc-600";

- const prefixClass = line.type === "added" ? "text-green-600" : line.type === "removed" ? "text-red-600" : "text-zinc-300";
+ const prefixClass = line.type === "added" ? "text-[#059669]" : line.type === "removed" ? "text-[#B91C1C]" : "text-zinc-300";
```

> 或者直接在 globals.css 中定义语义类：
> ```css
> .diff-removed-bg { background-color: #FEF2F2; }
> .diff-added-bg { background-color: #ECFDF5; }
> .diff-removed-text { color: #B91C1C; }
> .diff-added-text { color: #059669; }
> ```

---

### 3.12 `src/components/layout/TopBar.tsx`

#### 页面标题映射（第 26-29 行）
```diff
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "我的工坊",
- "/editor": "作文编辑器",
+ "/editor": "新建作文",     // 新建模式
};
```

> 当前代码在 pathname.startsWith("/editor") 时也返回"作文编辑器"，设计稿面包屑显示的是"我的工坊 / 新建作文"。需要区分 `/editor`（新建）和 `/editor/[essayId]`（编辑）。

---

### 3.13 三态规范（画板 13:10）

三态（空/加载/错误）对应代码中已有的组件：
- 空状态：`EssayList` 中的空状态块（第 96-108 行）— **已实现**
- 加载中：`src/app/(app)/dashboard/loading.tsx` 和 `src/app/(app)/essays/[essayId]/loading.tsx` — **已实现**
- 错误：`src/app/(app)/error.tsx` 和 `src/app/error.tsx` — **已实现**

设计稿中三态的文案：
- 空："暂无作文" + "点击「新建作文」开始你的第一篇练习" + 蓝色"新建作文"按钮
- 加载："加载中" + "正在获取数据，请稍候…"
- 错误："出错了" + "无法加载内容，请检查网络后重试" + "重试"按钮

检查现有 loading.tsx 和 error.tsx 的文案是否匹配，按需调整。

---

## 四、模块间关系图

```
Landing (page.tsx)
  ├── 无侧边栏（独立页面）
  ├── Navbar CTA → /register
  └── Hero CTA → /register

(app)/layout.tsx
  ├── Sidebar (共享) ← navGroups (dashboard-data.ts)
  └── TopBar (共享)
       ├── NotificationBell ← notifications 表
       ├── JoinByCode
       └── UserMenu

Dashboard (dashboard/page.tsx)
  ├── 服务端查询：essays + essay_versions + notifications
  ├── StatsCards ← statCardConfig (dashboard-data.ts) + stats props
  ├── EssayList ← DashboardEssay[] props
  │    └── EssayListItem ← statusConfig + tagConfig (dashboard-data.ts)
  ├── Heatmap ← levels[] props (24 项，周粒度)
  └── ActivityPanel ← ActivityItem[] props
       └── ActivityRow ← typeConfig (notification-config.ts)

Editor (editor/page.tsx)
  ├── EditorClient
  │    ├── EditorToolbar ← TipTap editor instance
  │    ├── EditorContent ← TipTap
  │    └── AiSuggestions ← plainText prop
  └── 发布 → publishNewEssay / publishNewVersion (essay-actions.ts)
       └── Supabase: INSERT essay + RPC create_essay_version

Detail (essays/[essayId]/page.tsx)
  ├── 服务端查询：essay + versions + members + prs + star + author
  └── DetailClient
       ├── EssayActions ← forkEssay / toggleStar (essay-actions.ts)
       ├── VersionSwitcher ← versions[] props
       ├── VersionHistory ← versions[] props
       ├── PrList ← prs[] props
       │    └── PrDiffView ← parseDiffText (diff.ts)
       └── DetailSidebar ← members + counts

PR 创建 (essays/[essayId]/prs/new/page.tsx)
  └── PrEditorClient
       └── createPullRequest (essay-actions.ts)
            └── Supabase: INSERT pull_requests + 触发器通知

PR 审阅 (essays/[essayId]/prs/[prId]/page.tsx)
  └── PrActions ← mergePr / closePr (essay-actions.ts)
       └── Supabase: RPC merge_pull_request + 触发器通知
```

---

## 五、执行顺序建议

按依赖关系分 3 批执行：

**批次 1（数据层，无 UI 依赖）**：
1. `dashboard-data.ts` — 更新 navGroups + statCardConfig + statusConfig
2. `notification-config.ts` — 确认不需要改

**批次 2（Landing 页，独立页面）**：
3. `page.tsx` — 全面重写 Hero + Features + CTA + Footer

**批次 3（应用内页面，依赖批次 1）**：
4. `Sidebar.tsx` — 更新 ICON_MAP + import
5. `TopBar.tsx` — 更新页面标题映射
6. `EssayList.tsx` — 改面板标题 + 新建按钮文案 + 版本号/状态 pill
7. `Heatmap.tsx` — 改标题 + 周粒度改造
8. `ActivityPanel.tsx` — 改面板标题
9. `EssayActions.tsx` — Fork → 借鉴
10. `DetailClient.tsx` — Fork 自 → 借鉴自 + 版本 pill
11. `PrDiffView.tsx` — diff 颜色对齐设计稿
12. 检查 loading.tsx / error.tsx 文案

---

## 六、验证清单

每个文件改完后：
- [ ] `npx tsc --noEmit` 零类型错误
- [ ] `npx eslint .` 零警告
- [ ] `npm run dev` 页面正常渲染
- [ ] 全站搜索 `Fork`（排除代码注释和变量名）确认无残留用户可见文案
- [ ] 全站搜索 `复刻` 确认无残留
- [ ] 全站搜索 `被 Star` 确认无残留
- [ ] 全站搜索 `免费注册` 确认无残留
- [ ] 全站搜索 `GitHub` 确认 Footer 等处无残留
