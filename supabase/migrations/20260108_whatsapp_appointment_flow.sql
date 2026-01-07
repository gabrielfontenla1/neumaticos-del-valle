-- Migration: Add pending_appointment column for WhatsApp appointment booking flow
-- This supports the multi-step appointment booking via WhatsApp bot

-- Add pending_appointment JSONB column to store appointment flow state
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS pending_appointment JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN whatsapp_conversations.pending_appointment IS
'Stores appointment booking flow state. Structure:
{
  "province": "catamarca" | "santiago" | "salta" | "tucuman",
  "branch_id": "uuid",
  "branch_name": "string",
  "selected_services": ["alignment", "tire-change"],
  "preferred_date": "2026-01-15",
  "preferred_time": "10:30",
  "customer_name": "string",
  "customer_phone": "string",
  "started_at": "timestamp"
}';

-- Index for queries on appointment state
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_apt
ON whatsapp_conversations USING GIN (pending_appointment)
WHERE pending_appointment IS NOT NULL;

-- Note: conversation_state column already exists and supports new values
-- New states: apt_province, apt_branch, apt_service, apt_date, apt_time, apt_contact, apt_confirm
