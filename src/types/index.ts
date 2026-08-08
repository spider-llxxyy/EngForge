/**
 * 核心类型定义
 *
 * TypeScript 的类型（Type）= 数据的形状描述。
 * 定义类型就像画蓝图——告诉编译器"一个作文长什么样"，
 * 以后你写代码操作作文时，编译器会检查你有没有写错字段名。
 *
 * 这些类型对应 Supabase 数据库里的表结构。
 * 开发时先定义类型，再建数据库表，这样代码和数据库保持一致。
 */

/** 用户 */
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

/** 作文 */
export interface Essay {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: EssayTag[];
  fork_count: number;
  star_count: number;
  current_version: number;
  latest_version: number;
  created_at: string;
  updated_at: string;
}

/** 作文标签（考研 / 高考 / CET-4 等） */
export type EssayTag = "kaoyan" | "gaokao" | "cet4" | "cet6" | "other";

/** 作文版本 */
export interface EssayVersion {
  id: string;
  essay_id: string;
  version_number: number;
  content: string;
  change_summary: string;
  created_by: string;
  created_at: string;
}

/** Pull Request（拉取请求） */
export type PRStatus = "open" | "merged" | "closed";

export interface PullRequest {
  id: string;
  from_essay_id: string;
  to_essay_id: string;
  title: string;
  description: string;
  status: PRStatus;
  created_by: string;
  merged_by: string | null;
  created_at: string;
  merged_at: string | null;
}

/** 通知 */
export type NotificationType = "pr_received" | "pr_merged" | "fork" | "star" | "invite";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
}

/** 邀请码 */
export interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  created_at: string;
  used_at: string | null;
}
