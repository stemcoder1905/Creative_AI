-- supabase/migrations/20241019_create_profiles.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid NOT NULL,
  full_name text,
  phone text,
  business_name text,
  profession text,
  business_description text,
  target_audience text,
  preferred_language text,
  country text,
  website text,
  social_links jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "self_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
