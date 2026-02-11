-- ===========================================
-- Migration: Baileys WhatsApp Integration
-- Date: 2026-02-11
-- ===========================================

-- Tabla: baileys_instances
-- Almacena instancias de conexion WhatsApp via Baileys
CREATE TABLE IF NOT EXISTS baileys_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'reconnecting', 'error')),
  qr_code TEXT,
  qr_expires_at TIMESTAMPTZ,
  session_data JSONB,
  last_connected_at TIMESTAMPTZ,
  error_message TEXT,
  settings JSONB DEFAULT '{"auto_reconnect": true, "read_messages": false, "typing_indicator": true, "presence_update": false}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para baileys_instances
CREATE INDEX IF NOT EXISTS idx_baileys_instances_status ON baileys_instances(status);
CREATE INDEX IF NOT EXISTS idx_baileys_instances_active ON baileys_instances(is_active) WHERE is_active = true;

-- ===========================================
-- Tabla: baileys_session_logs
-- Log de eventos de sesion para debugging
-- ===========================================
CREATE TABLE IF NOT EXISTS baileys_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES baileys_instances(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'qr_generated', 'connected', 'disconnected', 'reconnecting',
    'message_received', 'message_sent', 'error', 'session_restored', 'logout'
  )),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para baileys_session_logs
CREATE INDEX IF NOT EXISTS idx_baileys_logs_instance ON baileys_session_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_baileys_logs_created ON baileys_session_logs(created_at DESC);

-- ===========================================
-- Extension tabla whatsapp_conversations
-- ===========================================
ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS baileys_instance_id UUID REFERENCES baileys_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_baileys_instance ON whatsapp_conversations(baileys_instance_id) WHERE baileys_instance_id IS NOT NULL;

-- ===========================================
-- Trigger: Auto-update updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_baileys_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_baileys_instances_updated_at ON baileys_instances;
CREATE TRIGGER trigger_baileys_instances_updated_at
  BEFORE UPDATE ON baileys_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_baileys_instances_updated_at();

-- ===========================================
-- RLS Policies (service role bypasses these,
-- but adding for direct DB access safety)
-- ===========================================
ALTER TABLE baileys_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE baileys_session_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service role key)
CREATE POLICY "Service role full access on instances" ON baileys_instances
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on logs" ON baileys_session_logs
  FOR ALL USING (true) WITH CHECK (true);
