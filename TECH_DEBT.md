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
| 2026-08-09 | PR diff | base/head 版本必须先存在才能创建 PR，无法从草稿直接提交 | 中 | Phase 2 | 未偿还 |
| 2026-08-10 | 草稿存储 | 草稿仅存 localStorage，不支持跨设备恢复 | 中 | Phase 2 | 未偿还 |
| 2026-08-10 | 类型推断 | @supabase/ssr 在 insert()/rpc() 链退化为 never，用 as never 绕过 | 中 | Phase 2 | 未偿还 |
| 2026-08-14 | 性能 | Detail 页 6 个串行查询，应改 Promise.all 并行 | 中 | P3 | 未偿还 |
| 2026-08-14 | 数据 | 热力图/活动面板/连续天数全是假数据 | 高 | P2 | 未偿还 |
| 2026-08-14 | 安全 | Server Actions 不在应用层验 ownership | 中 | P2 | 未偿还 |
| 2026-08-14 | 响应式 | 全站无响应式适配 | 中 | P3 | 未偿还 |
| 2026-08-15 | 框架迁移 | Next.js 16.3 提示 middleware 文件约定已弃用，应迁移到 proxy（`npx @next/codemod@canary middleware-to-proxy .`） | 低 | P3 | 未偿还 |

## 偿还记录

> 每偿还一笔债务，在此记录偿还日期和方式。

| 偿还日期 | 原债务 | 偿还方式 | 实际耗时 |
|----------|--------|----------|----------|
| 2026-08-14 | XSS: dangerouslySetInnerHTML 无 sanitize | render-content.ts 加 isomorphic-dompurify，白名单仅允许 TipTap 结构标签 | 20min |
| 2026-08-14 | 全站无图标系统，用单字符代替 | 引入 lucide-react，替换 Sidebar/Landing/Toolbar/EssayActions/TopBar/UserMenu/DetailSidebar/AiSuggestions 共 9 个文件 | 1h |
| 2026-08-14 | 无 Toast/通知反馈系统 | 引入 sonner，root layout 挂载 Toaster，Fork/Star/发布/恢复版本加 toast 反馈 | 40min |
| 2026-08-14 | 无 error.tsx / loading.tsx / not-found.tsx | 创建 root error.tsx + app error.tsx + not-found.tsx + dashboard loading.tsx + detail loading.tsx | 40min |

## 使用示例

```
# 你在开发编辑器时说了「自动保存先只在内存里做，数据库同步后面再加」
# → 立刻打开此文件，加一行：
| 2026-08-10 | 编辑器自动保存 | 仅内存保存，未同步到 Supabase | 高 | Phase 1 | 未偿还 |
```
