# EngForge 项目周记

> **触发条件**：每完成一个 Phase 的里程碑时（Layer 4），追加一段周记。
> **目的**：写给半年后的自己。记录实际开发过程，而非计划。诚实记录困难、妥协、收获。

---

## 周记模板（复制使用）

```markdown
### Phase X · [里程碑名称] · [完成日期]

**实际开发时长**：X 天 / X 小时（预估 X 天，偏差 X%）

**完成的功能**：
- 功能 A
- 功能 B

**最大困难**：
[诚实记录——是技术难、还是需求不确定、还是时间不够]

**最重要的妥协**：
[记录这个 Phase 中做出的最大让步，以及为什么接受它]
→ 已记录到 TECH_DEBT.md？ [是/否]

**最重要的技术收获**：
[一句话——这个 Phase 让你学到的最有价值的东西]

**如果重新开始，我会怎么做不同的决策**：
[复盘——不是后悔，是提炼经验]

**下一个 Phase 的重点**：
[基于本次复盘，下一个 Phase 应该优先关注什么]
```

---

## 已完成周记

### Phase 0 · 原型验证 + 规划书 · 2026-08-05

**实际开发时长**：约 4 天（含多轮 UI 迭代）

**完成的功能**：
- 5 页面交互原型（Landing / Dashboard / Editor / Detail / Review）
- localStorage 持久化（编辑器内容、Fork 计数、修改历史、版本状态）
- 动态 AI 标注引擎（客户端词库扫描，11 个靶词）
- 产品规划书 v2.0（含产品治理四板块）
- Phase A 收尾修复（文案、字数、列表数据化、Editor→Detail 同步）

**最大困难**：
从 span 驱动的 AI 标注架构迁移到无 span 实时扫描模式——5 个函数需要重写，撤销机制在无 span 下难以定位原词。

**最重要的妥协**：
AI 标注仅用客户端词库（11 个词），未接入 LLM API。→ 已记录到 TECH_DEBT.md

**最重要的技术收获**：
contenteditable 中的词提取需要 caretRangeFromPoint + 手动遍历词边界，不能依赖浏览器 Selection API。

**如果重新开始，我会怎么做不同的决策**：
原型阶段就应该把 essayList 数据化，而不是硬编码 5 条 DOM。后期补救比一开始就写数组更费劲。

**下一个 Phase 的重点**：
正式搭建 Next.js + Supabase 项目，跑通技术栈热身（7 步），然后实现账号系统。

---

> 以下待填写

### Phase 1 · MVP 全功能落地 · 2026-08-15

**实际开发时长**：约 10 天（2026-08-06 ~ 08-15，预估 2 周，偏差 -29%）

**完成的功能**：
- 账号系统：注册/登录/邮箱确认回调/路由保护/用户菜单，含 429 限流、重复邮箱、超时等健壮性处理
- 作文编辑器：TipTap 富文本 + 元数据 + localStorage 草稿自动保存（debounce 2s）+ 发布 → v1，含恢复草稿
- AI 标注（客户端词库版，11 靶词，Phase 3 接 LLM）
- Fork + 版本管理：Detail 页 + 版本切换预览 + 恢复历史版本 + Star
- PR 系统：TipTap 预载的批改编辑器 + LCS 行级 diff（绿增红删）+ 合并/关闭生成新版本
- 通知系统：铃铛 + 未读徽章 + 下拉面板 + Supabase Realtime 实时推送 + sonner toast
- 邀请协作：owner 邀请码生成/撤销 + 凭码加入（幂等 RPC）+ 成员管理
- Dashboard 真实数据：作文列表 / 热力图（182 天按天聚合）/ 活动面板 / 统计卡片含连续天数
- 设计系统迁移 Bento Neutral + XSS 防护 + 错误边界（error/loading/not-found）
- Step 11 收尾：连续天数真实化、草稿 key 隔离、middleware → proxy 迁移、测试指南全量更新

**最大困难**：
两类"工具链不讲理"的问题。一是 `@supabase/ssr` 的类型推断在 insert()/rpc()/update() 链上退化为 never，明明代码是对的却编译报错；二是 React 19 新 hooks lint 规则比想象中严——effect 内不能同步 setState、render 期不能写 ref，Step 9/10 各踩了一次，被迫把初始化逻辑搬到事件回调和 lazy initializer 里。都不是业务难题，而是"框架契约"问题，排查时间远超写代码时间。

**最重要的妥协**：
两处。① 类型退化用 `as never` 绕过而不是深挖根因——因为根因在库的类型导出，修不动，只能等升级；② 草稿存 localStorage 而不是数据库，跨设备不同步。→ 已记录到 TECH_DEBT.md？ **是**

**最重要的技术收获**：
Server Actions 的安全边界要自己守：RLS 挡的是数据库层，SA 是"以用户身份跑的服务端代码"，publishNewVersion/mergePr/toggleStar 每一个都必须自己做 ownership 校验——stars 表 RLS 只查 user_id 不查作文可见性的漏洞，就是靠应用层 view 校验补上的。

**如果重新开始，我会怎么做不同的决策**：
① Dashboard 一开始就该直接查真实数据，"先 mock 后接"看似快，实际 P2 修复花的时间比一开始就写查询多；② 上来先跑一遍 `next build` 而不是只看 dev server——好几个类型/预渲染问题 dev 模式下完全隐形；③ SA 的 ownership 校验应该在写第一个 Action 时就抽成 checkEssayAccess，而不是每个函数散装判权限、事后统一补。

**下一个 Phase 的重点**：
Phase 2 三大件：个人主页、PR 评论线程、作文评论区（把"协作"从单点通知升级为对话）；顺带偿还：数据库草稿、as never 类型债、editor 元数据 RLS 静默跳过、富文本 diff。Phase 3：LLM AI 标注。

---
