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
  stock: number  // Keep this for compatibility
  stock_quantity?: number  // Actual DB field
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
  model?: string
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
  [key: string]: string | number | undefined
}

// Extended type for preview with metadata
export interface ImportRowPreview extends Omit<ImportRow, keyof ImportRow> {
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
  _hasSucursales: boolean
  _headers: string[]
  [key: string]: string | number | boolean | string[] | undefined
}

// Database query result types
export interface DBProductRaw {
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
  stock?: number
  stock_quantity?: number
  image_url?: string
  is_featured?: boolean
  features?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DBBrandRow {
  brand: string
}

export interface DBCategoryRow {
  category: string
}

export interface DBModelRow {
  model: string
}

export interface DBSizeRow {
  width: number | null
  profile: number | null
  diameter: number | null
}

export interface SizeOption {
  display: string
  width: number
  profile: number
  diameter: number
}

export interface ProductSearchResult {
  id: string
  name: string
  brand: string
  size?: string
  price: number
}

// PostgrestFilterBuilder type for query building
export type SupabaseQuery<T> = {
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQuery<T>
  eq: (column: string, value: unknown) => SupabaseQuery<T>
  or: (filters: string) => SupabaseQuery<T>
  gte: (column: string, value: number) => SupabaseQuery<T>
  lte: (column: string, value: number) => SupabaseQuery<T>
  gt: (column: string, value: number) => SupabaseQuery<T>
  range: (from: number, to: number) => SupabaseQuery<T>
}