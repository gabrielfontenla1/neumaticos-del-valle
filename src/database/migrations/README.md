# Migraciones de Base de Datos

Este directorio contiene migraciones SQL para Neumáticos del Valle.

## Archivos

### create_orders_tables.sql
Crea el sistema completo de órdenes:
- Tabla `orders` - almacena información de órdenes
- Tabla `order_history` - auditoría y historial de cambios
- Índices optimizados
- Triggers automáticos
- Funciones helper
- RLS policies

## Cómo Ejecutar Migraciones

### Opción 1: Supabase Dashboard (Recomendado)

1. Ir a https://app.supabase.com
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Click en "New Query"
5. Copiar contenido de `create_orders_tables.sql`
6. Click en "Run"
7. Esperar a que complete (generalmente 5-10 segundos)
8. Verificar en "Table Editor" que aparezcan las tablas

### Opción 2: Terminal (con supabase-cli)

```bash
# Si tienes supabase CLI instalado
supabase db push

# O si tienes acceso directo a PostgreSQL
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -f create_orders_tables.sql
```

### Opción 3: Node.js Script

```bash
# Ver archivo en scripts/run-migration.js (si existe)
node scripts/run-migration.js
```

## Verificación Post-Ejecución

Después de ejecutar la migración, verifica que todo esté correcto:

### En Supabase Dashboard

```sql
-- Verificar que las tablas existen
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('orders', 'order_history');

-- Verificar índices
SELECT indexname FROM pg_indexes
WHERE tablename = 'orders'
ORDER BY indexname;

-- Verificar triggers
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'orders';
```

### En Node.js/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Test: Crear una orden
const { data, error } = await supabase
  .from('orders')
  .insert({
    order_number: 'TEST-2025-00001',
    customer_name: 'Test',
    customer_email: 'test@example.com',
    customer_phone: '+56912345678',
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total_amount: 0,
    payment_method: 'test',
  })
  .select()

if (error) {
  console.error('Error:', error)
} else {
  console.log('✅ Orden creada:', data)
}
```

## Contenido de las Migraciones

### Tablas Creadas

#### orders
- 20 columnas
- PK: `id` (UUID)
- UK: `order_number`
- FKs: `store_id` → stores
- Índices: 6 índices optimizados

#### order_history
- 8 columnas
- PK: `id` (UUID)
- FKs: `order_id` → orders, `user_id` → auth.users
- Índices: 3 índices de auditoría

### Triggers Creados

1. `orders_updated_at_trigger` - Actualiza timestamp automáticamente
2. `order_status_change_trigger` - Registra cambios de estado
3. `order_payment_change_trigger` - Registra cambios de pago

### Funciones Creadas

1. `generate_order_number()` - Genera números de orden secuenciales
2. `update_orders_updated_at()` - Trigger function para timestamps
3. `log_order_status_change()` - Trigger function para auditoría de estado
4. `log_order_payment_change()` - Trigger function para auditoría de pago

### Policies RLS

- Pública puede crear órdenes
- Usuarios pueden ver sus propias órdenes
- Admins pueden ver y actualizar todas

## Troubleshooting

### Error: "relation already exists"
La tabla ya fue creada. Puedes:
1. Verificar si necesitas los datos actuales
2. Hacer DROP de la tabla (perderá datos)
3. O simplemente ignorar si ya está correcta

### Error: "permission denied"
Necesitas permisos de admin en Supabase. Verifica:
1. Usuario está logueado
2. Tienes rol de admin en Supabase
3. Las RLS policies no están bloqueando

### Error de sintaxis SQL
Verifica:
1. Que copiaste el archivo completo
2. Que no hay caracteres especiales rotos
3. Que PostgreSQL version es compatible (>= 12)

## Rollback

Si necesitas revertir la migración:

```sql
-- ⚠️ Esto borrará TODAS las órdenes
DROP TABLE IF EXISTS order_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP SEQUENCE IF EXISTS order_number_seq;
DROP FUNCTION IF EXISTS generate_order_number();
DROP FUNCTION IF EXISTS update_orders_updated_at();
DROP FUNCTION IF EXISTS log_order_status_change();
DROP FUNCTION IF EXISTS log_order_payment_change();
```

## Próximos Pasos

1. Ejecutar migración
2. Verificar tablas en Supabase Dashboard
3. Probar endpoints en `/src/app/api/orders`
4. Conectar frontend con las APIs

## Documentación

- Guía completa: `/ORDERS_SYSTEM_GUIDE.md`
- Tipos TypeScript: `/src/features/orders/types.ts`
- APIs: `/src/app/api/orders/`, `/src/app/api/admin/orders/`

## Contacto

Para preguntas sobre las migraciones, revisar:
- Comentarios en `create_orders_tables.sql`
- Documentación en `ORDERS_SYSTEM_GUIDE.md`
