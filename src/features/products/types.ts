export interface Product {
  id: string
  name: string
  brand: string
  model?: string
  category: string
  size?: string
  width?: number
  profile?: number
  diameter?: number
  load_index?: string
  speed_rating?: string
  description?: string
  price: number
  price_list?: number
  stock: number
  image_url?: string
  is_featured?: boolean
  features?: Record<string, any>
  created_at: string
  updated_at: string

  // Computed/helper fields
  size_display?: string
  images?: string[]
}

export interface ProductFilters {
  search?: string
  brand?: string
  category?: string
  width?: number
  profile?: number
  diameter?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

export interface ImportRow {
  sku: string
  name: string
  brand: string
  model?: string
  category?: string
  width?: string | number
  profile?: string | number
  diameter?: string | number
  price: string | number
  price_list?: string | number
  stock?: string | number
  description?: string
  [key: string]: any
}