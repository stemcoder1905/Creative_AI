-- supabase/migrations/20241019_create_profiles.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,          -- FIX: added email (used as primary lookup key)
  auth_user_id uuid,
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
  brand_colors text[],                 -- FIX: added brand_colors (used in profile POST)
  brand_slogan text,                   -- FIX: added brand_slogan
  primary_use_case text,               -- FIX: added primary_use_case
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow reads by email match (since we use email-based sessions)
CREATE POLICY "service_role_full_access" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);
