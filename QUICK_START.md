# Quick Start - Sistema de Testing E2E

## 🚀 Inicio Rápido

### 1. Ver la página de testing
```
http://localhost:3000/test-cart
```

### 2. Ejecutar un test básico
- Click en "Agregar Producto Test"
- Verifica que la notificación verde aparece
- Abre el carrito (icono en navbar)
- Verifica que el producto está ahí

### 3. Usar notificaciones en tu código
```typescript
import { useNotifications } from '@/components/CartNotifications'

function MyComponent() {
  const { showNotification } = useNotifications()

  const handleSuccess = () => {
    showNotification({
      type: 'success',
      title: '¡Operación exitosa!',
      message: 'Todo funcionó correctamente',
      duration: 3000
    })
  }

  return <button onClick={handleSuccess}>Test</button>
}
```

## 📂 Archivos Principales

### Sistema de Notificaciones
📄 `/src/components/CartNotifications.tsx`
- Proveedor de contexto
- Hook `useNotifications()`
- Componentes internos de notificación

### Página de Testing
📄 `/src/app/test-cart/page.tsx`
- Interfaz completa de testing
- 4 tabs: Overview, Acciones, Storage, Escenarios
- 8 casos de testing predefinidos

### CartDrawer Mejorado
📄 `/src/features/cart/components/CartDrawer.tsx`
- Contador animado
- Estados de carga
- Mejores animaciones

### AddToCartButton Mejorado
📄 `/src/features/cart/components/AddToCartButton.tsx`
- Integración de notificaciones
- Toast en agregar/error
- Feedback visual mejorado

## 📚 Documentación

| Documento | Propósito | Tamaño |
|-----------|-----------|--------|
| `TEST_CART_GUIDE.md` | Guía completa de testing | 350+ líneas |
| `E2E_TESTING_SUMMARY.md` | Resumen ejecutivo | 400+ líneas |
| `IMPLEMENTATION_DETAILS.md` | Detalles técnicos | 250+ líneas |
| `QUICK_START.md` | Este archivo | Referencia rápida |

## 🎯 Casos de Uso

### Agregar notificación de éxito
```typescript
showNotification({
  type: 'success',
  title: 'Producto agregado',
  message: 'Se agregó al carrito correctamente',
  duration: 3000
})
```

### Agregar notificación de error
```typescript
showNotification({
  type: 'error',
  title: 'Error al agregar',
  message: 'No se pudo agregar el producto',
  duration: 4000
})
```

### Agregar notificación con acción
```typescript
showNotification({
  type: 'info',
  title: 'Verifica tu carrito',
  action: {
    label: 'Ir al carrito',
    onClick: () => router.push('/carrito')
  },
  duration: 0  // No desaparece automáticamente
})
```

### Agregar notificación de advertencia
```typescript
showNotification({
  type: 'warning',
  title: 'Stock bajo',
  message: 'Solo quedan 2 unidades disponibles',
  duration: 5000
})
```

## 🧪 Escenarios de Testing Rápidos

### Test 1: Agregar producto (2 min)
1. Accede a `/test-cart`
2. Click "Agregar Producto Test"
3. Verifica notificación verde
4. Verifica contador en Overview

### Test 2: Persistencia (2 min)
1. Agrega 3 productos con "Agregar 3 Productos"
2. Tab "Storage" → Verifica localStorage
3. Recarga página (F5)
4. Verifica que los productos persisten

### Test 3: Animaciones (1 min)
1. Abre el carrito
2. Observa entrada con animación
3. Agrega un producto
4. Observa items con stagger

### Test 4: Estados de carga (2 min)
1. DevTools (F12) → Network → "Slow 3G"
2. Click "Agregar Producto Test"
3. Verifica "Agregando..." en botón
4. Verifica spinner en header

## 🔍 Debugging

### Console Logs
El carrito tiene logs con colores:
```
🟢 [useCart] addItem INICIO
🟣 [AddToCartButton] handleAddToCart INICIO
❌ [useCart] Error en loadCart: ...
✅ [AddToCartButton] Producto agregado exitosamente
```

### Ver localStorage
```javascript
// En la consola del navegador (F12)
localStorage  // Ver todo
localStorage.getItem('ndv_cart_session')
Object.keys(localStorage).filter(k => k.startsWith('ndv_'))
```

### Ver notificaciones
```javascript
// Las notificaciones aparecen en bottom-right
// Verifica en el navegador mientras haces testing
// En DevTools: Elements (Inspector) → Busca "notification"
```

## 📱 Testing en Móvil

### Responsive
- ✅ Funciona en 320px (móvil pequeño)
- ✅ Funciona en 768px (tablet)
- ✅ Funciona en 1024px+ (desktop)

### Touch
- ✅ Botones con tap animation
- ✅ Notificaciones swipeable
- ✅ Drawer abre desde lado

### Teléfono físico
1. `npm run dev`
2. Obtén la IP: `ipconfig getifaddr en0` (Mac) o `ipconfig` (Windows)
3. Accede desde el teléfono: `http://[TU_IP]:3000/test-cart`

## 🚀 Deploy

### Vercel
```bash
git add .
git commit -m "feat: Add E2E testing system and notification toasts"
git push
# Vercel detecta cambios automáticamente
```

### Manual
```bash
npm run build
npm run start
# Accede a http://localhost:3000/test-cart
```

## ⚡ Performance Tips

### Monitoreo
- Abre DevTools (F12)
- Tab Network para ver requests
- Tab Performance para analizar animaciones

### Optimizaciones
- Notificaciones son GPU-accelerated
- localStorage es asincrónico
- Animaciones usan requestAnimationFrame

## 🆘 Problemas Comunes

### Notificaciones no aparecen
✓ Verifica que `NotificationProvider` está en layout.tsx
✓ Verifica console para errores
✓ Verifica z-index: 50 en CartNotifications

### Carrito no persiste
✓ Abre DevTools → Application → Storage → localStorage
✓ Busca claves que empiezan con `ndv_`
✓ Limpia localStorage y recarga

### Animaciones entrecortadas
✓ Cierra extensiones del navegador
✓ Abre DevTools → Performance → graba interacción
✓ Verifica que tu computadora no está lenta

## 📞 Soporte

Para más información:
- Lee `TEST_CART_GUIDE.md` para guía completa
- Lee `IMPLEMENTATION_DETAILS.md` para detalles técnicos
- Revisa console.log para debuggear
- Abre GitHub issues si encuentras bugs

## 🎓 Aprender Más

### Framer Motion
- Documentación: https://www.framer.com/motion/
- Ejemplos de animaciones

### React Context
- Documentación: https://react.dev/reference/react/useContext
- Gestión de estado global

### Next.js
- Documentación: https://nextjs.org/
- Client components: https://nextjs.org/docs/getting-started/react-essentials

---

**¡Listo para empezar!** 🚀

1. Ve a `/test-cart`
2. Experimenta con los botones
3. Abre el carrito
4. Mira las animaciones
5. Revisa localStorage
6. ¡Disfruta el feedback visual! ✨
