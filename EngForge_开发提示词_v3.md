# EngForge 网页开发模式 · 开发提示词 v3

> 取代 `EngForge_改造提示词_v2.md`（那份针对 HTML 原型，使命已完成）。
> 本文件是「网页开发模式」下持续开发 EngForge 的任务提示词模板 + 两个即用示例。

---

## 一、使用方法

1. **工作空间必须选 `D:\EngForge`**（左下角选择工作目录），否则 AI 看不到工程。
2. 每次新任务：复制「二、任务模板」，填 3 个空（上次成果 / 本次目标 / 遗留决策点）——这就是四层纠偏体系里的 Layer 3 对话同步协议。
3. 需要对照 Ardot 设计稿时，在提示词里附上设计文件链接（见模板中「设计规范」一节），或 `@` 引用设计稿截图。
4. 任务完成后要求 AI 更新 `TECH_DEBT.md` / `.workbuddy/memory/` 并 git commit——不是可选项。

---

## 二、任务模板（每次复制此块）

```markdown
【项目背景】
EngForge 是一个已落地的 Next.js 工程（用 GitHub 的方式学英语写作：Fork/PR/Star），
不是从零生成网页。所有开发必须修改 D:\EngForge 中的现有代码。

【技术栈（不要引入新框架）】
- Next.js 16.3.0 (App Router + Turbopack) + React 19 + TypeScript 5
- Tailwind CSS v4（@theme inline token，见 src/app/globals.css）
- Supabase（@supabase/ssr，RLS 已全表开启）
- 图标 lucide-react / Toast sonner / 富文本 TipTap

【当前状态】（对话同步协议）
- 上次完成了：[填：具体成果 + commit hash]
- 今天要做：[填：本次目标]
- 上次遗留的决策点是：[填：没有就写"无"]

【设计规范（Bento Neutral，已落地代码）】
- token 定义在 src/app/globals.css 的 @theme inline：
  primary #3B82F6 / green #10B981 / amber #F59E0B，中性色一律 zinc
- 卡片统一：rounded-card + bg-white + shadow-card，不加边框
- 设计源文件（Ardot）：https://ardot.tencent.com/file/714864718971032
  需要新页面/新组件时先对照此设计稿，缺图的设计再补画

【硬性约束】
1. 修改现有工程文件，禁止生成独立 HTML 文件或另起项目
2. 新 UI 一律用 Tailwind 工具类 + 已有 token，禁止内联 style 和新硬编码色值
3. Next.js 16.3 与旧版差异大，写代码前先读 node_modules/next/dist/docs/ 相关文档
4. 客户端组件用 useSearchParams() 必须包 <Suspense>（静态预渲染要求）

【工作流程】
1. 先给出方案 + 涉及文件清单，等我确认后再写代码
2. 一次性写完，不要逐文件交付
3. 完成后必须跑验证三件套：npx tsc --noEmit → npx eslint src → npx next build，全绿才算完成
4. 通过后更新 TECH_DEBT.md（新增债务）和 .workbuddy/memory/ 当日日志，然后 git commit（信息用英文 conventional commits）
5. 启动 dev server（npm run dev，端口 3000）让我在预览里验收

【本次任务细节】
[填：具体需求、验收标准、边界情况]
```

---

## 三、即用示例 A：P2 数据修复（下一个任务）

```markdown
（前面照抄模板到【当前状态】，替换为：）
- 上次完成了：设计系统迁移 Bento Neutral 已全部落地（commit f61e6bd），build 全绿
- 今天要做：P2 数据修复三件事
- 上次遗留的决策点是：无

【本次任务细节】
1. 热力图真实数据：Heatmap 组件目前用 dashboard-data.ts 假数据，
   改为从 essays + essay_versions 表按天统计发布/版本创建数（SQL 聚合查询，可加 RPC）
2. 活动面板真实数据：ActivityPanel 改为查 notifications 表最近 20 条
3. Server Actions ownership 校验：essay-actions.ts 中 forkEssay / restoreVersion / toggleStar
   等所有 mutation 前先校验当前用户是否有权操作（essay.owner_id 或协作成员）
4. 顺带：Detail 页 /essays/[essayId] 的 6 个串行查询改 Promise.all 并行

【验收标准】
- 造几条测试数据后热力图格子颜色与实际活动日期一致
- 无权限用户调 Server Action 返回错误 toast 而非静默成功
- tsc / eslint / build 三件套全绿
```

## 四、即用示例 B：Step 8 PR 系统

```markdown
（前面照抄模板，【当前状态】按当时进度填写）

【本次任务细节】
实现 PR 系统 MVP（Phase 1 边界内）：
1. 数据库：pull_requests 表（migration 0002）：id / source_essay_id / target_essay_id /
   source_version / target_version / title / description / status(open|merged|closed) /
   created_by / created_at / merged_at；RLS + 合并触发通知
2. 创建 PR：从 Fork 出去的作文详情页发起，选目标原作 + base/head 版本
3. Diff 视图：两个版本 essay_content 纯文本 diff（可以自写 LCS 或引 diff 库，倾向轻量自写），
   左右对照或统一视图均可，先做统一视图
4. 合并：PR 作者或目标作文名义作者可合并；合并 = 调 create_essay_version 在目标作文生成新版本，
   PR 状态改 merged，通知双方
5. 页面：/essays/[id]/pulls 列表 + /pulls/[prId] 详情；Sidebar 加「Pull Requests」入口

【已知债务（设计时要绕开）】
- base/head 版本必须已存在才能建 PR（草稿不能直接提 PR，Phase 2 再补）
- diff 仅纯文本，不比较富文本格式

【验收标准】
- 完整走通：Fork → 编辑发布新版本 → 向原作提 PR → 原作者看到 diff → 合并 → 原作出现新版本 + 双方收到通知
- 三件套全绿 + commit
```

---

## 五、网页开发模式注意事项（踩坑预防）

| 坑 | 预防写法（已内置在模板里） |
|---|---|
| 模式默认倾向生成单文件 HTML 演示页 | 【硬性约束】第 1 条明确禁止 |
| 忽略工程已有设计 token，随手写死色值 | 【设计规范】引用 globals.css + Ardot 源文件 |
| 用训练数据里的旧 Next.js 写法 | 【硬性约束】第 3 条强制读 node_modules 内文档 |
| 改完不验证就宣布完成 | 【工作流程】第 3 条三件套全绿才算完成 |
| 新对话丢失上下文 | 【当前状态】三行同步 + 要求更新 memory |
| useSearchParams 预渲染报错（已踩过） | 【硬性约束】第 4 条 |
