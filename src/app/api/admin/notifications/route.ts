import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'
import {
  getNotificationsQuerySchema,
  createNotificationSchema,
  parseRequestBody,
  type NotificationListResponse,
  type AdminNotification,
} from '@/lib/validations'

/**
 * GET /api/admin/notifications
 * List notifications with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)

    // Parse and validate query params
    const queryResult = getNotificationsQuerySchema.safeParse({
      type: searchParams.get('type') || undefined,
      priority: searchParams.get('priority') || undefined,
      is_read: searchParams.get('is_read') || undefined,
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      )
    }

    const { type, priority, is_read, limit, offset } = queryResult.data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Build query
    let query = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (is_read !== undefined) {
      query = query.eq('is_read', is_read)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('is_dismissed', false)

    const response: NotificationListResponse = {
      notifications: (notifications || []) as AdminNotification[],
      total: count || 0,
      unread_count: unreadCount || 0,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/admin/notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/notifications
 * Create a manual notification (type: system)
 */
export async function POST(request: Request) {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const validation = await parseRequestBody(request, createNotificationSchema)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const body = validation.data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create notification
    const { data: notification, error } = await supabase
      .from('admin_notifications')
      .insert({
        type: body.type,
        title: body.title,
        message: body.message,
        priority: body.priority,
        reference_type: body.reference_type || null,
        reference_id: body.reference_id || null,
        action_url: body.action_url || null,
        metadata: body.metadata,
        expires_at: body.expires_at || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, notification },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
