# EngForge 设计系统 — Bento Neutral

> 迁移日期：2026-08-15（commit f61e6bd）
> 源文件（唯一事实源）：**Ardot 设计稿 https://ardot.tencent.com/file/714864718971032**
> 代码落地位置：`src/app/globals.css` 的 `@theme inline`

## Token 清单

### 色彩

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#3B82F6` | 主操作、链接、active 状态 |
| `--color-primary-dark` | `#2563EB` | hover |
| `--color-primary-light` | `#DBEAFE` | 选中背景 |
| `--color-primary-subtle` | `#EFF6FF` | Sidebar active、轻量强调底色 |
| `--color-green` | `#10B981` | 成功、增长类数据 |
| `--color-green-dark` | `#059669` / `--color-green-light` `#D1FAE5` | 同上梯度 |
| `--color-amber` | `#F59E0B` / `--color-amber-dark` `#D97706` | 提示、待办、草稿态 |
| 中性色 | zinc 全梯度（50-900） | 文字、边框、背景一律 zinc，不用 gray |

### 形状与阴影

- 卡片：`rounded-card`（12px）+ `bg-white` + `shadow-card`，**不加边框**
- 已废弃：purple / teal token、深色 Sidebar、gray 默认灰度

### 图标与反馈

- 图标：`lucide-react`（禁止单字符图标）
- Toast：`sonner`
- 富文本：TipTap（`.tiptap-content` 手写排版样式）

## 组件库页（DC-001，2026-08-15）

画布内新增 **Design System · 组件库** 画板，包含以下可复用资产：

| 类别 | 内容 |
|---|---|
| 色彩 | Primary / Green / Amber / Zinc 全梯度 swatch |
| 排版 | H1(24/Bold) · H2(20/SemiBold) · H3(16/SemiBold) · Body(14) · Caption(12) |
| 形状 | 卡片（r12 + shadow-card）、输入框(r8)、小元素(r6) |
| Button | Primary / Secondary / Ghost / Disabled 四态 |
| Status Pill | 草稿(amber) / 已发布(green) / 待审阅(blue) / 已合并(green solid) |
| Tag chip | zinc-100 底 + zinc-600 字 |
| Input | Label + 输入框 + Hint |
| Sidebar Nav | Active(primary-subtle 底) vs Default(透明) |
| Stat Card | 数值 + 标签 + 涨跌 |
| Toast | 成功(green) / 失败(amber) |
| EmptyState | 图标 + 主文案 + 次文案 + Primary Button |

**使用方式**：新页面/新组件直接从该画板复制对应元素，禁止凭记忆重画。

## 使用规则（摘自开发提示词 v3）

1. 新 UI 一律 Tailwind 工具类 + 上述 token，禁止内联 style 和新硬编码色值
2. 需要新页面/新组件时先对照 Ardot 源文件，缺图的设计先补画再写代码
3. 深度重构原型时，新原型基于本设计系统在 Ardot 画布上重建
