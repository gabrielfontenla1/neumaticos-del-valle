import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'
import type { DashboardCounts } from '@/lib/validations'

/**
 * GET /api/admin/notifications/counts
 * Get dashboard counts using the DB function
 */
export async function GET() {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Call the database function
    const { data, error } = await supabase.rpc('get_admin_dashboard_counts')

    if (error) {
      console.error('Error getting dashboard counts:', error)

      // Fallback: manual counts if function doesn't exist
      const [
        ordersResult,
        appointmentsResult,
        reviewsResult,
        notificationsResult,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false),
        supabase
          .from('admin_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
          .eq('is_dismissed', false),
      ])

      const fallbackCounts: DashboardCounts = {
        pending_orders: ordersResult.count || 0,
        pending_appointments: appointmentsResult.count || 0,
        pending_reviews: reviewsResult.count || 0,
        pending_quotes: 0,
        low_stock_products: 0,
        unread_notifications: notificationsResult.count || 0,
        active_vouchers: 0,
        today_appointments: 0,
        total_products: 0,
        total_customers: 0,
      }

      return NextResponse.json(fallbackCounts)
    }

    // RPC returns array with single row
    const counts = Array.isArray(data) ? data[0] : data

    return NextResponse.json(counts as DashboardCounts)
  } catch (error) {
    console.error('Error in GET /api/admin/notifications/counts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
