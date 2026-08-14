# EngForge 设计审核报告

> **审核日期**：2026-08-14
> **审核范围**：Phase 1 Step 1-7 全部产出（41 源文件 + 数据库 schema + 原型）
> **评估标准**：成熟可落地的 Web 应用

---

## 一、总体评估

**成熟度评分：62 / 100**

以"0 基础开发者第一个全栈项目"的标准来看，这个完成度相当不错——架构分层清晰、Server/Client 组件边界正确、数据库设计有触发器和 RLS、auth 错误处理细致。但以"可落地产品"的标准来看，有几个关键短板需要优先补齐。

### 做得好的地方

1. **架构分层清晰**：`lib/`（逻辑层）→ `components/`（UI 层）→ `app/`（路由层）的分离干净利落，Server Actions 和 Server Components 的使用方式正确
2. **数据库设计扎实**：8 表 + 7 触发器 + 全表 RLS + 4 RPC，版本不可变设计、fork/star 计数自动化、通知自动触发——这些是产品级的设计决策
3. **Auth 错误处理**：429 速率限制、超时保护、重复邮箱检测、邮件确认回调——比很多 MVP 做得都细
4. **草稿自动保存**：debounce 2s + localStorage + 恢复提示，交互细节到位
5. **技术债务自觉**：TECH_DEBT.md + PROGRESS_LOG.md + 四层纠偏体系，说明工程意识在

### 主要短板

1. **视觉设计粗糙**：所有图标都是单字符（F/P/S/H/+），没有真正的 icon system
2. **假数据误导**：热力图 182 格全是硬编码数组，Dashboard 给人"有数据"的错觉
3. **交互状态不完整**：编辑器无 loading 态、无退出确认、Fork/Star 无 toast 反馈
4. **响应式完全缺失**：固定 `w-60` sidebar + `grid-cols-[1fr_320px]`，移动端直接破碎
5. **安全盲点**：Detail 页面用 `dangerouslySetInnerHTML` 渲染用户内容，无 sanitize

---

## 二、六维度详细审核

### 2.1 设计系统（45/100）

**问题清单：**

| # | 问题 | 现状 | 影响 |
|---|------|------|------|
| 1 | 无图标系统 | 全站用单字符（F/P/S/H/+/D/R/G/B）当 icon | 视觉层次缺失，专业感不足 |
| 2 | Landing 页过简 | 单张白色卡片居中，3 个特性卡只有字母方块 | 第一印象薄弱，无法传达产品价值 |
| 3 | 无 Toast/通知组件 | Fork 成功直接 router.push，Star 无视觉反馈 | 用户操作后缺乏确认感 |
| 4 | 无 Loading 骨架屏 | Dashboard 数据查询期间白屏 | 感知性能差 |
| 5 | 色彩使用不规范 | Tailwind v4 @theme 定义了色板，但灰度仍用 `gray-300/400/500` 等默认值 | 品牌一致性割裂 |
| 6 | 无 Dark Mode | 虽然不是 MVP 必须，但 CSS 变量已部分就位却未启用 | 错失低成本扩展机会 |
| 7 | 排版缺乏节奏 | 标题/正文/标签的字号差距不够大（14px vs 13px vs 12px） | 信息层次扁平 |

**建议方向：**

- 引入 `lucide-react`（轻量 SVG 图标库，1.5万+ 图标，Tree-shaking 友好）
- 建立 Toast 系统：基于 `useEffect + portal` 的轻量实现，或用 `sonner` 库
- Dashboard 加骨架屏：在 Server Component 查询期间用 `loading.tsx` 自动展示
- 统一灰度体系：在 `@theme` 中定义 `--color-gray-50` 到 `--color-gray-900`，替换 Tailwind 默认值

### 2.2 架构与代码结构（72/100）

**做得好的：**
- `(auth)` / `(app)` 路由组隔离，布局复用正确
- Server Component 查询 + Client Component 交互的边界划分合理
- `getSessionUser()` 封装统一，middleware + layout 双重保险
- Server Actions 按功能聚合在 `essay-actions.ts`，权限校验在每次操作前

**问题：**

| # | 问题 | 详情 |
|---|------|------|
| 1 | 类型断言泛滥 | `as never` / `as { id: string }` / `as string \| null` 遍布 essay-actions.ts，源于 @supabase/ssr 类型推断退化。建议定义本地 `TypedSupabaseClient` 包装层 |
| 2 | Detail 页查询过重 | 1 个页面发了 6 个串行 Supabase 查询（essay → author → versions → member → star → members → fork source）。应改用 Promise.all 并行，或建一个 RPC 聚合查询 |
| 3 | 无错误边界 | 任何 Server Component 查询失败都会 500，没有 `error.tsx` 兜底 |
| 4 | 无 Loading 文件 | 缺少 `loading.tsx`，路由切换时白屏 |
| 5 | 类型重复定义 | `EssayTag` 在 `types/index.ts` 和 `dashboard-data.ts` 各定义一份，`User = Profile` 的 `@deprecated` 别名应清理 |

### 2.3 交互完整性（50/100）

**缺失的交互状态：**

| 页面 | 缺失项 | 严重度 |
|------|--------|--------|
| Editor | 编辑器加载中无 skeleton（TipTap 初始化有延迟） | 中 |
| Editor | 退出编辑器时无"未保存内容将丢失"确认 | 高 |
| Editor | 发布失败后错误提示是 `fixed bottom-4` 的临时 toast，3 秒后不自动消失 | 中 |
| Detail | Fork 按钮点击后只 disabled，无 loading spinner 或进度提示 | 中 |
| Detail | Star 按钮状态变更无动画/反馈 | 低 |
| Detail | 版本切换无过渡动画，内容直接替换 | 低 |
| Dashboard | 统计卡片第 4 个永远是 `{value: 0, sub: "即将上线"}` — 应隐藏或改成可点击的"敬请期待" | 中 |
| Dashboard | 热力图鼠标 hover 无 tooltip 显示日期和活动数 | 中 |
| 全局 | 无 404 页面（Next.js 默认的太丑） | 中 |
| 全局 | 无全局 Error Boundary | 高 |

### 2.4 数据真实性与完整性（40/100）

**假数据/空状态：**

| 位置 | 现状 | 建议 |
|------|------|------|
| Heatmap | 182 格硬编码数组 `heatmapLevels` | Phase 1 至少接 `essay_versions.created_at` 做真实热力图；或者先隐藏，等 Phase 2 接入 |
| ActivityPanel | "暂无活动"空状态，永不变化 | 接入 `notifications` 表查最近 10 条 |
| 学习目标 | "即将上线"静态文字 | 隐藏或做成可设置的简单目标 |
| Dashboard stats[3] | `{value: 0, sub: "即将上线"}` | 连续天数可从 `essay_versions` 按日聚合计算 |
| Sidebar navGroups | "批改请求" disabled → "Step 8"，"广场" disabled → "Phase 2.5" | 可接受，但建议用更优雅的 disabled 样式（虚线边框 + 灰色 icon） |

**核心逻辑问题：**

- `publishNewVersion` 不检查 `essayId` 的归属权限——Server Action 只验登录，不验 ownership。RLS 会拦截非法 UPDATE，但应该提前在应用层拦截，给用户友好提示
- `restoreVersion` 同样不验权限——RLS 保护了 RPC，但错误信息是 raw Postgres 报错

### 2.5 安全性（55/100）

| # | 风险 | 严重度 | 说明 |
|---|------|--------|------|
| 1 | **XSS: dangerouslySetInnerHTML** | **P0** | `DetailClient.tsx` 第 236 行直接渲染 `versionData?.html`，虽然 HTML 来自 `@tiptap/html generateHTML`（从 TipTap JSON 生成），但如果 DB 中的 JSON 被篡改，可能注入恶意 HTML。建议用 `DOMPurify` 或 `isomorphic-dompurify` 做服务端 sanitize |
| 2 | Server Action 权限 | 中 | `publishNewVersion` / `restoreVersion` 不在应用层检查 ownership，依赖 RLS。RLS 可靠但错误体验差 |
| 3 | 邀请码暴力枚举 | 低 | `use_invitation` RPC 无频率限制，8 字符码理论上可暴力。Phase 2 可加 rate limit |
| 4 | 环境变量 | 低 | middleware 中 `process.env.NEXT_PUBLIC_SUPABASE_URL!` 用 `!` 断言，如果环境变量缺失会在运行时崩溃。建议在 `supabase/client.ts` 加启动时校验 |

### 2.6 性能（60/100）

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | Detail 页 6 个串行查询 | 首屏延迟 ~600ms+ | 用 `Promise.all` 并行化无依赖查询 |
| 2 | 每个版本都服务端渲染 HTML | 版本多时 RSC payload 膨胀 | 只渲染当前版本 HTML，其他版本按需加载 |
| 3 | 无图片优化 | Landing 无图片，但后续需要 | Next.js `<Image>` 组件已可用 |
| 4 | TipTap 全量加载 | Editor 页面 JS bundle 较大 | 考虑 `next/dynamic` 懒加载编辑器 |
| 5 | 无 API 缓存 | Dashboard 每次访问都全量查询 | 可用 `unstable_cache` 或 Supabase view |

---

## 三、逐页面审核

### 3.1 Landing 页（`/`）

**现状**：渐变背景 + 居中白色卡片 + 3 个特性卡 + 2 个按钮

**问题**：
- "快速写一篇"按钮直接跳 `/editor`，但未登录用户会被 middleware 拦截到 `/login`，跳转链路是 `/` → `/editor` → `/login`，多一次重定向
- 3 个特性卡只有单字母方块（F/P/S），视觉信息量为零
- 无任何社交证明（用户数、好评、截图）
- "邀请制内测中"标签暗示需要邀请码，但注册页面无邀请码输入框

**建议**：
- "快速写一篇"改为"了解更多"或直接隐藏，主推"进入我的工坊"
- 特性卡换成真实的产品截图缩略图或 SVG 插画
- 如果是邀请制，注册页面应该有邀请码输入框

### 3.2 登录/注册页（`/login`, `/register`）

**现状**：居中卡片布局，渐变背景，表单 + 错误/成功提示

**做得好的**：
- 429 冷却倒计时机制
- 重复邮箱检测（`identities.length === 0`）
- 注册成功后 5s 倒计时跳转
- 邮件确认后的绿色提示

**问题**：
- 密码无可见性切换按钮（`type="password"` 不可查看）
- 无"记住我"选项
- 注册页面无邀请码输入（与 Landing 页"邀请制"矛盾）
- 表单字段无图标（邮箱应有 `@` 图标，密码应有锁图标）

### 3.3 Dashboard（`/dashboard`）

**现状**：Banner + 问候语 + 4 统计卡 + 两栏（EssayList + Heatmap / ActivityPanel）

**做得好的**：
- 问候语按时间段变化
- 空列表有引导文案
- 统计数据从 Supabase 真实查询

**问题**：
- 热力图是假数据（P2 优先级）
- ActivityPanel 是空占位
- 统计卡第 4 格（连续天数）永远是 0
- "邀请制工坊模式"Banner 的 icon 是字母 `I`，应该是盾牌或锁图标
- EssayList 列表项无排序/筛选功能
- 无分页（如果用户有 100+ 篇作文会一次全部加载）

### 3.4 编辑器（`/editor`, `/editor/[essayId]`）

**现状**：元数据栏 + TipTap 工具栏 + 编辑区 + AI 标注面板

**做得好的**：
- 草稿自动保存 + 恢复提示
- 字数统计实时更新
- AI 标注点击替换
- 工具栏按钮 active 状态高亮

**问题**：
- 退出编辑器无"未保存内容将丢失"确认（P3）
- TipTap 初始化期间无 loading skeleton
- AI 标注面板的词库只有 11 个词，几乎扫不出东西
- 编辑区 `max-w-[760px]` 在窄屏下会溢出（无 responsive 调整）
- 标签选择是 `<select>`，不支持多选（DB schema 是 `TEXT[]`）
- 可见性下拉框的选项文案太长（"私密 · 仅自己可见"），挤占空间
- 发布错误提示是 `fixed bottom-4` 的临时 div，不是 Toast 系统

### 3.5 详情页（`/essays/[essayId]`）

**现状**：面包屑 + 标题/标签/元信息 + 操作按钮 + Tab 切换（内容/历史/批改）+ 侧边栏

**做得好的**：
- 版本切换器 + 恢复功能
- Fork 来源链接
- 协作者列表
- Star 状态同步

**问题**：
- `dangerouslySetInnerHTML` 渲染用户内容（P0 安全风险）
- "批改记录"Tab 是空占位
- "邀请批改"按钮 disabled 且无样式区分
- 版本内容区域用 `prose prose-sm` 但未安装 `@tailwindcss/typography`，排版靠 `.tiptap-content` 的手写 CSS
- 6 个串行查询导致首屏慢
- 无"分享"功能（复制链接）

---

## 四、数据库与安全审核

### 4.1 Schema 设计

**评价：良好。** 8 表覆盖了 Phase 1 所有功能，关系设计合理：

- `essays` ← `essay_versions`（1:N，版本不可变）
- `essays` ← `essay_members`（1:N，协作权限）
- `essays` ← `pull_requests`（1:N，base/head 版本对）
- `essays` ← `stars`（1:N，用户收藏）
- `essays` ← `notifications`（通过触发器）
- `essays` ← `invitations`（1:N，邀请码）

**建议**：
- `essay_versions.content` 是 `JSONB`，未来版本多了查询会慢。可加 `generated` 列存 `content_hash` 做快速 diff
- `pull_requests.diff_text` 是 `TEXT`，Phase 2 如果做富文本 diff 需要改为 `JSONB`
- 缺少 `essay_comments` 表（Phase 2 规划中）
- 缺少 `pr_comments` 表（Phase 2 规划中）

### 4.2 RLS 策略

**评价：良好。** 全表启用 RLS，策略覆盖了 SELECT/INSERT/UPDATE/DELETE。

**潜在问题**：
- `notifications` 表用户不能直接 INSERT（只能通过 SECURITY DEFINER 触发器），这意味着如果未来需要"系统通知"类型，必须新增触发器——灵活性受限
- `invitations` 表的 SELECT 策略是 `USING (true)`——任何人都能看到所有邀请码。虽然码是随机的 8 字符，但理论上可被枚举
- `stars` 表的 SELECT 也是 `USING (true)`——任何人都能看到谁收藏了什么。Phase 2 如果需要隐私控制需收紧

### 4.3 RPC 函数

**评价：良好。** 4 个 RPC 都用 `SECURITY DEFINER` + 权限校验：

- `create_essay_version`：验成员角色 + 原子版本号
- `merge_pull_request`：验 owner + 创建新版本
- `use_invitation`：验有效期 + 加成员
- `generate_invite_code`：验 owner + 生成码

**建议**：
- `create_essay_version` 的版本号生成用 `MAX(version_number) + 1`，高并发下可能冲突。可改用 `LOCK TABLE` 或 sequence
- `merge_pull_request` 没有检查 base_version 是否已被 merge 过

---

## 五、优先级行动计划

### P0 — 安全（本周必须）

1. **sanitize HTML 输出**：在 `render-content.ts` 的 `renderContentToHTML` 中加 `isomorphic-dompurify`，或者改用 React 组件渲染 TipTap JSON（用 `@tiptap/react` 的 `ContentRenderer`）

### P1 — 设计系统（Step 8 之前）

2. **引入图标库**：`npm install lucide-react`，替换全站单字符图标
3. **建立 Toast 系统**：`npm install sonner`，Fork/Star/发布等操作加反馈
4. **加骨架屏**：为 Dashboard 和 Detail 页创建 `loading.tsx`
5. **加错误边界**：创建 `app/(app)/error.tsx` 和 `app/error.tsx`

### P2 — 数据真实性（Step 8 之前）

6. **热力图接真实数据**：从 `essay_versions.created_at` 按日聚合，计算最近 26 周活动
7. **ActivityPanel 接 notifications**：查最近 10 条通知渲染
8. **连续天数计算**：从 `essay_versions` 按日去重，计算连续写作天数
9. **Server Action 权限校验**：在 `publishNewVersion` 和 `restoreVersion` 前加 ownership 检查

### P3 — 交互完整性（Step 8-10 中逐步补齐）

10. **编辑器退出确认**：`useEffect` + `beforeunload` + 路由拦截
11. **404 页面**：创建 `app/not-found.tsx`
12. **Detail 页查询并行化**：`Promise.all`
13. **编辑器标签多选**：改 `<select>` 为 checkbox group 或 multiselect
14. **响应式基础**：至少让 Dashboard 在 `< 1024px` 下能用

### P4 — 内容补齐（Phase 1 收尾）

15. **Landing 页改版**：加产品截图、社交证明、更好的特性展示
16. **注册页加邀请码**：如果确实是邀请制
17. **Sidebar disabled 项样式优化**：虚线边框 + 灰色 icon

---

## 六、技术债务新增

以下是在审核中发现但未在 TECH_DEBT.md 中记录的债务：

| 日期 | 功能 | 债务内容 | 严重度 | 计划偿还 |
|------|------|----------|--------|----------|
| 2026-08-14 | 安全 | dangerouslySetInnerHTML 无 sanitize | 高 | P0 |
| 2026-08-14 | 性能 | Detail 页 6 个串行查询 | 中 | P3 |
| 2026-08-14 | 设计 | 全站无图标系统，用单字符代替 | 高 | P1 |
| 2026-08-14 | 交互 | 无 Toast/通知反馈系统 | 中 | P1 |
| 2026-08-14 | 交互 | 编辑器无退出确认 | 中 | P3 |
| 2026-08-14 | 数据 | 热力图/活动面板/连续天数全是假数据 | 高 | P2 |
| 2026-08-14 | 安全 | Server Actions 不在应用层验 ownership | 中 | P2 |
| 2026-08-14 | 健壮性 | 无 error.tsx / loading.tsx / not-found.tsx | 中 | P1 |
| 2026-08-14 | 响应式 | 全站无响应式适配 | 中 | P3 |

---

## 七、总结

EngForge 的 Phase 1 是一个**功能完整度高于设计成熟度**的 MVP。数据库设计和后端逻辑达到了产品级标准，但前端视觉和交互还停留在"能跑通"的阶段。

**核心矛盾**：产品定位是"用 GitHub 的方式学英语"——目标用户是考研/高考学生，他们需要一个**看起来专业、用起来顺手**的工具。当前的视觉品质无法支撑这个定位。

**下一步建议**：在继续推进 Step 8（PR 系统）之前，先花 2-3 天做一轮 P0+P1 的集中修复。安全漏洞和设计系统缺失会随着功能增加越来越难补。
