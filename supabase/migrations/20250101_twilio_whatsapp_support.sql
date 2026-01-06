-- ============================================================================
-- TWILIO WHATSAPP SUPPORT MIGRATION
-- Adds multi-provider support to existing kommo_conversations/messages tables
-- ============================================================================

-- 1. Add provider column to conversations
ALTER TABLE kommo_conversations
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'kommo';

-- 2. Add check constraint for valid providers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_provider'
  ) THEN
    ALTER TABLE kommo_conversations
    ADD CONSTRAINT check_valid_provider
    CHECK (provider IN ('kommo', 'twilio', 'meta'));
  END IF;
END $$;

-- 3. Make kommo_chat_id nullable (Twilio uses phone as identifier)
ALTER TABLE kommo_conversations
ALTER COLUMN kommo_chat_id DROP NOT NULL;

-- 4. Add constraint: Kommo requires chat_id, Twilio doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_kommo_requires_chat_id'
  ) THEN
    ALTER TABLE kommo_conversations
    ADD CONSTRAINT check_kommo_requires_chat_id
    CHECK (provider != 'kommo' OR kommo_chat_id IS NOT NULL);
  END IF;
END $$;

-- 5. Unique index for Twilio conversations (by provider + phone)
CREATE UNIQUE INDEX IF NOT EXISTS idx_twilio_conversation_phone
ON kommo_conversations(provider, phone)
WHERE provider = 'twilio' AND phone IS NOT NULL;

-- 6. Add provider to messages table
ALTER TABLE kommo_messages
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'kommo';

-- 7. Track last user message for 24h window rule
ALTER TABLE kommo_conversations
ADD COLUMN IF NOT EXISTS last_user_message_at TIMESTAMPTZ;

-- 8. Function to update last_user_message_at automatically
CREATE OR REPLACE FUNCTION update_last_user_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE kommo_conversations
    SET last_user_message_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for automatic update
DROP TRIGGER IF EXISTS trigger_update_last_user_message ON kommo_messages;
CREATE TRIGGER trigger_update_last_user_message
AFTER INSERT ON kommo_messages
FOR EACH ROW
EXECUTE FUNCTION update_last_user_message_timestamp();

-- 10. Index for provider queries
CREATE INDEX IF NOT EXISTS idx_conversations_provider_status
ON kommo_conversations(provider, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_provider_phone
ON kommo_conversations(provider, phone);

CREATE INDEX IF NOT EXISTS idx_messages_provider
ON kommo_messages(provider);

-- 11. View for active conversations by provider
CREATE OR REPLACE VIEW active_conversations_by_provider AS
SELECT
  provider,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'escalated') as escalated,
  COUNT(*) FILTER (WHERE last_user_message_at > NOW() - INTERVAL '24 hours') as within_24h
FROM kommo_conversations
GROUP BY provider;

-- 12. Comment for documentation
COMMENT ON COLUMN kommo_conversations.provider IS 'Messaging provider: kommo, twilio, or meta';
COMMENT ON COLUMN kommo_conversations.last_user_message_at IS 'Last user message timestamp for 24h window rule';
