-- Fix products table RLS policy for public access
-- This ensures products can be viewed by anyone (anonymous and authenticated users)

BEGIN;

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON products;

-- Create a simple, permissive policy for SELECT
CREATE POLICY "Public can view all products"
ON products
FOR SELECT
TO public
USING (true);

-- Verify RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Test: This should return all products
SELECT COUNT(*) as product_count FROM products;
