/**
 * ActivityPanel — 最近活动 + 学习目标
 *
 * Phase 1 阶段活动数据尚未接入，显示空状态占位。
 * Phase 2 接入 notifications 表后替换为真实数据。
 */

export function ActivityPanel() {
  return (
    <div className="space-y-4">
      {/* 最近活动 */}
      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-[15px] font-semibold text-zinc-950">最近活动</h3>
        </div>
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-sm text-zinc-400">暂无活动</p>
          <p className="mt-1 text-xs text-zinc-300">
            发布作文、收到批改后会显示在这里
          </p>
        </div>
      </div>

      {/* 学习目标 */}
      <div className="rounded-card bg-white p-5 shadow-card">
        <h4 className="mb-3 text-[13px] font-semibold text-zinc-700">
          学习目标
        </h4>
        <p className="text-[13px] text-zinc-400">即将上线</p>
      </div>
    </div>
  );
}
