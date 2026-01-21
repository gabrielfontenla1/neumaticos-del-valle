-- ============================================================================
-- AI Configuration System Migration
-- Creates audit log, backup tables, and seeds initial configurations
-- ============================================================================

-- Create config_audit_log table
CREATE TABLE IF NOT EXISTS public.config_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_config_audit_log_key ON public.config_audit_log(config_key);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_changed_at ON public.config_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_audit_log_changed_by ON public.config_audit_log(changed_by);

-- Create config_backups table
CREATE TABLE IF NOT EXISTS public.config_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_auto_backup BOOLEAN DEFAULT true
);

-- Create indexes for backups
CREATE INDEX IF NOT EXISTS idx_config_backups_key ON public.config_backups(config_key);
CREATE INDEX IF NOT EXISTS idx_config_backups_created_at ON public.config_backups(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.config_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_backups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only)
CREATE POLICY "Admins can view audit log" ON public.config_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view backups" ON public.config_backups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit log" ON public.config_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert backups" ON public.config_backups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Seed Initial Configurations
-- ============================================================================

-- AI Models Configuration
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'ai_models_config',
  '{
    "chatModel": "gpt-4o-mini",
    "fastModel": "gpt-3.5-turbo",
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 1,
    "frequencyPenalty": 0,
    "presencePenalty": 0
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- WhatsApp Bot Configuration
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'whatsapp_bot_config',
  '{
    "isActive": true,
    "maintenanceMode": false,
    "welcomeMessage": "¡Hola! Soy el asistente virtual de Neumáticos del Valle. ¿En qué puedo ayudarte?",
    "errorMessage": "Disculpa, hubo un error. Por favor, intenta nuevamente o contacta con un operador.",
    "maintenanceMessage": "El bot está en mantenimiento. Por favor, intenta más tarde.",
    "respectBusinessHours": true,
    "businessHours": {
      "monday": { "start": "08:00", "end": "18:00", "enabled": true },
      "tuesday": { "start": "08:00", "end": "18:00", "enabled": true },
      "wednesday": { "start": "08:00", "end": "18:00", "enabled": true },
      "thursday": { "start": "08:00", "end": "18:00", "enabled": true },
      "friday": { "start": "08:00", "end": "18:00", "enabled": true },
      "saturday": { "start": "08:00", "end": "13:00", "enabled": true },
      "sunday": { "start": "00:00", "end": "00:00", "enabled": false }
    },
    "maxMessagesPerConversation": 50,
    "aiResponseTimeout": 30,
    "enableQueueAlerts": true,
    "enableErrorAlerts": true
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- AI Prompts Configuration
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'ai_prompts_config',
  '{
    "whatsappSystemPrompt": "Sos un asistente virtual de Neumáticos del Valle, una empresa familiar con más de 30 años de experiencia en la venta de neumáticos y servicios de gomería en Mendoza, Argentina.\n\nINFORMACIÓN DE LA EMPRESA:\n- Sucursales: San Martín y Godoy Cruz\n- Horarios: Lunes a Viernes 8:00-18:00, Sábados 8:00-13:00\n- Servicios: Venta de neumáticos, alineación, balanceo, reparación de cubiertas\n- Contacto oficial: +54 261 123-4567\n\nPERSONALIDAD Y TONO:\n- Cordial, profesional pero cercano\n- Lenguaje claro y directo, evitando tecnicismos innecesarios\n- Proactivo en ofrecer soluciones\n- Paciente y empático con las consultas\n\nCAPACIDADES:\n1. Reservar turnos para servicios\n2. Consultar stock de neumáticos\n3. Responder preguntas frecuentes\n4. Brindar información sobre servicios y precios\n5. Derivar a operador humano cuando sea necesario\n\nINSTRUCCIONES:\n- Siempre confirma los datos antes de reservar un turno\n- Si no estás seguro de algo, admítelo y ofrece derivar a un operador\n- Mantén las respuestas concisas (max 2-3 oraciones)\n- Usa emojis ocasionalmente para humanizar la conversación\n- Recuerda el contexto de la conversación\n\nVARIABLES DISPONIBLES:\n{customer_name} - Nombre del cliente\n{branch_name} - Nombre de la sucursal\n{service_type} - Tipo de servicio solicitado",
    "productPrompt": "Experto en neumáticos con conocimiento técnico de marcas, medidas y aplicaciones.",
    "salesPrompt": "Enfocado en ventas consultivas, identificando necesidades y recomendando soluciones.",
    "technicalPrompt": "Especialista técnico en servicios de gomería, alineación y balanceo.",
    "faqPrompt": "Respondedor de preguntas frecuentes con información precisa y actualizada."
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- WhatsApp Function Tools Configuration
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'whatsapp_function_tools',
  '{
    "tools": [
      {
        "name": "book_appointment",
        "description": "Reservar un turno para el cliente",
        "enabled": true,
        "parameters": {
          "type": "object",
          "properties": {
            "date": { "type": "string", "description": "Fecha del turno (YYYY-MM-DD)" },
            "time": { "type": "string", "description": "Hora del turno (HH:MM)" },
            "branch": { "type": "string", "description": "Sucursal" },
            "service": { "type": "string", "description": "Tipo de servicio" }
          },
          "required": ["date", "time", "branch", "service"]
        }
      },
      {
        "name": "confirm_appointment",
        "description": "Confirmar un turno existente",
        "enabled": true,
        "parameters": {
          "type": "object",
          "properties": {
            "appointmentId": { "type": "string", "description": "ID del turno" },
            "confirmed": { "type": "boolean", "description": "Confirmación" }
          },
          "required": ["appointmentId", "confirmed"]
        }
      },
      {
        "name": "check_stock",
        "description": "Consultar disponibilidad de stock",
        "enabled": true,
        "parameters": {
          "type": "object",
          "properties": {
            "product": { "type": "string", "description": "Producto a consultar" },
            "branch": { "type": "string", "description": "Sucursal" }
          },
          "required": ["product"]
        }
      },
      {
        "name": "cancel_operation",
        "description": "Cancelar la operación actual",
        "enabled": true,
        "parameters": {
          "type": "object",
          "properties": {
            "reason": { "type": "string", "description": "Motivo de cancelación" }
          },
          "required": []
        }
      },
      {
        "name": "go_back",
        "description": "Retroceder al paso anterior",
        "enabled": true,
        "parameters": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      {
        "name": "show_help",
        "description": "Mostrar ayuda al usuario",
        "enabled": true,
        "parameters": {
          "type": "object",
          "properties": {
            "topic": { "type": "string", "description": "Tema de ayuda" }
          },
          "required": []
        }
      },
      {
        "name": "request_human",
        "description": "Solicitar asistencia de un operador humano",
        "enabled": true,
        "parameters": {
          "type": "object",
          "properties": {
            "reason": { "type": "string", "description": "Motivo de la solicitud" },
            "priority": { "type": "string", "enum": ["low", "medium", "high"], "description": "Prioridad" }
          },
          "required": ["reason"]
        }
      }
    ]
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Services Configuration
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'services_config',
  '{
    "services": [
      {
        "id": "alignment",
        "name": "Alineación",
        "description": "Alineación de tren delantero",
        "duration": 45,
        "price": 5000,
        "enabled": true
      },
      {
        "id": "balancing",
        "name": "Balanceo",
        "description": "Balanceo de 4 ruedas",
        "duration": 30,
        "price": 3000,
        "enabled": true
      },
      {
        "id": "tire-change",
        "name": "Cambio de Neumáticos",
        "description": "Cambio de neumáticos (incluye montaje y balanceo)",
        "duration": 60,
        "price": 8000,
        "enabled": true
      },
      {
        "id": "tire-repair",
        "name": "Reparación de Cubierta",
        "description": "Reparación de pinchaduras",
        "duration": 30,
        "price": 2000,
        "enabled": true
      }
    ],
    "provinces": [
      "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
      "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
      "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
      "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
    ]
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.config_audit_log IS 'Audit log for configuration changes';
COMMENT ON TABLE public.config_backups IS 'Backup copies of configurations before changes';

COMMENT ON COLUMN public.config_audit_log.config_key IS 'Configuration key from app_settings';
COMMENT ON COLUMN public.config_audit_log.old_value IS 'Previous configuration value';
COMMENT ON COLUMN public.config_audit_log.new_value IS 'New configuration value';
COMMENT ON COLUMN public.config_audit_log.changed_by IS 'User who made the change';
COMMENT ON COLUMN public.config_audit_log.change_reason IS 'Optional reason for the change';

COMMENT ON COLUMN public.config_backups.is_auto_backup IS 'Whether this backup was created automatically';
