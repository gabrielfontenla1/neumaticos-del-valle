-- ============================================================================
-- COMPLETE MIGRATION PACKAGE - Branch System 100%
-- Execute this entire file in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: Add Missing Columns
-- ============================================================================

-- Add province column
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- Add background_image_url column
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Add comments
COMMENT ON COLUMN public.stores.province IS 'Province where the store is located';
COMMENT ON COLUMN public.stores.background_image_url IS 'URL of the background image for the store card';

-- Update existing records with province inferred from city
UPDATE public.stores
SET province = CASE
  WHEN city ILIKE '%catamarca%' THEN 'Catamarca'
  WHEN city ILIKE '%santiago%' THEN 'Santiago del Estero'
  WHEN city ILIKE '%salta%' THEN 'Salta'
  WHEN city ILIKE '%tucum%' THEN 'Tucumán'
  ELSE NULL
END
WHERE province IS NULL;

-- ============================================================================
-- PART 2: Race Condition Fix - Single Main Branch
-- ============================================================================

-- Create function to enforce single main branch
CREATE OR REPLACE FUNCTION enforce_single_main_branch()
RETURNS TRIGGER AS $$
BEGIN
  -- If marking a branch as main
  IF NEW.is_main = true THEN
    -- Unmark all other branches as main
    UPDATE stores
    SET is_main = false, updated_at = NOW()
    WHERE is_main = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_single_main_branch ON stores;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER ensure_single_main_branch
BEFORE INSERT OR UPDATE ON stores
FOR EACH ROW
WHEN (NEW.is_main = true)
EXECUTE FUNCTION enforce_single_main_branch();

-- ============================================================================
-- PART 3: Clean Up - Ensure Single Main Branch Now
-- ============================================================================

-- Keep only the oldest branch as main, unmark all others
UPDATE stores
SET is_main = false, updated_at = NOW()
WHERE id NOT IN (
  SELECT id FROM stores WHERE is_main = true ORDER BY created_at LIMIT 1
);

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

-- Verify columns exist
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('province', 'background_image_url');

-- Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'ensure_single_main_branch';

-- Verify only one main branch
SELECT COUNT(*) as main_branches_count
FROM stores
WHERE is_main = true;

-- Show current branch status
SELECT
  id,
  name,
  province,
  is_main,
  active,
  background_image_url IS NOT NULL as has_image
FROM stores
ORDER BY is_main DESC, name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All migrations applied successfully!';
  RAISE NOTICE '📊 Verification queries completed above';
  RAISE NOTICE '🎯 Next step: Run npx tsx scripts/cleanup-branch-data.ts';
END $$;
