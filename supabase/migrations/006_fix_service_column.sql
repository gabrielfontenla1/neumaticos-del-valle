-- Fix service_type column in appointments table
-- First check if service_type exists, if not add it or rename from 'service'

-- Check if we have 'service' column and rename it to 'service_type'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'service'
    AND table_schema = 'public'
  ) THEN
    -- Rename 'service' to 'service_type'
    ALTER TABLE public.appointments RENAME COLUMN service TO service_type;
  END IF;
END $$;

-- If service_type doesn't exist at all, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'service_type'
    AND table_schema = 'public'
  ) THEN
    -- Add service_type column
    ALTER TABLE public.appointments ADD COLUMN service_type TEXT NOT NULL DEFAULT 'general';
  END IF;
END $$;

-- Make sure it's NOT NULL but with a default
ALTER TABLE public.appointments ALTER COLUMN service_type SET NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN service_type SET DEFAULT 'general';
