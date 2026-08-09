import Link from "next/link";

/**
 * Home 组件 — 这是 EngForge 的 Landing 页面（首页）
 *
 * 一个 React 组件 = 一个返回 JSX 的函数。
 * 文件名叫 page.tsx，Next.js 就自动把它当作 "/" 路由的页面。
 * 函数名叫 Home，export default 让别的文件能导入它。
 */
export default function Home() {
  // 三个核心特性的数据，存在数组里。
  // bg 和 color 存的是 Tailwind 类名，渲染时动态拼到 className 里。
  // 这就是"数据驱动视图"：数据变了，页面自动变。
  const features = [
    {
      icon: "F",
      title: "Fork 借鉴",
      desc: "复制范文到自己的工坊，在原文基础上改写练习",
      bg: "bg-primary-light",
      color: "text-primary",
    },
    {
      icon: "P",
      title: "PR 互改",
      desc: "邀请伙伴批改你的作文，逐句修改像代码 Review",
      bg: "bg-purple-light",
      color: "text-purple",
    },
    {
      icon: "S",
      title: "Star 收藏",
      desc: "收藏优质语料和范文，构建你的个人语料库",
      bg: "bg-teal-light",
      color: "text-teal",
    },
  ];

  return (
    // 最外层：渐变背景，撑满整个屏幕，居中卡片
    // min-h-screen = 最小高度 100vh（撑满视口）
    // bg-gradient-to-br = 渐变方向"到右下"（= CSS 的 135deg）
    // from-blue-600 via-purple-600 to-cyan-600 = 蓝→紫→青
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-purple to-teal p-10">

      {/* 白色卡片容器 */}
      {/* max-w-[560px] = 最大宽度 560px；rounded-2xl = 圆角；shadow-2xl = 大阴影 */}
      <div className="w-full max-w-[560px] rounded-2xl bg-white px-12 py-14 text-center shadow-2xl">

        {/* 邀请制内测中 — 琥珀色小标签 */}
        <span className="mb-5 inline-block rounded-full bg-amber-light px-3 py-1 text-xs font-semibold text-amber">
          邀请制内测中
        </span>

        {/* Logo — 渐变文字效果 */}
        {/* bg-clip-text + text-transparent = 把渐变背景裁剪到文字上 */}
        <h1 className="mb-2 bg-gradient-to-r from-primary to-purple bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          EngForge
        </h1>

        {/* 标语 */}
        <p className="mb-9 text-base text-gray-500">
          用 GitHub 的方式学英语 — 锻造你的写作能力
        </p>

        {/* 三个特性卡片 */}
        {/* features.map() = 遍历数组，每项生成一段 JSX */}
        {/* 花括号 {} 里写的是 JavaScript，React 会执行它并把结果放进去 */}
        <div className="mb-8 flex gap-4 text-left">
          {features.map((feature) => (
            // key 是 React 的要求：列表里每一项都要有唯一 key
            // React 用 key 来追踪哪一项变了，避免不必要的重新渲染
            <div key={feature.title} className="flex-1 rounded-lg bg-gray-50 p-4">

              {/* 图标方块 — 颜色来自数据 */}
              {/* 模板字符串 `...${feature.bg}` = 把动态类名拼进来 */}
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold ${feature.bg} ${feature.color}`}>
                {feature.icon}
              </div>

              <h4 className="mb-1 text-[13px] font-semibold">{feature.title}</h4>
              <p className="text-xs leading-relaxed text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* 两个按钮 */}
        {/* Link = Next.js 的导航组件，点击后切换路由，不会整页刷新 */}
        {/* href 指向目标路径，对应 App Router 里的文件夹 */}
        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            进入我的工坊
          </Link>
          <Link
            href="/editor"
            className="ml-3 rounded-lg border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-400"
          >
            快速写一篇
          </Link>
        </div>

      </div>
    </div>
  );
}
