-- ============================================================================
-- COMBINED MIGRATION: WhatsApp Bot Full Setup
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 0: FIX BRANCHES TABLE (add missing column)
-- ============================================================================
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- PART 1: STOCK LOCATION FLOW
-- ============================================================================

-- 1. Add new columns to whatsapp_conversations for location and state management
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS user_city TEXT,
ADD COLUMN IF NOT EXISTS preferred_branch_id UUID REFERENCES branches(id),
ADD COLUMN IF NOT EXISTS conversation_state TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS pending_tire_search JSONB;

-- 2. Add check constraint for conversation_state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_conversations_state_check'
  ) THEN
    ALTER TABLE whatsapp_conversations
    ADD CONSTRAINT whatsapp_conversations_state_check
    CHECK (conversation_state IN ('idle', 'awaiting_location', 'showing_results', 'awaiting_transfer_confirm'));
  END IF;
END $$;

-- 3. Add SANTIAGO branch if missing
INSERT INTO branches (name, code, city, province, is_active) VALUES
('Neumáticos del Valle - Santiago', 'SANTIAGO', 'Santiago del Estero', 'Santiago del Estero', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Index for conversation state queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_state
ON whatsapp_conversations(conversation_state)
WHERE conversation_state != 'idle';

-- 5. Index for branch lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_branch
ON whatsapp_conversations(preferred_branch_id)
WHERE preferred_branch_id IS NOT NULL;

-- 6. Function to get products with stock by branch
CREATE OR REPLACE FUNCTION get_products_with_branch_stock(
  p_width INTEGER,
  p_profile INTEGER,
  p_diameter INTEGER,
  p_branch_code VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  product_id INTEGER,
  brand VARCHAR,
  model VARCHAR,
  size_display VARCHAR,
  price DECIMAL,
  total_stock DECIMAL,
  branch_stock DECIMAL,
  branch_code VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.brand,
    p.model,
    p.size_display,
    p.price,
    get_total_stock(p.id) AS total_stock,
    COALESCE(bs.quantity, 0) AS branch_stock,
    b.code AS branch_code
  FROM products p
  LEFT JOIN branch_stock bs ON bs.product_id = p.id
  LEFT JOIN branches b ON bs.branch_id = b.id AND (p_branch_code IS NULL OR b.code = p_branch_code)
  WHERE p.width = p_width
    AND p.aspect_ratio = p_profile
    AND p.rim_diameter = p_diameter
    AND p.is_active = true
  ORDER BY
    CASE WHEN p_branch_code IS NOT NULL AND b.code = p_branch_code THEN bs.quantity ELSE 0 END DESC,
    p.price ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Function to find branches with stock
CREATE OR REPLACE FUNCTION find_branches_with_stock(
  p_product_ids INTEGER[],
  p_min_quantity INTEGER DEFAULT 2
)
RETURNS TABLE (
  branch_id UUID,
  branch_code VARCHAR,
  branch_name VARCHAR,
  total_quantity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS branch_id,
    b.code AS branch_code,
    b.name AS branch_name,
    SUM(bs.quantity) AS total_quantity
  FROM branches b
  JOIN branch_stock bs ON bs.branch_id = b.id
  WHERE bs.product_id = ANY(p_product_ids)
    AND bs.quantity >= p_min_quantity
    AND b.is_active = true
  GROUP BY b.id, b.code, b.name
  HAVING SUM(bs.quantity) >= p_min_quantity
  ORDER BY total_quantity DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 2: HUMAN TAKEOVER FEATURE
-- ============================================================================

-- 1. Extend whatsapp_conversations with pause functionality
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

-- 5. Function to update message stats
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

-- 6. Create trigger for stats
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

-- 8. RLS policies for authenticated users
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

-- ============================================================================
-- PART 3: APPOINTMENT BOOKING FLOW
-- ============================================================================

-- Add pending_appointment JSONB column
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS pending_appointment JSONB;

-- Index for queries on appointment state
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_apt
ON whatsapp_conversations USING GIN (pending_appointment)
WHERE pending_appointment IS NOT NULL;

-- ============================================================================
-- DONE! All migrations applied successfully
-- ============================================================================
SELECT 'Migration completed successfully!' as result;
