# Implementación: Integración de Órdenes con Checkout

## Resumen Ejecutivo

Se ha integrado el sistema de creación de órdenes con el flujo de checkout. Cuando un usuario envía un presupuesto por WhatsApp, se crea automáticamente una orden en la base de datos vinculada al voucher.

**Estado:** Completado e implementado
**Fecha:** 2025-11-05
**Versión:** 1.0

---

## Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────────────┐
│                    QuickCheckout Component                   │
│                  (src/features/checkout/)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    handleSubmit()
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
   createVoucher()                    createOrderFromVoucher()
        │                                     │
        │                              (new function)
        │                                     │
   Vouchers Table◄────────────────►Orders Table
        │                                     │
        └──────────────────┬──────────────────┘
                           │
                    generateWhatsAppMessage()
                    (with orderNumber param)
                           │
                    openWhatsApp()
                           │
                    User Opens WhatsApp
```

---

## Cambios por Archivo

### 1. `/src/features/checkout/api/voucher.ts`

#### Nueva Función: `createOrderFromVoucher()`

**Propósito:** Crear una orden en la base de datos a partir de datos del voucher

**Ubicación:** Líneas 193-253

**Firma:**

```typescript
export async function createOrderFromVoucher(
  voucherCode: string,           // Código del presupuesto
  customerName: string,           // Nombre del cliente
  customerEmail: string,          // Email del cliente
  customerPhone: string,          // Teléfono del cliente
  items: CartItem[],              // Items del carrito
  totals: {                       // Totales
    subtotal: number;
    tax: number;
    total: number;
  },
  storeId?: string,              // ID de la sucursal (opcional)
  notes?: string                 // Notas adicionales (opcional)
): Promise<{ order_number: string } | null>
```

**Flujo de ejecución:**

```
1. Transformar CartItem[] en OrderItem[]
   - product_id
   - product_name (brand + name)
   - sku
   - quantity
   - unit_price (sale_price || price)
   - total_price
   - image_url (opcional)
   - brand
   - model (name del producto)

2. Hacer POST a /api/orders con:
   {
     voucher_code: voucherCode,
     customer_name: customerName,
     customer_email: customerEmail,
     customer_phone: customerPhone,
     items: orderItems[],
     subtotal: totals.subtotal,
     tax: totals.tax,
     payment_method: 'pending',
     source: 'whatsapp',
     store_id: storeId || null,
     notes: notes || null
   }

3. Validar respuesta:
   - response.ok === true
   - data.success === true

4. Retornar { order_number: data.order.order_number }

5. En caso de error:
   - Loguear error en consola
   - Retornar null
```

**Error Handling:**

```typescript
try {
  // fetch y procesamiento
} catch (error) {
  console.error('Error in createOrderFromVoucher:', error)
  return null  // Fallo silencioso
}
```

**Integración con API:**

Se comunica con el endpoint existente `POST /api/orders` que:
- Genera número de orden automáticamente (ORD-YYYY-NNNNN)
- Inserta en tabla `orders`
- Actualiza estado del voucher a 'redeemed'
- Registra en tabla `order_history`

---

### 2. `/src/lib/whatsapp.ts`

#### Actualización 1: `generateWhatsAppMessage()`

**Antes:**
```typescript
export function generateWhatsAppMessage(voucher: VoucherData): string
```

**Después:**
```typescript
export function generateWhatsAppMessage(voucher: VoucherData, orderNumber?: string): string
```

**Cambios en el cuerpo (líneas 36-95):**

```typescript
// Antes:
const lines = [
  `🚗 *SOLICITUD DE PRESUPUESTO*`,
  `📋 Código: *${voucher.code}*`,
  ``,
  // ... resto del mensaje
]

// Después:
const lines = [
  `🚗 *SOLICITUD DE PRESUPUESTO*`,
  `📋 Código de Presupuesto: *${voucher.code}*`,
]

// NUEVO: Añadir número de orden si existe
if (orderNumber) {
  lines.push(`📌 Número de Orden: *${orderNumber}*`)
}

lines.push(
  ``,
  `👤 *DATOS DEL CLIENTE*`,
  // ... resto del mensaje
)
```

**Cambio de formato:**

- Antes: "Código"
- Después: "Código de Presupuesto" (más descriptivo)
- Nuevo: "Número de Orden" (solo si orderNumber está disponible)

#### Actualización 2: `openWhatsApp()`

**Antes:**
```typescript
export function openWhatsApp(voucher: VoucherData, storePhone?: string): void
```

**Después:**
```typescript
export function openWhatsApp(voucher: VoucherData, storePhone?: string, orderNumber?: string): void
```

**Cambio en el cuerpo (línea 128):**

```typescript
// Antes:
const message = generateWhatsAppMessage(voucher)

// Después:
const message = generateWhatsAppMessage(voucher, orderNumber)
```

**Compatibilidad:** Completamente retrocompatible (orderNumber es opcional)

---

### 3. `/src/features/checkout/components/QuickCheckout.tsx`

#### Actualización 1: Importación

**Línea 8 - Antes:**
```typescript
import { createVoucher } from '@/features/checkout/api/voucher'
```

**Línea 8 - Después:**
```typescript
import { createVoucher, createOrderFromVoucher } from '@/features/checkout/api/voucher'
```

#### Actualización 2: Función `handleSubmit()`

**Ubicación:** Líneas 96-170

**Nuevo flujo (líneas 110-131):**

```typescript
if (voucher) {
  let orderNumber: string | null = null

  // TRY TO CREATE ORDER
  console.log('Creating order from voucher...')
  const orderResult = await createOrderFromVoucher(
    voucher.code,
    formData.name,
    formData.email,
    formData.phone,
    items,
    totals,
    formData.store_id,
    formData.notes
  )

  if (orderResult) {
    orderNumber = orderResult.order_number
    console.log('Order created successfully:', orderNumber)
  } else {
    console.log('Order creation failed, continuing with voucher only')
  }
```

**Logs para debugging:**

```
console.log('Creating order from voucher...')
console.log('Order created successfully: ORD-2025-00001')
console.log('Order creation failed, continuing with voucher only')
```

**Cambio en openWhatsApp (línea 138):**

**Antes:**
```typescript
openWhatsApp(voucher, whatsappNumber)
```

**Después:**
```typescript
openWhatsApp(voucher, whatsappNumber, orderNumber || undefined)
```

**SessionStorage actualizado (líneas 142-153):**

**Antes:**
```typescript
sessionStorage.setItem('last_purchase', JSON.stringify({
  voucher_code: voucher.code,
  customer_name: formData.name,
  customer_email: formData.email,
  customer_phone: formData.phone,
  items: [...]
}))
```

**Después:**
```typescript
sessionStorage.setItem('last_purchase', JSON.stringify({
  voucher_code: voucher.code,
  order_number: orderNumber,  // ← NUEVO
  customer_name: formData.name,
  customer_email: formData.email,
  customer_phone: formData.phone,
  items: [...]
}))
```

**URL de redireccionamiento (línea 160):**

**Antes:**
```typescript
window.location.href = `/checkout/success?code=${voucher.code}`
```

**Después:**
```typescript
window.location.href = `/checkout/success?code=${voucher.code}${orderNumber ? `&order=${orderNumber}` : ''}`
```

---

## Flujo de Datos

```
ENTRADA (QuickCheckout.tsx)
│
├─ voucher.code ──────────────────────┐
├─ formData.name                      │
├─ formData.email                     │
├─ formData.phone                     │
├─ items[]                            │
├─ totals {}                          │
├─ formData.store_id                  │
└─ formData.notes                     │
   │                                  │
   └──► createVoucher()              │
        │                             │
        └──► INSERT vouchers          │
             │                        │
             └──► { code: "NDV-..." } │
                  │                   │
   ┌──────────────┘                   │
   │                                  │
   │  createOrderFromVoucher()         │
   │  (usando parámetros)◄────────────┘
   │
   ├─ Transformar items:
   │  CartItem[] ──► OrderItem[]
   │
   ├─ POST /api/orders con:
   │  {
   │    voucher_code,
   │    customer_name,
   │    customer_email,
   │    customer_phone,
   │    items,
   │    subtotal,
   │    tax,
   │    payment_method: 'pending',
   │    source: 'whatsapp',
   │    store_id,
   │    notes
   │  }
   │
   └──► /api/orders/route.ts
        │
        ├─ Generar order_number
        │  (ORD-YYYY-NNNNN)
        │
        ├─ INSERT orders
        │  INSERT order_history
        │  UPDATE vouchers (status='redeemed')
        │
        └──► { order_number: "ORD-..." }

SALIDA
│
├─ generateWhatsAppMessage(voucher, orderNumber)
│  │
│  └──► Mensaje con:
│       • Código de Presupuesto
│       • Número de Orden (si existe)
│       • Datos del cliente
│       • Productos
│       • Totales
│
└─ openWhatsApp() / sessionStorage / redirect
```

---

## Casos de Uso

### Caso 1: Orden creada exitosamente

```
✅ POST /api/orders exitoso
   ├─ orderNumber = "ORD-2025-00001"
   ├─ sessionStorage incluye order_number
   ├─ URL incluye &order=ORD-2025-00001
   ├─ Mensaje WhatsApp incluye número de orden
   └─ Console: "Order created successfully: ORD-2025-00001"
```

### Caso 2: Fallo en creación de orden

```
❌ POST /api/orders falla
   ├─ orderNumber = null
   ├─ sessionStorage NO incluye order_number
   ├─ URL NO incluye &order=...
   ├─ Mensaje WhatsApp SIN número de orden
   ├─ Console: "Order creation failed, continuing with voucher only"
   └─ Usuario NO ve error (fallback graceful)
```

### Caso 3: Error de validación

```
❌ Validación del formulario falla
   ├─ No se crea voucher
   ├─ No se intenta crear orden
   ├─ Se muestran errores al usuario
   └─ No se abre WhatsApp
```

---

## Base de Datos

### Tabla: `orders`

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(255) UNIQUE NOT NULL,  -- ORD-YYYY-NNNNN
  voucher_code VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  shipping NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',       -- pending, confirmed, etc
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, etc
  payment_method VARCHAR(255) NOT NULL,       -- 'pending' para WhatsApp
  source VARCHAR(50) NOT NULL,                -- 'whatsapp'
  notes TEXT,
  store_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

### Tabla: `order_history`

```sql
CREATE TABLE order_history (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  action VARCHAR(255) NOT NULL,               -- ORDER_CREATED
  description TEXT,
  user_id UUID,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Relaciones:

```
vouchers
├─ code ─────────► orders.voucher_code
└─ store_id ─────► orders.store_id ─────► stores.id

orders
├─ voucher_code ──────► vouchers.code
├─ store_id ───────────► stores.id
└─ id ──────────────────► order_history.order_id
```

---

## Variables de Entorno Requeridas

Ninguna nueva. Se usan las existentes:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Dependencias

Ninguna nueva. Usa:

- Supabase (existente)
- Next.js (existente)
- React (existente)
- TypeScript (existente)

---

## Testing

### Unit Tests Sugeridos

```typescript
describe('createOrderFromVoucher', () => {
  it('should create order with correct data', async () => {
    const result = await createOrderFromVoucher(...)
    expect(result.order_number).toMatch(/ORD-\d{4}-\d{5}/)
  })

  it('should return null on API error', async () => {
    const result = await createOrderFromVoucher(...) // con API down
    expect(result).toBeNull()
  })
})

describe('generateWhatsAppMessage', () => {
  it('should include order number when provided', () => {
    const msg = generateWhatsAppMessage(voucher, 'ORD-2025-00001')
    expect(msg).toContain('Número de Orden')
    expect(msg).toContain('ORD-2025-00001')
  })

  it('should not include order number when not provided', () => {
    const msg = generateWhatsAppMessage(voucher)
    expect(msg).not.toContain('Número de Orden')
  })
})
```

### Integration Tests Sugeridos

```typescript
describe('Checkout Order Integration', () => {
  it('should create both voucher and order', async () => {
    // 1. Llenar formulario
    // 2. Enviar
    // 3. Verificar voucher en DB
    // 4. Verificar orden en DB
    // 5. Verificar vinculación
  })

  it('should handle order creation failure gracefully', async () => {
    // 1. Mock API order como error
    // 2. Enviar checkout
    // 3. Verificar que voucher se crea
    // 4. Verificar que orden NO se crea
    // 5. Verificar que no hay error visible
  })
})
```

---

## Performance

### Tiempos esperados:

```
Voucher creation:      200-400ms (Supabase)
Order creation:        200-400ms (Supabase + order_number generation)
Message generation:    < 1ms (string concatenation)
WhatsApp redirect:     instant (window.open)
Total checkout flow:   600-1200ms
```

### Optimizaciones aplicadas:

1. **No-blocking**: Si falla orden, flujo continúa
2. **Parallel processing**: Items transformación es rápida (O(n))
3. **Minimal data transfer**: Solo datos necesarios al API

---

## Seguridad

### Datos enviados al API:

```typescript
{
  voucher_code,       // Público después del checkout
  customer_name,      // Usuario lo proporciona
  customer_email,     // Usuario lo proporciona
  customer_phone,     // Usuario lo proporciona
  items,              // Del carrito (público)
  subtotal,           // Calculado en frontend
  tax,                // Calculado en frontend
  payment_method,     // Hardcoded 'pending'
  source,             // Hardcoded 'whatsapp'
  store_id,           // Seleccionado por usuario
  notes               // Usuario lo proporciona
}
```

### Validaciones:

1. **Frontend**:
   - Validación de formulario (nombre, email, teléfono)
   - Selección de sucursal
   - Items no vacíos

2. **Backend** (`/api/orders`):
   - Validación de campos requeridos
   - Validación de email
   - Validación de items
   - Validación de payment_method

### No se envia información sensible:

- ✓ Contraseñas (no aplica)
- ✓ Tokens (no aplica)
- ✓ Datos de pago completos (payment_method='pending')
- ✓ Información interna del sistema

---

## Monitoreo y Debugging

### Logs en consola

```typescript
// Exitoso
console.log('Creating order from voucher...')
console.log('Order created successfully: ORD-2025-00001')

// Fallo
console.error('Error in createOrderFromVoucher:', error)
console.log('Order creation failed, continuing with voucher only')
```

### Logs en servidor

```typescript
// En /api/orders/route.ts
console.error('Error creating order:', insertError)
console.error('Error generating order number:', error)
console.error('Error logging order creation history:', historyError)
```

### Monitoreo en producción

Se recomienda:

1. **Sentry o similar**: Para errores no controlados
2. **Analytics**: Rastrear tasa de éxito de órdenes
3. **Alertas**: Si tasa de error > 5%
4. **Dashboard**: Mostrar órdenes creadas por día

---

## Rollback

En caso de necesitar deshacer esta integración:

1. Revertir últimas 3 funciones en `QuickCheckout.tsx`:
   - `handleSubmit()` → eliminar creación de orden
   - `createOrderFromVoucher` → no importar

2. Revertir cambios en `whatsapp.ts`:
   - Remover parámetro `orderNumber` de funciones

3. Revertir cambios en `voucher.ts`:
   - Remover función `createOrderFromVoucher()`

**Comando Git:**
```bash
git revert 2275379
```

(Nota: Hash es ejemplo, usar el hash real del commit)

---

## Próximas Mejoras

### Phase 2:

- [ ] Página de éxito mejorada mostrando número de orden
- [ ] Búsqueda de orden por número (cliente)
- [ ] Email de confirmación con número de orden
- [ ] Toast notifications con número de orden
- [ ] Historial de órdenes del cliente

### Phase 3:

- [ ] Webhook para sistemas externos
- [ ] Integración con sistema de CRM
- [ ] Dashboard de órdenes en admin
- [ ] Notificaciones en tiempo real
- [ ] Multi-idioma en mensajes

### Phase 4:

- [ ] Sistema de pagos integrado
- [ ] Seguimiento de estado de orden
- [ ] Cancelación de órdenes
- [ ] Edición de órdenes pre-confirmación
- [ ] Integración con sistema de entregas

---

## Referencias

- `src/features/checkout/api/voucher.ts` → createOrderFromVoucher()
- `src/lib/whatsapp.ts` → generateWhatsAppMessage(), openWhatsApp()
- `src/features/checkout/components/QuickCheckout.tsx` → handleSubmit()
- `src/app/api/orders/route.ts` → POST /api/orders endpoint
- `src/features/orders/types.ts` → Tipos de orden

---

## Documento Histórico

```
Versión 1.0
Fecha: 2025-11-05
Autor: Claude Code
Estado: Implementado en desarrollo
Cambios: Integración inicial de órdenes con checkout
```

