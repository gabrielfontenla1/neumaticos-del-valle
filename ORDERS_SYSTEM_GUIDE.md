# Sistema de Órdenes - Guía Completa

Documentación completa del sistema de gestión de órdenes implementado para Neumáticos del Valle.

## Resumen de Implementación

Se ha creado un sistema completo de órdenes en base de datos con APIs para crear, listar y actualizar órdenes. El sistema incluye:

- Tablas SQL optimizadas con índices y triggers
- Tipos TypeScript completos
- 3 endpoints API REST
- Validaciones de transiciones de estado
- Auditoría automática de cambios
- Integración con vouchers

---

## Archivos Creados

### 1. **Tipos TypeScript** (`/src/features/orders/types.ts`)
Define todas las interfaces y enums necesarios:

```typescript
// Enums de estado
OrderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
PaymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
OrderSource: 'website' | 'phone' | 'whatsapp' | 'in_store' | 'admin'

// Interfaces principales
Order, OrderItem, OrderHistory
CreateOrderRequest, UpdateOrderRequest
ListOrdersResponse, UpdateOrderResponse
```

### 2. **Migración SQL** (`/src/database/migrations/create_orders_tables.sql`)

Crea dos tablas principales:

#### Tabla `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE,      -- ORD-2025-00001
  voucher_code VARCHAR(50),             -- Código de voucher relacionado
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  items JSONB,                          -- Array de items de la orden
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  shipping DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  status VARCHAR(20),                   -- pending, confirmed, processing, etc.
  payment_status VARCHAR(20),           -- pending, completed, failed, refunded
  payment_method VARCHAR(50),
  source VARCHAR(20),                   -- website, phone, whatsapp, in_store, admin
  notes TEXT,
  store_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Tabla `order_history`
```sql
CREATE TABLE order_history (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,               -- FK a orders
  action VARCHAR(100),                  -- ORDER_CREATED, STATUS_CHANGED, etc.
  description TEXT,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  user_id UUID,                         -- Admin que realizó el cambio
  created_at TIMESTAMP
);
```

### 3. **API para Crear Órdenes** (`/src/app/api/orders/route.ts`)

**POST /api/orders** - Crear nueva orden

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Juan García",
    "customer_email": "juan@example.com",
    "customer_phone": "+56912345678",
    "items": [
      {
        "product_id": "uuid-producto",
        "product_name": "Pirelli P7",
        "sku": "PIR-P7-205/55R16",
        "quantity": 4,
        "unit_price": 120000,
        "total_price": 480000,
        "brand": "Pirelli"
      }
    ],
    "subtotal": 480000,
    "tax": 91200,
    "shipping": 15000,
    "payment_method": "credit_card",
    "source": "website",
    "notes": "Entregar en sucursal"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-2025-00001",
    "customer_name": "Juan García",
    "total_amount": 586200,
    "status": "pending",
    "payment_status": "pending",
    "created_at": "2025-11-05T10:30:00Z"
  }
}
```

**GET /api/orders** - Consultar orden (requiere order_number y email)

```bash
curl "http://localhost:3000/api/orders?order_number=ORD-2025-00001&email=juan@example.com"
```

---

### 4. **API Admin - Listar Órdenes** (`/src/app/api/admin/orders/route.ts`)

**GET /api/admin/orders** - Listar órdenes con filtros

```bash
# Listar todas las órdenes (primeras 50)
curl "http://localhost:3000/api/admin/orders"

# Con filtros
curl "http://localhost:3000/api/admin/orders?status=pending&payment_status=completed&page=1&limit=25"

# Por rango de fechas
curl "http://localhost:3000/api/admin/orders?date_from=2025-11-01&date_to=2025-11-05"

# Buscar por cliente (nombre, email, teléfono)
curl "http://localhost:3000/api/admin/orders?search=juan"

# Combinado
curl "http://localhost:3000/api/admin/orders?status=pending&source=website&search=garcía&page=2&limit=50"
```

**Parámetros disponibles:**
- `status` - pending, confirmed, processing, shipped, delivered, cancelled
- `payment_status` - pending, completed, failed, refunded
- `source` - website, phone, whatsapp, in_store, admin
- `date_from` - Fecha inicio (YYYY-MM-DD)
- `date_to` - Fecha fin (YYYY-MM-DD)
- `search` - Buscar en nombre, email o teléfono
- `page` - Número de página (default: 1)
- `limit` - Items por página (default: 50, máximo: 500)

**Respuesta:**
```json
{
  "success": true,
  "orders": [...],
  "total": 145,
  "page": 1,
  "limit": 50,
  "totalPages": 3
}
```

**POST /api/admin/orders** - Crear orden desde admin

Similar a POST /api/orders pero permite especificar:
- `status` inicial (default: pending)
- `payment_status` inicial (default: pending)
- Automáticamente establece `source: "admin"`

---

### 5. **API Admin - Actualizar Orden** (`/src/app/api/admin/orders/[id]/route.ts`)

**GET /api/admin/orders/[id]** - Obtener orden específica

```bash
curl "http://localhost:3000/api/admin/orders/550e8400-e29b-41d4-a716-446655440000"
```

**Incluye:** orden + historial completo de cambios

**PUT /api/admin/orders/[id]** - Actualizar estado/pagos

```bash
curl -X PUT "http://localhost:3000/api/admin/orders/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "payment_status": "completed",
    "notes": "Pago recibido. Procesar envío."
  }'
```

**Validaciones automáticas:**
- Transiciones de estado permitidas:
  - pending → confirmed, cancelled
  - confirmed → processing, cancelled
  - processing → shipped, cancelled
  - shipped → delivered, cancelled
  - delivered → (sin cambios)
  - cancelled → (sin cambios)

**DELETE /api/admin/orders/[id]** - Cancelar orden

```bash
curl -X DELETE "http://localhost:3000/api/admin/orders/550e8400-e29b-41d4-a716-446655440000"
```

Efectos:
- Marca orden como `cancelled`
- Si tiene voucher, revierte su estado a `active`
- Registra en historial

---

## Ejecución de Migraciones SQL

### Opción 1: Desde Supabase Dashboard

1. Ir a Supabase Dashboard → SQL Editor
2. Click en "New Query"
3. Copiar contenido de `/src/database/migrations/create_orders_tables.sql`
4. Ejecutar

### Opción 2: Desde Terminal (usando supabase-cli)

```bash
# Si tienes supabase-cli instalado
cd /ruta/al/proyecto

# Ejecutar migración
supabase db pull  # Si tienes migraciones locales
# O usar psql si tienes acceso directo
```

### Opción 3: Desde Node.js Script

```javascript
// Crear archivo: scripts/run-orders-migration.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const migrationSQL = fs.readFileSync(
  './src/database/migrations/create_orders_tables.sql',
  'utf8'
)

async function runMigration() {
  try {
    const { error } = await supabase.rpc('exec', { sql: migrationSQL })
    if (error) throw error
    console.log('✅ Migración ejecutada exitosamente')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

runMigration()
```

Ejecutar:
```bash
node scripts/run-orders-migration.js
```

---

## Características de la Implementación

### 1. Auditoría Automática

Cada cambio en una orden crea un registro en `order_history`:
- Cambios de estado
- Cambios de estado de pago
- Notas agregadas
- Incluye timestamp y usuario (cuando está disponible)

### 2. Índices Optimizados

Se crearon índices para queries comunes:
```
- order_number (búsqueda rápida)
- customer_email, customer_phone (búsqueda de cliente)
- status, payment_status (filtros)
- created_at (ordenamiento temporal)
- voucher_code (búsqueda de vouchers)
```

### 3. Transiciones de Estado Validadas

No todos los cambios de estado son permitidos:
- Pending solo puede ir a confirmed o cancelled
- Confirmed solo puede ir a processing o cancelled
- Processing solo puede ir a shipped o cancelled
- Shipped solo puede ir a delivered
- Delivered y cancelled no permiten cambios

### 4. Integración con Vouchers

- Al crear una orden con voucher, automáticamente marca el voucher como redeemed
- Si se cancela la orden, revierte el voucher a active

### 5. Row Level Security (RLS)

Políticas de seguridad:
- Público puede crear órdenes
- Usuarios pueden ver sus propias órdenes
- Solo admins pueden listar todas y actualizar

---

## Flujo de Uso Típico

### Cliente web compra productos:

1. **Cliente crea carrito y procesa compra**
   ```
   POST /api/orders
   ```
   - Se genera order_number automático (ORD-2025-00001)
   - Se crea registro en orders con status=pending
   - Se marca voucher como redeemed
   - Se registra en order_history

2. **Admin revisa órdenes**
   ```
   GET /api/admin/orders?status=pending
   ```
   - Filtra órdenes pendientes
   - Ve 50 órdenes por página

3. **Admin confirma pago**
   ```
   PUT /api/admin/orders/[id]
   Body: { "payment_status": "completed", "status": "confirmed" }
   ```
   - Valida transición de estado (pending→confirmed)
   - Registra cambio en historial

4. **Admin prepara envío**
   ```
   PUT /api/admin/orders/[id]
   Body: { "status": "processing", "notes": "Preparando envío" }
   ```

5. **Admin marca como enviado**
   ```
   PUT /api/admin/orders/[id]
   Body: { "status": "shipped", "notes": "Enviado por DHL" }
   ```

6. **Cliente verifica orden**
   ```
   GET /api/orders?order_number=ORD-2025-00001&email=cliente@example.com
   ```

---

## Estructura de Datos en JSONB

El campo `items` en orders es un array JSONB:

```json
{
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Pirelli Scorpion",
      "sku": "PIR-S-265/60R18",
      "quantity": 4,
      "unit_price": 180000,
      "total_price": 720000,
      "brand": "Pirelli",
      "image_url": "https://...",
      "model": "Scorpion"
    },
    {
      "product_id": "uuid2",
      "product_name": "Michelin Defender",
      "sku": "MIC-D-215/65R15",
      "quantity": 2,
      "unit_price": 95000,
      "total_price": 190000,
      "brand": "Michelin",
      "image_url": "https://...",
      "model": "Defender"
    }
  ]
}
```

---

## Ejemplos de Consultas SQL

```sql
-- Órdenes pendientes de los últimos 7 días
SELECT * FROM orders
WHERE status = 'pending'
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Total de ventas por día
SELECT DATE(created_at) as fecha, COUNT(*) as cantidad, SUM(total_amount) as monto
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- Clientes más frecuentes
SELECT customer_email, COUNT(*) as num_ordenes, SUM(total_amount) as monto_total
FROM orders
GROUP BY customer_email
ORDER BY monto_total DESC
LIMIT 10;

-- Órdenes con cambios recientes
SELECT o.id, o.order_number, o.status, oh.action, oh.description, oh.created_at
FROM orders o
LEFT JOIN order_history oh ON o.id = oh.order_id
ORDER BY oh.created_at DESC
LIMIT 20;

-- Vouchers redimidos
SELECT * FROM orders
WHERE voucher_code IS NOT NULL
ORDER BY created_at DESC;
```

---

## Próximas Mejoras Sugeridas

1. **Autenticación de Admin**
   - Implementar verificación de JWT para endpoints /admin
   - Registrar user_id del admin que realiza cambios

2. **Notificaciones**
   - Enviar email cuando orden cambia de estado
   - WhatsApp cuando estado es "shipped"

3. **Reportes**
   - Dashboard de ventas por período
   - Métricas de conversión

4. **Integraciones**
   - Webhook para sistemas externos
   - Sincronización con sistema de envíos

5. **Búsqueda Avanzada**
   - Búsqueda full-text en notas
   - Filtros por rango de montos

---

## Verificación de Instalación

```bash
# 1. Verificar que las tablas fueron creadas
# En Supabase Dashboard → SQL Editor → New Query:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('orders', 'order_history');

# 2. Verificar índices
SELECT indexname FROM pg_indexes
WHERE tablename = 'orders';

# 3. Probar endpoint
curl http://localhost:3000/api/orders?order_number=test&email=test@example.com

# 4. Ver errores si los hay
npm run dev  # En otra terminal
# Revisar consola para mensajes
```

---

## Soporte y Debugging

### Errores Comunes

**Error: "Order not found"**
- Verificar order_number exacto
- Verificar que email coincida con customer_email en DB

**Error: "Invalid status transition"**
- Revisar el estado actual de la orden
- Consultar tabla de transiciones válidas arriba

**Error: "Missing required customer information"**
- Verificar que enviás customer_name, customer_email, customer_phone
- Todos son requeridos

**Error: "Failed to create order in database"**
- Verificar conexión a Supabase
- Revisar variables de entorno (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Debugging

```typescript
// En caso de error, las respuestas incluyen detalles
const response = await fetch('http://localhost:3000/api/orders', { ... })
const data = await response.json()
console.log(data.error)  // Descripción del error
```

---

## Contacto y Actualizaciones

Sistema completado: 2025-11-05
Última actualización: 2025-11-05

Para preguntas o mejoras, revisar la documentación en `/src/features/orders/types.ts` y comentarios en los archivos de API.
