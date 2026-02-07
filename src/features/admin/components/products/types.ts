export interface ProductFormData {
  // General Info
  name: string
  sku: string
  brand_name: string | null
  description: string | null
  price: number | null
  sale_price: number | null
  stock: number
  min_stock_alert: number

  // Specifications
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  construction: string | null
  load_index: number | null
  speed_rating: string | null
  season: string | null

  // Characteristics
  extra_load: boolean
  run_flat: boolean
  seal_inside: boolean
  tube_type: boolean
  homologation: string | null

  // Status & Marketing
  status: 'active' | 'inactive' | 'out_of_stock'
  featured: boolean
  best_seller: boolean
  new_arrival: boolean
}

export interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string | null
  onSuccess?: () => void
}
