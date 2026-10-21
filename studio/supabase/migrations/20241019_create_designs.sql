-- supabase/migrations/20241019_create_designs.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table to store generated designs metadata
CREATE TABLE public.designs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  prompt jsonb,
  image_path text,          -- Supabase storage URL
  status text NOT NULL CHECK (status IN ('queued','processing','completed','failed')) DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for generation jobs (could be expanded later for background workers)
CREATE TABLE public.generation_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id uuid NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Table for design assets (additional files, variations, etc.)
CREATE TABLE public.design_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id uuid NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  asset_path text NOT NULL,   -- Supabase storage URL
  type text NOT NULL,         -- e.g., "thumbnail", "original", "variation"
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security for tenant isolation
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_select" ON public.designs
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "profile_insert" ON public.designs
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "profile_update" ON public.designs
  FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "profile_delete" ON public.designs
  FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = profile_id));

-- Apply same RLS pattern for generation_jobs and design_assets (they inherit the same checks via design_id)
CREATE POLICY "job_select" ON public.generation_jobs
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));
CREATE POLICY "job_insert" ON public.generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));
CREATE POLICY "job_update" ON public.generation_jobs
  FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));
CREATE POLICY "job_delete" ON public.generation_jobs
  FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));

CREATE POLICY "asset_select" ON public.design_assets
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));
CREATE POLICY "asset_insert" ON public.design_assets
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));
CREATE POLICY "asset_update" ON public.design_assets
  FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));
CREATE POLICY "asset_delete" ON public.design_assets
  FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.profiles WHERE id = (SELECT profile_id FROM public.designs WHERE id = design_id)));
