-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB DEFAULT '{}',
  is_main BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add store_id column to appointments if it doesn't exist
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add other missing columns to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS vehicle_make VARCHAR(100);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS preferred_date DATE;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS preferred_time VARCHAR(5);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_is_main ON public.stores(is_main);
CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON public.appointments(store_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(preferred_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Enable Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for stores
DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;
CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins can manage stores" ON public.stores;
CREATE POLICY "Admins can manage stores" ON public.stores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policies for appointments
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
    OR
    auth.uid() IS NULL
  );

-- Insert sample stores
INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
VALUES
  ('Sucursal Central', 'Av. San Martín 1234', 'Buenos Aires', '011-4444-5555', '5491144445555', 'central@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, true, true),
  ('Sucursal Norte', 'Av. Maipú 567', 'Vicente López', '011-4444-6666', '5491144446666', 'norte@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, false, true),
  ('Sucursal Sur', 'Av. Mitre 890', 'Avellaneda', '011-4444-7777', '5491144447777', 'sur@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, false, true)
ON CONFLICT (id) DO NOTHING;