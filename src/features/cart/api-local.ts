import { CartSession, CartItem, CartTotals } from './types'
import { getProductById } from '@/features/products/api'

// Generate unique session ID
export function generateSessionId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get cart from localStorage
function getLocalCart(sessionId: string): CartItem[] {
  console.log('📦 [api-local/getLocalCart] INICIO - sessionId:', sessionId)

  if (typeof window === 'undefined') {
    console.warn('⚠️ [api-local/getLocalCart] Window undefined (SSR)')
    return []
  }

  const key = `cart_${sessionId}`
  console.log('📦 [api-local/getLocalCart] Buscando key:', key)

  const cartData = localStorage.getItem(key)
  console.log('📦 [api-local/getLocalCart] Datos encontrados:', cartData ? 'SÍ' : 'NO')

  if (!cartData) {
    console.log('📦 [api-local/getLocalCart] No hay datos - retornando array vacío')
    return []
  }

  try {
    const items = JSON.parse(cartData)
    console.log('📦 [api-local/getLocalCart] Items parseados:', items.length, 'items')
    console.log('📦 [api-local/getLocalCart] FIN - SUCCESS')
    return items
  } catch (error) {
    console.error('❌ [api-local/getLocalCart] Error parseando JSON:', error)
    return []
  }
}

// Save cart to localStorage
function saveLocalCart(sessionId: string, items: CartItem[]): void {
  console.log('💾 [api-local/saveLocalCart] INICIO')
  console.log('💾 [api-local/saveLocalCart] sessionId:', sessionId)
  console.log('💾 [api-local/saveLocalCart] Cantidad de items:', items.length)

  if (typeof window === 'undefined') {
    console.warn('⚠️ [api-local/saveLocalCart] Window undefined (SSR)')
    return
  }

  const key = `cart_${sessionId}`
  const data = JSON.stringify(items)
  console.log('💾 [api-local/saveLocalCart] Guardando en key:', key)
  console.log('💾 [api-local/saveLocalCart] Tamaño de datos:', data.length, 'caracteres')

  localStorage.setItem(key, data)
  console.log('💾 [api-local/saveLocalCart] Guardado exitosamente')

  // Verificación
  const verification = localStorage.getItem(key)
  console.log('💾 [api-local/saveLocalCart] Verificación:', verification ? 'OK' : 'FALLÓ')
  console.log('💾 [api-local/saveLocalCart] FIN')
}

// Get product from actual products list
async function getProduct(productId: string) {
  console.log('🔶 [api-local/getProduct] INICIO - productId:', productId)
  try {
    console.log('🔶 [api-local/getProduct] Llamando a getProductById...')
    const product = await getProductById(productId)
    console.log('🔶 [api-local/getProduct] Producto recibido:', product)

    if (!product) {
      console.error('❌ [api-local/getProduct] Producto no encontrado:', productId)
      return null
    }

    // Validate required fields
    if (!product.id || !product.name || product.price === undefined) {
      console.error('❌ [api-local/getProduct] Producto incompleto - campos requeridos faltantes', {
        id: product.id,
        name: product.name,
        price: product.price
      })
      return null
    }

    // Map Product to cart-compatible format
    const mappedProduct = {
      id: product.id,
      product_id: product.id, // IMPORTANTE: Asignar product_id
      name: product.name,
      brand: product.brand || 'Sin marca',
      sku: product.sku || `SKU-${product.id}`,
      price: product.price,
      sale_price: product.price, // If there's no sale_price in Product type, use price
      stock_quantity: product.stock || product.stock_quantity || 0,
      width: product.width || null,
      aspect_ratio: product.profile || null,
      rim_diameter: product.diameter || null,
      season: product.features?.season || product.category || null,
      image_url: product.image_url || product.images?.[0] || null
    }

    console.log('🔶 [api-local/getProduct] Producto mapeado completamente:', {
      id: mappedProduct.id,
      product_id: mappedProduct.product_id,
      name: mappedProduct.name,
      price: mappedProduct.price,
      stock_quantity: mappedProduct.stock_quantity,
      brand: mappedProduct.brand,
      sku: mappedProduct.sku,
      width: mappedProduct.width,
      aspect_ratio: mappedProduct.aspect_ratio,
      rim_diameter: mappedProduct.rim_diameter
    })
    console.log('🔶 [api-local/getProduct] FIN - SUCCESS')
    return mappedProduct
  } catch (error) {
    console.error('❌ [api-local/getProduct] Error:', error)
    console.error('❌ [api-local/getProduct] Stack:', error instanceof Error ? error.stack : 'No stack')
    return null
  }
}

// Get or create cart session
export async function getOrCreateCartSession(sessionId: string): Promise<CartSession | null> {
  console.log('🔷 [api-local/getOrCreateCartSession] INICIO - sessionId:', sessionId)
  try {
    console.log('🔷 [api-local/getOrCreateCartSession] Obteniendo items del localStorage...')
    const items = getLocalCart(sessionId)
    console.log('🔷 [api-local/getOrCreateCartSession] Items encontrados:', items.length)

    const now = new Date()
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const session = {
      id: sessionId,
      session_id: sessionId,
      items,
      expires_at: expires.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
    console.log('🔷 [api-local/getOrCreateCartSession] Sesión creada:', session)
    console.log('🔷 [api-local/getOrCreateCartSession] FIN - SUCCESS')
    return session
  } catch (error) {
    console.error('❌ [api-local/getOrCreateCartSession] Error:', error)
    console.error('❌ [api-local/getOrCreateCartSession] Stack:', error instanceof Error ? error.stack : 'No stack')
    return null
  }
}

// Add item to cart
export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number = 1
): Promise<boolean> {
  console.log('🟡 [api-local] addToCart INICIO')
  console.log('🟡 [api-local] sessionId:', sessionId)
  console.log('🟡 [api-local] productId:', productId)
  console.log('🟡 [api-local] quantity:', quantity)

  try {
    // Validate inputs
    if (!sessionId || !sessionId.trim()) {
      console.error('❌ [api-local] sessionId inválido:', sessionId)
      return false
    }

    if (!productId || !productId.trim()) {
      console.error('❌ [api-local] productId inválido:', productId)
      return false
    }

    if (quantity <= 0) {
      console.error('❌ [api-local] quantity debe ser mayor a 0:', quantity)
      return false
    }

    const items = getLocalCart(sessionId)
    console.log('🟡 [api-local] Items actuales en carrito:', items.length)

    console.log('🟡 [api-local] Obteniendo producto...')
    const product = await getProduct(productId)
    console.log('🟡 [api-local] Producto obtenido:', product ? {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock_quantity
    } : 'NULL')

    if (!product) {
      console.error('❌ [api-local] Producto no encontrado:', productId)
      return false
    }

    if (product.stock_quantity === undefined || product.stock_quantity === null) {
      console.error('❌ [api-local] Stock del producto no disponible:', {
        productId,
        stock_quantity: product.stock_quantity
      })
      return false
    }

    if (product.stock_quantity < quantity) {
      console.error('❌ [api-local] Stock insuficiente:', {
        disponible: product.stock_quantity,
        solicitado: quantity
      })
      return false
    }

    // Check if item exists
    const existingItemIndex = items.findIndex(item => item.product_id === productId)
    console.log('🟡 [api-local] Index de item existente:', existingItemIndex)

    if (existingItemIndex >= 0) {
      // Update quantity
      const existingItem = items[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity
      console.log('🟡 [api-local] Actualizando cantidad existente:', {
        cantidadActual: existingItem.quantity,
        agregando: quantity,
        nuevaCantidad: newQuantity
      })

      if (newQuantity > product.stock_quantity) {
        console.error('❌ [api-local] Nueva cantidad excede stock:', {
          nuevaCantidad: newQuantity,
          stockDisponible: product.stock_quantity
        })
        return false
      }

      items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity
      }
      console.log('🟡 [api-local] Item actualizado:', items[existingItemIndex])
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `item_${Date.now()}`,
        product_id: productId,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        price: product.price,
        sale_price: product.sale_price,
        quantity,
        image_url: product.image_url,
        width: product.width,
        aspect_ratio: product.aspect_ratio,
        rim_diameter: product.rim_diameter,
        season: product.season,
        stock_quantity: product.stock_quantity
      }
      console.log('🟡 [api-local] Agregando nuevo item:', newItem)
      items.push(newItem)
    }

    console.log('🟡 [api-local] Guardando carrito en localStorage...')
    saveLocalCart(sessionId, items)
    console.log('🟡 [api-local] Carrito guardado exitosamente')
    console.log('🟡 [api-local] Total items en carrito:', items.length)
    console.log('🟡 [api-local] addToCart FIN - SUCCESS')
    return true
  } catch (error) {
    console.error('❌ [api-local] Error en addToCart:', error)
    console.error('❌ [api-local] Stack trace:', error instanceof Error ? error.stack : 'No stack')
    return false
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<boolean> {
  try {
    if (quantity <= 0) {
      return await removeFromCart(sessionId, itemId)
    }

    const items = getLocalCart(sessionId)
    const itemIndex = items.findIndex(item => item.id === itemId)

    if (itemIndex < 0) return false

    const item = items[itemIndex]
    const product = await getProduct(item.product_id)

    if (!product || product.stock_quantity < quantity) return false

    items[itemIndex] = {
      ...item,
      quantity
    }

    saveLocalCart(sessionId, items)
    return true
  } catch (error) {
    console.error('Error updating cart item:', error)
    return false
  }
}

// Remove item from cart
export async function removeFromCart(
  sessionId: string,
  itemId: string
): Promise<boolean> {
  try {
    const items = getLocalCart(sessionId)
    const filteredItems = items.filter(item => item.id !== itemId)

    if (filteredItems.length === items.length) return false // Item not found

    saveLocalCart(sessionId, filteredItems)
    return true
  } catch (error) {
    console.error('Error removing from cart:', error)
    return false
  }
}

// Clear cart
export async function clearCart(sessionId: string): Promise<boolean> {
  try {
    saveLocalCart(sessionId, [])
    return true
  } catch (error) {
    console.error('Error clearing cart:', error)
    return false
  }
}

// Calculate cart totals
export async function calculateCartTotals(sessionId: string): Promise<CartTotals> {
  try {
    const items = getLocalCart(sessionId)

    const subtotal = items.reduce((total, item) => {
      const price = item.sale_price || item.price
      return total + (price * item.quantity)
    }, 0)

    const tax = 0 // IVA ya incluido en el precio
    const shipping = 0 // Free shipping or calculate based on location
    const total = subtotal + shipping
    const items_count = items.reduce((count, item) => count + item.quantity, 0)

    return {
      subtotal,
      tax,
      shipping,
      total,
      items_count
    }
  } catch (error) {
    console.error('Error calculating totals:', error)
    return {
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      items_count: 0
    }
  }
}