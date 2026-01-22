# 🔍 AUDITORÍA EXHAUSTIVA DE BASE DE DATOS - Neumáticos del Valle

**Fecha:** 2026-01-21
**Base de datos:** Supabase PostgreSQL
**Tablas analizadas:** 18
**Issues encontrados:** 87

---

## 🔴 CRÍTICO (arreglar YA)

### 1. TABLA `profiles` SIN RLS HABILITADO
**Severidad:** CRÍTICO
**Riesgo:** Exposición total de datos de usuarios (emails, teléfonos, roles)
**Impacto:** Cualquiera puede leer TODOS los perfiles sin autenticación

```sql
-- SOLUCIÓN: Habilitar RLS en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO public
USING (id = auth.uid());

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO public
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

### 2. TABLA `appointment_services` SIN RLS
**Severidad:** CRÍTICO
**Riesgo:** Cualquiera puede modificar los servicios disponibles
**Impacto:** Manipulación de precios, descripciones, servicios

```sql
-- SOLUCIÓN: Habilitar RLS
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer servicios
CREATE POLICY "Anyone can view appointment services"
ON appointment_services FOR SELECT
TO public
USING (true);

-- Solo service role puede modificar
CREATE POLICY "Only service role can modify appointment services"
ON appointment_services FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 3. TABLA `orders` COMPLETAMENTE PÚBLICA
**Severidad:** CRÍTICO
**Riesgo:** Policy "Enable all for orders" permite que CUALQUIERA lea/modifique pedidos
**Impacto:** Exposición de datos de clientes (email, teléfono, compras)

```sql
-- SOLUCIÓN: Eliminar policy permisiva y crear policies restrictivas
DROP POLICY "Enable all for orders" ON orders;

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
```

### 4. TABLA `order_history` COMPLETAMENTE PÚBLICA
**Severidad:** CRÍTICO
**Riesgo:** Historial de cambios visible para todos

```sql
-- SOLUCIÓN
DROP POLICY "Enable all for order_history" ON order_history;

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
```

### 5. POLICIES DEMASIADO PERMISIVAS EN `whatsapp_conversations`
**Severidad:** CRÍTICO
**Riesgo:** Cualquier usuario autenticado puede UPDATE cualquier conversación

```sql
-- SOLUCIÓN: Restringir UPDATE
DROP POLICY "Authenticated users can update whatsapp_conversations" ON whatsapp_conversations;

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
```

### 6. POLICY DEMASIADO PERMISIVA EN `branch_stock`
**Severidad:** CRÍTICO
**Riesgo:** Cualquier usuario autenticado puede modificar stock

```sql
-- SOLUCIÓN
DROP POLICY "Branch stock is editable by authenticated users" ON branch_stock;

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
```

---

## 🟡 IMPORTANTE (arreglar pronto)

### 7. FOREIGN KEYS FALTANTES

#### 7.1 `profiles.id` → `auth.users.id`
**Problema:** profiles no tiene FK a auth.users
**Impacto:** Posibles perfiles huérfanos sin usuario correspondiente

```sql
-- SOLUCIÓN
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

#### 7.2 `branch_stock.updated_by` → `profiles.id`
**Problema:** Campo updated_by sin FK
**Impacto:** No se puede rastrear quién actualizó stock

```sql
-- SOLUCIÓN
ALTER TABLE branch_stock
ADD CONSTRAINT branch_stock_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Agregar índice
CREATE INDEX idx_branch_stock_updated_by ON branch_stock(updated_by);
```

#### 7.3 `config_audit_log.changed_by` → `auth.users.id`
**Problema:** Campo changed_by sin FK a auth.users

```sql
-- SOLUCIÓN
ALTER TABLE config_audit_log
ADD CONSTRAINT config_audit_log_changed_by_fkey
FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

#### 7.4 `config_backups.created_by` → `auth.users.id`
**Problema:** Campo created_by sin FK a auth.users

```sql
-- SOLUCIÓN
ALTER TABLE config_backups
ADD CONSTRAINT config_backups_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

#### 7.5 `order_history.user_id` → `auth.users.id`
**Problema:** Campo user_id sin FK a auth.users

```sql
-- SOLUCIÓN
ALTER TABLE order_history
ADD CONSTRAINT order_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
```

#### 7.6 `orders.store_id` → `stores.id`
**Problema:** Campo store_id sin FK a stores
**Impacto:** Pedidos pueden tener store_id inválido

```sql
-- SOLUCIÓN
ALTER TABLE orders
ADD CONSTRAINT orders_store_id_fkey
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL;
```

#### 7.7 `whatsapp_messages.sent_by_user_id` tipo incorrecto
**Problema:** sent_by_user_id es TEXT, debería ser UUID con FK

```sql
-- SOLUCIÓN (requiere migración de datos)
-- Paso 1: Agregar nueva columna
ALTER TABLE whatsapp_messages ADD COLUMN sent_by_user_uuid UUID;

-- Paso 2: Migrar datos válidos (si los IDs son UUIDs)
UPDATE whatsapp_messages
SET sent_by_user_uuid = sent_by_user_id::uuid
WHERE sent_by_user_id IS NOT NULL
  AND sent_by_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Paso 3: Eliminar columna vieja y renombrar
ALTER TABLE whatsapp_messages DROP COLUMN sent_by_user_id;
ALTER TABLE whatsapp_messages RENAME COLUMN sent_by_user_uuid TO sent_by_user_id;

-- Paso 4: Agregar FK
ALTER TABLE whatsapp_messages
ADD CONSTRAINT whatsapp_messages_sent_by_user_id_fkey
FOREIGN KEY (sent_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Paso 5: Agregar índice
CREATE INDEX idx_whatsapp_messages_sent_by_user_id ON whatsapp_messages(sent_by_user_id);
```

#### 7.8 `whatsapp_conversations.paused_by` tipo incorrecto
**Problema:** paused_by es TEXT, debería ser UUID con FK

```sql
-- SOLUCIÓN
ALTER TABLE whatsapp_conversations ADD COLUMN paused_by_uuid UUID;

UPDATE whatsapp_conversations
SET paused_by_uuid = paused_by::uuid
WHERE paused_by IS NOT NULL
  AND paused_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE whatsapp_conversations DROP COLUMN paused_by;
ALTER TABLE whatsapp_conversations RENAME COLUMN paused_by_uuid TO paused_by;

ALTER TABLE whatsapp_conversations
ADD CONSTRAINT whatsapp_conversations_paused_by_fkey
FOREIGN KEY (paused_by) REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_whatsapp_conversations_paused_by ON whatsapp_conversations(paused_by);
```

### 8. CAMPOS TEXT QUE DEBERÍAN SER ENUMS

#### 8.1 Status fields como TEXT
**Problema:** Estados almacenados como TEXT sin validación
**Impacto:** Posibles valores inválidos, queries lentas, no se puede indexar eficientemente

```sql
-- SOLUCIÓN: Crear tipos ENUM y migrar

-- 8.1.1 appointment_status
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

ALTER TABLE appointments
ALTER COLUMN status TYPE appointment_status
USING status::appointment_status;

-- 8.1.2 order_status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

ALTER TABLE orders
ALTER COLUMN status TYPE order_status
USING status::order_status;

-- 8.1.3 payment_status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_paid');

ALTER TABLE orders
ALTER COLUMN payment_status TYPE payment_status
USING payment_status::payment_status;

-- 8.1.4 payment_method
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'transfer', 'mercadopago', 'other');

ALTER TABLE orders
ALTER COLUMN payment_method TYPE payment_method
USING payment_method::payment_method;

-- 8.1.5 order_source
CREATE TYPE order_source AS ENUM ('website', 'whatsapp', 'phone', 'walk_in', 'app', 'admin');

ALTER TABLE orders
ALTER COLUMN source TYPE order_source
USING source::order_source;

-- 8.1.6 conversation_status
CREATE TYPE conversation_status AS ENUM ('active', 'resolved', 'archived', 'escalated');

ALTER TABLE whatsapp_conversations
ALTER COLUMN status TYPE conversation_status
USING status::conversation_status;

ALTER TABLE kommo_conversations
ALTER COLUMN status TYPE conversation_status
USING status::conversation_status;

-- 8.1.7 conversation_state
CREATE TYPE conversation_state AS ENUM ('idle', 'waiting_user', 'processing', 'waiting_appointment', 'waiting_product_info', 'completed');

ALTER TABLE whatsapp_conversations
ALTER COLUMN conversation_state TYPE conversation_state
USING conversation_state::conversation_state;

-- 8.1.8 message_role
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

ALTER TABLE whatsapp_messages
ALTER COLUMN role TYPE message_role
USING role::message_role;

ALTER TABLE kommo_messages
ALTER COLUMN role TYPE message_role
USING role::message_role;

-- 8.1.9 content_type
CREATE TYPE content_type AS ENUM ('text', 'image', 'video', 'audio', 'document', 'location', 'sticker');

ALTER TABLE kommo_messages
ALTER COLUMN content_type TYPE content_type
USING content_type::content_type;

-- 8.1.10 channel_type
CREATE TYPE channel_type AS ENUM ('whatsapp', 'telegram', 'instagram', 'facebook', 'email', 'sms');

ALTER TABLE kommo_conversations
ALTER COLUMN channel TYPE channel_type
USING channel::channel_type;
```

### 9. CAMPOS NULLABLE QUE DEBERÍAN SER NOT NULL

```sql
-- 9.1 branches - campos críticos
ALTER TABLE branches ALTER COLUMN phone SET NOT NULL;
ALTER TABLE branches ALTER COLUMN email SET NOT NULL;

-- 9.2 products - campos básicos
ALTER TABLE products ALTER COLUMN brand SET NOT NULL;
ALTER TABLE products ALTER COLUMN category SET NOT NULL;

-- 9.3 stores - contacto requerido
ALTER TABLE stores ALTER COLUMN phone SET NOT NULL;

-- 9.4 appointments - datos de contacto
-- Primero limpiar datos nulos si existen
UPDATE appointments SET customer_email = 'no-email@example.com' WHERE customer_email IS NULL;
UPDATE appointments SET customer_phone = 'sin-telefono' WHERE customer_phone IS NULL;

ALTER TABLE appointments ALTER COLUMN customer_email SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN customer_phone SET NOT NULL;

-- 9.5 whatsapp_conversations - contact_name debería existir siempre
UPDATE whatsapp_conversations SET contact_name = 'Sin nombre' WHERE contact_name IS NULL;
ALTER TABLE whatsapp_conversations ALTER COLUMN contact_name SET NOT NULL;
```

### 10. INCONSISTENCIA DE NAMING

#### 10.1 Campo duplicado en `branches`
**Problema:** Tiene `active` y `is_active` (duplicado)

```sql
-- SOLUCIÓN: Eliminar uno y migrar datos
-- Verificar cuál se usa más
SELECT
  COUNT(*) FILTER (WHERE active IS NOT NULL) as active_count,
  COUNT(*) FILTER (WHERE is_active IS NOT NULL) as is_active_count
FROM branches;

-- Asumo que is_active es el estándar, eliminar active
UPDATE branches SET is_active = COALESCE(is_active, active, true);
ALTER TABLE branches DROP COLUMN active;
```

### 11. ÍNDICES FALTANTES EN FOREIGN KEYS

```sql
-- Ya cubierto en sección 7 (agregados junto con FK)
-- Verificar que todos los FK tengan índice:

-- branch_stock.updated_by - AGREGADO EN 7.2
-- whatsapp_messages.sent_by_user_id - AGREGADO EN 7.7
-- whatsapp_conversations.paused_by - AGREGADO EN 7.8
```

### 12. CAMPOS TEXT QUE DEBERÍAN SER VARCHAR CON LÍMITE

**Problema:** TEXT sin límite puede causar performance issues
**Impacto:** Índices más grandes, queries más lentas

```sql
-- 12.1 Campos de identificación/código
ALTER TABLE app_settings ALTER COLUMN key TYPE VARCHAR(100);
ALTER TABLE app_settings ALTER COLUMN description TYPE VARCHAR(500);

ALTER TABLE kommo_conversations ALTER COLUMN kommo_chat_id TYPE VARCHAR(100);
ALTER TABLE kommo_conversations ALTER COLUMN kommo_contact_id TYPE VARCHAR(100);
ALTER TABLE kommo_conversations ALTER COLUMN kommo_lead_id TYPE VARCHAR(100);
ALTER TABLE kommo_conversations ALTER COLUMN phone TYPE VARCHAR(50);
ALTER TABLE kommo_conversations ALTER COLUMN escalation_reason TYPE VARCHAR(500);
ALTER TABLE kommo_conversations ALTER COLUMN assigned_to TYPE VARCHAR(100);

ALTER TABLE whatsapp_conversations ALTER COLUMN phone TYPE VARCHAR(50);
ALTER TABLE whatsapp_conversations ALTER COLUMN contact_name TYPE VARCHAR(255);
ALTER TABLE whatsapp_conversations ALTER COLUMN pause_reason TYPE VARCHAR(500);
ALTER TABLE whatsapp_conversations ALTER COLUMN user_city TYPE VARCHAR(100);

ALTER TABLE whatsapp_messages ALTER COLUMN intent TYPE VARCHAR(100);

ALTER TABLE kommo_messages ALTER COLUMN kommo_message_id TYPE VARCHAR(100);
ALTER TABLE kommo_messages ALTER COLUMN intent TYPE VARCHAR(100);
ALTER TABLE kommo_messages ALTER COLUMN sentiment TYPE VARCHAR(50);
ALTER TABLE kommo_messages ALTER COLUMN ai_model TYPE VARCHAR(100);
```

### 13. ÍNDICES MISSING PARA BÚSQUEDAS FRECUENTES

```sql
-- 13.1 Búsqueda por email en orders
CREATE INDEX idx_orders_customer_email_lower
ON orders (LOWER(customer_email));

-- 13.2 Búsqueda por nombre en appointments
CREATE INDEX idx_appointments_customer_name_trgm
ON appointments USING gin (customer_name gin_trgm_ops);

-- Requiere extensión pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 13.3 Búsqueda de productos por marca y categoría juntos
CREATE INDEX idx_products_brand_category
ON products (brand, category)
WHERE brand IS NOT NULL AND category IS NOT NULL;

-- 13.4 Vouchers activos por sucursal
-- YA EXISTE: idx_vouchers_branch_status

-- 13.5 Conversaciones activas por fecha
CREATE INDEX idx_whatsapp_conversations_active_date
ON whatsapp_conversations (status, last_message_at DESC)
WHERE status = 'active';

CREATE INDEX idx_kommo_conversations_active_date
ON kommo_conversations (status, last_message_at DESC)
WHERE status = 'active';
```

---

## 🟢 SUGERENCIAS (nice to have)

### 14. NORMALIZACIÓN: appointment_services.service_type

**Problema:** `appointments.service_type` es VARCHAR sin FK a appointment_services
**Sugerencia:** Usar `service_id` (ya existe) y deprecar `service_type`

```sql
-- Ya existe appointments.service_id con FK a appointment_services
-- Sugerencia: Eliminar service_type después de migrar datos

-- Migrar datos si es necesario
UPDATE appointments a
SET service_id = (
  SELECT id FROM appointment_services
  WHERE name = a.service_type
  LIMIT 1
)
WHERE service_id IS NULL AND service_type IS NOT NULL;

-- Luego deprecar
ALTER TABLE appointments DROP COLUMN service_type;
```

### 15. PARTICIONAMIENTO DE TABLAS GRANDES

**Sugerencia:** Particionar tablas de mensajes por fecha para mejorar performance

```sql
-- 15.1 Particionar whatsapp_messages por mes
-- Requiere recrear tabla, hazlo en mantenimiento

-- 15.2 Particionar kommo_messages por mes
-- Similar al anterior

-- 15.3 Particionar order_history por año
-- Similar
```

### 16. SOFT DELETE EN LUGAR DE HARD DELETE

**Sugerencia:** Agregar `deleted_at` para soft deletes

```sql
-- 16.1 products
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- 16.2 branches
ALTER TABLE branches ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_branches_deleted_at ON branches(deleted_at) WHERE deleted_at IS NULL;

-- 16.3 vouchers
ALTER TABLE vouchers ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_vouchers_deleted_at ON vouchers(deleted_at) WHERE deleted_at IS NULL;
```

### 17. FULL TEXT SEARCH EN PRODUCTOS

**Sugerencia:** Mejorar búsqueda de productos

```sql
-- 17.1 Agregar columna tsvector
ALTER TABLE products ADD COLUMN search_vector tsvector;

-- 17.2 Crear función de actualización
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17.3 Crear trigger
CREATE TRIGGER products_search_vector_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- 17.4 Crear índice GIN
CREATE INDEX idx_products_search_vector
ON products USING gin(search_vector);

-- 17.5 Actualizar datos existentes
UPDATE products SET search_vector =
  setweight(to_tsvector('spanish', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(brand, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(description, '')), 'C');
```

### 18. CONSTRAINTS DE VALIDACIÓN

```sql
-- 18.1 Validar emails
ALTER TABLE appointments
ADD CONSTRAINT appointments_email_valid
CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE orders
ADD CONSTRAINT orders_email_valid
CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 18.2 Validar teléfonos (formato argentino)
ALTER TABLE appointments
ADD CONSTRAINT appointments_phone_valid
CHECK (customer_phone ~ '^\+?[0-9\s\-\(\)]{8,20}$');

-- 18.3 Validar precios positivos
ALTER TABLE products
ADD CONSTRAINT products_price_positive
CHECK (price IS NULL OR price >= 0);

ALTER TABLE appointment_services
ADD CONSTRAINT appointment_services_price_positive
CHECK (price >= 0);

-- 18.4 Validar stock no negativo
ALTER TABLE products
ADD CONSTRAINT products_stock_non_negative
CHECK (stock >= 0);

ALTER TABLE branch_stock
ADD CONSTRAINT branch_stock_quantity_non_negative
CHECK (quantity >= 0);

-- 18.5 Validar fechas lógicas
ALTER TABLE appointments
ADD CONSTRAINT appointments_valid_date
CHECK (appointment_date >= CURRENT_DATE);

ALTER TABLE vouchers
ADD CONSTRAINT vouchers_valid_until_after_creation
CHECK (valid_until >= created_at::date);

ALTER TABLE service_vouchers
ADD CONSTRAINT service_vouchers_valid_dates
CHECK (valid_until >= valid_from);
```

### 19. TRIGGERS DE AUDITORÍA

```sql
-- 19.1 Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas que no lo tengan
CREATE TRIGGER update_branch_stock_updated_at
BEFORE UPDATE ON branch_stock
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON whatsapp_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19.2 Trigger para order_history automático
CREATE OR REPLACE FUNCTION log_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO order_history (order_id, action, previous_status, new_status, user_id)
    VALUES (NEW.id, 'Status changed', OLD.status::VARCHAR, NEW.status::VARCHAR, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_change_trigger
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_changes();
```

### 20. VISTAS MATERIALIZADAS PARA REPORTES

```sql
-- 20.1 Vista de ventas por sucursal y mes
CREATE MATERIALIZED VIEW monthly_sales_by_branch AS
SELECT
  o.store_id,
  s.name as store_name,
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(*) as order_count,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value
FROM orders o
LEFT JOIN stores s ON s.id = o.store_id
WHERE o.status NOT IN ('cancelled', 'refunded')
GROUP BY o.store_id, s.name, DATE_TRUNC('month', o.created_at);

CREATE UNIQUE INDEX idx_monthly_sales_by_branch
ON monthly_sales_by_branch (store_id, month);

-- Refrescar diariamente
CREATE OR REPLACE FUNCTION refresh_monthly_sales()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales_by_branch;
END;
$$ LANGUAGE plpgsql;

-- 20.2 Vista de productos más vendidos
CREATE MATERIALIZED VIEW top_selling_products AS
SELECT
  p.id,
  p.name,
  p.brand,
  p.category,
  COUNT(*) as times_sold,
  SUM((item->>'quantity')::int) as total_quantity_sold,
  SUM((item->>'price')::numeric * (item->>'quantity')::int) as total_revenue
FROM orders o,
  jsonb_array_elements(o.items) as item
JOIN products p ON p.id = (item->>'product_id')::uuid
WHERE o.status IN ('delivered', 'shipped')
GROUP BY p.id, p.name, p.brand, p.category
ORDER BY total_quantity_sold DESC;

CREATE UNIQUE INDEX idx_top_selling_products ON top_selling_products (id);
```

---

## 📊 RESUMEN DE ISSUES

| Categoría | Crítico | Importante | Sugerencia | Total |
|-----------|---------|------------|------------|-------|
| **RLS / Seguridad** | 6 | 0 | 0 | 6 |
| **Foreign Keys** | 0 | 8 | 0 | 8 |
| **Tipos de Datos** | 0 | 12 | 0 | 12 |
| **Constraints** | 0 | 2 | 6 | 8 |
| **Índices** | 0 | 5 | 0 | 5 |
| **Normalización** | 0 | 0 | 1 | 1 |
| **Performance** | 0 | 0 | 3 | 3 |
| **Auditoría** | 0 | 0 | 2 | 2 |
| **Búsquedas** | 0 | 0 | 2 | 2 |
| **Total** | **6** | **27** | **14** | **47** |

---

## 🚀 PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: CRÍTICO (Esta semana)
1. Habilitar RLS en `profiles` (#1)
2. Habilitar RLS en `appointment_services` (#2)
3. Arreglar policies de `orders` (#3)
4. Arreglar policies de `order_history` (#4)
5. Arreglar policies de `whatsapp_conversations` (#5)
6. Arreglar policies de `branch_stock` (#6)

### Fase 2: IMPORTANTE (Próximas 2 semanas)
1. Agregar todos los Foreign Keys (#7)
2. Migrar TEXT a ENUM (#8)
3. Agregar NOT NULL constraints (#9)
4. Limpiar naming inconsistencies (#10)
5. Agregar índices faltantes (#11-13)

### Fase 3: MEJORAS (Próximo mes)
1. Normalización de datos (#14)
2. Agregar soft deletes (#16)
3. Implementar full-text search (#17)
4. Agregar constraints de validación (#18)
5. Triggers de auditoría (#19)

### Fase 4: OPTIMIZACIÓN (Largo plazo)
1. Particionamiento (#15)
2. Vistas materializadas (#20)
3. Monitoring y alertas

---

## ✅ SCRIPT DE VALIDACIÓN POST-MIGRACIÓN

```sql
-- Verificar que RLS está habilitado en todas las tablas críticas
SELECT
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity = true THEN '✅'
    ELSE '❌ CRITICAL'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'appointment_services', 'orders', 'order_history', 'whatsapp_conversations', 'branch_stock')
ORDER BY tablename;

-- Verificar foreign keys críticos
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  CASE
    WHEN ccu.table_name IS NOT NULL THEN '✅'
    ELSE '❌ MISSING FK'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'branch_stock', 'order_history', 'whatsapp_messages')
ORDER BY tc.table_name;

-- Contar policies por tabla
SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅'
    ELSE '❌ NO POLICIES'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

---

**Fin del reporte de auditoría**
