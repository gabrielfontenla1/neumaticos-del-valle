-- Fix appointment_services schema - Add missing columns
-- Migration Date: 2025-01-21
-- Purpose: Add requires_vehicle and icon columns that were missing

-- Add missing columns
ALTER TABLE appointment_services
ADD COLUMN IF NOT EXISTS requires_vehicle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Update existing records to have default values
UPDATE appointment_services
SET requires_vehicle = CASE
  WHEN id IN ('inspection', 'tire-change', 'alignment', 'balancing', 'rotation', 'front-end', 'tire-repair', 'installation') THEN true
  ELSE false
END
WHERE requires_vehicle IS NULL;

-- Fix price constraint to allow free services (price = 0)
ALTER TABLE appointment_services
DROP CONSTRAINT IF EXISTS appointment_services_price_check;

ALTER TABLE appointment_services
ADD CONSTRAINT appointment_services_price_check CHECK (price >= 0);

-- Add comment
COMMENT ON COLUMN appointment_services.requires_vehicle IS 'Whether this service requires vehicle information';
COMMENT ON COLUMN appointment_services.icon IS 'Lucide icon name for UI display';
COMMENT ON CONSTRAINT appointment_services_price_check ON appointment_services IS 'Allows free services (price >= 0)';
