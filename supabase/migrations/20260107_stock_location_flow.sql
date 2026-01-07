-- ============================================================================
-- STOCK LOCATION FLOW FOR WHATSAPP BOT
-- Adds state management for tire searches with location-based stock
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

-- 3. Add SANTIAGO branch if missing (7 branches total)
INSERT INTO branches (name, code, is_active) VALUES
('Neumáticos del Valle - Santiago', 'SANTIAGO', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Index for conversation state queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_state
ON whatsapp_conversations(conversation_state)
WHERE conversation_state != 'idle';

-- 5. Index for branch lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_branch
ON whatsapp_conversations(preferred_branch_id)
WHERE preferred_branch_id IS NOT NULL;

-- 6. Function to get products with stock by branch for a tire size
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

-- 7. Function to find branches with stock for given products
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

-- 8. Comments for documentation
COMMENT ON COLUMN whatsapp_conversations.user_city IS 'City detected from user message for branch selection';
COMMENT ON COLUMN whatsapp_conversations.preferred_branch_id IS 'User''s nearest/preferred branch based on location';
COMMENT ON COLUMN whatsapp_conversations.conversation_state IS 'State machine: idle, awaiting_location, showing_results, awaiting_transfer_confirm';
COMMENT ON COLUMN whatsapp_conversations.pending_tire_search IS 'JSONB with pending tire search params when awaiting location';
COMMENT ON FUNCTION get_products_with_branch_stock IS 'Get products matching tire size with stock info per branch';
COMMENT ON FUNCTION find_branches_with_stock IS 'Find branches that have stock for given product IDs';
