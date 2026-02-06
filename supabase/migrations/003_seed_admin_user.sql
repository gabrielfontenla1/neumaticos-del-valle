-- Seed initial admin user
-- Run this in Supabase SQL Editor to create the first admin

-- Add policy to allow public insert (needed for user creation without Supabase Auth)
DO $$
BEGIN
  -- Drop existing conflicting policies if they exist
  DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Allow insert for authenticated or public" ON public.profiles;
  DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.profiles;

  -- Create permissive policies for the app's custom auth system
  CREATE POLICY "Allow public read on profiles"
    ON public.profiles FOR SELECT
    USING (true);

  CREATE POLICY "Allow public insert on profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

  CREATE POLICY "Allow public update on profiles"
    ON public.profiles FOR UPDATE
    USING (true)
    WITH CHECK (true);
END $$;

-- Insert initial admin user (if not exists)
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@neumaticosdelvallesrl.com',
  'Administrador',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify insertion
SELECT * FROM public.profiles;
