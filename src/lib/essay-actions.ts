/**
 * Essay Server Actions
 *
 * 发布作文的两个核心操作：
 * 1. publishNewEssay — 新建作文 + 创建 v1 版本
 * 2. publishNewVersion — 编辑已有作文，创建新版本
 *
 * "use server" 声明：这个文件中的函数都在服务端执行，
 * 客户端组件可以像调用普通函数一样调用它们，
 * Next.js 自动处理网络请求和参数序列化。
 *
 * 注意：@supabase/ssr 的类型推断在 insert() / rpc() 链上
 * 退化为 never/undefined，用 `as never` + 结果断言绕过。
 * 与 auth.ts 中 maybeSingle() 的处理方式一致。
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { Database } from "@/types/database";
import type { Json } from "@/types/database";

// ──────────────────────────────────────────────
// 类型定义
// ──────────────────────────────────────────────

type EssayVisibility = Database["public"]["Tables"]["essays"]["Insert"]["visibility"];

/** 发布操作的结果 */
interface ActionResult {
  success: boolean;
  error?: string;
  essayId?: string;
  versionId?: string;
}

// ──────────────────────────────────────────────
// Server Actions
// ──────────────────────────────────────────────

/**
 * 发布新作文
 *
 * 流程：
 * 1. 验证登录状态
 * 2. INSERT essays 记录（触发器自动添加作者为 owner 成员）
 * 3. RPC create_essay_version 创建 v1 版本
 * 4. 返回 essayId，客户端跳转到 Dashboard
 */
export async function publishNewEssay(params: {
  title: string;
  tags: string[];
  visibility: EssayVisibility;
  content: Json;
  plainText: string;
  wordCount: number;
  changeSummary?: string;
}): Promise<ActionResult> {
  // 1. 验证登录
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const supabase = await createClient();

  // 2. 插入 essay 记录
  const insertResult = await supabase
    .from("essays")
    .insert({
      author_id: user.id,
      title: params.title.trim(),
      tags: params.tags,
      visibility: params.visibility,
      word_count: params.wordCount,
    } as never)
    .select("id")
    .single();
  const essay = (insertResult.data ?? null) as { id: string } | null;
  const essayError = insertResult.error as { message?: string } | null;

  if (essayError || !essay) {
    return {
      success: false,
      error: "创建作文失败：" + (essayError?.message ?? "未知错误"),
    };
  }

  // 3. 创建 v1 版本
  const rpcResult = await supabase.rpc("create_essay_version", {
    p_essay_id: essay.id,
    p_content: params.content,
    p_plain_text: params.plainText,
    p_word_count: params.wordCount,
    p_change_summary: params.changeSummary || "初始版本",
  } as never);
  const versionId = (rpcResult.data ?? null) as string | null;
  const versionError = rpcResult.error as { message?: string } | null;

  if (versionError || !versionId) {
    // 版本创建失败，清理已创建的 essay（触发器会级联删除）
    await supabase.from("essays").delete().eq("id", essay.id);
    return {
      success: false,
      error: "创建版本失败：" + (versionError?.message ?? "未知错误"),
    };
  }

  return {
    success: true,
    essayId: essay.id,
    versionId,
  };
}

/**
 * 发布新版本（编辑已有作文）
 *
 * 流程：
 * 1. 验证登录
 * 2. UPDATE essays 表的 title / tags / visibility / word_count
 * 3. RPC create_essay_version 创建新版本（RPC 内部验证权限）
 * 4. 返回 versionId
 */
export async function publishNewVersion(params: {
  essayId: string;
  title: string;
  tags: string[];
  visibility: EssayVisibility;
  content: Json;
  plainText: string;
  wordCount: number;
  changeSummary?: string;
}): Promise<ActionResult> {
  // 1. 验证登录
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const supabase = await createClient();

  // 2. 更新 essay 元数据（标题、标签、可见性、词数）
  const updateResult = await supabase
    .from("essays")
    .update({
      title: params.title.trim(),
      tags: params.tags,
      visibility: params.visibility,
      word_count: params.wordCount,
    } as never)
    .eq("id", params.essayId);

  const updateError = updateResult.error as { message?: string } | null;
  if (updateError) {
    return {
      success: false,
      error: "更新作文信息失败：" + updateError.message,
    };
  }

  // 3. 创建新版本
  const rpcResult = await supabase.rpc("create_essay_version", {
    p_essay_id: params.essayId,
    p_content: params.content,
    p_plain_text: params.plainText,
    p_word_count: params.wordCount,
    p_change_summary: params.changeSummary || "修改更新",
  } as never);
  const versionId = (rpcResult.data ?? null) as string | null;
  const versionError = rpcResult.error as { message?: string } | null;

  if (versionError || !versionId) {
    return {
      success: false,
      error: "发布新版本失败：" + (versionError?.message ?? "未知错误"),
    };
  }

  return {
    success: true,
    essayId: params.essayId,
    versionId,
  };
}
