// Order Status Enums
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderSource {
  WEBSITE = 'website',
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
  IN_STORE = 'in_store',
  ADMIN = 'admin',
}

// Order Item type
export interface OrderItem {
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  total_price: number
  image_url?: string
  brand?: string
  model?: string
}

// Main Order interface
export interface Order {
  id: string
  order_number: string
  voucher_code?: string
  customer_name: string
  customer_email: string
  customer_phone: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total_amount: number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string
  source: OrderSource
  notes?: string
  store_id?: string
  created_at: string
  updated_at: string
}

// Order History for tracking changes
export interface OrderHistory {
  id: string
  order_id: string
  action: string
  description: string
  user_id?: string
  previous_status?: OrderStatus
  new_status?: OrderStatus
  created_at: string
}

// API Request/Response types
export interface CreateOrderRequest {
  voucher_code?: string
  customer_name: string
  customer_email: string
  customer_phone: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping?: number
  payment_method: string
  source?: OrderSource
  notes?: string
  store_id?: string
}

export interface UpdateOrderRequest {
  status?: OrderStatus
  payment_status?: PaymentStatus
  notes?: string
}

export interface CreateOrderResponse {
  success: boolean
  order?: Order
  error?: string
}

export interface UpdateOrderResponse {
  success: boolean
  order?: Order
  error?: string
}

export interface ListOrdersResponse {
  success: boolean
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
  error?: string
}

// Filter options for listing
export interface OrderFilters {
  status?: OrderStatus
  payment_status?: PaymentStatus
  source?: OrderSource
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  limit?: number
}
