# Shopping Cart Debugging Guide

**Purpose**: Help developers debug shopping cart issues using the enhanced logging system
**Last Updated**: 2025-11-05
**Status**: Ready for use

---

## Quick Start

### Enable Logging
1. Open browser DevTools: **F12**
2. Go to **Console** tab
3. Add products to cart
4. Look for colored markers: 🔍, 🔶, 🟡, 💾, 🔷, 🔄

---

## Log Marker Reference

### Product Retrieval Flow

#### 🔍 getProductById (src/features/products/api.ts)
**When**: Product is fetched from Supabase

**Expected Log**:
```
🔍 [getProductById] INICIO - id: 7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b
🔍 [getProductById] Response - data: OBTENIDO
🔍 [getProductById] Producto mapeado: {
  id: "7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b",
  name: "Michelin Pilot Sport 4",
  price: 150,
  stock: 10,
  width: 185,
  profile: 65,
  diameter: 15
}
🔍 [getProductById] FIN - SUCCESS
```

**Troubleshooting**:
- ❌ "Response - data: NULL" → Product not in database
- ❌ "Response - error: NOT FOUND" → ID doesn't exist
- ❌ "Response - error: PERMISSION DENIED" → Check Supabase key

---

#### 🔶 getProduct (src/features/cart/api-local.ts)
**When**: Product is mapped for cart storage

**Expected Log**:
```
🔶 [api-local/getProduct] INICIO - productId: 7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b
🔶 [api-local/getProduct] Llamando a getProductById...
🔶 [api-local/getProduct] Producto recibido: {
  id: "...",
  name: "Michelin Pilot Sport 4",
  price: 150,
  stock: 10,
  ...
}
🔶 [api-local/getProduct] Producto mapeado completamente: {
  id: "7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b",
  product_id: "7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b",  ← IMPORTANT: Must be set
  name: "Michelin Pilot Sport 4",
  price: 150,
  stock_quantity: 10,
  brand: "Michelin",
  sku: "MI-185-65-15",
  width: 185,
  aspect_ratio: 65,        ← Mapped from profile
  rim_diameter: 15         ← Mapped from diameter
}
🔶 [api-local/getProduct] FIN - SUCCESS
```

**Troubleshooting**:
- ❌ "Producto no encontrado" → getProductById returned null
- ❌ "Producto incompleto - campos requeridos faltantes" → Missing id, name, or price
- ❌ No product_id in mapped output → **CRITICAL BUG**
- ⚠️ aspect_ratio or rim_diameter are 0 → Fields not mapping correctly

---

### Cart Operations Flow

#### 🟡 addToCart (src/features/cart/api-local.ts)
**When**: Adding item to shopping cart

**Expected Log**:
```
🟡 [api-local] addToCart INICIO
🟡 [api-local] sessionId: cart_1730760000000_abc123def
🟡 [api-local] productId: 7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b
🟡 [api-local] quantity: 1

🟡 [api-local] Items actuales en carrito: 0
🟡 [api-local] Obteniendo producto...
🟡 [api-local] Producto obtenido: {
  id: "7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b",
  name: "Michelin Pilot Sport 4",
  price: 150,
  stock: 10
}
🟡 [api-local] Index de item existente: -1  ← New item (not duplicate)
🟡 [api-local] Agregando nuevo item: {
  id: "item_1730760000000",
  product_id: "7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b",
  name: "Michelin Pilot Sport 4",
  quantity: 1,
  ...
}
🟡 [api-local] Guardando carrito en localStorage...
🟡 [api-local] Carrito guardado exitosamente
🟡 [api-local] Total items en carrito: 1
🟡 [api-local] addToCart FIN - SUCCESS
```

**Troubleshooting**:
- ❌ "sessionId inválido" → Session ID not initialized
- ❌ "productId inválido" → Empty or invalid product ID
- ❌ "quantity debe ser mayor a 0" → Quantity must be ≥ 1
- ❌ "Stock insuficiente" → Requested quantity > available stock
- ❌ "Stock del producto no disponible" → Missing stock field

---

#### 💾 saveLocalCart (src/features/cart/api-local.ts)
**When**: Saving cart to localStorage

**Expected Log**:
```
💾 [api-local/saveLocalCart] INICIO
💾 [api-local/saveLocalCart] sessionId: cart_1730760000000_abc123def
💾 [api-local/saveLocalCart] Cantidad de items: 1
💾 [api-local/saveLocalCart] Guardando en key: cart_cart_1730760000000_abc123def
💾 [api-local/saveLocalCart] Tamaño de datos: 456 caracteres
💾 [api-local/saveLocalCart] Guardado exitosamente
💾 [api-local/saveLocalCart] Verificación: OK
💾 [api-local/saveLocalCart] FIN
```

**Troubleshooting**:
- ⚠️ "Window undefined (SSR)" → Server-side rendering (normal in Next.js)
- ❌ "Verificación: FALLÓ" → localStorage save failed
- ⚠️ Large size (>1MB) → Consider cleanup

---

#### 📦 getLocalCart (src/features/cart/api-local.ts)
**When**: Loading cart from localStorage

**Expected Log**:
```
📦 [api-local/getLocalCart] INICIO - sessionId: cart_1730760000000_abc123def
📦 [api-local/getLocalCart] Buscando key: cart_cart_1730760000000_abc123def
📦 [api-local/getLocalCart] Datos encontrados: SÍ
📦 [api-local/getLocalCart] Items parseados: 1 items
📦 [api-local/getLocalCart] FIN - SUCCESS
```

**Troubleshooting**:
- "Datos encontrados: NO" → Cart empty (normal on first load)
- ❌ "Error parseando JSON" → localStorage data corrupted (use `localStorage.clear()`)

---

#### 🔷 getOrCreateCartSession (src/features/cart/api-local.ts)
**When**: Creating or retrieving cart session

**Expected Log**:
```
🔷 [api-local/getOrCreateCartSession] INICIO - sessionId: cart_1730760000000_abc123def
🔷 [api-local/getOrCreateCartSession] Obteniendo items del localStorage...
🔷 [api-local/getOrCreateCartSession] Items encontrados: 0
🔷 [api-local/getOrCreateCartSession] Sesión creada: {
  id: "cart_1730760000000_abc123def",
  session_id: "cart_1730760000000_abc123def",
  items: [],
  expires_at: "2025-11-12T...",
  created_at: "2025-11-05T...",
  updated_at: "2025-11-05T..."
}
🔷 [api-local/getOrCreateCartSession] FIN - SUCCESS
```

---

### Hook Flow

#### 🟢 addItem (src/features/cart/hooks/useCart.ts)
**When**: User clicks "Add to Cart" button

**Expected Log**:
```
🟢 [useCart] addItem INICIO
🟢 [useCart] productId: 7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b
🟢 [useCart] quantity: 1
🟢 [useCart] sessionId obtenido: cart_1730760000000_abc123def
🟢 [useCart] Llamando a addToCart API...
🟢 [useCart] Resultado de addToCart API: true
🟢 [useCart] Recargando carrito...
🟢 [useCart] Carrito recargado exitosamente
🟢 [useCart] addItem FIN - retornando: true
```

---

#### 🔄 loadCart (src/features/cart/hooks/useCart.ts)
**When**: Cart component mounts or after changes

**Expected Log**:
```
🔄 [useCart] loadCart INICIO
🔄 [useCart] sessionId: cart_1730760000000_abc123def
🔄 [useCart] Obteniendo o creando sesión de carrito...
🔄 [useCart] Sesión obtenida: {...session...}
🔄 [useCart] Items cargados: 1
🔄 [useCart] Calculando totales...
🔄 [useCart] Totales calculados: {
  subtotal: 150,
  tax: 28.5,
  shipping: 0,
  total: 178.5,
  items_count: 1
}
🔄 [useCart] loadCart ÉXITO
```

---

## Common Issues & Solutions

### Issue 1: Product Not Found in Cart

**Symptoms**:
```
❌ [api-local/getProduct] Producto no encontrado: 7e52fa1b-d9aa-4e0b-8876-37b77cf15f8b
```

**Root Causes**:
1. Product ID doesn't exist in database
2. Product ID is invalid/malformed
3. Database connection failed
4. Supabase key permissions issue

**Solution**:
1. Verify product exists: Open database → products table → search ID
2. Verify ID format (should be UUID)
3. Check Supabase connection status
4. Test with different product

---

### Issue 2: Duplicate Items in Cart

**Symptoms**:
- Same product added twice = 2 separate items (not quantity update)
- product_id field missing in cart items

**Root Cause**:
```
❌ product_id: undefined  ← Missing field
```

**Solution**:
- This should be FIXED by the current code
- Clear localStorage if old data present:
  ```javascript
  localStorage.clear()
  ```
- Reload page and retry

---

### Issue 3: Stock Error

**Symptoms**:
```
❌ [api-local] Stock insuficiente: {
  disponible: 5,
  solicitado: 10
}
```

**Root Causes**:
1. Requested quantity > available stock
2. Stock field not set in product database
3. Stock field is undefined/null

**Solution**:
1. Add only available quantity
2. Check database → ensure stock field populated
3. If field missing:
   ```javascript
   // Inspect product in console
   console.log(product.stock)
   console.log(product.stock_quantity)
   ```

---

### Issue 4: localStorage Corrupted

**Symptoms**:
```
❌ Error parseando JSON: SyntaxError: Unexpected token...
```

**Solution**:
```javascript
// In browser console
localStorage.clear()
// Reload page
location.reload()
```

---

### Issue 5: Tire Specs Missing

**Symptoms**:
- Product in cart but tire dimensions show as null/0

**Indicators**:
```
width: null          ← Should be 185
aspect_ratio: null   ← Should be 65
rim_diameter: null   ← Should be 15
```

**Root Cause**:
- Field mapping issue (profile → aspect_ratio, diameter → rim_diameter)
- Or fields missing in database product

**Solution**:
1. Check database → product row → width, profile, diameter fields
2. Verify mapping is correct in getProduct():
   ```typescript
   aspect_ratio: product.profile || null,  // ✅ Correct
   rim_diameter: product.diameter || null, // ✅ Correct
   ```

---

## Testing Commands

### 1. Check localStorage
```javascript
// In browser console
localStorage.getItem('cart_cart_...')  // Shows cart data
localStorage.keys()                      // Lists all storage keys
localStorage.clear()                     // Clear all (use carefully!)
```

### 2. Inspect Session
```javascript
// In browser console
sessionStorage.getItem('ndv_cart_session')  // Shows session ID
```

### 3. Check Product Fields
```javascript
// Add this to console when testing
const cartKey = localStorage.keys().find(k => k.startsWith('cart_cart_'))
const cart = JSON.parse(localStorage.getItem(cartKey))
cart.forEach(item => {
  console.log('Item:', {
    id: item.id,
    product_id: item.product_id,  // Should NOT be undefined
    name: item.name,
    width: item.width,
    aspect_ratio: item.aspect_ratio,  // Should have value
    rim_diameter: item.rim_diameter    // Should have value
  })
})
```

### 4. Monitor API Calls
```javascript
// In browser DevTools
// Go to Network tab
// Filter by "api"
// Look for products endpoint calls
// Check response status (200 = success)
```

---

## Debug Workflow

### When Adding Product to Cart

1. **Open Console** (F12)
2. **Click "Add to Cart"**
3. **Watch for markers**:
   - 🔍 → Product fetched from DB
   - 🔶 → Product mapped for cart
   - 🟡 → Item added to cart
   - 💾 → Saved to localStorage
4. **Check for errors** (red text with ❌)
5. **Verify cart updated** (check cart UI)

---

### When Cart Not Working

1. **Check Console for Errors**:
   - Look for red text
   - Look for ❌ markers
   - Note the error message

2. **Identify Failing Step**:
   - No 🔍 log → Product retrieval failed
   - No 🔶 log → Product mapping failed
   - No 🟡 log → Cart operation failed
   - No 💾 log → Storage save failed

3. **Apply Appropriate Fix**:
   - See "Common Issues & Solutions" above

4. **Verify Fix**:
   - Clear console
   - Retry operation
   - Look for ✅ "SUCCESS" markers

---

## Performance Monitoring

### Monitor localStorage Size
```javascript
// In browser console
function getStorageSize() {
  let size = 0
  for(let key in localStorage) {
    if(localStorage.hasOwnProperty(key)) {
      size += localStorage[key].length + key.length
    }
  }
  return (size / 1024).toFixed(2) + ' KB'
}
console.log(getStorageSize())
```

**Thresholds**:
- < 100 KB: Normal
- 100 KB - 1 MB: Monitor
- > 1 MB: Consider cleanup

---

## Advanced Debugging

### Enable Verbose Logging
All logging is already enabled in the fixed code. Markers use colors for easy filtering:
- 🔍 Blue (Product retrieval)
- 🔶 Orange (Product mapping)
- 🟡 Yellow (Cart operations)
- 🟢 Green (Hook operations)
- 🔷 Blue (Session)
- 💾 Disk (Storage)
- 📦 Box (localStorage read)

### Filter Console
In browser DevTools Console:
- **Filter box**: Type "🔍" to see only product retrieval logs
- **Filter box**: Type "error" to see only errors

### Copy Full Log
```javascript
// Get all logs as text for bug reports
// Select all (Ctrl+A) → Copy → Paste in text file
```

---

## Documentation References

- **BACKEND_API_VERIFICATION_REPORT.md** - Detailed technical analysis
- **CART_FIXES_SUMMARY.md** - Quick summary of fixes
- **VERIFICATION_CHECKLIST.md** - Complete checklist
- **DEBUGGING_GUIDE.md** - This document

---

## Support

### Quick Checklist for Issues

- [ ] Is Supabase URL correct?
- [ ] Is Supabase key valid?
- [ ] Does product exist in database?
- [ ] Does product have required fields (name, price, stock)?
- [ ] Is browser console showing errors?
- [ ] Is localStorage full?
- [ ] Are tire specs in database?

### Get Help

1. **Check Console Logs** - Most issues visible in colored markers
2. **Clear Cache** - `localStorage.clear()` + reload
3. **Verify Database** - Check Supabase dashboard
4. **Test with Different Product** - Isolate the issue
5. **Check Network** - Verify API calls in DevTools Network tab

---

**Last Updated**: 2025-11-05
**Status**: Ready for Production Use
