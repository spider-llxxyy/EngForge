import Link from "next/link";
import {
  GitFork,
  GitPullRequest,
  Star,
  Sparkles,
  TrendingUp,
  GitPullRequestArrow,
} from "lucide-react";

/**
 * Landing 页面 — 按 Ardot 视觉重设计稿（Frame 2:179）实现
 *
 * 结构：Navbar → Split Hero（左文案 + 右产品预览）→ 3 Feature 卡片 → CTA → Footer
 * 设计系统：Bento Neutral（zinc 中性色 + blue/emerald/amber 三强调色）
 */

/** 三个核心特性 — 对应设计稿 Features Section */
const FEATURES = [
  {
    icon: GitFork,
    title: "Fork 借鉴",
    desc: "一键复制高分范文到自己的工坊，在原文基础上修改练习。",
    iconBg: "bg-primary-subtle",
    iconColor: "text-primary",
  },
  {
    icon: GitPullRequest,
    title: "PR 互改",
    desc: "邀请同学互相批改作文，生成新版本，追踪每一步改进。",
    iconBg: "bg-amber-light",
    iconColor: "text-amber",
  },
  {
    icon: Star,
    title: "Star 收藏",
    desc: "收藏优秀范文，追踪自己的写作进步曲线。",
    iconBg: "bg-green-light",
    iconColor: "text-green",
  },
];

/** Hero 右侧预览卡片 — 模拟产品内的真实界面 */
function ProductPreview() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-3 rounded-2xl bg-zinc-100 p-6">
      {/* 预览 1：作文卡片 */}
      <div className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-card">
        <span className="w-fit rounded bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
          考研
        </span>
        <p className="text-sm font-semibold text-zinc-950">
          The Impact of AI on Education
        </p>
        <p className="text-xs text-zinc-500">32 词 · 2 小时前 · 3 forks</p>
      </div>

      {/* 预览 2：协作动态 */}
      <div className="flex items-center gap-3 rounded-lg bg-white p-3.5 shadow-card">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green text-[11px] font-semibold text-white">
          C
        </span>
        <p className="text-[13px] text-zinc-600">陈同学 fork 了你的作文</p>
      </div>

      {/* 预览 3：写作统计 */}
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-card">
        <div>
          <p className="text-xs text-zinc-500">本周写作</p>
          <p className="text-xl font-bold text-zinc-950">7 篇</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-green-light px-2.5 py-1 text-[11px] font-semibold text-green">
          <TrendingUp className="h-3 w-3" />
          +40%
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* ── Navbar ── */}
      <header className="flex h-16 items-center justify-between bg-white px-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-base font-bold text-white">
            E
          </span>
          <span className="text-lg font-semibold text-zinc-950">EngForge</span>
        </Link>

        {/* 导航链接 */}
        <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
          <a href="#features" className="transition-colors hover:text-zinc-950">
            产品
          </a>
          <a href="#cta" className="transition-colors hover:text-zinc-950">
            学习路径
          </a>
          <a href="#features" className="transition-colors hover:text-zinc-950">
            关于
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            免费注册
          </Link>
        </div>
      </header>

      {/* ── Hero：左文案 + 右产品预览 ── */}
      <section className="flex flex-col items-center gap-16 bg-white px-16 py-20 lg:flex-row">
        {/* 左：文案 */}
        <div className="flex max-w-[560px] flex-col gap-6">
          {/* 定位徽章 */}
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            考研英语 · 上海高考
          </span>

          <h1 className="text-[44px] font-bold leading-[1.2] tracking-tight text-zinc-950">
            用 GitHub 的方式
            <br />
            学英语写作
          </h1>

          <p className="text-base leading-relaxed text-zinc-600">
            Fork 借鉴高分范文，PR 互改提升，Star 收藏你的进步。
            <br />
            让协作成为学习英语的最佳方式。
          </p>

          <div className="mt-2 flex gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-primary px-9 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              开始写作
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-200 bg-white px-9 py-3 text-base font-semibold text-zinc-950 transition-colors hover:bg-zinc-50"
            >
              查看示例
            </Link>
          </div>
        </div>

        {/* 右：产品预览 */}
        <ProductPreview />
      </section>

      {/* ── Features：三个核心动作 ── */}
      <section id="features" className="bg-zinc-50 px-16 py-20">
        <h2 className="mb-10 text-center text-[32px] font-bold text-zinc-950">
          三个动作，掌握英语写作
        </h2>

        <div className="mx-auto flex max-w-[1200px] gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex-1 rounded-xl bg-white p-7 shadow-card"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] ${feature.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-zinc-950">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        id="cta"
        className="flex flex-col items-center gap-6 bg-white px-16 py-16"
      >
        <h2 className="text-[28px] font-semibold text-zinc-950">
          准备好开始你的英语写作之旅了吗？
        </h2>
        <Link
          href="/register"
          className="rounded-lg bg-primary px-10 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          免费注册
        </Link>
        <p className="flex items-center gap-1.5 text-sm text-zinc-500">
          <GitPullRequestArrow className="h-4 w-4 text-primary" />
          邀请制内测中，注册后即可创建你的工坊
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="flex items-center justify-between border-t border-zinc-200 bg-white px-16 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-base font-bold text-white">
            E
          </span>
          <span className="text-sm font-medium text-zinc-600">EngForge</span>
        </div>
        <p className="text-xs text-zinc-500">
          © 2026 EngForge. 用 GitHub 的方式学英语。
        </p>
      </footer>
    </div>
  );
}
