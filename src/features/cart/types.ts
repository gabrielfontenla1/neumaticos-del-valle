export interface CartItem {
  id: string
  product_id: string
  name: string
  brand: string
  sku: string
  price: number
  sale_price: number | null
  quantity: number
  image_url: string | null
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  season: string | null
  stock_quantity: number
}

export interface CartSession {
  id: string
  session_id: string
  items: CartItem[]
  expires_at: string
  created_at: string
  updated_at: string
}

export interface CartTotals {
  subtotal: number
  tax: number
  shipping: number
  total: number
  items_count: number
}

export interface CustomerData {
  name: string
  email: string
  phone: string
  store_id?: string
  notes?: string
}

export interface VoucherData {
  code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  store_id: string | null
  notes: string | null
  valid_until: string
}