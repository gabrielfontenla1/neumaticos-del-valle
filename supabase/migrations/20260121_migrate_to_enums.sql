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
-- PARTE 2: MIGRAR COLUMNAS A ENUM
-- ============================================================================
-- ADVERTENCIA: Esto puede fallar si existen valores no contemplados en ENUM
-- Verificar primero con:
-- SELECT DISTINCT status FROM appointments;
-- SELECT DISTINCT status FROM orders;
-- etc.
-- ============================================================================

RAISE NOTICE '==================================================';
RAISE NOTICE 'INICIANDO MIGRACIÓN A ENUMS';
RAISE NOTICE 'Esta operación puede tomar varios minutos...';
RAISE NOTICE '==================================================';

-- 2.1: appointments.status
DO $$
BEGIN
  -- Verificar valores únicos primero
  RAISE NOTICE 'Valores actuales en appointments.status:';
  PERFORM DISTINCT status FROM appointments;

  -- Normalizar valores (convertir a minúsculas, trimear espacios)
  UPDATE appointments SET status = LOWER(TRIM(status));

  -- Migrar
  ALTER TABLE appointments
  ALTER COLUMN status TYPE appointment_status
  USING status::appointment_status;

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

  ALTER TABLE orders
  ALTER COLUMN status TYPE order_status
  USING status::order_status;

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

  ALTER TABLE orders
  ALTER COLUMN payment_status TYPE payment_status
  USING payment_status::payment_status;

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

  ALTER TABLE orders
  ALTER COLUMN source TYPE order_source
  USING source::order_source;

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

  ALTER TABLE whatsapp_conversations
  ALTER COLUMN status TYPE conversation_status
  USING status::conversation_status;

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

  ALTER TABLE kommo_conversations
  ALTER COLUMN status TYPE conversation_status
  USING status::conversation_status;

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

  ALTER TABLE whatsapp_conversations
  ALTER COLUMN conversation_state TYPE conversation_state
  USING conversation_state::conversation_state;

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

  ALTER TABLE kommo_messages
  ALTER COLUMN content_type TYPE content_type
  USING content_type::content_type;

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

  ALTER TABLE kommo_conversations
  ALTER COLUMN channel TYPE channel_type
  USING channel::channel_type;

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
