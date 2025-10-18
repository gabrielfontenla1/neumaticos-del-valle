-- Fix infinite recursion in profiles RLS policies
-- The issue: other tables' policies query profiles, which creates recursion

-- First, drop all existing policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create simpler policies that don't cause recursion
-- Allow all authenticated users to read all profiles
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow anonymous users to read profiles (for public pages)
CREATE POLICY "Allow anonymous to read profiles" ON public.profiles
  FOR SELECT
  TO anon
  USING (true);
