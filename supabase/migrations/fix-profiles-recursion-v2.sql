-- Fix infinite recursion in profiles RLS policies
-- Solution: Use a SECURITY DEFINER function in public schema

BEGIN;

-- Step 1: Create helper function in public schema with SECURITY DEFINER
-- This function bypasses RLS when checking admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'::user_role
  );
$$;

-- Grant execute to public (anon and authenticated)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Step 2: Drop the problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Step 3: Recreate policies using the SECURITY DEFINER function
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO public
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO public
USING (public.is_admin())
WITH CHECK (public.is_admin());

COMMIT;

-- Test query
SELECT 'Profiles policies fixed successfully!' as message;
