import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/notifications/[id]
 * Get a single notification by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { id } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: notification, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error in GET /api/admin/notifications/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/notifications/[id]
 * Update notification (mark as read, action taken, etc.)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { id } = await params
    const body = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Build update object
    const updateData: Record<string, unknown> = {}

    // Mark as read
    if (body.is_read === true) {
      updateData.is_read = true
      updateData.read_at = new Date().toISOString()
      // read_by would need user ID from session
    }

    // Mark action as taken
    if (body.action_taken === true) {
      updateData.action_taken = true
      updateData.action_taken_at = new Date().toISOString()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      )
    }

    const { data: notification, error } = await supabase
      .from('admin_notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Error in PATCH /api/admin/notifications/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/notifications/[id]
 * Dismiss (soft delete) a notification
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { id } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Soft delete (dismiss)
    const { error } = await supabase
      .from('admin_notifications')
      .update({
        is_dismissed: true,
        dismissed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error dismissing notification:', error)
      return NextResponse.json(
        { error: 'Failed to dismiss notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/notifications/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
