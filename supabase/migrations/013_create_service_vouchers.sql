-- Create service vouchers table for service-based vouchers
-- (distinct from product vouchers in the 'vouchers' table)

-- Create enum for service types
DROP TYPE IF EXISTS public.service_type CASCADE;
CREATE TYPE public.service_type AS ENUM ('inspection', 'rotation', 'balancing', 'alignment');

-- Create enum for service voucher status
DROP TYPE IF EXISTS public.service_voucher_status CASCADE;
CREATE TYPE public.service_voucher_status AS ENUM ('pending', 'active', 'redeemed', 'expired');

-- Create service_vouchers table
CREATE TABLE IF NOT EXISTS public.service_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  review_id UUID, -- Reference to a review if voucher came from one

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,

  -- Service details
  service_type service_type NOT NULL,
  service_value DECIMAL(10, 2) NOT NULL,

  -- Validity
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,

  -- Status
  status service_voucher_status DEFAULT 'active',

  -- Notes
  notes TEXT,

  -- Redemption info
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redemption_notes TEXT,

  -- Store reference
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_service_vouchers_code ON public.service_vouchers(code);
CREATE INDEX idx_service_vouchers_status ON public.service_vouchers(status);
CREATE INDEX idx_service_vouchers_customer_email ON public.service_vouchers(customer_email);
CREATE INDEX idx_service_vouchers_valid_until ON public.service_vouchers(valid_until);
CREATE INDEX idx_service_vouchers_service_type ON public.service_vouchers(service_type);

-- Create updated_at trigger
CREATE TRIGGER update_service_vouchers_updated_at
  BEFORE UPDATE ON public.service_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.service_vouchers ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anonymous read access (for public voucher verification)
CREATE POLICY "Allow public read access to service vouchers"
  ON public.service_vouchers
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert service vouchers
CREATE POLICY "Allow authenticated insert access to service vouchers"
  ON public.service_vouchers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update service vouchers
CREATE POLICY "Allow authenticated update access to service vouchers"
  ON public.service_vouchers
  FOR UPDATE
  TO authenticated
  USING (true);

-- Comment on table
COMMENT ON TABLE public.service_vouchers IS 'Service-based vouchers for tire services (inspection, rotation, balancing, alignment)';
