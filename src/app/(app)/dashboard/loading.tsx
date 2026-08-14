/**
 * Dashboard 骨架屏
 *
 * 路由切换到 /dashboard 时，Server Component 查询 Supabase 期间
 * 自动展示此骨架屏，避免白屏等待。
 * 布局结构和真实 Dashboard 对齐，减少内容加载后的布局跳动。
 */

export default function DashboardLoading() {
  return (
    <div className="max-w-[1200px] px-8 py-7">
      {/* Banner 占位 */}
      <div className="mb-6 h-[72px] animate-pulse rounded-xl bg-zinc-100" />

      {/* 问候语 + 统计卡占位 */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <div className="mb-2 h-8 w-48 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[88px] w-[140px] animate-pulse rounded-card bg-zinc-100"
            />
          ))}
        </div>
      </div>

      {/* 两栏布局 */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* 左栏 */}
        <div className="space-y-6">
          {/* EssayList 占位 */}
          <div className="overflow-hidden rounded-card bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="h-5 w-24 animate-pulse rounded bg-zinc-100" />
              <div className="h-7 w-16 animate-pulse rounded border border-zinc-200" />
            </div>
            <div className="py-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3.5 last:border-b-0"
                >
                  <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-zinc-200" />
                  <div className="flex-1">
                    <div className="mb-1 h-4 w-48 animate-pulse rounded bg-zinc-100" />
                    <div className="flex gap-3">
                      <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
                      <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
                      <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap 占位 */}
          <div className="overflow-hidden rounded-card bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="h-5 w-28 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="p-5">
              <div className="grid grid-cols-[repeat(26,minmax(0,1fr))] gap-[3px]">
                {Array.from({ length: 182 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-pulse rounded-sm bg-zinc-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：ActivityPanel 占位 */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-card bg-white shadow-card">
            <div className="border-b border-zinc-200 px-5 py-4">
              <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="flex flex-col items-center justify-center px-5 py-10">
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
          <div className="rounded-card bg-white p-5 shadow-card">
            <div className="mb-3 h-5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
