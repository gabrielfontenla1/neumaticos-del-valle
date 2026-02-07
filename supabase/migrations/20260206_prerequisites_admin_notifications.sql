-- ============================================================
-- MIGRATION: Prerequisites for Admin Notifications
-- Date: 2026-02-06
-- Author: Terminal DATABASE
-- Description: Creates missing tables and columns required by
--              20260206_admin_notifications.sql
-- ============================================================
--
-- This migration was created to document changes made before
-- applying the admin_notifications migration. These tables and
-- columns were missing from the production database.
--
-- Changes:
-- 1. CREATE TABLE reviews (product reviews system)
-- 2. CREATE TABLE review_images (images for reviews)
-- 3. CREATE TABLE quotes (customer quotations)
-- 4. ADD COLUMNS to products: stock_quantity, min_stock_alert, status
--
-- ============================================================

-- ============================================================
-- 1. REVIEWS TABLE
-- Customer reviews for products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

COMMENT ON TABLE public.reviews IS 'Reseñas de clientes para productos';

-- ============================================================
-- 2. REVIEW_IMAGES TABLE
-- Images attached to reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_images_review ON public.review_images(review_id);

COMMENT ON TABLE public.review_images IS 'Imágenes adjuntas a las reseñas';

-- ============================================================
-- 3. QUOTES TABLE
-- Customer quotation requests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,

  -- Vehicle info (optional)
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,

  -- Quote details
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Status: pending, sent, accepted, rejected, expired
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'expired')),

  -- Validity period
  valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Source tracking
  source TEXT DEFAULT 'website',

  -- Staff reference
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_phone ON public.quotes(customer_phone);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

COMMENT ON TABLE public.quotes IS 'Cotizaciones solicitadas por clientes';

-- ============================================================
-- 4. PRODUCTS TABLE - ADD MISSING COLUMNS
-- Columns required by admin_notifications triggers
-- ============================================================

-- stock_quantity: mirrors 'stock' column for compatibility
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

-- min_stock_alert: threshold for low stock notifications
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 5;

-- status: product availability status
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Sync stock_quantity with existing stock column
UPDATE products
SET stock_quantity = stock
WHERE stock_quantity IS NULL AND stock IS NOT NULL;

-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- Ensure updated_at is automatically maintained
-- ============================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reviews trigger
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Quotes trigger
DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Reviews policies
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
CREATE POLICY "Anyone can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vendedor'))
  );

-- Quotes policies
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
CREATE POLICY "Admins can manage quotes" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vendedor'))
  );

DROP POLICY IF EXISTS "System can insert quotes" ON public.quotes;
CREATE POLICY "System can insert quotes" ON public.quotes
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 7. GRANTS
-- ============================================================
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

GRANT SELECT, INSERT ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

GRANT SELECT ON public.review_images TO anon;
GRANT SELECT, INSERT ON public.review_images TO authenticated;
GRANT ALL ON public.review_images TO service_role;

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260206_prerequisites_admin_notifications completed';
  RAISE NOTICE '   - Table reviews created';
  RAISE NOTICE '   - Table review_images created';
  RAISE NOTICE '   - Table quotes created';
  RAISE NOTICE '   - Columns added to products: stock_quantity, min_stock_alert, status';
END $$;
