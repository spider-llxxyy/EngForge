-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  EngForge — 0002: Fix RLS infinite recursion                          ║
-- ║  Run in Supabase SQL Editor (one block)                               ║
-- ║                                                                        ║
-- ║  Problem: essays ↔ essay_members policies reference each other,       ║
-- ║  causing "infinite recursion detected in policy for relation essays". ║
-- ║  Fix: extract cross-table checks into SECURITY DEFINER helper         ║
-- ║  functions (bypass RLS), and rewrite policies to call them.           ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────
-- 1. Helper functions (SECURITY DEFINER → bypass RLS, no recursion)
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_essay_member(p_essay_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.essay_members
    WHERE essay_id = p_essay_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_essay_editor(p_essay_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.essay_members
    WHERE essay_id = p_essay_id AND user_id = p_user_id
      AND role IN ('owner', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_essay_owner(p_essay_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.essays
    WHERE id = p_essay_id AND author_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_essay(p_essay_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.essays e
    WHERE e.id = p_essay_id
      AND (
        e.author_id = p_user_id
        OR e.visibility = 'public'
        OR public.is_essay_member(e.id, p_user_id)
      )
  );
$$;

-- ──────────────────────────────────────────────────────────────────────
-- 2. Rewrite the mutually-recursive policies
-- ──────────────────────────────────────────────────────────────────────

-- 2.1 essays
DROP POLICY IF EXISTS "essays_select_member" ON public.essays;
CREATE POLICY "essays_select_member"
  ON public.essays FOR SELECT
  USING (public.is_essay_member(id, auth.uid()));

-- 2.2 essay_versions (was: nested essays → members → essays)
DROP POLICY IF EXISTS "versions_select_accessible" ON public.essay_versions;
CREATE POLICY "versions_select_accessible"
  ON public.essay_versions FOR SELECT
  USING (public.can_view_essay(essay_id, auth.uid()));

DROP POLICY IF EXISTS "versions_insert_member" ON public.essay_versions;
CREATE POLICY "versions_insert_member"
  ON public.essay_versions FOR INSERT
  WITH CHECK (public.is_essay_editor(essay_id, auth.uid()));

-- 2.3 essay_members (was: essays → back into essays policies)
DROP POLICY IF EXISTS "members_select_participant" ON public.essay_members;
CREATE POLICY "members_select_participant"
  ON public.essay_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_essay_owner(essay_id, auth.uid())
  );

DROP POLICY IF EXISTS "members_insert_owner" ON public.essay_members;
CREATE POLICY "members_insert_owner"
  ON public.essay_members FOR INSERT
  WITH CHECK (public.is_essay_owner(essay_id, auth.uid()));

DROP POLICY IF EXISTS "members_delete_owner" ON public.essay_members;
CREATE POLICY "members_delete_owner"
  ON public.essay_members FOR DELETE
  USING (public.is_essay_owner(essay_id, auth.uid()));

-- 2.4 pull_requests (was: members → essays → members)
DROP POLICY IF EXISTS "prs_select_participant" ON public.pull_requests;
CREATE POLICY "prs_select_participant"
  ON public.pull_requests FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.is_essay_member(essay_id, auth.uid())
  );

DROP POLICY IF EXISTS "prs_insert_member" ON public.pull_requests;
CREATE POLICY "prs_insert_member"
  ON public.pull_requests FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_essay_member(essay_id, auth.uid())
  );

DROP POLICY IF EXISTS "prs_update_owner_or_creator" ON public.pull_requests;
CREATE POLICY "prs_update_owner_or_creator"
  ON public.pull_requests FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_essay_owner(essay_id, auth.uid())
  );
