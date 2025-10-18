-- Migration: Stock Import System
-- Adds normalized tire data fields and branch stock management

-- ============================================
-- 0. ENSURE REQUIRED FUNCTIONS EXIST
-- ============================================

-- Create update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. UPDATE PRODUCTS TABLE
-- ============================================

-- Add new normalized tire data columns
ALTER TABLE products
ADD COLUMN IF NOT EXISTS aspect_ratio INTEGER, -- Renaming from 'profile' conceptually
ADD COLUMN IF NOT EXISTS rim_diameter INTEGER, -- Renaming from 'diameter' conceptually
ADD COLUMN IF NOT EXISTS construction VARCHAR(10), -- 'R', 'Z', 'BIAS'
ADD COLUMN IF NOT EXISTS load_index INTEGER,
ADD COLUMN IF NOT EXISTS speed_rating VARCHAR(5),

-- Tire characteristics
ADD COLUMN IF NOT EXISTS extra_load BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS run_flat BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seal_inside BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tube_type BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS homologation VARCHAR(50), -- BMW, Mercedes, Audi, etc.

-- Description fields
ADD COLUMN IF NOT EXISTS original_description TEXT, -- Raw description from Excel
ADD COLUMN IF NOT EXISTS display_name VARCHAR(300), -- Clean name for customers

-- Parsing metadata
ADD COLUMN IF NOT EXISTS parse_confidence INTEGER DEFAULT 0, -- 0-100%
ADD COLUMN IF NOT EXISTS parse_warnings TEXT[]; -- Array of parsing warnings

-- Migrate existing data from 'profile' and 'diameter' to new columns
UPDATE products
SET aspect_ratio = profile,
    rim_diameter = diameter
WHERE aspect_ratio IS NULL AND profile IS NOT NULL;

-- Create indices for new columns
CREATE INDEX IF NOT EXISTS idx_products_tire_size
  ON products(width, aspect_ratio, rim_diameter)
  WHERE width IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_construction
  ON products(construction)
  WHERE construction IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_load_speed
  ON products(load_index, speed_rating)
  WHERE load_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_characteristics
  ON products(extra_load, run_flat, seal_inside)
  WHERE extra_load = true OR run_flat = true OR seal_inside = true;

CREATE INDEX IF NOT EXISTS idx_products_homologation
  ON products(homologation)
  WHERE homologation IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_parse_confidence
  ON products(parse_confidence);

-- Update size_display to use new column names
DROP INDEX IF EXISTS idx_products_size;
ALTER TABLE products
DROP COLUMN IF EXISTS size_display;

ALTER TABLE products
ADD COLUMN size_display VARCHAR(20) GENERATED ALWAYS AS (
  CASE
    WHEN width IS NOT NULL AND aspect_ratio IS NOT NULL AND rim_diameter IS NOT NULL
    THEN width::TEXT || '/' || aspect_ratio::TEXT || 'R' || rim_diameter::TEXT
    ELSE NULL
  END
) STORED;

-- ============================================
-- 2. CREATE BRANCH_STOCK TABLE
-- ============================================

-- Note: First we need branches table, let's check if it exists
-- If not, create a simple one for now

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE, -- 'BELGRANO', 'CATAMARCA', etc.
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for branches updated_at
CREATE TRIGGER branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default branches from Excel
INSERT INTO branches (name, code, is_active) VALUES
('Neumáticos del Valle - Belgrano', 'BELGRANO', true),
('Neumáticos del Valle Catamarca Centro', 'CATAMARCA', true),
('Neumáticos del Valle La Banda', 'LA_BANDA', true),
('Neumáticos del Valle - Salta', 'SALTA', true),
('Neumáticos del Valle - Tucumán', 'TUCUMAN', true),
('Neumáticos del Valle - Virgen', 'VIRGEN', true)
ON CONFLICT (code) DO NOTHING;

-- Create branch_stock table
CREATE TABLE IF NOT EXISTS branch_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  notes TEXT,

  -- Unique constraint: one stock record per product per branch
  CONSTRAINT unique_product_branch UNIQUE (product_id, branch_id)
);

-- Indices for branch_stock
CREATE INDEX idx_branch_stock_product ON branch_stock(product_id);
CREATE INDEX idx_branch_stock_branch ON branch_stock(branch_id);
CREATE INDEX idx_branch_stock_quantity ON branch_stock(quantity) WHERE quantity > 0;
CREATE INDEX idx_branch_stock_updated ON branch_stock(last_updated DESC);

-- Trigger for branch_stock last_updated
CREATE OR REPLACE FUNCTION update_branch_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branch_stock_updated
  BEFORE UPDATE ON branch_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_stock_timestamp();

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Branches RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branches are viewable by everyone"
  ON branches FOR SELECT
  USING (true);

CREATE POLICY "Branches are editable by authenticated users"
  ON branches FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Branch Stock RLS
ALTER TABLE branch_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch stock is viewable by everyone"
  ON branch_stock FOR SELECT
  USING (true);

CREATE POLICY "Branch stock is editable by authenticated users"
  ON branch_stock FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to get total stock for a product across all branches
CREATE OR REPLACE FUNCTION get_total_stock(p_product_id INTEGER)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(quantity), 0)
  FROM branch_stock
  WHERE product_id = p_product_id;
$$ LANGUAGE SQL STABLE;

-- Function to get stock for a product at a specific branch
CREATE OR REPLACE FUNCTION get_branch_stock(p_product_id INTEGER, p_branch_code VARCHAR)
RETURNS DECIMAL AS $$
  SELECT COALESCE(bs.quantity, 0)
  FROM branch_stock bs
  JOIN branches b ON bs.branch_id = b.id
  WHERE bs.product_id = p_product_id
    AND b.code = p_branch_code;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN products.aspect_ratio IS 'Tire aspect ratio (e.g., 75 in 205/75R15)';
COMMENT ON COLUMN products.rim_diameter IS 'Rim diameter in inches (e.g., 15 in 205/75R15)';
COMMENT ON COLUMN products.construction IS 'Tire construction type: R (Radial), Z (High Speed), BIAS (Diagonal)';
COMMENT ON COLUMN products.load_index IS 'Load index number (e.g., 99 in 99T)';
COMMENT ON COLUMN products.speed_rating IS 'Speed rating letter (e.g., T in 99T)';
COMMENT ON COLUMN products.extra_load IS 'Extra Load (XL) tire designation';
COMMENT ON COLUMN products.run_flat IS 'Run-flat tire (R-F, r-f)';
COMMENT ON COLUMN products.seal_inside IS 'Self-sealing tire (s-i, S-I)';
COMMENT ON COLUMN products.tube_type IS 'Tube-type tire (TT)';
COMMENT ON COLUMN products.homologation IS 'OEM homologation (BMW, Mercedes, Audi, Porsche, etc.)';
COMMENT ON COLUMN products.original_description IS 'Original description from import source';
COMMENT ON COLUMN products.display_name IS 'Clean, formatted name for customer display';
COMMENT ON COLUMN products.parse_confidence IS 'Confidence score (0-100%) of automated parsing';
COMMENT ON COLUMN products.parse_warnings IS 'Warnings generated during automated parsing';

COMMENT ON TABLE branches IS 'Physical store locations';
COMMENT ON TABLE branch_stock IS 'Stock levels for each product at each branch';
COMMENT ON FUNCTION get_total_stock IS 'Get total stock for a product across all branches';
COMMENT ON FUNCTION get_branch_stock IS 'Get stock for a product at a specific branch';
