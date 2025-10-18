import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { CartSession, CartItem, CartTotals } from './types'

// Generate unique session ID
export function generateSessionId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create cart session
export async function getOrCreateCartSession(sessionId: string): Promise<CartSession | null> {
  try {
    // First try to get existing session
    const { data: existingSession, error: fetchError } = await supabase
      .from('cart_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (existingSession && !fetchError) {
      const session = existingSession as any

      // Get cart items
      const { data: items } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            name, brand_id, sku, price, sale_price, stock_quantity,
            width, aspect_ratio, rim_diameter, season,
            brands (name),
            product_images (url, is_primary)
          )
        `)
        .eq('cart_session_id', session.id)

      const cartItems: CartItem[] = (items as any[] || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products.name,
        brand: item.products.brands?.name || '',
        sku: item.products.sku,
        price: item.price_at_time,
        sale_price: item.products.sale_price,
        quantity: item.quantity,
        image_url: item.products.product_images?.find((img: any) => img.is_primary)?.url || null,
        width: item.products.width,
        aspect_ratio: item.products.aspect_ratio,
        rim_diameter: item.products.rim_diameter,
        season: item.products.season,
        stock_quantity: item.products.stock_quantity
      }))

      return {
        id: session.id,
        session_id: session.session_id,
        items: cartItems,
        expires_at: session.expires_at,
        created_at: session.created_at,
        updated_at: session.updated_at
      }
    }

    // Create new session
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: newSession, error: createError } = await untypedClient
      .from('cart_sessions')
      .insert({
        session_id: sessionId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (createError) {
      // Silently fail if database is not set up yet
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cart database not available:', createError.message)
      }
      return null
    }

    const session = newSession as any

    return {
      id: session.id,
      session_id: session.session_id,
      items: [],
      expires_at: session.expires_at,
      created_at: session.created_at,
      updated_at: session.updated_at
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
    // Get cart session
    const session = await getOrCreateCartSession(sessionId)
    if (!session) return false

    // Get product details
    const { data: productData } = await supabase
      .from('products')
      .select('price, sale_price, stock_quantity')
      .eq('id', productId)
      .single()

    const product = productData as any

    if (!product || product.stock_quantity < quantity) return false

    // Check if item exists
    const { data: existingItemData } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_session_id', session.id)
      .eq('product_id', productId)
      .single()

    const existingItem = existingItemData as any

    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.stock_quantity) return false

      const { error } = await untypedClient
        .from('cart_items')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)

      return !error
    } else {
      // Add new item
      const { error } = await untypedClient
        .from('cart_items')
        .insert({
          cart_session_id: session.id,
          product_id: productId,
          quantity,
          price_at_time: product.sale_price || product.price
        })

      return !error
    }
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

    const session = await getOrCreateCartSession(sessionId)
    if (!session) return false

    // Get item and check stock
    const { data: item } = await supabase
      .from('cart_items')
      .select('product_id, products(stock_quantity)')
      .eq('id', itemId)
      .eq('cart_session_id', session.id)
      .single()

    const itemData = item as any

    if (!itemData || itemData.products.stock_quantity < quantity) return false

    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await untypedClient
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)

    return !error
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
    const session = await getOrCreateCartSession(sessionId)
    if (!session) return false

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_session_id', session.id)

    return !error
  } catch (error) {
    console.error('Error removing from cart:', error)
    return false
  }
}

// Clear cart
export async function clearCart(sessionId: string): Promise<boolean> {
  try {
    const session = await getOrCreateCartSession(sessionId)
    if (!session) return false

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_session_id', session.id)

    return !error
  } catch (error) {
    console.error('Error clearing cart:', error)
    return false
  }
}

// Calculate cart totals
export async function calculateCartTotals(sessionId: string): Promise<CartTotals> {
  try {
    const session = await getOrCreateCartSession(sessionId)
    if (!session || session.items.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        items_count: 0
      }
    }

    const subtotal = session.items.reduce((sum, item) => {
      const price = item.sale_price || item.price
      return sum + (price * item.quantity)
    }, 0)

    const tax = subtotal * 0.19 // 19% IVA
    const shipping = 0 // Free shipping for pickup
    const total = subtotal + tax + shipping
    const items_count = session.items.reduce((sum, item) => sum + item.quantity, 0)

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