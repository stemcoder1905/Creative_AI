-- supabase/migrations/20241019_create_credits.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.credits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid NOT NULL,
  total_credits int NOT NULL,
  used_credits int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_select" ON public.credits
  FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "self_insert" ON public.credits
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "self_update" ON public.credits
  FOR UPDATE USING (auth.uid() = auth_user_id);
