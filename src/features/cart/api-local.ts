import { CartSession, CartItem, CartTotals } from './types'
import { getProductById } from '@/features/products/api-local'

// Generate unique session ID
export function generateSessionId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get cart from localStorage
function getLocalCart(sessionId: string): CartItem[] {
  if (typeof window === 'undefined') return []

  const cartData = localStorage.getItem(`cart_${sessionId}`)
  if (!cartData) return []

  try {
    return JSON.parse(cartData)
  } catch {
    return []
  }
}

// Save cart to localStorage
function saveLocalCart(sessionId: string, items: CartItem[]): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(`cart_${sessionId}`, JSON.stringify(items))
}

// Get product from actual products list
async function getProduct(productId: string) {
  try {
    const product = await getProductById(productId)

    if (!product) {
      console.error(`Product not found: ${productId}`)
      return null
    }

    // Map Product to cart-compatible format
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      price: product.price,
      sale_price: product.price, // If there's no sale_price in Product type, use price
      stock_quantity: product.stock,
      width: product.width,
      aspect_ratio: product.profile,
      rim_diameter: product.diameter,
      season: product.features?.season || product.category,
      image_url: product.images?.[0] || '/tire.webp'
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Get or create cart session
export async function getOrCreateCartSession(sessionId: string): Promise<CartSession | null> {
  try {
    const items = getLocalCart(sessionId)
    const now = new Date()
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    return {
      id: sessionId,
      session_id: sessionId,
      items,
      expires_at: expires.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
  } catch (error) {
    console.error('Error in getOrCreateCartSession:', error)
    return null
  }
}

// Add item to cart
export async function addToCart(
  sessionId: string,
  productId: string,
  quantity: number = 1
): Promise<boolean> {
  try {
    const items = getLocalCart(sessionId)
    const product = await getProduct(productId)

    if (!product || product.stock_quantity < quantity) return false

    // Check if item exists
    const existingItemIndex = items.findIndex(item => item.product_id === productId)

    if (existingItemIndex >= 0) {
      // Update quantity
      const existingItem = items[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.stock_quantity) return false

      items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity
      }
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
      items.push(newItem)
    }

    saveLocalCart(sessionId, items)
    return true
  } catch (error) {
    console.error('Error adding to cart:', error)
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