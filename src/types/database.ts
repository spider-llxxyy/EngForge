/**
 * Database Types — Supabase 类型安全查询的基础
 *
 * 这个文件镜像了 supabase/migrations/0001_initial_schema.sql 中的表结构。
 * Supabase 客户端使用这些类型做编译时检查：
 *   const { data } = await supabase.from('essays').select('*')
 *   // data 的类型自动推导为 Database['public']['Tables']['essays']['Row']
 */

// TipTap 编辑器输出的 JSON 类型
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          avatar_initials: string
          bio: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string
          avatar_url?: string | null
          avatar_initials?: string
          bio?: string
        }
        Update: {
          email?: string
          username?: string
          avatar_url?: string | null
          avatar_initials?: string
          bio?: string
        }
      }

      essays: {
        Row: {
          id: string
          author_id: string
          title: string
          tags: string[]
          visibility: 'private' | 'invite' | 'public'
          forked_from: string | null
          fork_count: number
          star_count: number
          current_version: number
          latest_version: number
          word_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          tags?: string[]
          visibility?: 'private' | 'invite' | 'public'
          forked_from?: string | null
          fork_count?: number
          star_count?: number
          current_version?: number
          latest_version?: number
          word_count?: number
        }
        Update: {
          title?: string
          tags?: string[]
          visibility?: 'private' | 'invite' | 'public'
          forked_from?: string | null
          current_version?: number
          latest_version?: number
          word_count?: number
        }
      }

      essay_versions: {
        Row: {
          id: string
          essay_id: string
          version_number: number
          content: Json
          plain_text: string
          change_summary: string
          word_count: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          essay_id: string
          version_number: number
          content: Json
          plain_text?: string
          change_summary?: string
          word_count?: number
          created_by: string
        }
        Update: {
          change_summary?: string
        }
      }

      essay_members: {
        Row: {
          id: string
          essay_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          essay_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
        }
        Update: {
          role?: 'owner' | 'editor' | 'viewer'
        }
      }

      pull_requests: {
        Row: {
          id: string
          essay_id: string
          base_version_id: string
          head_version_id: string
          title: string
          description: string
          diff_text: string
          status: 'open' | 'merged' | 'closed'
          created_by: string
          merged_by: string | null
          created_at: string
          merged_at: string | null
        }
        Insert: {
          id?: string
          essay_id: string
          base_version_id: string
          head_version_id: string
          title: string
          description?: string
          diff_text?: string
          status?: 'open' | 'merged' | 'closed'
          created_by: string
        }
        Update: {
          title?: string
          description?: string
          diff_text?: string
          status?: 'open' | 'merged' | 'closed'
          merged_by?: string | null
          merged_at?: string | null
        }
      }

      invitations: {
        Row: {
          id: string
          code: string
          essay_id: string | null
          created_by: string
          max_uses: number | null
          used_count: number
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          essay_id?: string | null
          created_by: string
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
        }
        Update: {
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
        }
      }

      notifications: {
        Row: {
          id: string
          user_id: string
          type:
            | 'pr_received'
            | 'pr_merged'
            | 'pr_closed'
            | 'fork'
            | 'star'
            | 'invite'
            | 'member_joined'
          title: string
          content: string
          link_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: Database['public']['Tables']['notifications']['Row']['type']
          title: string
          content?: string
          link_url?: string | null
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }

      stars: {
        Row: {
          id: string
          user_id: string
          essay_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          essay_id: string
        }
        Update: Record<string, never>
      }
    }

    Views: Record<string, never>

    Functions: {
      create_essay_version: {
        Args: {
          p_essay_id: string
          p_content: Json
          p_plain_text: string
          p_word_count: number
          p_change_summary?: string
        }
        Returns: string // version UUID
      }
      merge_pull_request: {
        Args: { p_pr_id: string }
        Returns: string // new version UUID
      }
      use_invitation: {
        Args: { p_code: string }
        Returns: Json
      }
      generate_invite_code: {
        Args: {
          p_essay_id: string
          p_max_uses?: number | null
          p_expires_days?: number | null
        }
        Returns: string // invite code
      }
    }

    Enums: {
      essay_visibility: 'private' | 'invite' | 'public'
      pr_status: 'open' | 'merged' | 'closed'
      notification_type:
        | 'pr_received'
        | 'pr_merged'
        | 'pr_closed'
        | 'fork'
        | 'star'
        | 'invite'
        | 'member_joined'
    }
  }
}

// Default export for Supabase client generic
export default Database
