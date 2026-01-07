-- ============================================================================
-- WHATSAPP CONVERSATIONS & MESSAGES TABLES
-- Simple tables for WhatsApp bot conversations (unified AI)
-- ============================================================================

-- 1. Create whatsapp_conversations table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  contact_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone
ON whatsapp_conversations(phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation
ON whatsapp_messages(conversation_id, created_at DESC);

-- 4. Unique constraint on phone (one conversation per phone number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone_unique
ON whatsapp_conversations(phone);

-- 5. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_conversation ON whatsapp_messages;
CREATE TRIGGER trigger_update_whatsapp_conversation
AFTER INSERT ON whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_conversation_timestamp();

-- 6. RLS Policies (enable for service role access)
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to whatsapp_conversations"
ON whatsapp_conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to whatsapp_messages"
ON whatsapp_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read conversations (for admin dashboard)
CREATE POLICY "Authenticated users can read whatsapp_conversations"
ON whatsapp_conversations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read whatsapp_messages"
ON whatsapp_messages
FOR SELECT
TO authenticated
USING (true);

-- 7. Comments
COMMENT ON TABLE whatsapp_conversations IS 'WhatsApp conversations for the unified AI bot';
COMMENT ON TABLE whatsapp_messages IS 'Messages in WhatsApp conversations';
COMMENT ON COLUMN whatsapp_conversations.phone IS 'Phone number without whatsapp: prefix';
COMMENT ON COLUMN whatsapp_messages.role IS 'user or assistant';
