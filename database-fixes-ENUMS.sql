-- ============================================================================
-- DATABASE ENUM MIGRATION - IMPORTANT
-- ============================================================================
-- IMPORTANTE: Ejecutar DESPUÉS de database-fixes-IMPORTANT.sql
-- Esta migración convierte campos TEXT/VARCHAR a ENUM
-- REQUIERE downtime de aplicación (unos minutos)
-- Backup completo OBLIGATORIO antes de ejecutar
-- Probar primero en desarrollo
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: CREAR TIPOS ENUM
-- ============================================================================

-- 1.1: appointment_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM (
      'pending',
      'confirmed',
      'completed',
      'cancelled',
      'no_show'
    );
    RAISE NOTICE '✅ Tipo appointment_status creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo appointment_status ya existe';
  END IF;
END $$;

-- 1.2: order_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    );
    RAISE NOTICE '✅ Tipo order_status creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo order_status ya existe';
  END IF;
END $$;

-- 1.3: payment_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'pending',
      'paid',
      'failed',
      'refunded',
      'partially_paid'
    );
    RAISE NOTICE '✅ Tipo payment_status creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo payment_status ya existe';
  END IF;
END $$;

-- 1.4: payment_method
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM (
      'cash',
      'credit_card',
      'debit_card',
      'transfer',
      'mercadopago',
      'other'
    );
    RAISE NOTICE '✅ Tipo payment_method creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo payment_method ya existe';
  END IF;
END $$;

-- 1.5: order_source
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_source') THEN
    CREATE TYPE order_source AS ENUM (
      'website',
      'whatsapp',
      'phone',
      'walk_in',
      'app',
      'admin'
    );
    RAISE NOTICE '✅ Tipo order_source creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo order_source ya existe';
  END IF;
END $$;

-- 1.6: conversation_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
    CREATE TYPE conversation_status AS ENUM (
      'active',
      'resolved',
      'archived',
      'escalated'
    );
    RAISE NOTICE '✅ Tipo conversation_status creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo conversation_status ya existe';
  END IF;
END $$;

-- 1.7: conversation_state
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_state') THEN
    CREATE TYPE conversation_state AS ENUM (
      'idle',
      'waiting_user',
      'processing',
      'waiting_appointment',
      'waiting_product_info',
      'completed'
    );
    RAISE NOTICE '✅ Tipo conversation_state creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo conversation_state ya existe';
  END IF;
END $$;

-- 1.8: message_role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
    CREATE TYPE message_role AS ENUM (
      'user',
      'assistant',
      'system'
    );
    RAISE NOTICE '✅ Tipo message_role creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo message_role ya existe';
  END IF;
END $$;

-- 1.9: content_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
    CREATE TYPE content_type AS ENUM (
      'text',
      'image',
      'video',
      'audio',
      'document',
      'location',
      'sticker'
    );
    RAISE NOTICE '✅ Tipo content_type creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo content_type ya existe';
  END IF;
END $$;

-- 1.10: channel_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE channel_type AS ENUM (
      'whatsapp',
      'telegram',
      'instagram',
      'facebook',
      'email',
      'sms'
    );
    RAISE NOTICE '✅ Tipo channel_type creado';
  ELSE
    RAISE NOTICE '⚠️  Tipo channel_type ya existe';
  END IF;
END $$;

-- ============================================================================
-- PARTE 1.5: ELIMINAR VIEWS Y TRIGGERS QUE REFERENCIAN COLUMNAS A MIGRAR
-- ============================================================================
-- Views y triggers bloquean la migración de tipos, los recreamos al final

-- Drop views
DROP VIEW IF EXISTS public.active_conversations_by_provider CASCADE;
DROP VIEW IF EXISTS public.available_products CASCADE;
DROP VIEW IF EXISTS public.kommo_active_conversations CASCADE;
DROP VIEW IF EXISTS public.kommo_conversation_stats CASCADE;
DROP VIEW IF EXISTS public.today_appointments CASCADE;
DROP VIEW IF EXISTS public.whatsapp_appointments CASCADE;

-- Drop triggers on tables being migrated
DROP TRIGGER IF EXISTS trigger_verify_appointment_availability ON public.appointments;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS order_payment_change_trigger ON public.orders;
DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
DROP TRIGGER IF EXISTS orders_updated_at_trigger ON public.orders;
DROP TRIGGER IF EXISTS trigger_update_kommo_conversation_updated_at ON public.kommo_conversations;
DROP TRIGGER IF EXISTS trigger_update_kommo_message_counts ON public.kommo_messages;
DROP TRIGGER IF EXISTS trigger_update_last_user_message ON public.kommo_messages;

-- Drop CHECK constraints (will be redundant after ENUM migration)
ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_status_check CASCADE;
ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_state_check CASCADE;
ALTER TABLE kommo_conversations DROP CONSTRAINT IF EXISTS kommo_conversations_status_check CASCADE;
ALTER TABLE kommo_conversations DROP CONSTRAINT IF EXISTS kommo_conversations_channel_check CASCADE;
ALTER TABLE whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_role_check CASCADE;
ALTER TABLE kommo_messages DROP CONSTRAINT IF EXISTS kommo_messages_role_check CASCADE;
ALTER TABLE kommo_messages DROP CONSTRAINT IF EXISTS kommo_messages_content_type_check CASCADE;

-- Drop partial indexes with WHERE clauses comparing to text
DROP INDEX IF EXISTS public.idx_kommo_conversations_active_date;
DROP INDEX IF EXISTS public.idx_whatsapp_conv_state;
DROP INDEX IF EXISTS public.idx_whatsapp_conversations_active_date;

DO $$
BEGIN
  RAISE NOTICE '✅ Views, triggers, CHECK constraints e indexes eliminados temporalmente para migración';
  RAISE NOTICE 'ℹ️  CHECK constraints no serán recreados (redundantes con ENUM types)';
END $$;

-- ============================================================================
-- PARTE 2: MIGRAR COLUMNAS A ENUM
-- ============================================================================
-- ADVERTENCIA: Esto puede fallar si existen valores no contemplados en ENUM
-- Verificar primero con:
-- SELECT DISTINCT status FROM appointments;
-- SELECT DISTINCT status FROM orders;
-- etc.
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'INICIANDO MIGRACIÓN A ENUMS';
  RAISE NOTICE 'Esta operación puede tomar varios minutos...';
  RAISE NOTICE '==================================================';
END $$;

-- 2.1: appointments.status
DO $$
BEGIN
  -- Verificar valores únicos primero
  RAISE NOTICE 'Valores actuales en appointments.status:';
  PERFORM DISTINCT status FROM appointments;

  -- Normalizar valores (convertir a minúsculas, trimear espacios)
  UPDATE appointments SET status = LOWER(TRIM(status));

  -- Drop DEFAULT before migration
  ALTER TABLE appointments ALTER COLUMN status DROP DEFAULT;

  -- Migrar
  ALTER TABLE appointments
  ALTER COLUMN status TYPE appointment_status
  USING status::appointment_status;

  -- Re-add DEFAULT
  ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending'::appointment_status;

  RAISE NOTICE '✅ appointments.status migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando appointments.status: %', SQLERRM;
    RAISE NOTICE '   Verificar valores con: SELECT DISTINCT status FROM appointments;';
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.2: orders.status
DO $$
BEGIN
  UPDATE orders SET status = LOWER(TRIM(status));

  ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;

  ALTER TABLE orders
  ALTER COLUMN status TYPE order_status
  USING status::order_status;

  ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::order_status;

  RAISE NOTICE '✅ orders.status migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando orders.status: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.3: orders.payment_status
DO $$
BEGIN
  UPDATE orders SET payment_status = LOWER(TRIM(payment_status));

  ALTER TABLE orders ALTER COLUMN payment_status DROP DEFAULT;

  ALTER TABLE orders
  ALTER COLUMN payment_status TYPE payment_status
  USING payment_status::payment_status;

  ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'pending'::payment_status;

  RAISE NOTICE '✅ orders.payment_status migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando orders.payment_status: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.4: orders.payment_method
DO $$
BEGIN
  UPDATE orders SET payment_method = LOWER(TRIM(payment_method));

  ALTER TABLE orders
  ALTER COLUMN payment_method TYPE payment_method
  USING payment_method::payment_method;

  RAISE NOTICE '✅ orders.payment_method migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando orders.payment_method: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.5: orders.source
DO $$
BEGIN
  UPDATE orders SET source = LOWER(TRIM(source));

  ALTER TABLE orders ALTER COLUMN source DROP DEFAULT;

  ALTER TABLE orders
  ALTER COLUMN source TYPE order_source
  USING source::order_source;

  ALTER TABLE orders ALTER COLUMN source SET DEFAULT 'website'::order_source;

  RAISE NOTICE '✅ orders.source migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando orders.source: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.6: whatsapp_conversations.status
DO $$
BEGIN
  UPDATE whatsapp_conversations SET status = LOWER(TRIM(status));

  ALTER TABLE whatsapp_conversations ALTER COLUMN status DROP DEFAULT;

  ALTER TABLE whatsapp_conversations
  ALTER COLUMN status TYPE conversation_status
  USING status::conversation_status;

  ALTER TABLE whatsapp_conversations ALTER COLUMN status SET DEFAULT 'active'::conversation_status;

  RAISE NOTICE '✅ whatsapp_conversations.status migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando whatsapp_conversations.status: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.7: kommo_conversations.status
DO $$
BEGIN
  UPDATE kommo_conversations SET status = LOWER(TRIM(status));

  ALTER TABLE kommo_conversations ALTER COLUMN status DROP DEFAULT;

  ALTER TABLE kommo_conversations
  ALTER COLUMN status TYPE conversation_status
  USING status::conversation_status;

  ALTER TABLE kommo_conversations ALTER COLUMN status SET DEFAULT 'active'::conversation_status;

  RAISE NOTICE '✅ kommo_conversations.status migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando kommo_conversations.status: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.8: whatsapp_conversations.conversation_state
DO $$
BEGIN
  UPDATE whatsapp_conversations SET conversation_state = LOWER(TRIM(conversation_state));

  ALTER TABLE whatsapp_conversations ALTER COLUMN conversation_state DROP DEFAULT;

  ALTER TABLE whatsapp_conversations
  ALTER COLUMN conversation_state TYPE conversation_state
  USING conversation_state::conversation_state;

  ALTER TABLE whatsapp_conversations ALTER COLUMN conversation_state SET DEFAULT 'idle'::conversation_state;

  RAISE NOTICE '✅ whatsapp_conversations.conversation_state migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando whatsapp_conversations.conversation_state: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.9: whatsapp_messages.role
DO $$
BEGIN
  UPDATE whatsapp_messages SET role = LOWER(TRIM(role));

  ALTER TABLE whatsapp_messages
  ALTER COLUMN role TYPE message_role
  USING role::message_role;

  RAISE NOTICE '✅ whatsapp_messages.role migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando whatsapp_messages.role: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.10: kommo_messages.role
DO $$
BEGIN
  UPDATE kommo_messages SET role = LOWER(TRIM(role));

  ALTER TABLE kommo_messages
  ALTER COLUMN role TYPE message_role
  USING role::message_role;

  RAISE NOTICE '✅ kommo_messages.role migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando kommo_messages.role: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.11: kommo_messages.content_type
DO $$
BEGIN
  UPDATE kommo_messages SET content_type = LOWER(TRIM(content_type));

  ALTER TABLE kommo_messages ALTER COLUMN content_type DROP DEFAULT;

  ALTER TABLE kommo_messages
  ALTER COLUMN content_type TYPE content_type
  USING content_type::content_type;

  ALTER TABLE kommo_messages ALTER COLUMN content_type SET DEFAULT 'text'::content_type;

  RAISE NOTICE '✅ kommo_messages.content_type migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando kommo_messages.content_type: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- 2.12: kommo_conversations.channel
DO $$
BEGIN
  UPDATE kommo_conversations SET channel = LOWER(TRIM(channel));

  ALTER TABLE kommo_conversations ALTER COLUMN channel DROP DEFAULT;

  ALTER TABLE kommo_conversations
  ALTER COLUMN channel TYPE channel_type
  USING channel::channel_type;

  ALTER TABLE kommo_conversations ALTER COLUMN channel SET DEFAULT 'whatsapp'::channel_type;

  RAISE NOTICE '✅ kommo_conversations.channel migrado a ENUM';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error migrando kommo_conversations.channel: %', SQLERRM;
    RAISE EXCEPTION 'Migration failed';
END $$;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'ENUM MIGRATION COMPLETADA';
  RAISE NOTICE '==================================================';
END $$;

-- Verificar que las columnas ahora son ENUM
SELECT
  table_name,
  column_name,
  data_type,
  udt_name as enum_type,
  CASE
    WHEN udt_name LIKE '%status' OR udt_name LIKE '%type' OR udt_name LIKE '%method' OR udt_name LIKE '%source' OR udt_name LIKE '%state' OR udt_name LIKE '%role' THEN '✅ IS ENUM'
    ELSE '❌ NOT ENUM'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('appointments', 'orders', 'whatsapp_conversations', 'kommo_conversations', 'whatsapp_messages', 'kommo_messages')
  AND column_name IN ('status', 'payment_status', 'payment_method', 'source', 'conversation_state', 'role', 'content_type', 'channel')
ORDER BY table_name, column_name;

-- Listar todos los tipos ENUM creados
SELECT
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values,
  '✅ CREATED' as status
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================================================
-- PARTE 3: RECREAR VIEWS ELIMINADAS
-- ============================================================================

CREATE OR REPLACE VIEW public.active_conversations_by_provider AS
 SELECT provider,
    count(*) AS total,
    count(*) FILTER (WHERE (status = 'active'::conversation_status)) AS active,
    count(*) FILTER (WHERE (status = 'escalated'::conversation_status)) AS escalated,
    count(*) FILTER (WHERE (last_user_message_at > (now() - '24:00:00'::interval))) AS within_24h
   FROM kommo_conversations
  GROUP BY provider;

CREATE OR REPLACE VIEW public.available_products AS
 SELECT id,
    name,
    brand,
    model,
    category,
    size,
    width,
    profile,
    diameter,
    load_index,
    speed_rating,
    description,
    price,
    stock,
    image_url,
    features,
    created_at,
    updated_at
   FROM products
  WHERE (stock > 0);

CREATE OR REPLACE VIEW public.kommo_active_conversations AS
 SELECT id,
    kommo_chat_id,
    kommo_contact_id,
    kommo_lead_id,
    phone,
    contact_name,
    contact_email,
    status,
    message_count,
    bot_message_count,
    user_message_count,
    last_message_at,
    last_bot_response_at,
    escalated_at,
    resolved_at,
    escalation_reason,
    assigned_to,
    channel,
    metadata,
    tags,
    created_at,
    updated_at,
    ( SELECT m.content
           FROM kommo_messages m
          WHERE (m.conversation_id = c.id)
          ORDER BY m.created_at DESC
         LIMIT 1) AS last_message_content,
    ( SELECT m.role
           FROM kommo_messages m
          WHERE (m.conversation_id = c.id)
          ORDER BY m.created_at DESC
         LIMIT 1) AS last_message_role
   FROM kommo_conversations c
  WHERE (status = 'active'::conversation_status)
  ORDER BY last_message_at DESC;

CREATE OR REPLACE VIEW public.kommo_conversation_stats AS
 SELECT date_trunc('day'::text, created_at) AS date,
    channel,
    status,
    count(*) AS conversation_count,
    sum(message_count) AS total_messages,
    sum(bot_message_count) AS bot_messages,
    sum(user_message_count) AS user_messages,
    avg(message_count) AS avg_messages_per_conversation
   FROM kommo_conversations
  GROUP BY (date_trunc('day'::text, created_at)), channel, status
  ORDER BY (date_trunc('day'::text, created_at)) DESC;

CREATE OR REPLACE VIEW public.today_appointments AS
 SELECT id,
    customer_name,
    customer_email,
    customer_phone,
    service_type AS service,
    appointment_date,
    appointment_time,
    branch,
    vehicle_info,
    notes,
    status,
    created_at,
    updated_at
   FROM appointments
  WHERE ((appointment_date = CURRENT_DATE) AND (status <> 'cancelled'::appointment_status))
  ORDER BY appointment_time;

CREATE OR REPLACE VIEW public.whatsapp_appointments AS
 SELECT a.id,
    a.customer_name,
    a.customer_phone,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.notes,
    a.created_at,
    s.name AS store_name,
    srv.name AS service_name,
    srv.duration AS service_duration,
    c.contact_name AS whatsapp_contact,
    c.kommo_chat_id
   FROM (((appointments a
     LEFT JOIN stores s ON ((a.store_id = s.id)))
     LEFT JOIN appointment_services srv ON ((a.service_id = srv.id)))
     LEFT JOIN kommo_conversations c ON ((a.kommo_conversation_id = c.id)))
  WHERE (a.source = 'whatsapp'::text)
  ORDER BY a.appointment_date DESC, a.appointment_time DESC;

DO $$
BEGIN
  RAISE NOTICE '✅ Views recreadas exitosamente';
END $$;

-- ============================================================================
-- PARTE 4: RECREAR TRIGGERS ELIMINADOS
-- ============================================================================

-- Recreate appointments triggers
CREATE TRIGGER trigger_verify_appointment_availability
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION verify_appointment_availability();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recreate orders triggers (with updated WHEN clauses for ENUMs)
CREATE TRIGGER order_payment_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (old.payment_status IS DISTINCT FROM new.payment_status)
  EXECUTE FUNCTION log_order_payment_change();

CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (old.status IS DISTINCT FROM new.status)
  EXECUTE FUNCTION log_order_status_change();

CREATE TRIGGER orders_updated_at_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Recreate kommo_conversations triggers
CREATE TRIGGER trigger_update_kommo_conversation_updated_at
  BEFORE UPDATE ON public.kommo_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_kommo_conversation_updated_at();

-- Recreate kommo_messages triggers
CREATE TRIGGER trigger_update_kommo_message_counts
  AFTER INSERT ON public.kommo_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_kommo_message_counts();

CREATE TRIGGER trigger_update_last_user_message
  AFTER INSERT ON public.kommo_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_user_message_timestamp();

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers recreados exitosamente';
END $$;

-- ============================================================================
-- PARTE 5: RECREAR INDEXES PARCIALES
-- ============================================================================

-- Recreate partial indexes with ENUM comparisons
CREATE INDEX idx_kommo_conversations_active_date
  ON public.kommo_conversations USING btree (status, last_message_at DESC)
  WHERE (status = 'active'::conversation_status);

CREATE INDEX idx_whatsapp_conv_state
  ON public.whatsapp_conversations USING btree (conversation_state)
  WHERE (conversation_state <> 'idle'::conversation_state);

CREATE INDEX idx_whatsapp_conversations_active_date
  ON public.whatsapp_conversations USING btree (status, last_message_at DESC)
  WHERE (status = 'active'::conversation_status);

DO $$
BEGIN
  RAISE NOTICE '✅ Indexes parciales recreados exitosamente';
END $$;

COMMIT;

-- ============================================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================================================
-- 1. Verificar que todas las columnas muestran ✅ IS ENUM
-- 2. Verificar que todos los tipos ENUM se crearon correctamente
-- 3. Actualizar el código de la aplicación para usar los valores ENUM
-- 4. Probar TODAS las funcionalidades que usan estos campos
-- 5. Monitorear logs de errores en próximas 48 horas
-- 6. ROLLBACK: Si algo falla, restaurar desde backup
-- ============================================================================

-- ============================================================================
-- ROLLBACK MANUAL (solo si es necesario)
-- ============================================================================
-- ADVERTENCIA: Esto revierte TODOS los cambios
-- Ejecutar solo si la migración falló completamente
-- ============================================================================
/*
BEGIN;

-- Revertir appointments.status
ALTER TABLE appointments ALTER COLUMN status TYPE VARCHAR(50)
USING status::VARCHAR;

-- Revertir orders
ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(20)
USING status::VARCHAR;

ALTER TABLE orders ALTER COLUMN payment_status TYPE VARCHAR(20)
USING payment_status::VARCHAR;

ALTER TABLE orders ALTER COLUMN payment_method TYPE VARCHAR(50)
USING payment_method::VARCHAR;

ALTER TABLE orders ALTER COLUMN source TYPE VARCHAR(20)
USING source::VARCHAR;

-- Revertir whatsapp_conversations
ALTER TABLE whatsapp_conversations ALTER COLUMN status TYPE TEXT
USING status::TEXT;

ALTER TABLE whatsapp_conversations ALTER COLUMN conversation_state TYPE TEXT
USING conversation_state::TEXT;

-- Revertir kommo_conversations
ALTER TABLE kommo_conversations ALTER COLUMN status TYPE TEXT
USING status::TEXT;

ALTER TABLE kommo_conversations ALTER COLUMN channel TYPE TEXT
USING channel::TEXT;

-- Revertir messages
ALTER TABLE whatsapp_messages ALTER COLUMN role TYPE TEXT
USING role::TEXT;

ALTER TABLE kommo_messages ALTER COLUMN role TYPE TEXT
USING role::TEXT;

ALTER TABLE kommo_messages ALTER COLUMN content_type TYPE TEXT
USING content_type::TEXT;

-- Eliminar tipos ENUM
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS order_source CASCADE;
DROP TYPE IF EXISTS conversation_status CASCADE;
DROP TYPE IF EXISTS conversation_state CASCADE;
DROP TYPE IF EXISTS message_role CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS channel_type CASCADE;

COMMIT;

RAISE NOTICE 'ROLLBACK COMPLETADO - Restaurar defaults originales manualmente';
*/
