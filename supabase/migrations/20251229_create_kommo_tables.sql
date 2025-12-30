-- ============================================================================
-- MIGRACIÓN: Tablas para integración Kommo CRM
-- Fecha: 2024-12-29
-- Descripción: Crea tablas para almacenar conversaciones y mensajes de WhatsApp/Kommo
-- ============================================================================

-- ============================================================================
-- TABLA: kommo_conversations
-- Almacena las conversaciones/chats de Kommo
-- ============================================================================

CREATE TABLE IF NOT EXISTS kommo_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificadores de Kommo
  kommo_chat_id TEXT NOT NULL UNIQUE,
  kommo_contact_id TEXT,
  kommo_lead_id TEXT,

  -- Datos del contacto
  phone TEXT,
  contact_name TEXT,
  contact_email TEXT,

  -- Estado de la conversación
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated', 'closed')),

  -- Métricas
  message_count INTEGER DEFAULT 0,
  bot_message_count INTEGER DEFAULT 0,
  user_message_count INTEGER DEFAULT 0,

  -- Timestamps
  last_message_at TIMESTAMPTZ,
  last_bot_response_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Escalación
  escalation_reason TEXT,
  assigned_to TEXT, -- ID del usuario asignado en Kommo

  -- Origen del canal
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'telegram', 'facebook', 'other')),

  -- Metadatos adicionales
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLA: kommo_messages
-- Almacena los mensajes individuales de cada conversación
-- ============================================================================

CREATE TABLE IF NOT EXISTS kommo_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relación con conversación
  conversation_id UUID NOT NULL REFERENCES kommo_conversations(id) ON DELETE CASCADE,

  -- Identificadores de Kommo
  kommo_message_id TEXT,

  -- Rol del mensaje
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),

  -- Contenido
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'voice', 'video', 'location', 'contact')),
  media_url TEXT,

  -- Análisis de IA
  intent TEXT CHECK (intent IN (
    'greeting',
    'product_inquiry',
    'price_inquiry',
    'availability_inquiry',
    'faq',
    'appointment',
    'complaint',
    'escalation',
    'purchase',
    'thanks',
    'other'
  )),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  confidence_score DECIMAL(3,2), -- 0.00 a 1.00

  -- Productos referenciados
  products_referenced JSONB DEFAULT '[]',

  -- Métricas de IA
  ai_model TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,

  -- Metadatos
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_kommo_conversations_chat_id
  ON kommo_conversations(kommo_chat_id);

CREATE INDEX IF NOT EXISTS idx_kommo_conversations_contact_id
  ON kommo_conversations(kommo_contact_id);

CREATE INDEX IF NOT EXISTS idx_kommo_conversations_phone
  ON kommo_conversations(phone);

CREATE INDEX IF NOT EXISTS idx_kommo_conversations_status
  ON kommo_conversations(status);

CREATE INDEX IF NOT EXISTS idx_kommo_conversations_channel
  ON kommo_conversations(channel);

CREATE INDEX IF NOT EXISTS idx_kommo_conversations_last_message
  ON kommo_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_kommo_conversations_created
  ON kommo_conversations(created_at DESC);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_kommo_messages_conversation
  ON kommo_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_kommo_messages_role
  ON kommo_messages(role);

CREATE INDEX IF NOT EXISTS idx_kommo_messages_intent
  ON kommo_messages(intent);

CREATE INDEX IF NOT EXISTS idx_kommo_messages_created
  ON kommo_messages(created_at DESC);

-- Índice para búsqueda de texto
CREATE INDEX IF NOT EXISTS idx_kommo_messages_content_search
  ON kommo_messages USING gin(to_tsvector('spanish', content));

-- ============================================================================
-- FUNCIONES
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_kommo_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar contadores de mensajes
CREATE OR REPLACE FUNCTION update_kommo_message_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE kommo_conversations
    SET
      message_count = message_count + 1,
      bot_message_count = CASE WHEN NEW.role = 'assistant' THEN bot_message_count + 1 ELSE bot_message_count END,
      user_message_count = CASE WHEN NEW.role = 'user' THEN user_message_count + 1 ELSE user_message_count END,
      last_message_at = NEW.created_at,
      last_bot_response_at = CASE WHEN NEW.role = 'assistant' THEN NEW.created_at ELSE last_bot_response_at END,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para updated_at en conversaciones
DROP TRIGGER IF EXISTS trigger_update_kommo_conversation_updated_at ON kommo_conversations;
CREATE TRIGGER trigger_update_kommo_conversation_updated_at
  BEFORE UPDATE ON kommo_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_kommo_conversation_updated_at();

-- Trigger para actualizar contadores cuando se inserta un mensaje
DROP TRIGGER IF EXISTS trigger_update_kommo_message_counts ON kommo_messages;
CREATE TRIGGER trigger_update_kommo_message_counts
  AFTER INSERT ON kommo_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_kommo_message_counts();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE kommo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kommo_messages ENABLE ROW LEVEL SECURITY;

-- Política para service role (acceso completo)
CREATE POLICY "Service role has full access to kommo_conversations"
  ON kommo_conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to kommo_messages"
  ON kommo_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para usuarios autenticados (solo lectura para admins y vendedores)
CREATE POLICY "Authenticated users can read kommo_conversations"
  ON kommo_conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
  );

CREATE POLICY "Authenticated users can read kommo_messages"
  ON kommo_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
  );

-- ============================================================================
-- VISTAS
-- ============================================================================

-- Vista para estadísticas de conversaciones
CREATE OR REPLACE VIEW kommo_conversation_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  channel,
  status,
  COUNT(*) as conversation_count,
  SUM(message_count) as total_messages,
  SUM(bot_message_count) as bot_messages,
  SUM(user_message_count) as user_messages,
  AVG(message_count) as avg_messages_per_conversation
FROM kommo_conversations
GROUP BY DATE_TRUNC('day', created_at), channel, status
ORDER BY date DESC;

-- Vista para conversaciones activas
CREATE OR REPLACE VIEW kommo_active_conversations AS
SELECT
  c.*,
  (
    SELECT content
    FROM kommo_messages m
    WHERE m.conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) as last_message_content,
  (
    SELECT role
    FROM kommo_messages m
    WHERE m.conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) as last_message_role
FROM kommo_conversations c
WHERE c.status = 'active'
ORDER BY c.last_message_at DESC;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE kommo_conversations IS 'Almacena las conversaciones de WhatsApp/Kommo';
COMMENT ON TABLE kommo_messages IS 'Almacena los mensajes individuales de cada conversación';
COMMENT ON COLUMN kommo_conversations.kommo_chat_id IS 'ID único del chat en Kommo';
COMMENT ON COLUMN kommo_conversations.status IS 'Estado: active, resolved, escalated, closed';
COMMENT ON COLUMN kommo_messages.intent IS 'Intención detectada por IA: greeting, product_inquiry, etc';
COMMENT ON COLUMN kommo_messages.sentiment IS 'Sentimiento detectado: positive, neutral, negative';
