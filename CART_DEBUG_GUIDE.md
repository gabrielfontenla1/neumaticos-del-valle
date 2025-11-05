# Guía de Diagnóstico del Carrito - Logging Exhaustivo

## Resumen de Cambios Implementados

Se ha agregado logging exhaustivo en toda la cadena de ejecución del carrito de compras para diagnosticar el problema del botón "Agregar al carrito".

## Archivos Modificados

### 1. ProductDetail.tsx
**Ubicación**: `/src/features/products/catalog/ProductDetail.tsx`

**Modificaciones**:
- ✅ Agregado logging exhaustivo en `handleAddToCart` (líneas 96-120)
- ✅ Función convertida a `async` para manejar correctamente la promesa
- ✅ Agregado manejo de errores con try/catch
- ✅ Agregado botón de debug temporal para ver estado del carrito (líneas 350-376)
- ✅ Importación del hook `useCart` con todas las propiedades necesarias (línea 27)

**Logs a buscar**:
```
🔵 [ProductDetail] handleAddToCart INICIO
🔵 [ProductDetail] Producto: {...}
🔵 [ProductDetail] Product ID: xxx
🔵 [ProductDetail] Quantity: 1
🔵 [ProductDetail] Llamando a addItem con: {...}
✅ [ProductDetail] Resultado de addItem: true/false
🔵 [ProductDetail] handleAddToCart FIN
```

### 2. useCart.ts
**Ubicación**: `/src/features/cart/hooks/useCart.ts`

**Modificaciones**:
- ✅ Logging en `loadCart` (líneas 54-89)
- ✅ Logging en `addItem` (líneas 98-115)
- ✅ Logging en inicialización del useEffect (línea 93)

**Logs a buscar**:
```
⚡ [useCart] useEffect - Inicializando carrito
🔄 [useCart] loadCart INICIO
🔄 [useCart] sessionId: xxx
🔄 [useCart] Items cargados: X
🔄 [useCart] Totales calculados: {...}
🟢 [useCart] addItem INICIO
🟢 [useCart] sessionId obtenido: xxx
🟢 [useCart] Resultado de addToCart API: true/false
🟢 [useCart] addItem FIN - retornando: true/false
```

### 3. api-local.ts
**Ubicación**: `/src/features/cart/api-local.ts`

**Modificaciones**:
- ✅ Logging en `getLocalCart` (líneas 10-38)
- ✅ Logging en `saveLocalCart` (líneas 41-63)
- ✅ Logging en `getProduct` (líneas 66-101)
- ✅ Logging en `getOrCreateCartSession` (líneas 104-129)
- ✅ Logging en `addToCart` (líneas 132-208)

**Logs a buscar**:
```
📦 [api-local/getLocalCart] INICIO - sessionId: xxx
📦 [api-local/getLocalCart] Items parseados: X items
💾 [api-local/saveLocalCart] Guardando en key: xxx
💾 [api-local/saveLocalCart] Verificación: OK/FALLÓ
🔶 [api-local/getProduct] Producto recibido: {...}
🔷 [api-local/getOrCreateCartSession] Sesión creada: {...}
🟡 [api-local] addToCart INICIO
🟡 [api-local] Producto obtenido: {...}
🟡 [api-local] Agregando nuevo item: {...}
🟡 [api-local] Total items en carrito: X
🟡 [api-local] addToCart FIN - SUCCESS
```

### 4. AddToCartButton.tsx
**Ubicación**: `/src/features/cart/components/AddToCartButton.tsx`

**Modificaciones**:
- ✅ Logging exhaustivo en `handleAddToCart` (líneas 30-87)

**Logs a buscar**:
```
🟣 [AddToCartButton] handleAddToCart INICIO
🟣 [AddToCartButton] Llamando a addItem con: {...}
🟣 [AddToCartButton] Resultado de addItem: true/false
✅ [AddToCartButton] Producto agregado exitosamente
🟣 [AddToCartButton] handleAddToCart FIN
```

## Flujo Completo de Logging

Cuando el usuario hace clic en "Agregar al carrito", el flujo de logs debería ser:

```
1. 🔵 [ProductDetail] handleAddToCart INICIO
2. 🔵 [ProductDetail] Llamando a addItem con: {...}
3. 🟢 [useCart] addItem INICIO
4. 🟢 [useCart] Llamando a addToCart API...
5. 🟡 [api-local] addToCart INICIO
6. 📦 [api-local/getLocalCart] INICIO
7. 📦 [api-local/getLocalCart] Items parseados: X items
8. 🔶 [api-local/getProduct] INICIO - productId: xxx
9. 🔶 [api-local/getProduct] Producto recibido: {...}
10. 🟡 [api-local] Agregando nuevo item: {...}
11. 💾 [api-local/saveLocalCart] INICIO
12. 💾 [api-local/saveLocalCart] Guardado exitosamente
13. 💾 [api-local/saveLocalCart] Verificación: OK
14. 🟡 [api-local] addToCart FIN - SUCCESS
15. 🟢 [useCart] Resultado de addToCart API: true
16. 🟢 [useCart] Recargando carrito...
17. 🔄 [useCart] loadCart INICIO
18. ✅ [ProductDetail] Resultado de addItem: true
19. 🔵 [ProductDetail] handleAddToCart FIN
```

## Botón de Debug

Se ha agregado un botón de debug temporal en la página de detalle del producto:

**Ubicación**: Debajo del botón "Agregar al carrito"
**Texto**: "🔍 DEBUG: Ver Estado Carrito"
**Color**: Púrpura

**Información que muestra**:
- Número de items en el carrito
- Total de items
- Estado de carga
- SessionId en localStorage
- Datos del carrito en localStorage

## Cómo Usar Este Debug

### 1. Abrir la Consola del Navegador
- Chrome/Edge: F12 o Ctrl+Shift+J (Windows) / Cmd+Option+J (Mac)
- Firefox: F12 o Ctrl+Shift+K (Windows) / Cmd+Option+K (Mac)

### 2. Reproducir el Problema
1. Ir a cualquier página de detalle de producto
2. Abrir la consola del navegador
3. Hacer clic en el botón "🔍 DEBUG: Ver Estado Carrito" para ver el estado inicial
4. Hacer clic en "Agregar al carrito"
5. Observar el flujo de logs en la consola
6. Hacer clic nuevamente en "🔍 DEBUG: Ver Estado Carrito" para ver el estado final

### 3. Identificar el Punto de Fallo

#### Si los logs se detienen en ProductDetail:
```
❌ [ProductDetail] No hay producto disponible
```
**Problema**: El producto no está cargando correctamente.

#### Si los logs se detienen en useCart:
```
❌ [useCart] No hay sessionId disponible
⚠️ [useCart] addToCart retornó false
```
**Problema**: No se está generando o recuperando el sessionId correctamente.

#### Si los logs se detienen en api-local/getProduct:
```
❌ [api-local/getProduct] Producto no encontrado
```
**Problema**: El API de productos no está retornando el producto.

#### Si los logs se detienen en api-local/addToCart:
```
❌ [api-local] Stock insuficiente
❌ [api-local] Nueva cantidad excede stock
```
**Problema**: Validación de stock fallando.

#### Si saveLocalCart falla:
```
💾 [api-local/saveLocalCart] Verificación: FALLÓ
```
**Problema**: localStorage no está funcionando o está lleno.

## Símbolos de Logging

- 🔵 **ProductDetail**: Componente de detalle del producto
- 🟢 **useCart Hook**: Hook personalizado del carrito
- 🟡 **api-local**: Funciones de API local (localStorage)
- 📦 **getLocalCart**: Lectura de localStorage
- 💾 **saveLocalCart**: Escritura en localStorage
- 🔶 **getProduct**: Obtención de datos del producto
- 🔷 **getOrCreateCartSession**: Creación/recuperación de sesión
- 🟣 **AddToCartButton**: Componente del botón
- ⚡ **useEffect**: Inicialización de efectos
- 🔄 **loadCart**: Recarga del carrito
- ✅ **Éxito**: Operación completada exitosamente
- ❌ **Error**: Operación fallida
- ⚠️ **Warning**: Advertencia

## Próximos Pasos

Una vez identificado el punto de fallo con los logs:

1. **Tomar una captura de pantalla** de la consola mostrando el flujo de logs
2. **Copiar todos los logs** relacionados con el flujo
3. **Verificar el botón de debug** para confirmar el estado del carrito
4. **Reportar** el punto específico donde se detiene el flujo

## Limpieza del Debug

Para remover todo el logging una vez solucionado el problema:

1. Buscar y remover todos los `console.log` agregados
2. Remover el botón de debug temporal de ProductDetail.tsx
3. Restaurar la función `handleAddToCart` a su versión original si es necesario

## Archivos a Revisar

Si el problema persiste después de identificar el punto de fallo:

1. `/src/features/products/api.ts` - Verificar `getProductById`
2. `/src/features/cart/types.ts` - Verificar tipos de datos
3. `/src/providers/CartProvider.tsx` - Verificar provider del carrito
4. Browser DevTools > Application > Local Storage - Verificar datos guardados
