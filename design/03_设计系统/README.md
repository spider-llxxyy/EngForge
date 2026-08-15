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

## 使用规则（摘自开发提示词 v3）

1. 新 UI 一律 Tailwind 工具类 + 上述 token，禁止内联 style 和新硬编码色值
2. 需要新页面/新组件时先对照 Ardot 源文件，缺图的设计先补画再写代码
3. 深度重构原型时，新原型基于本设计系统在 Ardot 画布上重建
