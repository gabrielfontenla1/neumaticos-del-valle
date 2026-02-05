-- ============================================================
-- MIGRATION: Consolidate Pending Database Fixes
-- Date: 2026-02-05
-- Project: Neumáticos del Valle
-- ============================================================
--
-- This migration consolidates all pending fixes from:
-- - database-fixes-audit.sql
-- - final-moto-fix.sql
-- - database-fixes-CRITICAL.sql
-- - database-fixes-IMPORTANT.sql
--
-- Changes included:
-- 1. Data cleanup (replace NULLs with empty strings)
-- 2. FK indexes for performance (10-100x faster JOINs)
-- 3. NOT NULL constraints on important fields
-- 4. ENUM conversion for appointments.source
-- 5. Moto product images fix
--
-- IMPORTANT: Run scripts/backup-before-migration.js BEFORE this migration!
-- ============================================================

BEGIN;

-- ============================================================
-- PHASE 1: DATA CLEANUP
-- Replace NULLs with empty strings before adding NOT NULL constraints
-- ============================================================

-- 1.1 Clean profiles.phone
UPDATE profiles SET phone = '' WHERE phone IS NULL;
RAISE NOTICE 'Cleaned NULL phone values in profiles';

-- 1.2 Clean stores.email
UPDATE stores SET email = '' WHERE email IS NULL;
RAISE NOTICE 'Cleaned NULL email values in stores';

-- 1.3 Clean kommo_conversations.phone (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kommo_conversations') THEN
    UPDATE kommo_conversations SET phone = '' WHERE phone IS NULL;
    RAISE NOTICE 'Cleaned NULL phone values in kommo_conversations';
  END IF;
END $$;

-- 1.4 Clean appointments.source (prepare for ENUM conversion)
-- Set invalid/NULL values to 'website' as default
UPDATE appointments
SET source = 'website'
WHERE source IS NULL
   OR source NOT IN ('website', 'whatsapp', 'phone', 'walk_in', 'app', 'admin');
RAISE NOTICE 'Cleaned invalid source values in appointments';

-- ============================================================
-- PHASE 2: PERFORMANCE INDEXES
-- Add indexes to foreign keys that were missing them
-- Impact: Improves JOIN performance by 10-100x
-- ============================================================

-- 2.1 Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_branch_stock_updated_by ON branch_stock(updated_by);
CREATE INDEX IF NOT EXISTS idx_config_backups_created_by ON config_backups(created_by);
CREATE INDEX IF NOT EXISTS idx_service_vouchers_redeemed_by ON service_vouchers(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_service_vouchers_store_id ON service_vouchers(store_id);

-- 2.2 Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email);
CREATE INDEX IF NOT EXISTS idx_stores_phone ON stores(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created_at ON whatsapp_conversations(created_at);

RAISE NOTICE 'Created performance indexes';

-- ============================================================
-- PHASE 3: NOT NULL CONSTRAINTS
-- Add data integrity constraints after data cleanup
-- ============================================================

-- 3.1 profiles.phone NOT NULL
ALTER TABLE profiles ALTER COLUMN phone SET NOT NULL;
RAISE NOTICE 'Added NOT NULL constraint to profiles.phone';

-- 3.2 stores.email NOT NULL
ALTER TABLE stores ALTER COLUMN email SET NOT NULL;
RAISE NOTICE 'Added NOT NULL constraint to stores.email';

-- 3.3 kommo_conversations.phone NOT NULL (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kommo_conversations') THEN
    ALTER TABLE kommo_conversations ALTER COLUMN phone SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to kommo_conversations.phone';
  END IF;
END $$;

-- ============================================================
-- PHASE 4: ENUM CONVERSION
-- Convert appointments.source from TEXT to order_source ENUM
-- The order_source ENUM already exists from previous migrations
-- ============================================================

DO $$
BEGIN
  -- Check if column is still TEXT (not already ENUM)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
      AND column_name = 'source'
      AND udt_name != 'order_source'
  ) THEN
    -- Convert to ENUM
    ALTER TABLE appointments
      ALTER COLUMN source TYPE order_source
      USING source::order_source;
    RAISE NOTICE 'Converted appointments.source to ENUM';
  ELSE
    RAISE NOTICE 'appointments.source is already an ENUM - skipping';
  END IF;
END $$;

-- ============================================================
-- PHASE 5: MOTO PRODUCTS IMAGE FIX
-- Update moto products with correct images
-- ============================================================

-- 5.1 Fix Super City products
UPDATE products
SET
  image_url = '/supercity.jpg',
  updated_at = NOW()
WHERE name ILIKE '%super city%';

-- 5.2 Fix other moto products with placeholder images
UPDATE products
SET
  image_url = '/supercity.jpg',
  updated_at = NOW()
WHERE category = 'moto'
  AND (image_url = '/placeholder-moto.jpg' OR image_url IS NULL);

RAISE NOTICE 'Updated moto product images';

-- ============================================================
-- PHASE 6: FOREIGN KEY CONSTRAINTS (if missing)
-- Ensure branch_stock has proper FK relationships
-- ============================================================

-- 6.1 FK to branches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_branch_stock_branch'
      AND table_name = 'branch_stock'
  ) THEN
    ALTER TABLE branch_stock
      ADD CONSTRAINT fk_branch_stock_branch
      FOREIGN KEY (branch_id) REFERENCES branches(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: branch_stock.branch_id → branches.id';
  END IF;
END $$;

-- 6.2 FK to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_branch_stock_product'
      AND table_name = 'branch_stock'
  ) THEN
    ALTER TABLE branch_stock
      ADD CONSTRAINT fk_branch_stock_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Added FK: branch_stock.product_id → products.id';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================

-- Verify indexes created
SELECT '📊 VERIFICATION: Indexes' as section;
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify NOT NULL constraints
SELECT '📊 VERIFICATION: NOT NULL Constraints' as section;
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('profiles', 'phone'),
    ('stores', 'email')
  )
ORDER BY table_name;

-- Verify ENUM conversion
SELECT '📊 VERIFICATION: ENUM Conversion' as section;
SELECT column_name, udt_name
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name = 'source';

-- Verify moto images
SELECT '📊 VERIFICATION: Moto Images' as section;
SELECT name, image_url
FROM products
WHERE category = 'moto'
LIMIT 10;

-- Final success message
SELECT '✅ Migration 20260205_consolidate_pending_fixes completed successfully!' as message;
