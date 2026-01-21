-- Add province and background_image_url columns to stores table
-- Migration: 20260121_add_branch_columns

-- Add province column
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- Add background_image_url column
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Add comment to columns
COMMENT ON COLUMN public.stores.province IS 'Province where the store is located';
COMMENT ON COLUMN public.stores.background_image_url IS 'URL of the background image for the store card';

-- Update existing records with province extracted from city if needed
-- This is safe because IF NOT EXISTS will skip if column already has data
UPDATE public.stores
SET province = CASE
  WHEN city ILIKE '%catamarca%' THEN 'Catamarca'
  WHEN city ILIKE '%santiago%' THEN 'Santiago del Estero'
  WHEN city ILIKE '%salta%' THEN 'Salta'
  WHEN city ILIKE '%tucum%' THEN 'Tucumán'
  ELSE NULL
END
WHERE province IS NULL;
