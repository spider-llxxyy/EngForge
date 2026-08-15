/**
 * PR 审阅页骨架屏
 */

export default function PrDetailLoading() {
  return (
    <div className="px-8 py-6">
      {/* 面包屑占位 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
        <span className="text-zinc-300">/</span>
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <span className="text-zinc-300">/</span>
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
      </div>

      {/* PR 头部占位 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-7 w-64 animate-pulse rounded bg-zinc-100" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>

      {/* Diff 区域占位 */}
      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="border-b border-zinc-200 px-4 py-2.5">
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="p-4">
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
