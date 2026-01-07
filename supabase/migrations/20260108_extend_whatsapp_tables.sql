-- ============================================================================
-- EXTEND WHATSAPP TABLES FOR HUMAN TAKEOVER FEATURE
-- Adds pause/resume functionality and message metadata
-- ============================================================================

-- 1. Extend whatsapp_conversations with pause functionality and tracking
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_by TEXT,
ADD COLUMN IF NOT EXISTS pause_reason TEXT,
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- 2. Extend whatsapp_messages with metadata
ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS sent_by_human BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sent_by_user_id TEXT,
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- 3. Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_conversations_status_check'
  ) THEN
    ALTER TABLE whatsapp_conversations
    ADD CONSTRAINT whatsapp_conversations_status_check
    CHECK (status IN ('active', 'resolved', 'archived'));
  END IF;
END $$;

-- 4. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_paused
ON whatsapp_conversations(is_paused) WHERE is_paused = TRUE;

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message
ON whatsapp_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status
ON whatsapp_conversations(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_by_human
ON whatsapp_messages(sent_by_human) WHERE sent_by_human = TRUE;

-- 5. Function to update message_count and last_message_at
CREATE OR REPLACE FUNCTION update_whatsapp_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET
    message_count = message_count + 1,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Replace old trigger with new one that updates stats
DROP TRIGGER IF EXISTS trigger_update_whatsapp_conversation ON whatsapp_messages;
DROP TRIGGER IF EXISTS trigger_update_whatsapp_conversation_stats ON whatsapp_messages;

CREATE TRIGGER trigger_update_whatsapp_conversation_stats
AFTER INSERT ON whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_conversation_stats();

-- 7. Update existing conversations with message counts
UPDATE whatsapp_conversations c
SET
  message_count = (
    SELECT COUNT(*) FROM whatsapp_messages m WHERE m.conversation_id = c.id
  ),
  last_message_at = (
    SELECT MAX(created_at) FROM whatsapp_messages m WHERE m.conversation_id = c.id
  )
WHERE message_count = 0 OR message_count IS NULL;

-- 8. Add RLS policies for authenticated users to update conversations (for pause/resume)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_conversations'
    AND policyname = 'Authenticated users can update whatsapp_conversations'
  ) THEN
    CREATE POLICY "Authenticated users can update whatsapp_conversations"
    ON whatsapp_conversations
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 9. Add policy for authenticated users to insert messages (for human takeover)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_messages'
    AND policyname = 'Authenticated users can insert whatsapp_messages'
  ) THEN
    CREATE POLICY "Authenticated users can insert whatsapp_messages"
    ON whatsapp_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- 10. Comments for new columns
COMMENT ON COLUMN whatsapp_conversations.status IS 'Conversation status: active, resolved, archived';
COMMENT ON COLUMN whatsapp_conversations.is_paused IS 'Whether the AI bot is paused for this conversation';
COMMENT ON COLUMN whatsapp_conversations.paused_at IS 'Timestamp when the conversation was paused';
COMMENT ON COLUMN whatsapp_conversations.paused_by IS 'User ID who paused the conversation';
COMMENT ON COLUMN whatsapp_conversations.pause_reason IS 'Reason for pausing the conversation';
COMMENT ON COLUMN whatsapp_conversations.message_count IS 'Total number of messages in the conversation';
COMMENT ON COLUMN whatsapp_conversations.last_message_at IS 'Timestamp of the last message';
COMMENT ON COLUMN whatsapp_messages.sent_by_human IS 'Whether this message was sent by a human operator';
COMMENT ON COLUMN whatsapp_messages.sent_by_user_id IS 'User ID of the human operator who sent this message';
COMMENT ON COLUMN whatsapp_messages.intent IS 'Detected intent of the message';
COMMENT ON COLUMN whatsapp_messages.response_time_ms IS 'Time in ms to generate the response';
