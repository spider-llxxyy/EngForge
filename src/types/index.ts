/**
 * 核心类型定义
 *
 * 这些类型镜像 src/types/database.ts 中的数据库表结构，
 * 供 UI 组件直接使用。database.ts 是 Supabase 客户端查询的底层类型，
 * 此文件是业务层的便捷别名 + UI 专用类型。
 */

// ──────────────────────────────────────────────
// 枚举类型（对应数据库 ENUM）
// ──────────────────────────────────────────────

export type EssayVisibility = 'private' | 'invite' | 'public'
export type PRStatus = 'open' | 'merged' | 'closed'
export type EssayMemberRole = 'owner' | 'editor' | 'viewer'
export type NotificationType =
  | 'pr_received'
  | 'pr_merged'
  | 'pr_closed'
  | 'fork'
  | 'star'
  | 'invite'
  | 'member_joined'

// 前端展示用的作文标签
export type EssayTag = 'kaoyan' | 'gaokao' | 'cet4' | 'cet6' | 'other'

// ──────────────────────────────────────────────
// 表行类型（对应数据库 Row）
// ──────────────────────────────────────────────

/** 用户 — profiles 表 */
export interface Profile {
  id: string
  email: string
  username: string
  avatar_url: string | null
  avatar_initials: string
  bio: string
  created_at: string
  updated_at: string
}

/** 作文 — essays 表 */
export interface Essay {
  id: string
  author_id: string
  title: string
  tags: string[]
  visibility: EssayVisibility
  forked_from: string | null
  fork_count: number
  star_count: number
  current_version: number
  latest_version: number
  word_count: number
  created_at: string
  updated_at: string
}

/** 作文版本 — essay_versions 表 */
export interface EssayVersion {
  id: string
  essay_id: string
  version_number: number
  content: unknown // TipTap JSON（具体结构由编辑器定义）
  plain_text: string
  change_summary: string
  word_count: number
  created_by: string
  created_at: string
}

/** 作文协作者 — essay_members 表 */
export interface EssayMember {
  id: string
  essay_id: string
  user_id: string
  role: EssayMemberRole
  created_at: string
}

/** Pull Request — pull_requests 表 */
export interface PullRequest {
  id: string
  essay_id: string
  base_version_id: string
  head_version_id: string
  title: string
  description: string
  diff_text: string
  status: PRStatus
  created_by: string
  merged_by: string | null
  created_at: string
  merged_at: string | null
}

/** 邀请码 — invitations 表 */
export interface Invitation {
  id: string
  code: string
  essay_id: string | null
  created_by: string
  max_uses: number | null
  used_count: number
  expires_at: string | null
  created_at: string
}

/** 通知 — notifications 表 */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string
  link_url: string | null
  is_read: boolean
  created_at: string
}

/** 收藏 — stars 表 */
export interface Star {
  id: string
  user_id: string
  essay_id: string
  created_at: string
}

// ──────────────────────────────────────────────
// UI 专用类型（带 JOIN 数据，不在数据库表中）
// ──────────────────────────────────────────────

/** 作文列表项（带作者信息，用于 Dashboard 和广场） */
export interface EssayWithAuthor extends Essay {
  author?: Pick<Profile, 'id' | 'username' | 'avatar_initials'>
  is_starred_by_me?: boolean
}

/** PR 列表项（带创建者信息） */
export interface PullRequestWithCreator extends PullRequest {
  creator?: Pick<Profile, 'id' | 'username' | 'avatar_initials'>
  essay_title?: string
}

/** 通知列表项（预留扩展：未来可加 actor 信息） */
export type NotificationItem = Notification & {
  actor?: Pick<Profile, 'id' | 'username' | 'avatar_initials'>
}

// ──────────────────────────────────────────────
// 保留的旧类型别名（向后兼容 dashboard-data.ts）
// ──────────────────────────────────────────────

/** @deprecated 使用 Profile 代替 */
export type User = Profile
