-- supabase/migrations/20241024_social_publishing.sql
-- Social Media Publishing Automation tables
-- Requires: profiles table with (id, email) from earlier migrations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. social_accounts: one row per connected platform account
-- ─────────────────────────────────────────────
CREATE TABLE public.social_accounts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform        text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin')),
  platform_account_id   text NOT NULL,          -- page/user/org ID from the platform
  account_name    text,                          -- display name shown in UI
  account_type    text DEFAULT 'page',           -- 'page' | 'profile' | 'organization'
  access_token_enc  text NOT NULL,               -- AES-256-GCM encrypted token (base64)
  refresh_token_enc text,                        -- encrypted refresh token if available
  token_expires_at  timestamptz,                 -- when the access token expires
  scopes          text[],                        -- granted OAuth scopes
  meta            jsonb,                         -- extra data (profile picture, etc.)
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, platform, platform_account_id)  -- prevent duplicate connections
);

-- ─────────────────────────────────────────────
-- 2. social_posts: one row per publish intent
-- ─────────────────────────────────────────────
CREATE TABLE public.social_posts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  design_id       uuid REFERENCES public.designs(id) ON DELETE SET NULL,
  caption         text,
  hashtags        text,
  image_url       text NOT NULL,                 -- publicly accessible URL at publish time
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','scheduled','publishing','published','failed','cancelled')),
  scheduled_at    timestamptz,                   -- NULL = publish immediately
  timezone        text NOT NULL DEFAULT 'UTC',
  publish_now     boolean NOT NULL DEFAULT false,
  retry_count     int NOT NULL DEFAULT 0,
  max_retries     int NOT NULL DEFAULT 3,
  next_retry_at   timestamptz,
  error_details   text,
  idempotency_key text UNIQUE DEFAULT uuid_generate_v4()::text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for scheduler: quickly find due posts
CREATE INDEX idx_social_posts_scheduled
  ON public.social_posts (status, scheduled_at)
  WHERE status IN ('scheduled', 'publishing');

-- ─────────────────────────────────────────────
-- 3. social_post_targets: which account(s) each post goes to
-- ─────────────────────────────────────────────
CREATE TABLE public.social_post_targets (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_post_id      uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  social_account_id   uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','publishing','published','failed','skipped')),
  platform_post_id    text,                      -- ID returned by the platform after publish
  platform_permalink  text,                      -- direct URL to the post
  published_at        timestamptz,
  error_message       text,
  UNIQUE (social_post_id, social_account_id)
);

-- ─────────────────────────────────────────────
-- 4. publishing_logs: audit trail for every attempt
-- ─────────────────────────────────────────────
CREATE TABLE public.publishing_logs (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_post_id      uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  social_account_id   uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  attempt_number      int NOT NULL DEFAULT 1,
  status              text NOT NULL,             -- 'success' | 'failure' | 'skipped'
  platform_response   jsonb,                     -- raw API response (no tokens logged)
  error_message       text,
  duration_ms         int,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
ALTER TABLE public.social_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_logs     ENABLE ROW LEVEL SECURITY;

-- social_accounts: service role can do everything (we use service-role client)
CREATE POLICY "sa_service_all"  ON public.social_accounts     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sp_service_all"  ON public.social_posts        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "spt_service_all" ON public.social_post_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "pl_service_all"  ON public.publishing_logs     FOR ALL USING (true) WITH CHECK (true);
