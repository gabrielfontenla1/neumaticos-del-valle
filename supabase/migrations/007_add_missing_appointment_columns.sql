-- Add missing columns to appointments table if they don't exist

-- Add appointment_date column (copy from preferred_date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'appointment_date'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN appointment_date DATE;
    -- Copy existing data from preferred_date
    UPDATE public.appointments SET appointment_date = preferred_date WHERE preferred_date IS NOT NULL;
    -- Make it NOT NULL after copying data
    ALTER TABLE public.appointments ALTER COLUMN appointment_date SET NOT NULL;
  END IF;
END $$;

-- Add appointment_time column (copy from preferred_time)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'appointment_time'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN appointment_time TIME;
    -- Copy existing data from preferred_time
    UPDATE public.appointments SET appointment_time = preferred_time WHERE preferred_time IS NOT NULL;
    -- Make it NOT NULL after copying data
    ALTER TABLE public.appointments ALTER COLUMN appointment_time SET NOT NULL;
  END IF;
END $$;

-- Add branch column (text field for branch name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'branch'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN branch TEXT;
  END IF;
END $$;

-- Add user_id column for linking to authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'user_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
