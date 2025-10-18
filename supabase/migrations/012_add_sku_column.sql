-- Add SKU column to products table (missing from original schema)
-- SKU (Stock Keeping Unit) is the unique identifier from the Excel file

-- Add SKU column as VARCHAR(100) with unique constraint
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- Create unique index on SKU for faster lookups and uniqueness enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- Add brand_name column (separate from brand for imported data)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand_name VARCHAR(200);

-- Add slug column for URL-friendly product identifiers
ALTER TABLE products
ADD COLUMN IF NOT EXISTS slug VARCHAR(300);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;

-- Comment on new columns
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier from Excel (CODIGO_PROPIO)';
COMMENT ON COLUMN products.brand_name IS 'Brand name from Excel import (MARCA column)';
COMMENT ON COLUMN products.slug IS 'URL-friendly identifier for product pages';
