-- =============================================================================
-- Fix RLS Infinite Recursion - Final Customized Solution
-- =============================================================================
-- Problem: Policies on other tables query profiles table, causing recursion
-- Solution: Create security functions that bypass RLS
-- Tables: profiles, stores, branches, products, vouchers, appointments
-- =============================================================================

-- Step 1: Create security functions that bypass RLS
-- =============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin or vendedor
CREATE OR REPLACE FUNCTION public.is_admin_or_vendedor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'vendedor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT email FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Fix profiles table policies (simple, no recursion)
-- =============================================================================

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Create simple policies for profiles
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 3: Update stores policies to use security functions
-- =============================================================================

DROP POLICY IF EXISTS "Only admins can manage stores" ON public.stores;

CREATE POLICY "Only admins can manage stores" ON public.stores
  FOR ALL USING (is_admin());

-- Step 4: Update branches policies (if any exist)
-- =============================================================================

DROP POLICY IF EXISTS "Only admins can manage branches" ON public.branches;

CREATE POLICY "Only admins can manage branches" ON public.branches
  FOR ALL USING (is_admin());

-- Step 5: Update products policies to use security functions
-- =============================================================================

DROP POLICY IF EXISTS "Only admins can manage products" ON public.products;

CREATE POLICY "Only admins can manage products" ON public.products
  FOR ALL USING (is_admin());

-- Step 6: Update vouchers policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Only admins can update vouchers" ON public.vouchers;

CREATE POLICY "Users can view own vouchers" ON public.vouchers
  FOR SELECT USING (
    customer_email = current_user_email() OR is_admin()
  );

CREATE POLICY "Only admins can update vouchers" ON public.vouchers
  FOR UPDATE USING (is_admin());

-- Step 7: Update appointments policies
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Only admins can update appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (
    customer_email = current_user_email() OR is_admin_or_vendedor()
  );

CREATE POLICY "Only admins can update appointments" ON public.appointments
  FOR UPDATE USING (is_admin_or_vendedor());

-- =============================================================================
-- Verification queries (optional, for testing)
-- =============================================================================

-- Verify functions were created
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'is_admin_or_vendedor', 'current_user_email')
ORDER BY routine_name;

-- Verify policies on profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
