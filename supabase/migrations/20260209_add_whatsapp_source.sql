-- Migration: Add source field to WhatsApp tables
-- Purpose: Track which provider (Twilio or Baileys) sent/received each message
-- Date: 2026-02-09

-- Add source column to whatsapp_conversations
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'twilio'
CHECK (source IN ('twilio', 'baileys'));

COMMENT ON COLUMN whatsapp_conversations.source IS 'WhatsApp provider: twilio (Business API) or baileys (Web)';

-- Add source column to whatsapp_messages
ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'twilio'
CHECK (source IN ('twilio', 'baileys'));

COMMENT ON COLUMN whatsapp_messages.source IS 'WhatsApp provider that sent/received this message';

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_source
ON whatsapp_conversations(source);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_source
ON whatsapp_messages(source);
