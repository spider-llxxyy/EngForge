# EngForge 技术债务看板

> **触发条件**：每次你说出「先这样，后面再改」这句话时，立刻花 30 秒往这里加一行。不要拖。
> **维护规则**：每完成一个 Phase（Layer 4 里程碑复盘）时，重读此表，标记已偿还的债务，更新计划偿还 Phase。

## 严重度定义

| 级别 | 含义 | 处理原则 |
|------|------|----------|
| **高** | 影响核心功能可用性或安全性 | 必须在当前 Phase 结束前偿还 |
| **中** | 功能可用但体验/可维护性受损 | 计划在下一个 Phase 偿还 |
| **低** | 已知限制但不影响使用 | 可长期保留，定期评估是否仍需要 |

## 债务清单

| 日期 | 功能 | 债务内容 | 严重度 | 计划偿还 Phase | 状态 |
|------|------|----------|--------|----------------|------|
| 2026-08-05 | AI 标注 | 客户端词库仅 11 个靶词，未接入 LLM API | 高 | Phase 3 | 未偿还 |
| 2026-08-05 | PR diff | 仅支持纯文本 diff，不支持富文本格式差异 | 中 | Phase 2 | 未偿还 |
| 2026-08-05 | 个人主页 | Phase 1 降级为右上角菜单，无完整用户主页 | 中 | Phase 2 | 未偿还 |
| 2026-08-05 | PR 评论 | PR 下无评论线程，无法讨论修改建议 | 中 | Phase 2 | 未偿还 |
| 2026-08-05 | 作文评论 | 作文详情页下无评论区 | 低 | Phase 2 | 未偿还 |
| 2026-08-09 | 通知写入 | notifications INSERT 由 SECURITY DEFINER 触发器完成，用户无法直接 INSERT；如需新增通知类型需新增触发器 | 低 | Phase 2 | 未偿还 |
| 2026-08-09 | 邀请码通用性 | 当前 use_invitation 仅支持 essay 级邀请，不支持全局邀请（注册邀请） | 低 | Phase 2 | 未偿还 |
| 2026-08-09 | PR diff | base/head 版本必须先存在才能创建 PR，无法从草稿直接提交 | 中 | ~~Phase 2~~ | ✅ 已偿还（Step 8 createPullRequest 内部自动 create_essay_version 生成 head） |
| 2026-08-10 | 草稿存储 | 草稿仅存 localStorage，不支持跨设备恢复 | 中 | Phase 2 | 未偿还 |
| 2026-08-10 | 类型推断 | @supabase/ssr 在 insert()/rpc() 链退化为 never，用 as never 绕过 | 中 | Phase 2 | 未偿还 |
| 2026-08-14 | 性能 | Detail 页 6 个串行查询，应改 Promise.all 并行 | 中 | ~~P3~~ | ✅ 已偿还 |
| 2026-08-14 | 数据 | 热力图/活动面板已接入真实数据；**连续天数仍为假数据** | 高 | P2 | 部分偿还 |
| 2026-08-14 | 安全 | Server Actions 不在应用层验 ownership | 中 | ~~P2~~ | ✅ 已偿还 |
| 2026-08-14 | 响应式 | 全站无响应式适配 | 中 | P3 | 未偿还 |
| 2026-08-15 | 框架迁移 | Next.js 16.3 提示 middleware 文件约定已弃用，应迁移到 proxy（`npx @next/codemod@canary middleware-to-proxy .`） | 低 | P3 | 未偿还 |
| 2026-08-15 | 通知 Realtime | 客户端断线期间漏掉的 INSERT 靠下次整页刷新补齐（supabase-js 自带重连，但离线窗口内的推送不补发） | 低 | P3 | 未偿还 |

## 偿还记录

> 每偿还一笔债务，在此记录偿还日期和方式。

| 偿还日期 | 原债务 | 偿还方式 | 实际耗时 |
|----------|--------|----------|----------|
| 2026-08-14 | XSS: dangerouslySetInnerHTML 无 sanitize | render-content.ts 加 isomorphic-dompurify，白名单仅允许 TipTap 结构标签 | 20min |
| 2026-08-14 | 全站无图标系统，用单字符代替 | 引入 lucide-react，替换 Sidebar/Landing/Toolbar/EssayActions/TopBar/UserMenu/DetailSidebar/AiSuggestions 共 9 个文件 | 1h |
| 2026-08-14 | 无 Toast/通知反馈系统 | 引入 sonner，root layout 挂载 Toaster，Fork/Star/发布/恢复版本加 toast 反馈 | 40min |
| 2026-08-14 | 无 error.tsx / loading.tsx / not-found.tsx | 创建 root error.tsx + app error.tsx + not-found.tsx + dashboard loading.tsx + detail loading.tsx | 40min |
| 2026-08-15 | 性能: Detail 页 6 串行查询 | 改为 2 批 Promise.all（批次A: essay/versions/members/star，批次B: author/fork来源），myMembership 从 members 查询派生 | 30min |
| 2026-08-15 | 安全: SA 无 ownership 校验 | essay-actions.ts 新增 checkEssayAccess(supabase, essayId, userId, mode)，publishNewVersion/restoreVersion 用 edit 校验，toggleStar 用 view 校验；EssayActions star 失败 toast 透传 error | 40min |
| 2026-08-15 | 数据: 热力图假数据 | dashboard/page.tsx 查 essays+essay_versions created_at 聚合为 182 天 levels 传 prop；Heatmap 改 props 驱动删假数组；ActivityPanel 查 notifications 最近 20 条渲染真实列表 | 50min |
| 2026-08-15 | PR: base/head 需预先存在 | createPullRequest SA 内部调 create_essay_version 自动生成 head 版本（更新 latest_version 不动 current_version），提交 PR 即建版本 | Step 8 内完成 |
| 2026-08-15 | PR 系统缺失（Step 8） | 新增 8 文件：diff.ts(LCS行级diff) / prs/new 页+PrEditorClient / prs/[prId] 页+loading / PrDiffView / PrActions / PrList；改 5 文件：essay-actions(+createPullRequest/mergePr/closePr) / DetailClient(reviews tab 接 PrList) / Detail 页(批次A加 PRs 查询) / Sidebar 标签 / TopBar 标题 | 3h |
| 2026-08-15 | 通知系统缺失（Step 9） | 新增 notification-config.ts(类型映射+相对时间，去重) + NotificationBell.tsx(铃铛+徽章+下拉面板+Realtime 订阅+已读+toast)；改 TopBar(插入铃铛) / layout(服务端未读计数) / ActivityPanel(import 共享配置) | 1h |

## 使用示例

```
# 你在开发编辑器时说了「自动保存先只在内存里做，数据库同步后面再加」
# → 立刻打开此文件，加一行：
| 2026-08-10 | 编辑器自动保存 | 仅内存保存，未同步到 Supabase | 高 | Phase 1 | 未偿还 |
```
