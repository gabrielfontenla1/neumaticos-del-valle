/**
 * Product Types for Admin
 */

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string | null
  brand_id: string | null
  brand_name: string | null
  category_id: string | null
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  construction: string | null
  load_index: number | null
  speed_rating: string | null
  season: string | null
  price: number | null
  sale_price: number | null
  cost: number | null
  stock_quantity: number
  min_stock_alert: number
  status: ProductStatus
  featured: boolean
  best_seller: boolean
  new_arrival: boolean
  created_at: string
  updated_at: string
}

export interface ProductStats {
  total: number
  active: number
  inactive: number
  out_of_stock: number
  low_stock: number
  featured: number
}

export interface ProductFilters {
  status?: ProductStatus
  brand_id?: string
  category_id?: string
  search?: string
  page?: number
  limit?: number
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  out_of_stock: 'Sin Stock',
}
