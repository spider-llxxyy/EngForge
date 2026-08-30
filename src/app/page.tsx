import Link from "next/link";
import {
  FilePlus,
  GitPullRequest,
  Star,
  Sparkles,
  TrendingUp,
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
    icon: FilePlus,
    title: "写作 · 发布",
    desc: "打开编辑器就能写，写完自动存为第一个版本。之后每次修改都会生成新版本，随时回看、随时恢复。",
    iconBg: "bg-primary-subtle",
    iconColor: "text-primary",
  },
  {
    icon: GitPullRequest,
    title: "邀请批改",
    desc: "生成邀请码发给同学，对方就能进入你的作文提交批改——逐句对照，改了哪里一目了然。",
    iconBg: "bg-amber-light",
    iconColor: "text-amber",
  },
  {
    icon: Star,
    title: "采纳 · 借鉴",
    desc: "满意的批改一键采纳，自动生成新版本；看到好范文可以借鉴一份到自己账号继续改。",
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
        <p className="text-xs text-zinc-500">32 词 · 2 小时前 · 3 次借鉴</p>
      </div>

      {/* 预览 2：协作动态 */}
      <div className="flex items-center gap-3 rounded-lg bg-white p-3.5 shadow-card">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green text-[11px] font-semibold text-white">
          C
        </span>
        <p className="text-[13px] text-zinc-600">陈同学 借鉴了你的作文</p>
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

      {/* 预览 4：AI 替换建议 */}
      <div className="flex items-center gap-2 rounded-lg bg-white p-3.5 shadow-card">
        <span className="text-[13px] text-zinc-600">
          替换建议：<span className="text-red line-through">depicted</span>
          {" → "}
          <span className="font-semibold text-primary">illustrated / portrayed</span>
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
            开始使用
          </Link>
        </div>
      </header>

      {/* ── Hero：左文案 + 右产品预览 ── */}
      <section className="flex flex-col items-center gap-16 bg-zinc-50 px-16 py-20 lg:flex-row">
        {/* 左：文案 */}
        <div className="flex max-w-[680px] flex-col gap-6">
          {/* 定位徽章 */}
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            考研英语 · 上海高考
          </span>

          <h1 className="text-[40px] font-bold leading-[1.3] tracking-tight text-zinc-950">
            写一遍不够？那就写十遍，每次都留痕
          </h1>

          <p className="text-base leading-[1.7] text-zinc-600">
            每篇作文都有完整的版本历史——改了一笔就存一个版本，同学帮你批改的内容也能合并进来。想看进步轨迹？翻版本历史就行。
          </p>

          <div className="mt-2">
            <Link
              href="/register"
              className="rounded-lg bg-primary px-9 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              开始使用
            </Link>
          </div>
        </div>

        {/* 右：产品预览 */}
        <ProductPreview />
      </section>

      {/* ── Features：三个核心动作 ── */}
      <section id="features" className="bg-zinc-50 px-16 py-20">
        <h2 className="mb-10 text-center text-[32px] font-bold text-zinc-950">
          三步，把作文从初稿改到满意
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
          第一篇作文，现在就能开始
        </h2>
        <Link
          href="/register"
          className="rounded-lg bg-primary px-10 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          开始使用
        </Link>
        <p className="flex items-center gap-1.5 text-sm text-zinc-500">
          邀请制内测中，注册后即可开始写作
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
          © 2026 EngForge. 写一遍不够，就写十遍。
        </p>
      </footer>
    </div>
  );
}
