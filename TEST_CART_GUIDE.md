# Guía de Testing E2E del Carrito

## Descripción General

Este documento describe el sistema de testing E2E para validar la funcionalidad del carrito de compras y el sistema de notificaciones de Neumáticos del Valle.

## Componentes Creados

### 1. Sistema de Notificaciones (`src/components/CartNotifications.tsx`)

Sistema de notificaciones toast reutilizable con soporte para múltiples tipos de mensajes.

**Características:**
- ✅ Notificaciones de éxito (verde)
- ❌ Notificaciones de error (rojo)
- ⚠️ Notificaciones de advertencia (naranja)
- ℹ️ Notificaciones informativas (azul)
- Animaciones suaves de entrada/salida
- Duración personalizable (0 = sin auto-cerrar)
- Acciones interactivas
- Descartes manuales

**Uso:**
```tsx
import { useNotifications } from '@/components/CartNotifications'

function MyComponent() {
  const { showNotification } = useNotifications()

  const handleAction = () => {
    showNotification({
      type: 'success',
      title: '¡Éxito!',
      message: 'La acción se completó correctamente',
      duration: 3000
    })
  }

  return <button onClick={handleAction}>Ejecutar acción</button>
}
```

### 2. CartDrawer Mejorado

El componente CartDrawer ahora incluye:

**Mejoras Visuales:**
- ✨ Contador animado en el icono del carrito
- 🎯 Gradiente en el botón de envío
- 📊 Estados de carga animados
- ⚡ Transiciones suaves entre estados
- 🔄 Indicador de carga spinning

**Feedback de Usuario:**
- Estados de "Enviando..." con icono spinner
- Estados de "Limpiando..." con icono spinner
- Deshabilitación de botones durante operaciones
- Mensajes contextuales en el header

**Animaciones Framer Motion:**
- Entrada del header con fade-up
- Contador animado con scale
- Items con stagger delay
- Botones con hover/tap animations
- Estado de carga con spinner infinito

### 3. Página de Testing (`src/app/test-cart/page.tsx`)

Página aislada en `/test-cart` para testing E2E del carrito.

**Características:**

#### Tab Overview
- Estado actual del carrito (productos, totales)
- Listado de items con controles rápidos
- Indicador de carga en tiempo real

#### Tab Acciones
- Botón: Agregar un producto test
- Botón: Agregar 3 productos secuencialmente
- Botón: Limpiar carrito
- Botón: Recargar página

#### Tab Storage
- Monitor en vivo de localStorage
- Visualización de todas las claves `ndv_*`
- Botón para copiar valores
- Detalles expandibles para ver contenido completo

#### Tab Escenarios
- 8 escenarios de testing predefinidos:
  1. Agregar un producto
  2. Agregar múltiples productos
  3. Actualizar cantidad
  4. Remover producto
  5. Persistencia en localStorage
  6. Vaciar carrito
  7. Abrir drawer del carrito
  8. Estados de carga

## Acceso a la Página de Testing

**URL:** `http://localhost:3000/test-cart`

**En Producción:** Cambiar por URL del dominio

## Flujo de Testing Recomendado

### 1. Testing Básico (5 minutos)
```
1. Accede a /test-cart
2. Click "Agregar Producto Test"
3. Verifica que se agregó a Overview
4. Click en el carrito (ícono en nav)
5. Verifica que aparece en el drawer
6. Click "Enviar pedido por WhatsApp"
```

### 2. Testing de Persistencia (5 minutos)
```
1. Agrega varios productos
2. Tab "Storage" → Verifica localStorage
3. Abre DevTools (F12) → Tab Application → Storage
4. Recarga la página (F5)
5. Verifica que los productos persisten
6. Verifica que localStorage sigue ahí
```

### 3. Testing de Notificaciones (3 minutos)
```
1. Agrega un producto
2. Verifica que aparece notificación verde
3. Intenta agregar sin stock
4. Verifica que aparece notificación roja
5. Verifica que se desaparece automáticamente
```

### 4. Testing de Animaciones (3 minutos)
```
1. Abre el carrito
2. Verifica que abre con animación
3. Agrega productos
4. Verifica que cada item entra con animación
5. Vacía el carrito
6. Verifica que items salen con animación
```

### 5. Testing de Estados de Carga (5 minutos)
```
1. DevTools (F12) → Network
2. Throttle: "Slow 3G"
3. Click "Agregar Producto Test"
4. Verifica que el botón muestra "Agregando..."
5. Verifica que counter se actualiza
6. Verifica que notificación aparece
```

## Productos Mock para Testing

### Producto Test Principal
```typescript
{
  id: 'test-tire-001',
  name: 'Neumático Test',
  brand: 'Test Brand',
  sku: 'TEST-225/65R17',
  width: 225,
  aspect_ratio: 65,
  rim_diameter: 17,
  season: 'Invierno',
  price: 89000,
  sale_price: 69000,
  stock_quantity: 10,
  image_url: '/placeholder-tire.png'
}
```

## Claves localStorage Monitoradas

- `ndv_cart_session` - ID de sesión del carrito
- `ndv_cart_*` - Datos del carrito (JSON serializado)
- `ndv_session_*` - Datos de sesión

## Integración de Notificaciones

### 1. En el Layout
Las notificaciones están integradas automáticamente en `/src/app/layout.tsx`

```tsx
<NotificationProvider>
  <CartProvider>
    {children}
  </CartProvider>
</NotificationProvider>
```

### 2. En AddToCartButton
Al agregar productos, automáticamente se muestran notificaciones:

```tsx
// Éxito
showNotification({
  type: 'success',
  title: '¡Agregado al carrito!',
  message: `${productName} fue añadido exitosamente`,
  duration: 3000
})

// Error
showNotification({
  type: 'error',
  title: 'Error al agregar',
  message: 'No se pudo agregar el producto al carrito',
  duration: 4000
})
```

## Casos de Uso del Sistema de Notificaciones

### Agregar Producto
```tsx
const { showNotification } = useNotifications()

showNotification({
  type: 'success',
  title: '¡Producto agregado!',
  message: 'Se añadió correctamente al carrito',
  duration: 3000
})
```

### Validación Fallida
```tsx
showNotification({
  type: 'error',
  title: 'Error de validación',
  message: 'Por favor completa todos los campos',
  duration: 4000
})
```

### Operación Completada
```tsx
showNotification({
  type: 'success',
  title: 'Operación completada',
  duration: 3000
})
```

### Con Acción
```tsx
showNotification({
  type: 'info',
  title: 'Acción requerida',
  action: {
    label: 'Ir al carrito',
    onClick: () => router.push('/carrito')
  },
  duration: 0 // No desaparece automáticamente
})
```

## Debugging

### Console Logs
El carrito tiene logs detallados con colores:
- 🔄 Operaciones normales
- 🟢 Agregar items
- ❌ Errores
- ✅ Éxito
- ⚠️ Advertencias
- 🟣 Botón "Agregar al Carrito"

### DevTools
1. Abre DevTools (F12)
2. Tab "Console" para ver logs
3. Tab "Application" para ver localStorage
4. Tab "Network" para ver throttling
5. Tab "Performance" para analizar animaciones

### LocalStorage Debug
```javascript
// En la consola
localStorage // Ver todo
localStorage.getItem('ndv_cart_session')
Object.keys(localStorage).filter(k => k.startsWith('ndv_'))
```

## Mejoras Futuras

1. **Test Automation**
   - Playwright E2E tests
   - CI/CD integration
   - Visual regression testing

2. **Más Notificaciones**
   - Stock bajo
   - Cambios de precio
   - Límites de cantidad

3. **Analytics**
   - Tracking de conversión
   - Funnel analysis
   - A/B testing

4. **Performance**
   - Lazy loading
   - Code splitting
   - Image optimization

## Troubleshooting

### Problema: Notificaciones no aparecen
**Solución:** Verifica que `NotificationProvider` está en el layout

### Problema: Carrito no persiste
**Solución:** Verifica localStorage en DevTools, limpia y recarga

### Problema: Animaciones entrecortadas
**Solución:** Verifica performance en DevTools, desactiva extensiones

### Problema: Botones no se deshabilitan
**Solución:** Verifica que `isLoading` viene del context

## Recursos

- Documentación de Framer Motion: https://www.framer.com/motion/
- React Context API: https://react.dev/reference/react/useContext
- Next.js Client Components: https://nextjs.org/docs/getting-started/react-essentials

---

**Última actualización:** 2024
**Versión:** 1.0
**Status:** ✅ Production Ready
