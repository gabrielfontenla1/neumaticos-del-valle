-- Make customer_email and customer_phone optional in appointments table
ALTER TABLE public.appointments
  ALTER COLUMN customer_email DROP NOT NULL,
  ALTER COLUMN customer_phone DROP NOT NULL;

-- Drop the old index on customer_email since it's now optional
DROP INDEX IF EXISTS idx_appointments_customer_email;

-- Create a new partial index only for non-null emails
CREATE INDEX idx_appointments_customer_email ON public.appointments(customer_email) WHERE customer_email IS NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.appointments.customer_email IS 'Optional email address - customer will be contacted via WhatsApp if not provided';
COMMENT ON COLUMN public.appointments.customer_phone IS 'Optional phone number - customer will be contacted via WhatsApp';
