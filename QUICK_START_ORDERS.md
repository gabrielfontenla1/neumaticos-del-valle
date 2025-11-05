# Inicio Rápido - Sistema de Órdenes

Guía rápida para empezar a usar el sistema de órdenes de Neumáticos del Valle.

## Paso 1: Ejecutar Migración SQL (⏱️ 5 min)

### En Supabase Dashboard:

1. Login en https://app.supabase.com
2. Seleccionar proyecto "neumaticos-del-valle"
3. Ir a "SQL Editor" → "New Query"
4. Copiar todo el contenido de:
   ```
   /src/database/migrations/create_orders_tables.sql
   ```
5. Pegar en el editor
6. Click en "Run" (ícono play azul)
7. Esperar a completar

✅ **Verificar:** En "Table Editor" debes ver tablas `orders` y `order_history`

---

## Paso 2: Probar APIs (⏱️ 10 min)

### Crear una orden:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+56912345678",
    "items": [
      {
        "product_id": "123e4567-e89b-12d3-a456-426614174000",
        "product_name": "Test Tire",
        "sku": "TEST-001",
        "quantity": 4,
        "unit_price": 100000,
        "total_price": 400000,
        "brand": "TestBrand"
      }
    ],
    "subtotal": 400000,
    "tax": 76000,
    "shipping": 10000,
    "payment_method": "credit_card",
    "source": "website"
  }'
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-2025-00001",
    "status": "pending",
    "total_amount": 486000
  }
}
```

### Listar órdenes (admin):

```bash
curl "http://localhost:3000/api/admin/orders?status=pending"
```

### Actualizar orden:

```bash
curl -X PUT "http://localhost:3000/api/admin/orders/{ID_DE_ORDEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "payment_status": "completed",
    "notes": "Pago recibido"
  }'
```

---

## Paso 3: Integrar en Frontend (⏱️ 30 min)

### En formulario de checkout:

```typescript
// src/components/checkout/CheckoutForm.tsx
import { CreateOrderRequest } from '@/features/orders'

async function handleCheckout(cartItems, customerData) {
  const orderData: CreateOrderRequest = {
    customer_name: customerData.name,
    customer_email: customerData.email,
    customer_phone: customerData.phone,
    items: cartItems.map(item => ({
      product_id: item.id,
      product_name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      brand: item.brand,
      image_url: item.image
    })),
    subtotal: calculateSubtotal(cartItems),
    tax: calculateTax(cartItems),
    shipping: SHIPPING_COST,
    payment_method: 'credit_card',
    source: 'website'
  }

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })

  const result = await response.json()
  
  if (result.success) {
    const orderNumber = result.order.order_number
    // Redirigir a página de confirmación
    router.push(`/checkout/success?order=${orderNumber}`)
  }
}
```

### En admin panel:

```typescript
// src/components/admin/OrdersList.tsx
import { ListOrdersResponse } from '@/features/orders'

async function loadOrders(status = 'pending') {
  const response = await fetch(
    `/api/admin/orders?status=${status}&limit=50`
  )
  const data: ListOrdersResponse = await response.json()
  
  if (data.success) {
    setOrders(data.orders)
    setTotal(data.total)
    setTotalPages(data.totalPages)
  }
}
```

---

## Paso 4: Tabla de Referencia Rápida

### Estados de Orden

| Estado     | Descripción                           | Transiciones |
|-----------|---------------------------------------|---------------|
| pending   | Orden recibida, sin confirmar        | → confirmed, cancelled |
| confirmed | Pago confirmado                      | → processing, cancelled |
| processing| Preparando para envío               | → shipped, cancelled |
| shipped   | Enviado al cliente                  | → delivered, cancelled |
| delivered | Entregado                           | (final) |
| cancelled | Cancelada                           | (final) |

### Estados de Pago

| Estado    | Descripción |
|----------|------------|
| pending   | Esperando pago |
| completed | Pago recibido |
| failed    | Pago rechazado |
| refunded  | Reembolsado |

### Fuentes de Orden

| Fuente   | Descripción |
|---------|------------|
| website  | Compra desde sitio web |
| phone    | Pedido por teléfono |
| whatsapp | Pedido por WhatsApp |
| in_store | Compra en tienda física |
| admin    | Creada por admin panel |

---

## Paso 5: Filtros para Admin

```bash
# Órdenes pendientes
GET /api/admin/orders?status=pending

# Órdenes no pagadas
GET /api/admin/orders?payment_status=pending

# Órdenes de hoy
GET /api/admin/orders?date_from=2025-11-05&date_to=2025-11-05

# Buscar por cliente
GET /api/admin/orders?search=juan%20garcia

# Página 2, 25 items por página
GET /api/admin/orders?page=2&limit=25

# Combinados
GET /api/admin/orders?status=pending&payment_status=pending&sort=created_at&page=1&limit=50
```

---

## Estructura de Respuestas

### POST /api/orders (Crear)

```json
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_number": "ORD-2025-00001",
    "voucher_code": null,
    "customer_name": "Juan García",
    "customer_email": "juan@example.com",
    "customer_phone": "+56912345678",
    "items": [...],
    "subtotal": 400000,
    "tax": 76000,
    "shipping": 10000,
    "total_amount": 486000,
    "status": "pending",
    "payment_status": "pending",
    "payment_method": "credit_card",
    "source": "website",
    "notes": null,
    "store_id": null,
    "created_at": "2025-11-05T10:30:00Z",
    "updated_at": "2025-11-05T10:30:00Z"
  }
}
```

### GET /api/admin/orders (Listar)

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

### GET /api/admin/orders/[id] (Detalles)

```json
{
  "success": true,
  "order": {...},
  "history": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "action": "STATUS_CHANGED",
      "description": "Order status changed from pending to confirmed",
      "previous_status": "pending",
      "new_status": "confirmed",
      "user_id": null,
      "created_at": "2025-11-05T10:35:00Z"
    }
  ]
}
```

---

## Errores Comunes

### Error: "Missing required customer information"
**Solución:** Verifica que envías `customer_name`, `customer_email`, `customer_phone`

### Error: "Order must contain at least one item"
**Solución:** El array `items` debe tener al menos 1 producto

### Error: "Invalid status transition from pending to shipped"
**Solución:** No todas las transiciones son válidas. Ver tabla arriba.

### Error: "Order not found"
**Solución:** Verifica que el ID existe y pertenece al cliente

---

## Base de Datos - Consultas Útiles

```sql
-- Ver todas las órdenes
SELECT id, order_number, customer_name, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC;

-- Ver historial de una orden
SELECT action, description, created_at
FROM order_history
WHERE order_id = 'UUID_DE_LA_ORDEN'
ORDER BY created_at DESC;

-- Total vendido hoy
SELECT COUNT(*) as num_ordenes, SUM(total_amount) as monto_total
FROM orders
WHERE DATE(created_at) = CURRENT_DATE;

-- Clientes recurrentes
SELECT customer_email, COUNT(*) as num_compras, SUM(total_amount) as monto_total
FROM orders
GROUP BY customer_email
HAVING COUNT(*) > 1
ORDER BY monto_total DESC;
```

---

## Archivos Clave

| Archivo | Descripción | Líneas |
|---------|------------|--------|
| `/src/features/orders/types.ts` | Tipos TypeScript | 130 |
| `/src/features/orders/index.ts` | Exports | 13 |
| `/src/database/migrations/create_orders_tables.sql` | Migración SQL | 188 |
| `/src/app/api/orders/route.ts` | API pública | 251 |
| `/src/app/api/admin/orders/route.ts` | API admin - listar | 285 |
| `/src/app/api/admin/orders/[id]/route.ts` | API admin - detalle | 423 |

**Total: 1,290 líneas de código nuevo**

---

## Próximos Pasos

1. ✅ Ejecutar migración SQL
2. ✅ Probar endpoints con curl/Postman
3. ⬜ Integrar formulario checkout
4. ⬜ Integrar admin panel
5. ⬜ Agregar notificaciones por email
6. ⬜ Agregar página de tracking

---

## Recursos

- **Guía Completa:** `ORDERS_SYSTEM_GUIDE.md`
- **Resumen Técnico:** `ORDERS_IMPLEMENTATION_SUMMARY.md`
- **SQL README:** `src/database/migrations/README.md`
- **Tipos:** `src/features/orders/types.ts`

---

## Soporte

Si encuentras errores:

1. Revisar la sección de Debugging en `ORDERS_SYSTEM_GUIDE.md`
2. Verificar logs en consola del servidor
3. Consultar respuesta de error en JSON

Para consultas sobre la migración SQL, ver comentarios en el archivo.

---

**Implementado:** 2025-11-05
**Estado:** Listo para producción ✅
