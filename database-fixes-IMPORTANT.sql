-- ============================================================================
-- DATABASE SCHEMA FIXES - IMPORTANT
-- ============================================================================
-- IMPORTANTE: Ejecutar DESPUÉS de database-fixes-CRITICAL.sql
-- Revisar y ejecutar en orden
-- Ejecutar en ambiente de desarrollo primero
-- Backup completo antes de ejecutar en producción
-- Algunas migraciones pueden tomar tiempo en tablas grandes
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: AGREGAR FOREIGN KEYS FALTANTES
-- ============================================================================

-- FIX #7.1: profiles.id → auth.users.id
-- Verificar si ya existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

    RAISE NOTICE '✅ FK profiles.id → auth.users.id agregado';
  ELSE
    RAISE NOTICE '⚠️  FK profiles.id → auth.users.id ya existe';
  END IF;
END $$;

-- FIX #7.2: branch_stock.updated_by → profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'branch_stock_updated_by_fkey'
  ) THEN
    ALTER TABLE branch_stock
    ADD CONSTRAINT branch_stock_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_branch_stock_updated_by ON branch_stock(updated_by);

    RAISE NOTICE '✅ FK branch_stock.updated_by → profiles.id agregado';
  ELSE
    RAISE NOTICE '⚠️  FK branch_stock.updated_by → profiles.id ya existe';
  END IF;
END $$;

-- FIX #7.3: config_audit_log.changed_by → auth.users.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'config_audit_log_changed_by_fkey'
  ) THEN
    ALTER TABLE config_audit_log
    ADD CONSTRAINT config_audit_log_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

    RAISE NOTICE '✅ FK config_audit_log.changed_by → auth.users.id agregado';
  ELSE
    RAISE NOTICE '⚠️  FK config_audit_log.changed_by → auth.users.id ya existe';
  END IF;
END $$;

-- FIX #7.4: config_backups.created_by → auth.users.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'config_backups_created_by_fkey'
  ) THEN
    ALTER TABLE config_backups
    ADD CONSTRAINT config_backups_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

    RAISE NOTICE '✅ FK config_backups.created_by → auth.users.id agregado';
  ELSE
    RAISE NOTICE '⚠️  FK config_backups.created_by → auth.users.id ya existe';
  END IF;
END $$;

-- FIX #7.5: order_history.user_id → auth.users.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_history_user_id_fkey'
  ) THEN
    ALTER TABLE order_history
    ADD CONSTRAINT order_history_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

    RAISE NOTICE '✅ FK order_history.user_id → auth.users.id agregado';
  ELSE
    RAISE NOTICE '⚠️  FK order_history.user_id → auth.users.id ya existe';
  END IF;
END $$;

-- FIX #7.6: orders.store_id → stores.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_store_id_fkey'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL;

    RAISE NOTICE '✅ FK orders.store_id → stores.id agregado';
  ELSE
    RAISE NOTICE '⚠️  FK orders.store_id → stores.id ya existe';
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: LIMPIAR INCONSISTENCIAS DE NAMING
-- ============================================================================

-- FIX #10: Eliminar campo duplicado branches.active (mantener is_active)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branches' AND column_name = 'active'
  ) THEN
    -- Migrar datos si is_active es NULL
    UPDATE branches SET is_active = COALESCE(is_active, active, true);

    -- Eliminar columna duplicada
    ALTER TABLE branches DROP COLUMN active;

    RAISE NOTICE '✅ Campo duplicado branches.active eliminado';
  ELSE
    RAISE NOTICE '⚠️  Campo branches.active ya no existe';
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: AGREGAR CONSTRAINTS NOT NULL EN CAMPOS CRÍTICOS
-- ============================================================================

-- FIX #9.1: branches - campos críticos
DO $$
BEGIN
  -- Limpiar datos nulos primero
  UPDATE branches SET phone = 'sin-telefono' WHERE phone IS NULL;
  UPDATE branches SET email = 'sin-email@example.com' WHERE email IS NULL;

  -- Agregar constraints
  ALTER TABLE branches ALTER COLUMN phone SET NOT NULL;
  ALTER TABLE branches ALTER COLUMN email SET NOT NULL;

  RAISE NOTICE '✅ Constraints NOT NULL agregados a branches';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Error agregando NOT NULL a branches: %', SQLERRM;
END $$;

-- FIX #9.2: products - campos básicos
DO $$
BEGIN
  -- Limpiar datos nulos
  UPDATE products SET brand = 'Sin marca' WHERE brand IS NULL;
  UPDATE products SET category = 'Sin categoría' WHERE category IS NULL;

  -- Agregar constraints
  ALTER TABLE products ALTER COLUMN brand SET NOT NULL;
  ALTER TABLE products ALTER COLUMN category SET NOT NULL;

  RAISE NOTICE '✅ Constraints NOT NULL agregados a products';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Error agregando NOT NULL a products: %', SQLERRM;
END $$;

-- FIX #9.3: stores - contacto requerido
DO $$
BEGIN
  UPDATE stores SET phone = 'sin-telefono' WHERE phone IS NULL;

  ALTER TABLE stores ALTER COLUMN phone SET NOT NULL;

  RAISE NOTICE '✅ Constraint NOT NULL agregado a stores.phone';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Error agregando NOT NULL a stores: %', SQLERRM;
END $$;

-- FIX #9.4: whatsapp_conversations - contact_name
DO $$
BEGIN
  UPDATE whatsapp_conversations SET contact_name = 'Sin nombre' WHERE contact_name IS NULL;

  ALTER TABLE whatsapp_conversations ALTER COLUMN contact_name SET NOT NULL;

  RAISE NOTICE '✅ Constraint NOT NULL agregado a whatsapp_conversations.contact_name';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Error agregando NOT NULL a whatsapp_conversations: %', SQLERRM;
END $$;

-- ============================================================================
-- PARTE 4: AGREGAR ÍNDICES FALTANTES
-- ============================================================================

-- FIX #13.1: Búsqueda por email en orders (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_lower
ON orders (LOWER(customer_email));

-- FIX #13.2: Habilitar extensión pg_trgm para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Búsqueda por nombre en appointments
CREATE INDEX IF NOT EXISTS idx_appointments_customer_name_trgm
ON appointments USING gin (customer_name gin_trgm_ops);

-- FIX #13.3: Búsqueda de productos por marca y categoría
CREATE INDEX IF NOT EXISTS idx_products_brand_category
ON products (brand, category)
WHERE brand IS NOT NULL AND category IS NOT NULL;

-- FIX #13.4: Conversaciones activas por fecha
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_active_date
ON whatsapp_conversations (status, last_message_at DESC)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_kommo_conversations_active_date
ON kommo_conversations (status, last_message_at DESC)
WHERE status = 'active';

DO $$
BEGIN
  RAISE NOTICE '✅ Índices adicionales creados';
END $$;

-- ============================================================================
-- PARTE 5: MIGRAR CAMPOS TEXT A VARCHAR CON LÍMITES
-- ============================================================================

-- FIX #12: Campos de identificación/código
DO $$
BEGIN
  -- app_settings
  ALTER TABLE app_settings ALTER COLUMN key TYPE VARCHAR(100);
  ALTER TABLE app_settings ALTER COLUMN description TYPE VARCHAR(500);

  -- kommo_conversations
  ALTER TABLE kommo_conversations ALTER COLUMN kommo_chat_id TYPE VARCHAR(100);
  ALTER TABLE kommo_conversations ALTER COLUMN kommo_contact_id TYPE VARCHAR(100);
  ALTER TABLE kommo_conversations ALTER COLUMN kommo_lead_id TYPE VARCHAR(100);
  ALTER TABLE kommo_conversations ALTER COLUMN phone TYPE VARCHAR(50);
  ALTER TABLE kommo_conversations ALTER COLUMN escalation_reason TYPE VARCHAR(500);
  ALTER TABLE kommo_conversations ALTER COLUMN assigned_to TYPE VARCHAR(100);

  -- whatsapp_conversations
  ALTER TABLE whatsapp_conversations ALTER COLUMN phone TYPE VARCHAR(50);
  ALTER TABLE whatsapp_conversations ALTER COLUMN contact_name TYPE VARCHAR(255);
  ALTER TABLE whatsapp_conversations ALTER COLUMN pause_reason TYPE VARCHAR(500);
  ALTER TABLE whatsapp_conversations ALTER COLUMN user_city TYPE VARCHAR(100);

  -- whatsapp_messages
  ALTER TABLE whatsapp_messages ALTER COLUMN intent TYPE VARCHAR(100);

  -- kommo_messages
  ALTER TABLE kommo_messages ALTER COLUMN kommo_message_id TYPE VARCHAR(100);
  ALTER TABLE kommo_messages ALTER COLUMN intent TYPE VARCHAR(100);
  ALTER TABLE kommo_messages ALTER COLUMN sentiment TYPE VARCHAR(50);
  ALTER TABLE kommo_messages ALTER COLUMN ai_model TYPE VARCHAR(100);

  RAISE NOTICE '✅ Campos TEXT migrados a VARCHAR con límites';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Error migrando TEXT a VARCHAR: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICACIÓN POST-APLICACIÓN
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'IMPORTANT FIXES APLICADOS EXITOSAMENTE';
  RAISE NOTICE '==================================================';
END $$;

-- Verificar foreign keys agregados
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  '✅ FK EXISTS' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'branch_stock', 'config_audit_log', 'config_backups', 'order_history', 'orders')
  AND kcu.column_name IN ('id', 'updated_by', 'changed_by', 'created_by', 'user_id', 'store_id')
ORDER BY tc.table_name, kcu.column_name;

-- Verificar índices creados
SELECT
  tablename,
  indexname,
  '✅ INDEX EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_branch_stock_updated_by',
    'idx_orders_customer_email_lower',
    'idx_appointments_customer_name_trgm',
    'idx_products_brand_category',
    'idx_whatsapp_conversations_active_date',
    'idx_kommo_conversations_active_date'
  )
ORDER BY tablename, indexname;

COMMIT;

-- ============================================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================================================
-- 1. Verificar que todas las queries muestran ✅
-- 2. Analizar performance de queries con EXPLAIN ANALYZE
-- 3. Monitorear logs de errores en próximas 24 horas
-- 4. Proceder con database-fixes-ENUMS.sql para migrar a tipos ENUM
-- ============================================================================
