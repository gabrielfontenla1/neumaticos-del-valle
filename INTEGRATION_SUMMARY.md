# Integración del Sistema de Órdenes con Checkout

## Resumen Ejecutivo

Se ha integrado exitosamente el sistema de órdenes existente con el flujo de checkout, permitiendo que cuando un usuario envía un presupuesto por WhatsApp, se cree automáticamente una orden en la base de datos.

## Cambios Realizados

### 1. **src/features/checkout/api/voucher.ts**

#### Nueva función: `createOrderFromVoucher()`

```typescript
export async function createOrderFromVoucher(
  voucherCode: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  items: CartItem[],
  totals: { subtotal: number; tax: number; total: number },
  storeId?: string,
  notes?: string
): Promise<{ order_number: string } | null>
```

**Funcionalidad:**
- Convierte los datos del voucher en un formato compatible con la API de órdenes
- Realiza una solicitud POST a `/api/orders` con:
  - Código del voucher
  - Datos del cliente
  - Detalles de los productos
  - Totales (subtotal, impuesto)
  - Origen: 'whatsapp'
  - Método de pago: 'pending' (se pagará en la tienda)

**Manejo de errores:**
- Retorna `null` si la creación de la orden falla
- Realiza logging de errores para debugging
- Permite que el flujo continúe incluso si falla la creación de orden

---

### 2. **src/lib/whatsapp.ts**

#### Actualización: `generateWhatsAppMessage()`

```typescript
export function generateWhatsAppMessage(voucher: VoucherData, orderNumber?: string): string
```

**Cambios:**
- Añadido parámetro opcional `orderNumber`
- Incluye el número de orden en el mensaje si está disponible
- Formato mejorado con separadores claros:
  - Código de Presupuesto: NDV-XXXXX
  - Número de Orden: ORD-2025-00001 (si disponible)
  - Datos del cliente
  - Productos solicitados
  - Resumen con totales

#### Actualización: `openWhatsApp()`

```typescript
export function openWhatsApp(voucher: VoucherData, storePhone?: string, orderNumber?: string): void
```

**Cambios:**
- Parámetro adicional `orderNumber`
- Se pasa automáticamente a `generateWhatsAppMessage()`

---

### 3. **src/features/checkout/components/QuickCheckout.tsx**

#### Actualización: `handleSubmit()`

**Flujo mejorado:**

1. **Crear Voucher** (existente)
   ```typescript
   const voucher = await createVoucher(formData, items, totals)
   ```

2. **Crear Orden** (nuevo)
   ```typescript
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
   ```
   - Captura el `order_number` si es exitoso
   - Continúa el flujo incluso si falla

3. **Enviar WhatsApp** (mejorado)
   ```typescript
   openWhatsApp(voucher, whatsappNumber, orderNumber || undefined)
   ```
   - Incluye el número de orden en el mensaje

4. **Almacenar en sesión** (mejorado)
   ```typescript
   sessionStorage.setItem('last_purchase', JSON.stringify({
     voucher_code: voucher.code,
     order_number: orderNumber,  // ← Nuevo
     customer_name: formData.name,
     // ...
   }))
   ```

5. **Redirigir** (mejorado)
   ```typescript
   window.location.href = `/checkout/success?code=${voucher.code}${orderNumber ? `&order=${orderNumber}` : ''}`
   ```
   - Pasa el número de orden en la URL si está disponible

#### Actualización: Importaciones

```typescript
import { createVoucher, createOrderFromVoucher } from '@/features/checkout/api/voucher'
```

---

## Flujo de Ejecución Completo

### Antes (solo voucher):
```
Usuario llena formulario → Crea Voucher → Envía por WhatsApp → Éxito
```

### Ahora (voucher + orden):
```
Usuario llena formulario
  → Crea Voucher
  → Intenta crear Orden
      ✓ Orden creada → Incluir número de orden en WhatsApp
      ✗ Orden falla → Continuar con solo voucher
  → Envía por WhatsApp (con info de orden si disponible)
  → Almacena datos en sesión
  → Redirige a página de éxito
```

---

## Formato del Mensaje WhatsApp

### Con orden exitosa:
```
🚗 *SOLICITUD DE PRESUPUESTO*
📋 Código de Presupuesto: *NDV-XXXXX*
📌 Número de Orden: *ORD-2025-00001*

👤 *DATOS DEL CLIENTE*
Nombre: Juan Pérez
Teléfono: +56 9 1234 5678
Email: juan@email.com

🛞 *PRODUCTOS SOLICITADOS*
1. Continental DWS
   235/45R17 - Cantidad: 2
   Precio unitario: $180.000
   Subtotal: $360.000

💰 *RESUMEN*
Subtotal: $360.000
IVA (19%): $68.400
*TOTAL: $428.400*

_Este presupuesto es válido hasta el 12/11/2025_
_Favor confirmar disponibilidad de stock_
```

### Sin orden (fallida):
```
🚗 *SOLICITUD DE PRESUPUESTO*
📋 Código de Presupuesto: *NDV-XXXXX*
(sin línea de número de orden)
...
```

---

## Manejo de Errores

### Errores capturados:
1. **Fallo en creación de orden**
   - Se registra en consola: `console.error('Error creating order from voucher:', data.error)`
   - El flujo continúa con solo el voucher
   - Usuario no ve error, pero el número de orden no aparece en WhatsApp

2. **Fallo en envío de WhatsApp**
   - Se captura en try/catch general
   - Se muestra alerta al usuario
   - Usuario permanece en checkout

### Logs para debugging:
```typescript
console.log('Creating order from voucher...')
console.log('Order created successfully:', orderNumber)
console.log('Order creation failed, continuing with voucher only')
```

---

## Integración con API `/api/orders`

La función `createOrderFromVoucher()` se comunica con el endpoint POST `/api/orders` con los siguientes parámetros:

```typescript
{
  voucher_code: string,           // Código del presupuesto
  customer_name: string,          // Nombre del cliente
  customer_email: string,         // Email del cliente
  customer_phone: string,         // Teléfono del cliente
  items: OrderItem[],             // Productos del pedido
  subtotal: number,               // Total antes de impuestos
  tax: number,                    // IVA (19%)
  payment_method: 'pending',      // Método de pago (fijo para WhatsApp)
  source: 'whatsapp',            // Origen del pedido
  store_id?: string,             // Sucursal para retiro
  notes?: string                 // Notas adicionales
}
```

**Respuesta esperada:**
```typescript
{
  success: true,
  order: {
    order_number: string,         // ORD-2025-00001
    id: string,
    // ... otros datos de orden
  }
}
```

---

## Datos Persistidos en SessionStorage

Ahora incluye información de la orden:

```typescript
{
  voucher_code: "NDV-XXXXX",
  order_number: "ORD-2025-00001",  // ← Nuevo
  customer_name: "Juan Pérez",
  customer_email: "juan@email.com",
  customer_phone: "+56 9 1234 5678",
  items: [
    {
      product_id: "...",
      name: "Continental DWS",
      quantity: 2
    }
  ]
}
```

---

## Testing Recomendado

### 1. Verificar creación de orden:
- [ ] Completar checkout
- [ ] Verificar que se crea orden en base de datos
- [ ] Verificar que el número de orden aparece en WhatsApp

### 2. Verificar fallback:
- [ ] Desactivar endpoint `/api/orders` temporalmente
- [ ] Completar checkout
- [ ] Verificar que se crea voucher incluso sin orden
- [ ] Verificar que WhatsApp se envía sin número de orden

### 3. Verificar parámetros:
- [ ] Verificar que el order_number se incluye en URL de redireccionamiento
- [ ] Verificar que los datos se almacenan en sessionStorage
- [ ] Verificar logs en consola del navegador

### 4. Verificar UI:
- [ ] Botón "Procesando..." aparece mientras se crea orden
- [ ] No hay errores visibles al usuario si falla orden
- [ ] Mensaje de WhatsApp incluye formato correcto

---

## Archivos Modificados

1. `/src/features/checkout/api/voucher.ts` - Nueva función `createOrderFromVoucher()`
2. `/src/lib/whatsapp.ts` - Actualizado `generateWhatsAppMessage()` y `openWhatsApp()`
3. `/src/features/checkout/components/QuickCheckout.tsx` - Integración en `handleSubmit()`

## Archivos NO Modificados (compatibles):

- `/src/app/api/orders/route.ts` - Endpoint existente (usado por la integración)
- `/src/features/orders/types.ts` - Tipos existentes (usados por la integración)

---

## Próximos Pasos Opcionales

1. **Notificaciones visual**: Mostrar toast con número de orden
2. **Página de éxito mejorada**: Mostrar número de orden en `/checkout/success`
3. **Email de confirmación**: Incluir número de orden en email
4. **Panel de cliente**: Permitir que cliente busque orden con número
5. **Webhooks**: Notificar a sistema externo cuando se crea orden desde WhatsApp

