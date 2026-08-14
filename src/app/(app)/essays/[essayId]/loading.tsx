/**
 * 详情页骨架屏
 *
 * 路由切换到 /essays/[essayId] 时，Server Component 查询 Supabase 期间
 * 自动展示此骨架屏。布局和真实 DetailClient 对齐。
 */

export default function EssayDetailLoading() {
  return (
    <div className="px-8 py-6">
      {/* 面包屑占位 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
        <span className="text-zinc-300">/</span>
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
      </div>

      {/* 头部：标题 + 元信息 + 操作按钮 */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-7 w-64 animate-pulse rounded bg-zinc-100" />
          {/* 标签占位 */}
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
          </div>
          {/* 元信息占位 */}
          <div className="mt-3 flex items-center gap-4">
            <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
        {/* 操作按钮占位 */}
        <div className="flex gap-2">
          <div className="h-9 w-16 animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-zinc-100" />
        </div>
      </div>

      {/* 主体：两栏布局 */}
      <div className="flex gap-6">
        {/* 左栏：内容区 */}
        <div className="min-w-0 flex-1">
          {/* Tabs 占位 */}
          <div className="mb-4 flex gap-1 border-b border-zinc-200">
            <div className="h-9 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="h-9 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="h-9 w-20 animate-pulse rounded bg-zinc-100" />
          </div>

          {/* 内容区域占位 */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="space-y-4">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        </div>

        {/* 右栏：侧边栏占位 */}
        <div className="w-64 shrink-0 space-y-4">
          {/* 协作者卡片 */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-3 h-5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          </div>
          {/* 数据统计卡片 */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-3 h-5 w-12 animate-pulse rounded bg-zinc-100" />
            <div className="grid grid-cols-3 gap-2 text-center">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="mx-auto mb-1 h-6 w-8 animate-pulse rounded bg-zinc-100" />
                  <div className="mx-auto h-3 w-10 animate-pulse rounded bg-zinc-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
