"use client";

/**
 * DetailClient — 作文详情页客户端壳
 *
 * 管理状态：
 * - activeTab: 当前 Tab（内容 / 版本历史 / 批改记录）
 * - activeVersion: 当前展示的版本号
 *
 * 组合子组件：
 * - EssayActions: Fork / Star / 编辑 按钮
 * - VersionSwitcher: 版本 pill 按钮组
 * - VersionHistory: 版本历史时间线
 * - DetailSidebar: 右侧栏
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EssayActions } from "./EssayActions";
import { VersionSwitcher } from "./VersionSwitcher";
import { VersionHistory } from "./VersionHistory";
import { DetailSidebar } from "./DetailSidebar";
import { restoreVersion } from "@/lib/essay-actions";

type Tab = "content" | "history" | "reviews";

export interface VersionData {
  version_number: number;
  html: string;
  change_summary: string;
  created_at: string;
  word_count: number;
}

export interface MemberData {
  username: string;
  avatar_initials: string;
  role: string;
}

interface DetailClientProps {
  essay: {
    id: string;
    title: string;
    tags: string[];
    visibility: string;
    visibilityLabel: string;
    fork_count: number;
    star_count: number;
    current_version: number;
    latest_version: number;
    word_count: number;
    created_at: string;
    forked_from: string | null;
    forked_from_title: string | null;
  };
  author: {
    username: string;
    avatar_initials: string;
  };
  versions: VersionData[];
  isStarred: boolean;
  isOwner: boolean;
  canEdit: boolean;
  members: MemberData[];
  tagLabels: Record<string, string>;
}

export function DetailClient(props: DetailClientProps) {
  const { essay, author, versions, isStarred, isOwner, canEdit, members, tagLabels } = props;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [activeVersion, setActiveVersion] = useState(essay.current_version);
  const [restoring, setRestoring] = useState(false);

  // 当前版本数据
  const versionData = versions.find((v) => v.version_number === activeVersion);
  const isLatest = activeVersion === essay.latest_version;

  // 恢复版本
  async function handleRestore() {
    if (restoring || !canEdit) return;
    setRestoring(true);

    const result = await restoreVersion(essay.id, activeVersion);

    if (result.success) {
      toast.success("已恢复到 v" + activeVersion, {
        description: "正在刷新页面...",
      });
      router.refresh();
    } else {
      toast.error("恢复失败", {
        description: result.error ?? "未知错误",
      });
      setRestoring(false);
    }
  }

  // Tab 配置
  const tabs: { key: Tab; label: string }[] = [
    { key: "content", label: "内容" },
    { key: "history", label: `版本历史 (${versions.length})` },
    { key: "reviews", label: "批改记录" },
  ];

  return (
    <div className="px-8 py-6">
      {/* 面包屑 */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-primary">
          我的工坊
        </Link>
        <span>/</span>
        <span className="text-zinc-950">{essay.title}</span>
      </nav>

      {/* 头部：标题 + 标签 + 元信息 + 操作按钮 */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-zinc-950">{essay.title}</h1>

          {/* Fork 来源 */}
          {essay.forked_from && essay.forked_from_title && (
            <p className="mt-1 text-sm text-zinc-500">
              Fork 自{" "}
              <Link
                href={`/essays/${essay.forked_from}`}
                className="text-primary hover:underline"
              >
                {essay.forked_from_title}
              </Link>
            </p>
          )}

          {/* 标签 */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {essay.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
              >
                {tagLabels[tag as keyof typeof tagLabels] ?? tag}
              </span>
            ))}
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {essay.visibilityLabel}
            </span>
          </div>

          {/* 元信息 */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                {author.avatar_initials}
              </span>
              {author.username}
            </span>
            <span>{essay.created_at}</span>
            <span>{essay.word_count} 词</span>
            <span>当前 v{essay.current_version}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <EssayActions
          essayId={essay.id}
          isOwner={isOwner}
          isStarred={isStarred}
          canEdit={canEdit}
          starCount={essay.star_count}
        />
      </div>

      {/* 主体：两栏布局 */}
      <div className="flex gap-6">
        {/* 左栏：内容区 */}
        <div className="min-w-0 flex-1">
          {/* Tabs */}
          <div className="mb-4 flex gap-1 border-b border-zinc-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          {activeTab === "content" && (
            <div>
              {/* 版本切换器 */}
              {versions.length > 1 && (
                <div className="mb-4">
                  <VersionSwitcher
                    versions={versions}
                    activeVersion={activeVersion}
                    latestVersion={essay.latest_version}
                    onSwitch={setActiveVersion}
                  />
                  {/* 恢复按钮 */}
                  {canEdit && !isLatest && (
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={handleRestore}
                        disabled={restoring}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                      >
                        {restoring ? "恢复中..." : `恢复到 v${activeVersion}`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 作文内容 */}
              <div
                className="prose prose-sm max-w-none rounded-lg border border-zinc-200 bg-white p-6"
                dangerouslySetInnerHTML={{
                  __html: versionData?.html ?? "<p>版本内容不存在</p>",
                }}
              />
            </div>
          )}

          {activeTab === "history" && (
            <VersionHistory
              versions={versions}
              currentVersion={essay.current_version}
            />
          )}

          {activeTab === "reviews" && (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
              批改记录将在 Step 8 PR 系统中实现
            </div>
          )}
        </div>

        {/* 右栏：侧边栏 */}
        <div className="w-64 shrink-0">
          <DetailSidebar
            members={members}
            forkCount={essay.fork_count}
            starCount={essay.star_count}
            versionCount={versions.length}
            isOwner={isOwner}
            essayId={essay.id}
          />
        </div>
      </div>
    </div>
  );
}
