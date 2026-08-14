"use client";

/**
 * VersionSwitcher — 版本 pill 按钮组
 *
 * 显示 v1 v2 v3 ... pill 按钮，点击切换当前展示的版本。
 * 当前版本高亮，最新版本带标记。
 */

import type { VersionData } from "./DetailClient";

interface VersionSwitcherProps {
  versions: VersionData[];
  activeVersion: number;
  latestVersion: number;
  onSwitch: (version: number) => void;
}

export function VersionSwitcher({
  versions,
  activeVersion,
  latestVersion,
  onSwitch,
}: VersionSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-zinc-500">版本：</span>
      {versions.map((v) => {
        const isActive = v.version_number === activeVersion;
        const isLatest = v.version_number === latestVersion;

        return (
          <button
            key={v.version_number}
            onClick={() => onSwitch(v.version_number)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            v{v.version_number}
            {isLatest && (
              <span
                className={`ml-1 ${isActive ? "text-primary-light" : "text-green"}`}
              >
                *
              </span>
            )}
          </button>
        );
      })}
      <span className="text-xs text-zinc-400">* 最新</span>
    </div>
  );
}
