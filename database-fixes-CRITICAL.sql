-- ============================================================================
-- DATABASE SECURITY FIXES - CRITICAL
-- ============================================================================
-- IMPORTANTE: Revisar y ejecutar en orden
-- Ejecutar en ambiente de desarrollo primero
-- Backup completo antes de ejecutar en producción
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX #1: HABILITAR RLS EN PROFILES
-- ============================================================================
-- CRÍTICO: profiles expone emails, teléfonos, roles sin protección

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recrear policies restrictivas
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO public
USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO public
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Allow trigger to insert profiles"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

-- ============================================================================
-- FIX #2: HABILITAR RLS EN APPOINTMENT_SERVICES
-- ============================================================================

ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view appointment services" ON appointment_services;
DROP POLICY IF EXISTS "Only service role can modify appointment services" ON appointment_services;

CREATE POLICY "Anyone can view appointment services"
ON appointment_services FOR SELECT
TO public
USING (true);

CREATE POLICY "Only service role can modify appointment services"
ON appointment_services FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FIX #3: ARREGLAR POLICIES DE ORDERS
-- ============================================================================
-- CRÍTICO: orders completamente público

DROP POLICY IF EXISTS "Enable all for orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Solo staff puede ver pedidos
CREATE POLICY "Staff can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
);

-- Solo admins pueden crear pedidos
CREATE POLICY "Admins can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Solo admins pueden actualizar pedidos
CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- FIX #4: ARREGLAR POLICIES DE ORDER_HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Enable all for order_history" ON order_history;
DROP POLICY IF EXISTS "Staff can view order history" ON order_history;
DROP POLICY IF EXISTS "System can insert order history" ON order_history;

-- Solo staff puede ver historial
CREATE POLICY "Staff can view order history"
ON order_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
);

-- Sistema puede insertar (via trigger)
CREATE POLICY "System can insert order history"
ON order_history FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================================================
-- FIX #5: ARREGLAR POLICIES DE WHATSAPP_CONVERSATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can update whatsapp_conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "Staff can update whatsapp conversations" ON whatsapp_conversations;

-- Solo admins y vendedores pueden actualizar conversaciones
CREATE POLICY "Staff can update whatsapp conversations"
ON whatsapp_conversations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
);

-- ============================================================================
-- FIX #6: ARREGLAR POLICIES DE BRANCH_STOCK
-- ============================================================================

DROP POLICY IF EXISTS "Branch stock is editable by authenticated users" ON branch_stock;
DROP POLICY IF EXISTS "Staff can manage branch stock" ON branch_stock;

-- Solo admins y vendedores pueden modificar stock
CREATE POLICY "Staff can manage branch stock"
ON branch_stock FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
);

-- ============================================================================
-- VERIFICACIÓN POST-APLICACIÓN
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'CRITICAL FIXES APLICADOS EXITOSAMENTE';
  RAISE NOTICE '==================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Verificando RLS habilitado...';
END $$;

SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED - ERROR!'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'appointment_services', 'orders', 'order_history', 'whatsapp_conversations', 'branch_stock')
ORDER BY tablename;

-- Contar policies por tabla crítica
SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ HAS POLICIES'
    ELSE '❌ NO POLICIES - ERROR!'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'appointment_services', 'orders', 'order_history', 'whatsapp_conversations', 'branch_stock')
GROUP BY tablename
ORDER BY tablename;

COMMIT;

-- ============================================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================================================
-- 1. Verificar que todas las queries muestran ✅
-- 2. Probar acceso desde aplicación con usuario normal (NO admin)
-- 3. Probar acceso desde aplicación con usuario admin
-- 4. Verificar logs de errores en próximas 24 horas
-- 5. Proceder con database-fixes-IMPORTANT.sql
-- ============================================================================
