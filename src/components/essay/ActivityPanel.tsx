/**
 * ============================================
 * ActivityPanel — 最近活动 + 学习目标
 * ============================================
 * 右栏两个面板组合在一起：
 * 1. "最近活动" — 5 条时间线，每条有加粗的人名或动作名
 * 2. "学习目标" — 进度条显示本周目标完成情况
 *
 * 设计来源：原型 EngForge_原型.html 的 .panel（活动）+ .sidebar-card（目标）
 *
 * 为什么把两个面板放在一个文件里？
 * — 它们都在 Dashboard 右栏，体积都不大，拆成两个文件反而碎片化。
 *   内部用子组件分隔，page.tsx 只需 import 一个 ActivityPanel。
 *
 * 为什么是服务端组件？
 * — 数据是静态数组，不需要交互。活动文字的"加粗"由数据里的 bold 标记决定，
 *   不是用户点击产生的，所以不需要客户端状态。
 */

import {
  activities,
  learningGoal,
  type Activity,
} from "@/lib/dashboard-data";

/* ============================================================
 * 子组件：ActivityItem — 单条活动记录
 * ============================================================
 * 每条活动由若干"片段"(segments) 组成。
 * 有的片段 bold: true（如人名"王同学"），需要加粗显示；
 * 有的 bold: false（如" 向你的作文发起了 PR 批改"），正常字重。
 *
 * 为什么用 segments 数组而不是直接写 HTML 字符串？
 * — 数据驱动：加粗信息存在数据里，渲染时由代码决定 <strong> 还是 <span>。
 *   以后数据从数据库来时，不需要改组件代码。
 */

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="border-b border-gray-100 px-5 py-3 last:border-b-0">
      {/*
       * 活动文字 — 遍历 segments，bold 的用 <strong> + font-medium
       *
       * 为什么用 <strong> 标签而不是 <span className="font-medium">？
       * — <strong> 有语义意义（强调），对屏幕阅读器和 SEO 友好。
       *   原型也用的 <strong>，保持一致。
       * — font-medium 对应 CSS font-weight: 500（原型 .activity-text strong 样式）
       */}
      <p className="text-[13px] leading-relaxed text-gray-700">
        {activity.segments.map((segment, i) =>
          segment.bold ? (
            <strong key={i} className="font-medium">
              {segment.text}
            </strong>
          ) : (
            <span key={i}>{segment.text}</span>
          )
        )}
      </p>

      {/* 时间 — 灰色小字，对应原型 .activity-time */}
      <p className="mt-0.5 text-[11px] text-gray-400">{activity.time}</p>
    </div>
  );
}

/* ============================================================
 * 子组件：LearningGoalCard — 学习目标进度卡
 * ============================================================
 * 一个小卡片：标题 + 描述 + 进度条 + 进度文字。
 *
 * 进度条实现原理：
 * — 外层 div: 灰色背景容器，固定高度 8px，圆角，overflow:hidden
 * — 内层 div: 蓝色填充条，高度 100%，宽度由百分比控制
 * — 宽度用 inline style 而不是 Tailwind 类，因为百分比是动态计算的
 *   （Tailwind 的 w-67% 不是预设值，需要方括号语法 w-[67%]，
 *    但用 style 更清晰，也避免了 Tailwind JIT 的不确定性）
 */

function LearningGoalCard() {
  const { description, current, total } = learningGoal;

  // 计算进度百分比：2/3 = 66.67%，四舍五入到整数
  // 原型写死 width:67%，这里动态计算保持一致
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-[18px] shadow-sm">
      {/* 卡片标题 — 比面板标题小一号，对应原型 .sidebar-card h4 */}
      <h4 className="mb-3 text-[13px] font-semibold text-gray-700">
        学习目标
      </h4>

      {/* 目标描述 — 灰色 13px，对应原型 inline style */}
      <p className="mb-3 text-[13px] text-gray-600">{description}</p>

      {/*
       * 进度条容器
       * — h-2 = 8px 高度（对应原型 height:8px）
       * — rounded-md = 6px 圆角（Tailwind 的 rounded-md = 0.375rem = 6px）
       * — bg-gray-100 = 灰色轨道背景
       * — overflow-hidden = 超出部分裁剪（填充条圆角由容器裁出）
       */}
      <div className="h-2 overflow-hidden rounded-md bg-gray-100">
        {/*
         * 进度条填充
         * — bg-primary = 蓝色（来自 @theme 定义的 --color-primary）
         * — h-full = 填满容器高度
         * — rounded-md = 圆角（和容器一致）
         * — transition-all = 宽度变化时有过渡动画（以后数据更新时好看）
         * — style={{ width: `${percentage}%` }} = 动态宽度
         */}
        <div
          className="h-full rounded-md bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 进度文字 — "已完成 2/3 篇" */}
      <p className="mt-1.5 text-xs text-gray-500">
        已完成 {current}/{total} 篇
      </p>
    </div>
  );
}

/* ============================================================
 * 父组件：ActivityPanel — 右栏整体
 * ============================================================
 * 用 space-y-4（16px 间距）包裹两个子面板，
 * 对应原型 .sidebar-card 的 margin-bottom: 16px。
 */

export function ActivityPanel() {
  return (
    <div className="space-y-4">
      {/* ===== 第一块：最近活动面板 ===== */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* 面板头部 — 只有标题，没有副标题或按钮 */}
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-[15px] font-semibold text-gray-800">最近活动</h3>
        </div>

        {/* 活动列表 — 遍历 activities 数组 */}
        <div>
          {activities.map((activity, index) => (
            <ActivityItem
              key={index}
              activity={activity}
            />
          ))}
        </div>
      </div>

      {/* ===== 第二块：学习目标卡片 ===== */}
      <LearningGoalCard />
    </div>
  );
}
