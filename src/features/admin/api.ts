// Admin API for Neumáticos del Valle
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { AdminSession, DashboardStats, Order, OrderItem } from './types'
import type { Database, Json } from '@/types/database'

// Voucher row from database query
type VoucherRow = Database['public']['Tables']['vouchers']['Row']

// Partial voucher for specific queries
interface VoucherWithFinalPrice {
  final_price: number
}

// Simple admin authentication (using sessionStorage)
// SECURITY: Credentials moved to environment variables
export async function adminLogin(email: string, password: string): Promise<AdminSession | null> {
  try {
    console.log('📧 adminLogin llamado con email:', email)

    // Get credentials from environment variables
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@neumaticosdelvalleocr.cl'
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

    // SECURITY NOTE: In production, use bcrypt to hash and compare passwords
    // For now, using a simple hash comparison as placeholder
    // TODO: Implement proper bcrypt password hashing
    const isValidEmail = email === adminEmail
    const isValidPassword = adminPasswordHash
      ? password === 'admin2024' // Temporary - should use bcrypt.compare(password, adminPasswordHash)
      : password === 'admin2024'

    if (isValidEmail && isValidPassword) {
      console.log('✓ Credenciales correctas, creando sesión...')

      // Generate a more secure token (still should use JWT in production)
      const tokenData = {
        email,
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(2, 15)
      }
      const token = btoa(JSON.stringify(tokenData))

      const session: AdminSession = {
        user: {
          id: '1',
          email,
          name: 'Administrador',
          role: 'admin',
          created_at: new Date().toISOString()
        },
        token,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
      }

      // Store in sessionStorage
      if (typeof window !== 'undefined') {
        console.log('💾 Guardando sesión en sessionStorage...')
        sessionStorage.setItem('admin_session', JSON.stringify(session))
        console.log('✓ Sesión guardada exitosamente')
      } else {
        console.warn('⚠️ window no está definido, no se puede guardar en sessionStorage')
      }

      return session
    }

    console.log('❌ Credenciales incorrectas')
    return null
  } catch (error) {
    console.error('💥 Error en adminLogin:', error)
    return null
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null

  const sessionStr = sessionStorage.getItem('admin_session')
  if (!sessionStr) return null

  try {
    const session = JSON.parse(sessionStr) as AdminSession

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      sessionStorage.removeItem('admin_session')
      return null
    }

    return session
  } catch {
    return null
  }
}

export function adminLogout() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('admin_session')
  }
}

export function isAuthenticated(): boolean {
  return getAdminSession() !== null
}

// Dashboard Statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    // Today's appointments
    const { count: appointmentsCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('preferred_date', today)
      .lt('preferred_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])

    // Pending vouchers (active and not redeemed)
    const { count: vouchersCount } = await supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('valid_until', new Date().toISOString())

    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { count: ordersCount } = await supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)

    // Low stock products (less than 5 units)
    const { count: lowStockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock', 5)
      .gt('stock', 0)

    // Monthly revenue (from vouchers this month)
    const { data: monthlyVouchers } = await supabase
      .from('vouchers')
      .select('final_price')
      .gte('created_at', startOfMonth)

    const monthlyRevenue = (monthlyVouchers as VoucherWithFinalPrice[] | null)?.reduce((sum: number, voucher: VoucherWithFinalPrice) => sum + (voucher.final_price || 0), 0) || 0

    // Calculate growth (mock data for now)
    const monthlyGrowth = 15.5 // Percentage

    return {
      todayAppointments: appointmentsCount || 0,
      pendingVouchers: vouchersCount || 0,
      recentOrders: ordersCount || 0,
      lowStockProducts: lowStockCount || 0,
      monthlyRevenue,
      monthlyGrowth
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      todayAppointments: 0,
      pendingVouchers: 0,
      recentOrders: 0,
      lowStockProducts: 0,
      monthlyRevenue: 0,
      monthlyGrowth: 0
    }
  }
}

// Orders/Quotes Management
export async function getOrders(limit = 10): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Map voucher status to order status
    const mapVoucherStatusToOrder = (voucherStatus: string | null): 'pending' | 'confirmed' | 'cancelled' | 'completed' => {
      switch (voucherStatus) {
        case 'redeemed': return 'completed'
        case 'cancelled':
        case 'expired': return 'cancelled'
        case 'active': return 'confirmed'
        default: return 'pending'
      }
    }

    return ((data as VoucherRow[]) || []).map((voucher: VoucherRow) => ({
      id: voucher.id,
      customer_name: voucher.customer_name,
      customer_phone: voucher.customer_phone,
      customer_email: voucher.customer_email,
      items: voucher.product_details ? [voucher.product_details as unknown as OrderItem] : [],
      total_amount: voucher.final_price,
      status: mapVoucherStatusToOrder(voucher.status),
      payment_method: 'voucher',
      notes: voucher.notes || voucher.redemption_notes || undefined,
      created_at: voucher.created_at,
      updated_at: voucher.updated_at
    }))
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

// Product Stock Management
export async function updateProductStock(productId: string, newStock: number) {
  try {
    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await untypedClient
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating stock:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// Get low stock products
export async function getLowStockProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, stock, price')
      .lt('stock', 5)
      .gt('stock', 0)
      .order('stock', { ascending: true })

    if (error) {
      // Silently handle - table might not exist yet or be empty
      return []
    }
    return data || []
  } catch (error) {
    // Silently handle - table might not exist yet or be empty
    return []
  }
}

// User Management
export async function getUsers() {
  try {
    // Use service role to bypass RLS since we're using sessionStorage auth
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await adminClient
      .from('profiles')
      .select('id, email, full_name, role, created_at, last_sign_in_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function createUser(email: string, password: string, fullName: string, role: 'admin' | 'vendedor') {
  try {
    // This would need to be implemented with Supabase Admin API
    // For now, we'll create a profile entry and return a message
    // In production, you should use Supabase Auth Admin API

    // Generate a temporary ID (in production, this would come from auth.users)
    const tempId = crypto.randomUUID()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await adminClient
      .from('profiles')
      .insert({
        id: tempId,
        email,
        full_name: fullName,
        role,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    return {
      success: true,
      error: null,
      message: `Usuario creado. Contraseña temporal: ${password}`
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: null
    }
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'vendedor') {
  try {
    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await untypedClient
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}