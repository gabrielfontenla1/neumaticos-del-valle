import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'

/**
 * POST /api/admin/notifications/read-all
 * Mark all unread notifications as read
 */
export async function POST() {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()

    // Mark all unread as read
    const { error, count } = await supabase
      .from('admin_notifications')
      .update({
        is_read: true,
        read_at: now,
      })
      .eq('is_read', false)
      .eq('is_dismissed', false)

    if (error) {
      console.error('Error marking all as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      marked_count: count || 0,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/notifications/read-all:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
