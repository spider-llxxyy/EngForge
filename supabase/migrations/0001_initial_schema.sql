-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  EngForge Phase 1 — Initial Database Schema                           ║
-- ║  8 tables + triggers + RLS policies + RPC functions                   ║
-- ║  Run in Supabase SQL Editor (one block)                               ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────
-- 0. Extensions
-- ──────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────
-- 1. Enums
-- ──────────────────────────────────────────────────────────────────────
CREATE TYPE essay_visibility AS ENUM ('private', 'invite', 'public');
CREATE TYPE pr_status AS ENUM ('open', 'merged', 'closed');
CREATE TYPE notification_type AS ENUM (
  'pr_received', 'pr_merged', 'pr_closed',
  'fork', 'star', 'invite', 'member_joined'
);

-- ──────────────────────────────────────────────────────────────────────
-- 2. Tables
-- ──────────────────────────────────────────────────────────────────────

-- 2.1 profiles — extends auth.users (business data only)
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  username        TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  avatar_initials TEXT NOT NULL DEFAULT '',
  bio             TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 essays — top-level "repository" for each composition
CREATE TABLE public.essays (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  visibility      essay_visibility NOT NULL DEFAULT 'private',
  forked_from     UUID REFERENCES public.essays(id) ON DELETE SET NULL,
  fork_count      INTEGER NOT NULL DEFAULT 0,
  star_count      INTEGER NOT NULL DEFAULT 0,
  current_version INTEGER NOT NULL DEFAULT 1,
  latest_version  INTEGER NOT NULL DEFAULT 1,
  word_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 essay_versions — immutable version history (TipTap JSON content)
CREATE TABLE public.essay_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id       UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content        JSONB NOT NULL,
  plain_text     TEXT NOT NULL DEFAULT '',
  change_summary TEXT NOT NULL DEFAULT '',
  word_count     INTEGER NOT NULL DEFAULT 0,
  created_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(essay_id, version_number)
);

-- 2.4 essay_members — collaboration access control
CREATE TABLE public.essay_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id  UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'editor'
             CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(essay_id, user_id)
);

-- 2.5 pull_requests — batch改建议 (base + head version pair)
CREATE TABLE public.pull_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id        UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  base_version_id UUID NOT NULL REFERENCES public.essay_versions(id) ON DELETE CASCADE,
  head_version_id UUID NOT NULL REFERENCES public.essay_versions(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  diff_text       TEXT NOT NULL DEFAULT '',
  status          pr_status NOT NULL DEFAULT 'open',
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merged_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merged_at       TIMESTAMPTZ
);

-- 2.6 invitations — invite codes for essay access
CREATE TABLE public.invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT NOT NULL UNIQUE,
  essay_id   UUID REFERENCES public.essays(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_uses   INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 notifications — in-app bell (Supabase Realtime)
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  link_url   TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 stars — user bookmarks
CREATE TABLE public.stars (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  essay_id   UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, essay_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- 3. Indexes
-- ──────────────────────────────────────────────────────────────────────
CREATE INDEX idx_essays_author      ON public.essays(author_id);
CREATE INDEX idx_essays_visibility  ON public.essays(visibility);
CREATE INDEX idx_essays_forked_from ON public.essays(forked_from);
CREATE INDEX idx_versions_essay     ON public.essay_versions(essay_id);
CREATE INDEX idx_versions_creator   ON public.essay_versions(created_by);
CREATE INDEX idx_members_user       ON public.essay_members(user_id);
CREATE INDEX idx_prs_essay          ON public.pull_requests(essay_id);
CREATE INDEX idx_prs_status         ON public.pull_requests(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_stars_user         ON public.stars(user_id);
CREATE INDEX idx_stars_essay        ON public.stars(essay_id);

-- ──────────────────────────────────────────────────────────────────────
-- 4. Trigger Functions
-- ──────────────────────────────────────────────────────────────────────

-- 4.1 Auto-create profile when a new auth.users record is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_initials)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    UPPER(LEFT(COALESCE(NEW.email, '?'), 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.2 Auto-update updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER essays_updated_at
  BEFORE UPDATE ON public.essays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.3 Auto-add essay author as owner in essay_members
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.essay_members (essay_id, user_id, role)
  VALUES (NEW.id, NEW.author_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_essay_created_add_owner
  AFTER INSERT ON public.essays
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- 4.4 Auto-increment fork_count when an essay is forked
CREATE OR REPLACE FUNCTION public.handle_fork_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.forked_from IS NOT NULL THEN
    UPDATE public.essays
    SET fork_count = fork_count + 1
    WHERE id = NEW.forked_from;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_essay_forked
  AFTER INSERT ON public.essays
  FOR EACH ROW
  WHEN (NEW.forked_from IS NOT NULL)
  EXECUTE FUNCTION public.handle_fork_created();

-- 4.5 Auto-update star_count on stars INSERT/DELETE
CREATE OR REPLACE FUNCTION public.handle_star_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.essays SET star_count = star_count + 1 WHERE id = NEW.essay_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.essays SET star_count = star_count - 1 WHERE id = OLD.essay_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_star_inserted
  AFTER INSERT ON public.stars
  FOR EACH ROW EXECUTE FUNCTION public.handle_star_change();

CREATE TRIGGER on_star_deleted
  AFTER DELETE ON public.stars
  FOR EACH ROW EXECUTE FUNCTION public.handle_star_change();

-- 4.6 Auto-create notification when a PR is opened
CREATE OR REPLACE FUNCTION public.notify_pr_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT author_id INTO v_author_id FROM public.essays WHERE id = NEW.essay_id;

  IF v_author_id IS NOT NULL AND v_author_id != NEW.created_by THEN
    INSERT INTO public.notifications (user_id, type, title, content, link_url)
    VALUES (
      v_author_id,
      'pr_received',
      '收到新的批改建议',
      '有人提交了 PR：' || NEW.title,
      '/essays/' || NEW.essay_id || '/prs/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pr_created_notify
  AFTER INSERT ON public.pull_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_pr_created();

-- 4.7 Auto-create notification when a PR is merged
CREATE OR REPLACE FUNCTION public.notify_pr_merged()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (OLD.status = 'open' AND NEW.status = 'merged') THEN
    IF NEW.created_by != NEW.merged_by THEN
      INSERT INTO public.notifications (user_id, type, title, content, link_url)
      VALUES (
        NEW.created_by,
        'pr_merged',
        'PR 已被合并',
        '你的 PR 已被合并：' || NEW.title,
        '/essays/' || NEW.essay_id || '/prs/' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pr_merged_notify
  AFTER UPDATE ON public.pull_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_pr_merged();

-- ──────────────────────────────────────────────────────────────────────
-- 5. Row-Level Security (RLS) Policies
-- ──────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essays          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essay_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essay_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pull_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stars           ENABLE ROW LEVEL SECURITY;

-- 5.1 profiles
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5.2 essays
CREATE POLICY "essays_select_own"
  ON public.essays FOR SELECT
  USING (auth.uid() = author_id);

CREATE POLICY "essays_select_member"
  ON public.essays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.essay_members
      WHERE essay_id = essays.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "essays_select_public"
  ON public.essays FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "essays_insert_own"
  ON public.essays FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "essays_update_own"
  ON public.essays FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "essays_delete_own"
  ON public.essays FOR DELETE
  USING (auth.uid() = author_id);

-- 5.3 essay_versions (follow parent essay visibility)
CREATE POLICY "versions_select_accessible"
  ON public.essay_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.essays e
      WHERE e.id = essay_versions.essay_id
      AND (
        e.author_id = auth.uid()
        OR e.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM public.essay_members
          WHERE essay_id = e.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "versions_insert_member"
  ON public.essay_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.essay_members
      WHERE essay_id = essay_versions.essay_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- 5.4 essay_members
CREATE POLICY "members_select_participant"
  ON public.essay_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.essays
      WHERE id = essay_members.essay_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_owner"
  ON public.essay_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.essays
      WHERE id = essay_members.essay_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "members_delete_owner"
  ON public.essay_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.essays
      WHERE id = essay_members.essay_id AND author_id = auth.uid()
    )
  );

-- 5.5 pull_requests
CREATE POLICY "prs_select_participant"
  ON public.pull_requests FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.essay_members
      WHERE essay_id = pull_requests.essay_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "prs_insert_member"
  ON public.pull_requests FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.essay_members
      WHERE essay_id = pull_requests.essay_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "prs_update_owner_or_creator"
  ON public.pull_requests FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.essays
      WHERE id = pull_requests.essay_id AND author_id = auth.uid()
    )
  );

-- 5.6 invitations
CREATE POLICY "invitations_select_any"
  ON public.invitations FOR SELECT
  USING (true);

CREATE POLICY "invitations_insert_creator"
  ON public.invitations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "invitations_update_creator"
  ON public.invitations FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "invitations_delete_creator"
  ON public.invitations FOR DELETE
  USING (created_by = auth.uid());

-- 5.7 notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Note: INSERT on notifications is done by SECURITY DEFINER trigger functions
-- (they bypass RLS). Users cannot directly INSERT notifications.

-- 5.8 stars
CREATE POLICY "stars_select_all"
  ON public.stars FOR SELECT
  USING (true);

CREATE POLICY "stars_insert_own"
  ON public.stars FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "stars_delete_own"
  ON public.stars FOR DELETE
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────
-- 6. RPC Functions (called from client via supabase.rpc())
-- ──────────────────────────────────────────────────────────────────────

-- 6.1 Create a new essay version (atomic version_number increment)
CREATE OR REPLACE FUNCTION public.create_essay_version(
  p_essay_id      UUID,
  p_content       JSONB,
  p_plain_text    TEXT,
  p_word_count    INTEGER,
  p_change_summary TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_version    INTEGER;
  v_version_id     UUID;
BEGIN
  -- Verify caller is a member with editor/owner role
  IF NOT EXISTS (
    SELECT 1 FROM public.essay_members
    WHERE essay_id = p_essay_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
  ) THEN
    RAISE EXCEPTION 'Permission denied: not an editor of this essay';
  END IF;

  -- Atomically get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_new_version
  FROM public.essay_versions
  WHERE essay_id = p_essay_id;

  -- Insert the new version
  INSERT INTO public.essay_versions (
    essay_id, version_number, content, plain_text,
    word_count, change_summary, created_by
  )
  VALUES (
    p_essay_id, v_new_version, p_content, p_plain_text,
    p_word_count, p_change_summary, auth.uid()
  )
  RETURNING id INTO v_version_id;

  -- Update essay metadata
  UPDATE public.essays
  SET latest_version = v_new_version,
      word_count     = p_word_count,
      updated_at     = NOW()
  WHERE id = p_essay_id;

  RETURN v_version_id;
END;
$$;

-- 6.2 Merge a PR (creates new version from head, updates PR status)
CREATE OR REPLACE FUNCTION public.merge_pull_request(
  p_pr_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pr            public.pull_requests%ROWTYPE;
  v_head          public.essay_versions%ROWTYPE;
  v_new_version   INTEGER;
  v_version_id    UUID;
  v_is_owner      BOOLEAN;
BEGIN
  -- Load PR
  SELECT * INTO v_pr FROM public.pull_requests WHERE id = p_pr_id;
  IF NOT FOUND OR v_pr.status != 'open' THEN
    RAISE EXCEPTION 'PR not found or not open';
  END IF;

  -- Verify caller is the essay owner
  SELECT EXISTS (
    SELECT 1 FROM public.essays
    WHERE id = v_pr.essay_id AND author_id = auth.uid()
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Permission denied: only essay owner can merge';
  END IF;

  -- Load head version content
  SELECT * INTO v_head FROM public.essay_versions WHERE id = v_pr.head_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Head version not found';
  END IF;

  -- Create new version from head content
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_new_version
  FROM public.essay_versions WHERE essay_id = v_pr.essay_id;

  INSERT INTO public.essay_versions (
    essay_id, version_number, content, plain_text,
    word_count, change_summary, created_by
  )
  VALUES (
    v_pr.essay_id, v_new_version, v_head.content, v_head.plain_text,
    v_head.word_count, 'Merge PR: ' || v_pr.title, auth.uid()
  )
  RETURNING id INTO v_version_id;

  -- Update essay current + latest version
  UPDATE public.essays
  SET current_version = v_new_version,
      latest_version  = v_new_version,
      word_count      = v_head.word_count,
      updated_at      = NOW()
  WHERE id = v_pr.essay_id;

  -- Mark PR as merged (triggers notification via on_pr_merged_notify)
  UPDATE public.pull_requests
  SET status = 'merged', merged_by = auth.uid(), merged_at = NOW()
  WHERE id = p_pr_id;

  RETURN v_version_id;
END;
$$;

-- 6.3 Use an invitation code (join an essay as member)
CREATE OR REPLACE FUNCTION public.use_invitation(
  p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_invite public.invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.invitations WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', '邀请码不存在');
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', '邀请码已过期');
  END IF;

  IF v_invite.max_uses IS NOT NULL AND v_invite.used_count >= v_invite.max_uses THEN
    RETURN json_build_object('success', false, 'error', '邀请码使用次数已达上限');
  END IF;

  IF v_invite.essay_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '无效的邀请码');
  END IF;

  -- Add caller as editor (idempotent)
  INSERT INTO public.essay_members (essay_id, user_id, role)
  VALUES (v_invite.essay_id, auth.uid(), 'editor')
  ON CONFLICT DO NOTHING;

  -- Increment usage count
  UPDATE public.invitations
  SET used_count = used_count + 1
  WHERE id = v_invite.id;

  RETURN json_build_object(
    'success', true,
    'essay_id', v_invite.essay_id
  );
END;
$$;

-- 6.4 Generate a random invite code (utility)
CREATE OR REPLACE FUNCTION public.generate_invite_code(
  p_essay_id  UUID,
  p_max_uses  INTEGER DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verify caller is the essay owner
  IF NOT EXISTS (
    SELECT 1 FROM public.essays
    WHERE id = p_essay_id AND author_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied: only essay owner can create invite codes';
  END IF;

  -- Generate 8-char alphanumeric code
  v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  IF p_expires_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO public.invitations (code, essay_id, created_by, max_uses, expires_at)
  VALUES (v_code, p_essay_id, auth.uid(), p_max_uses, v_expires_at);

  RETURN v_code;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────
-- 7. Realtime — enable for notifications table
-- ──────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pull_requests;
