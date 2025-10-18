// Admin types for Neumáticos del Valle

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'vendedor'
  created_at: string
}

export interface DashboardStats {
  todayAppointments: number
  pendingVouchers: number
  recentOrders: number
  lowStockProducts: number
  monthlyRevenue: number
  monthlyGrowth: number
}

export interface AdminSession {
  user: AdminUser
  token: string
  expiresAt: string
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  items: OrderItem[]
  total_amount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

export interface ProductStock {
  id: string
  name: string
  sku: string
  current_stock: number
  min_stock: number
  max_stock: number
  last_updated: string
}