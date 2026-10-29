-- supabase/migrations/20241019_create_credits.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.credits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- FIX: was auth_user_id, API queries by profile_id
  total_credits int NOT NULL DEFAULT 25,
  used_credits int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (email-session based auth)
CREATE POLICY "service_role_full_access" ON public.credits
  FOR ALL USING (true) WITH CHECK (true);
