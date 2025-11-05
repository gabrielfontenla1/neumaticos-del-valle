# Guía de Prueba: Integración Checkout-Órdenes

## Descripción General

Esta guía proporciona pasos para validar que la integración entre el sistema de checkout y el sistema de órdenes funciona correctamente.

## Requisitos Previos

- Aplicación ejecutándose en `http://localhost:6001` (o el puerto configurado)
- Navegador moderno con DevTools (F12)
- Base de datos Supabase accesible
- Al menos un producto en el catálogo
- Al menos una sucursal activa

## Configuración Inicial

### 1. Verificar estado del servidor

```bash
npm run dev
```

Esperar a que compile completamente.

### 2. Abrir la aplicación

```
http://localhost:6001
```

### 3. Abrir DevTools

Presionar `F12` para abrir las Developer Tools del navegador.

---

## Prueba 1: Flujo Completo Exitoso

### Objetivo
Verificar que se crea una orden cuando se completa el checkout.

### Pasos

#### 1.1 Agregar producto al carrito

1. Navega a la sección de productos
2. Busca un producto (ej: "Continental")
3. Click en "Agregar al Carrito"
4. Verifica que el carrito muestre la cantidad de items

#### 1.2 Abrir carrito

1. Click en el ícono del carrito (esquina superior derecha)
2. Verifica que el producto está en la lista
3. El carrito debe mostrar:
   - Descripción del producto
   - Cantidad
   - Precio unitario
   - Subtotal
   - IVA (19%)
   - Total

#### 1.3 Proceder al checkout

1. Click en botón "Solicitar Presupuesto por WhatsApp"
2. Se abre formulario con campos:
   - Nombre completo *
   - Teléfono *
   - Email *
   - Sucursal para retiro *
   - Notas adicionales

#### 1.4 Llenar formulario

Completa con datos de prueba:

```
Nombre: Juan Test
Email: juan@test.com
Teléfono: +56 9 1234 5678
Sucursal: [Selecciona una]
Notas: Presupuesto de prueba
```

#### 1.5 Enviar

1. Click en "Enviar por WhatsApp"
2. Observar botón muestra "Procesando..."

#### 1.6 Verificar creación de orden

**En la consola (F12 → Console):**

Debe ver:
```
Creating order from voucher...
Order created successfully: ORD-2025-XXXXX
```

**En la base de datos (Supabase):**

1. Ir a `https://supabase.com`
2. Buscar tabla `orders`
3. Verificar que existe nuevo registro con:
   - `order_number`: ORD-2025-XXXXX
   - `voucher_code`: NDV-XXXXX
   - `customer_name`: Juan Test
   - `source`: whatsapp
   - `status`: pending
   - `payment_status`: pending

#### 1.7 Verificar mensaje WhatsApp

1. Se abre WhatsApp (o WhatsApp Web si está en desktop)
2. El mensaje debe incluir:
   - ✓ Código de Presupuesto: NDV-XXXXX
   - ✓ **Número de Orden: ORD-2025-XXXXX** ← Nuevo
   - ✓ Datos del cliente
   - ✓ Productos solicitados
   - ✓ Resumen de precios

#### 1.8 Verificar redireccionamiento

1. Después de abrir WhatsApp, debe redirigir a `/checkout/success`
2. URL debe incluir: `?code=NDV-XXXXX&order=ORD-2025-XXXXX`
3. La página de éxito debe mostrar:
   - Confirmación de presupuesto
   - Código de presupuesto
   - (Opcional: número de orden)

#### 1.9 Verificar sessionStorage

En la consola, ejecutar:

```javascript
JSON.parse(sessionStorage.getItem('last_purchase'))
```

Debe retornar:

```javascript
{
  voucher_code: "NDV-XXXXX",
  order_number: "ORD-2025-XXXXX",  // ← Verificar que está
  customer_name: "Juan Test",
  customer_email: "juan@test.com",
  customer_phone: "+56 9 1234 5678",
  items: [...]
}
```

---

## Prueba 2: Flujo con Fallo de Creación de Orden

### Objetivo
Verificar comportamiento graceful fallback si falla la creación de orden.

### Pasos

#### 2.1 Simular error de API

1. Abrir DevTools → Network
2. Buscar todas las solicitudes
3. O simular error manualmente (ver sección "Simular Errores")

#### 2.2 Completar checkout

1. Agregar producto
2. Llenar formulario
3. Enviar

#### 2.3 Verificar comportamiento

**En consola debe ver:**

```
Creating order from voucher...
Order creation failed, continuing with voucher only
```

**Esperado:**

- ✓ Voucher se crea
- ✓ WhatsApp se abre (pero SIN número de orden)
- ✓ No hay error visible al usuario
- ✓ Redireccionamiento funciona
- ✓ Mensaje WhatsApp NO incluye "Número de Orden"

**En base de datos:**

- ✓ Voucher existe
- ✗ Orden NO se crea (o se crea sin datos correctos)

---

## Prueba 3: Validación de Datos

### Objetivo
Verificar que los datos se transmiten correctamente entre componentes.

### Pasos

#### 3.1 Interceptar solicitud de creación de orden

1. DevTools → Network
2. En el formulario, cambiar nombre a: `"Test Order Validation"`
3. Enviar checkout
4. En Network, buscar solicitud a `/api/orders`
5. Click en ella → Tab "Request"
6. Verificar el body tiene:

```json
{
  "voucher_code": "NDV-XXXXX",
  "customer_name": "Test Order Validation",
  "customer_email": "...",
  "customer_phone": "...",
  "items": [
    {
      "product_id": "...",
      "product_name": "...",
      "sku": "...",
      "quantity": 2,
      "unit_price": 180000,
      "total_price": 360000,
      "brand": "...",
      "model": "..."
    }
  ],
  "subtotal": 360000,
  "tax": 68400,
  "payment_method": "pending",
  "source": "whatsapp"
}
```

#### 3.2 Verificar respuesta

En Network, click en la solicitud → Tab "Response":

```json
{
  "success": true,
  "order": {
    "id": "...",
    "order_number": "ORD-2025-XXXXX",
    "voucher_code": "NDV-XXXXX",
    "customer_name": "Test Order Validation",
    ...
  }
}
```

---

## Prueba 4: Múltiples Órdenes

### Objetivo
Verificar que los números de orden se generan secuencialmente.

### Pasos

#### 4.1 Completar primer checkout

1. Crear primera orden (prueba 1)
2. Anotar número de orden: `ORD-2025-00001`

#### 4.2 Completar segundo checkout

1. Agregar producto diferente
2. Llenar formulario con datos diferentes
3. Enviar
4. Anotar número de orden: `ORD-2025-00002` (o superior)

#### 4.3 Verificar secuencia

- ✓ Segundo número > primer número
- ✓ Prefijo y año son iguales
- ✓ Números se incrementan

---

## Prueba 5: Validación de Errores

### Objetivo
Verificar que la validación funciona correctamente.

### Pasos

#### 5.1 Campo nombre vacío

1. Abrir carrito
2. Click "Solicitar Presupuesto"
3. Dejar nombre en blanco
4. Click "Enviar por WhatsApp"
5. ✓ Debe mostrar error: "El nombre es requerido"

#### 5.2 Email inválido

1. Llenar nombre
2. Completar otros campos
3. Ingresar email inválido: `"juan@"`
4. Click "Enviar"
5. ✓ Debe mostrar error: "Formato de email inválido"

#### 5.3 Teléfono inválido

1. Llenar nombre y email
2. Ingresar teléfono inválido: `"abc123"`
3. Click "Enviar"
4. ✓ Debe mostrar error: "Formato de teléfono inválido"

#### 5.4 Sucursal sin seleccionar

1. Dejar sucursal en blanco
2. Completar otros campos
3. Click "Enviar"
4. ✓ Debe mostrar error: "Selecciona una sucursal"

---

## Simular Errores Manualmente

### Para probar fallback de orden (sin crear realmente un error):

#### Opción 1: Comentar en código (temporal)

En `QuickCheckout.tsx`, línea ~115, cambiar:

```typescript
// Comentar temporalmente
// const orderResult = await createOrderFromVoucher(...)
const orderResult = null  // Simular fallo
```

Luego revertir después de pruebas.

#### Opción 2: Mock de API

En DevTools → Network → "Disable network throttling" → "Offline"

Esto simula que el servidor no responde.

#### Opción 3: Bloquear solicitud

En DevTools → Network:
1. Click derecho en solicitud `/api/orders`
2. "Block request URL"
3. Hacer checkout nuevamente
4. La solicitud será bloqueada

---

## Checklist Completo

### Flujo Principal

- [ ] Se crea voucher en base de datos
- [ ] Se crea orden en base de datos
- [ ] Número de orden es único
- [ ] Número de orden incluye fecha actual
- [ ] Orden está vinculada a voucher (voucher_code)
- [ ] WhatsApp abre con mensaje correcto
- [ ] Mensaje incluye número de orden
- [ ] Redireccionamiento a /checkout/success funciona
- [ ] URL contiene parámetros correctos

### Datos

- [ ] Nombre de cliente se guarda correctamente
- [ ] Email se guarda correctamente
- [ ] Teléfono se guarda correctamente
- [ ] Productos se guardan con cantidad correcta
- [ ] Precios se calculan correctamente
- [ ] IVA es 19% del subtotal
- [ ] Store ID se asigna correctamente
- [ ] Notas se guardan si existen

### Robustez

- [ ] Flujo continúa si orden falla
- [ ] Voucher se crea aunque orden falle
- [ ] Mensaje WhatsApp se envía aunque orden falle
- [ ] Errores se loguean en consola
- [ ] No hay errores visibles al usuario si falla orden
- [ ] Validación de formulario funciona

### Base de Datos

- [ ] Tabla `orders` tiene nuevo registro
- [ ] Tabla `vouchers` tiene nuevo registro
- [ ] Status de orden es "pending"
- [ ] Payment status es "pending"
- [ ] Source es "whatsapp"
- [ ] Created_at es timestamp actual
- [ ] Order number sigue formato ORD-YYYY-NNNNN

### SessionStorage

- [ ] purchase_completed = 'true'
- [ ] last_purchase contiene order_number
- [ ] last_purchase contiene voucher_code
- [ ] last_purchase contiene datos del cliente
- [ ] last_purchase contiene items

---

## Logs Esperados en Consola

```
Creating order from voucher...
Order created successfully: ORD-2025-00001
```

O en caso de fallo:

```
Creating order from voucher...
Error creating order from voucher: [error message]
Order creation failed, continuing with voucher only
```

---

## Troubleshooting

### "Order creation failed, continuing with voucher only"

**Posibles causas:**

1. Endpoint `/api/orders` no está disponible
   - Verificar que servidor backend está corriendo
   - Verificar que no hay errores en `/api/orders/route.ts`

2. Datos incompletos en solicitud
   - Verificar que todos los items tienen product_id
   - Verificar que totals tiene subtotal y tax

3. Base de datos no accesible
   - Verificar credenciales de Supabase
   - Verificar que las tablas existen

**Solución:**

1. Abrir DevTools → Network
2. Buscar solicitud `/api/orders` (POST)
3. Ver Response para detalles del error
4. Verificar logs del servidor

### WhatsApp no incluye número de orden

**Posibles causas:**

1. Orden no se creó (ver logs arriba)
2. Parámetro orderNumber no se pasó a openWhatsApp()
3. generateWhatsAppMessage() no recibe el parámetro

**Verificación:**

En consola:

```javascript
// Búscar en logs si incluye "Order created successfully"
// Si no aparece, la orden falló
```

### Número de orden repetido

**Esto no debería suceder**, pero si ocurre:

1. Verificar que la base de datos no tiene restricción de uniqueness
2. Verificar que generateOrderNumber() se ejecuta en el servidor
3. Posible race condition si dos órdenes se crean simultáneamente

**Solución:**

Ejecutar en Supabase SQL Editor:

```sql
SELECT order_number, COUNT(*)
FROM orders
GROUP BY order_number
HAVING COUNT(*) > 1;
```

Si retorna resultados, hay duplicados.

### Página de éxito no muestra orden

1. Verificar que redirect URL es correcta:
   ```
   /checkout/success?code=NDV-XXXXX&order=ORD-2025-XXXXX
   ```

2. Verificar que `/checkout/success/page.tsx` lee parámetro `order`

3. En DevTools → Application → SessionStorage:
   ```javascript
   JSON.parse(sessionStorage.getItem('last_purchase'))
   ```
   Debe incluir `order_number`

---

## Performance

### Tiempos esperados:

- Creación de voucher: 200-500ms
- Creación de orden: 200-500ms
- Total checkout: 400-1000ms
- WhatsApp abre inmediatamente después

Si los tiempos son significativamente mayores, revisar Network tab en DevTools.

---

## Notas Finales

- Esta integración es **non-blocking**: si falla la orden, el usuario no ve error
- Los logs en consola son útiles para debugging en producción
- Los números de orden se generan con formato secuencial pero pueden tener gaps si ocurren errores
- El campo `payment_method` siempre es "pending" para órdenes de WhatsApp
- El campo `source` siempre es "whatsapp" para órdenes del checkout

---

## Próximas Mejoras

- [ ] Mostrar toast con número de orden
- [ ] Incluir número de orden en email de confirmación
- [ ] Mostrar número de orden en página de éxito
- [ ] Permitir búsqueda de orden por número
- [ ] Notificaciones en tiempo real de cambios de orden
- [ ] Webhook para sistemas externos

