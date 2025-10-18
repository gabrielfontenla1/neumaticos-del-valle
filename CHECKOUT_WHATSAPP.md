# Checkout WhatsApp - Documentación de Implementación

## Resumen

Sistema de checkout ultra simple que permite a los usuarios solicitar presupuestos de neumáticos a través de WhatsApp. Sin procesamiento de pagos, solo generación de vouchers y envío directo por WhatsApp.

## Arquitectura

### Componentes Principales

```
/src/features/cart/
├── api.ts              # Operaciones con Supabase
├── types.ts            # TypeScript interfaces
├── hooks/
│   └── useCart.ts      # Hook principal del carrito
└── components/
    └── AddToCartButton.tsx

/src/features/checkout/
├── api/
│   └── voucher.ts      # Generador de vouchers
└── components/
    └── QuickCheckout.tsx # Modal de checkout

/src/lib/
└── whatsapp.ts         # Helpers de WhatsApp

/src/components/
├── CartButton.tsx      # Botón flotante del carrito
└── MobileCartBar.tsx   # Barra inferior móvil
```

## Flujo de Usuario

1. **Navegación de Productos**
   - Usuario ve productos en `/products`
   - Cada producto muestra precio, stock y botón "Agregar al Carrito"

2. **Agregar al Carrito**
   - Click en "Agregar al Carrito"
   - Producto se agrega con animación
   - Aparece botón flotante con contador
   - Datos se sincronizan con Supabase

3. **Revisión del Carrito**
   - Click en botón flotante abre drawer lateral
   - Usuario puede modificar cantidades
   - Se muestran totales con IVA incluido

4. **Checkout**
   - Click en "Solicitar Presupuesto por WhatsApp"
   - Formulario simple: nombre, teléfono, email
   - Selección de sucursal para retiro
   - Campo opcional para notas

5. **Envío por WhatsApp**
   - Sistema genera código único (NDV-XXXXX)
   - Guarda voucher en base de datos
   - Abre WhatsApp con mensaje formateado
   - Redirect a página de éxito

## Base de Datos

### Tablas Utilizadas

- `cart_sessions`: Sesiones de carrito (7 días de duración)
- `cart_items`: Items del carrito con precio al momento
- `vouchers`: Presupuestos generados
- `stores`: Sucursales disponibles
- `products`: Catálogo de productos

### Voucher Structure

```typescript
{
  code: 'NDV-ABC123',
  customer_name: string,
  customer_email: string,
  customer_phone: string,
  product_details: JSON,
  quantity: number,
  unit_price: number,
  total_price: number,
  final_price: number,
  valid_until: date,
  status: 'active',
  store_id: uuid
}
```

## Configuración WhatsApp

### Números de WhatsApp

Editar en `/src/lib/whatsapp.ts`:

```typescript
export const WHATSAPP_NUMBERS = {
  main: '56912345678',    // Número principal
  santiago: '56987654321', // Sucursal Santiago
  default: '56912345678'   // Por defecto
}
```

### Formato del Mensaje

```
🚗 SOLICITUD DE PRESUPUESTO
📋 Código: NDV-ABC123

👤 DATOS DEL CLIENTE
Nombre: Juan Pérez
Teléfono: +56912345678
Email: juan@email.com

🛞 PRODUCTOS SOLICITADOS
1. Pirelli Cinturato P7
   205/55R16 - Cantidad: 4
   Precio unitario: $85.000
   Subtotal: $340.000

💰 RESUMEN
Subtotal: $340.000
IVA (19%): $64.600
TOTAL: $404.600

📝 NOTAS
Necesito instalación

_Este presupuesto es válido hasta el DD/MM/AAAA_
_Favor confirmar disponibilidad de stock_
```

## Uso del Sistema

### Para Desarrolladores

1. **Hook useCart**
```typescript
import { useCart } from '@/features/cart/hooks/useCart'

function Component() {
  const {
    items,
    totals,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
    openCart,
    closeCart
  } = useCart()

  // Agregar producto
  await addItem(productId, quantity)

  // Actualizar cantidad
  await updateQuantity(itemId, newQuantity)

  // Remover item
  await removeItem(itemId)
}
```

2. **Botón Agregar al Carrito**
```typescript
import { AddToCartButton } from '@/features/cart/components/AddToCartButton'

<AddToCartButton
  productId="123"
  productName="Pirelli P7"
  disabled={stock === 0}
  variant="full"
/>
```

3. **Integración en Layout**
```typescript
// app/layout.tsx
import { CartProvider } from '@/providers/CartProvider'
import { QuickCheckout } from '@/features/checkout/components/QuickCheckout'
import { CartButton } from '@/components/CartButton'

<CartProvider>
  {children}
  <QuickCheckout />
  <CartButton />
</CartProvider>
```

### Para el Cliente

1. **Agregar Productos**: Click en "Agregar al Carrito" en cualquier producto
2. **Ver Carrito**: Click en el botón flotante azul
3. **Modificar**: Usar botones +/- para cambiar cantidades
4. **Solicitar**: Click en botón verde de WhatsApp
5. **Completar Datos**: Llenar formulario simple
6. **Enviar**: Se abre WhatsApp con el mensaje

## Testing

### Test Manual
1. Navegar a `/products`
2. Agregar varios productos
3. Abrir carrito y modificar cantidades
4. Completar checkout
5. Verificar mensaje en WhatsApp
6. Verificar voucher en base de datos

### Test Automatizado
```bash
npm run test-checkout
```

Verifica:
- Generación de códigos únicos
- Creación de vouchers en DB
- Sesiones de carrito
- Cálculo de totales

## Mantenimiento

### Limpiar Carritos Expirados

Función SQL disponible:
```sql
SELECT clean_expired_carts();
```

### Verificar Vouchers

```sql
-- Vouchers activos
SELECT * FROM vouchers
WHERE status = 'active'
AND valid_until > NOW();

-- Vouchers por cliente
SELECT * FROM vouchers
WHERE customer_phone = '+56912345678';
```

## Métricas

El sistema registra:
- Productos más agregados al carrito
- Tasa de conversión carrito → voucher
- Vouchers generados por día
- Productos más solicitados
- Sucursales más seleccionadas

## Mejoras Futuras

- [ ] Notificaciones por email al generar voucher
- [ ] Panel admin para gestionar vouchers
- [ ] Integración con CRM
- [ ] Seguimiento de conversión voucher → venta
- [ ] Recordatorios automáticos de vouchers por vencer
- [ ] Sistema de descuentos y promociones
- [ ] Carrito persistente con login

## Soporte

Para problemas o consultas:
- WhatsApp: +56912345678
- Email: soporte@neumaticosdelval.cl