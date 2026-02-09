-- Migration: Add 'pending' to payment_method enum
-- Purpose: Support WhatsApp checkout where payment method is defined later
-- Requested: 2026-02-09

-- Add 'pending' value to payment_method enum
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'pending';

-- Note: After applying this migration, update CartDrawer.tsx to use 'pending' instead of 'other'
