-- supabase/migrations/20241019_create_otp_codes.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security – only service role can access
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_access" ON public.otp_codes
  FOR ALL USING (auth.uid() IS NULL);
