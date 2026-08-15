/**
 * Essay Server Actions
 *
 * 作文相关服务端操作：
 * 1. publishNewEssay — 新建作文 + 创建 v1 版本
 * 2. publishNewVersion — 编辑已有作文，创建新版本
 * 3. forkEssay — Fork 别人的作文到自己的工坊
 * 4. restoreVersion — 恢复到历史版本（创建新版本）
 * 5. toggleStar — 收藏 / 取消收藏
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

  // 2. 校验编辑权限（作者本人或 editor 成员）
  const access = await checkEssayAccess(supabase, params.essayId, user.id, "edit");
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  // 3. 更新 essay 元数据（标题、标签、可见性、词数）
  // 注意：essays 表 RLS 只允许作者 UPDATE，editor 成员更新元数据会被
  // 静默跳过（版本内容仍由 RPC 正常创建）— 已记录在 TECH_DEBT.md。
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

// ──────────────────────────────────────────────
// Fork + 版本恢复 + 收藏
// ──────────────────────────────────────────────

/** Fork 操作的结果 */
interface ForkResult {
  success: boolean;
  error?: string;
  newEssayId?: string;
}

/** 收藏操作的结果 */
interface StarResult {
  success: boolean;
  error?: string;
  starred?: boolean;
}

// ──────────────────────────────────────────────
// 应用层权限校验
// ──────────────────────────────────────────────

/**
 * 校验当前用户对某篇作文的访问权限。
 *
 * 为什么 RLS 之外还要应用层校验？
 * 1. stars 表的 RLS 只校验 user_id = auth.uid()，
 *    不校验目标作文是否可见 — 不加这层校验，
 *    任何登录用户都能收藏一篇自己看不见的私密作文。
 * 2. RLS 拒绝时 Supabase 往往静默返回空结果而非报错，
 *    应用层校验能把失败转成明确的中文错误返回给前端 toast。
 *
 * view：作者本人 / essay_members 任意角色 / visibility = public
 * edit：作者本人 / essay_members 的 owner、editor 角色
 */
async function checkEssayAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  essayId: string,
  userId: string,
  mode: "view" | "edit"
): Promise<{ ok: true } | { ok: false; error: string }> {
  // 查作文基础信息（RLS 闸口：查不到 = 不存在或不可见）
  const essayResult = await supabase
    .from("essays")
    .select("id, author_id, visibility")
    .eq("id", essayId)
    .single();
  const essay = (essayResult.data ?? null) as {
    id: string;
    author_id: string;
    visibility: string;
  } | null;

  if (!essay) {
    return { ok: false, error: "作文不存在或无权访问" };
  }

  // 作者本人拥有全部权限
  if (essay.author_id === userId) {
    return { ok: true };
  }

  // 查成员身份（members_select_participant 策略允许成员查看自己的记录）
  const memberResult = await supabase
    .from("essay_members")
    .select("role")
    .eq("essay_id", essayId)
    .eq("user_id", userId)
    .maybeSingle();
  const membership = (memberResult.data ?? null) as { role: string } | null;

  if (mode === "view") {
    // 公开作文任何人可见；协作者任意角色可见
    if (essay.visibility === "public" || membership) {
      return { ok: true };
    }
    return { ok: false, error: "这篇作文是私密的，你没有访问权限" };
  }

  // edit 模式：需要 owner 或 editor 角色
  if (membership && (membership.role === "owner" || membership.role === "editor")) {
    return { ok: true };
  }
  return { ok: false, error: "需要作者本人或 editor 成员权限" };
}

/**
 * Fork 作文
 *
 * 流程：
 * 1. 验证登录
 * 2. 查询原作文 + 当前版本内容
 * 3. INSERT 新 essay（forked_from = 原 id，复制标题/标签/可见性）
 * 4. RPC create_essay_version（复制原作文当前版本的内容）
 * 5. INSERT notification（通知原作者被 Fork）
 * 6. 返回新 essay id → 前端跳转
 */
export async function forkEssay(essayId: string): Promise<ForkResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const supabase = await createClient();

  // 查询原作文（essays 表 RLS 已闸口：作者/成员/公开可见才查得到，
  // 私密作文直接返回 null → 报"不存在或无权访问"，无需重复校验）
  const essayResult = await supabase
    .from("essays")
    .select("id, title, tags, visibility, current_version, author_id")
    .eq("id", essayId)
    .single();
  const essay = (essayResult.data ?? null) as {
    id: string;
    title: string;
    tags: string[];
    visibility: EssayVisibility;
    current_version: number;
    author_id: string;
  } | null;
  const essayError = essayResult.error as { message?: string } | null;

  if (essayError || !essay) {
    return { success: false, error: "原作文不存在或无权访问" };
  }

  // 查询当前版本内容
  const versionResult = await supabase
    .from("essay_versions")
    .select("content, plain_text, word_count")
    .eq("essay_id", essayId)
    .eq("version_number", essay.current_version)
    .single();
  const version = (versionResult.data ?? null) as {
    content: Json;
    plain_text: string;
    word_count: number;
  } | null;
  const versionError = versionResult.error as { message?: string } | null;

  if (versionError || !version) {
    return { success: false, error: "获取原作文版本失败" };
  }

  // INSERT 新 essay（触发器 handle_fork_created 自动 fork_count + 1）
  const insertResult = await supabase
    .from("essays")
    .insert({
      author_id: user.id,
      title: essay.title,
      tags: essay.tags,
      visibility: essay.visibility,
      forked_from: essay.id,
      word_count: version.word_count,
    } as never)
    .select("id")
    .single();
  const newEssay = (insertResult.data ?? null) as { id: string } | null;
  const insertError = insertResult.error as { message?: string } | null;

  if (insertError || !newEssay) {
    return {
      success: false,
      error: "Fork 失败：" + (insertError?.message ?? "未知错误"),
    };
  }

  // 创建 v1 版本（复制原作文内容）
  const rpcResult = await supabase.rpc("create_essay_version", {
    p_essay_id: newEssay.id,
    p_content: version.content,
    p_plain_text: version.plain_text,
    p_word_count: version.word_count,
    p_change_summary: `Fork 自原作文 v${essay.current_version}`,
  } as never);
  const rpcError = rpcResult.error as { message?: string } | null;

  if (rpcError) {
    // 版本创建失败，清理已创建的 essay
    await supabase.from("essays").delete().eq("id", newEssay.id);
    return { success: false, error: "Fork 版本创建失败：" + rpcError.message };
  }

  // 通知原作者被 Fork（不阻塞主流程）
  if (essay.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: essay.author_id,
      type: "fork",
      title: "你的作文被 Fork 了",
      content: `${user.username} Fork 了你的作文「${essay.title}」`,
      link_url: `/essays/${newEssay.id}`,
    } as never).then(() => {});
  }

  return { success: true, newEssayId: newEssay.id };
}

/**
 * 恢复到历史版本
 *
 * 取指定版本的 content，用 create_essay_version 创建一个新版本。
 * 不删除历史版本——所有版本都是不可变的。
 */
export async function restoreVersion(
  essayId: string,
  versionNumber: number
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const supabase = await createClient();

  // 校验编辑权限（作者本人或 editor 成员）
  const access = await checkEssayAccess(supabase, essayId, user.id, "edit");
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  // 查询目标版本内容
  const versionResult = await supabase
    .from("essay_versions")
    .select("content, plain_text, word_count")
    .eq("essay_id", essayId)
    .eq("version_number", versionNumber)
    .single();
  const version = (versionResult.data ?? null) as {
    content: Json;
    plain_text: string;
    word_count: number;
  } | null;
  const versionError = versionResult.error as { message?: string } | null;

  if (versionError || !version) {
    return { success: false, error: "目标版本不存在" };
  }

  // 用旧内容创建新版本
  const rpcResult = await supabase.rpc("create_essay_version", {
    p_essay_id: essayId,
    p_content: version.content,
    p_plain_text: version.plain_text,
    p_word_count: version.word_count,
    p_change_summary: `恢复到 v${versionNumber}`,
  } as never);
  const versionId = (rpcResult.data ?? null) as string | null;
  const rpcError = rpcResult.error as { message?: string } | null;

  if (rpcError || !versionId) {
    return {
      success: false,
      error: "恢复失败：" + (rpcError?.message ?? "未知错误"),
    };
  }

  // 同步 essays.word_count
  await supabase
    .from("essays")
    .update({ word_count: version.word_count } as never)
    .eq("id", essayId);

  return { success: true, essayId, versionId };
}

/**
 * 收藏 / 取消收藏作文
 *
 * 检查 stars 表是否已有记录：
 * - 有 → DELETE，返回 starred: false
 * - 无 → INSERT，返回 starred: true + 通知作者
 */
export async function toggleStar(essayId: string): Promise<StarResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const supabase = await createClient();

  // 校验查看权限（防止收藏一篇自己看不见的私密作文 —
  // stars 表 RLS 只校验 user_id，目标作文可见性必须在这里闸口）
  const access = await checkEssayAccess(supabase, essayId, user.id, "view");
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  // 检查是否已收藏
  const checkResult = await supabase
    .from("stars")
    .select("id")
    .eq("user_id", user.id)
    .eq("essay_id", essayId)
    .maybeSingle();
  const existing = (checkResult.data ?? null) as { id: string } | null;
  const checkError = checkResult.error as { message?: string } | null;

  if (checkError) {
    return { success: false, error: "操作失败：" + checkError.message };
  }

  if (existing) {
    // 已收藏 → 取消收藏
    const deleteResult = await supabase
      .from("stars")
      .delete()
      .eq("id", existing.id);
    const deleteError = deleteResult.error as { message?: string } | null;

    if (deleteError) {
      return { success: false, error: "取消收藏失败：" + deleteError.message };
    }

    return { success: true, starred: false };
  }

  // 未收藏 → 添加收藏
  const insertResult = await supabase
    .from("stars")
    .insert({
      user_id: user.id,
      essay_id: essayId,
    } as never);
  const insertError = insertResult.error as { message?: string } | null;

  if (insertError) {
    return { success: false, error: "收藏失败：" + insertError.message };
  }

  // 通知作文作者被收藏（不阻塞主流程）
  const essayResult = await supabase
    .from("essays")
    .select("author_id, title")
    .eq("id", essayId)
    .single();
  const essay = (essayResult.data ?? null) as {
    author_id: string;
    title: string;
  } | null;

  if (essay && essay.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: essay.author_id,
      type: "star",
      title: "你的作文被收藏了",
      content: `${user.username} 收藏了你的作文「${essay.title}」`,
      link_url: `/essays/${essayId}`,
    } as never).then(() => {});
  }

  return { success: true, starred: true };
}
