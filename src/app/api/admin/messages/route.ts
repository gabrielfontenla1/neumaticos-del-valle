import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'
import { z } from 'zod'

// Schema for creating broadcast messages
const createMessageSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  target_roles: z.array(z.enum(['admin', 'vendedor'])).optional(),
  expires_at: z.string().datetime().optional(),
})

/**
 * GET /api/admin/messages
 * List system messages / announcements for admin users
 */
export async function GET(request: Request) {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get system notifications as messages
    const { data: messages, error, count } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .eq('type', 'system')
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/messages:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/messages
 * Create a broadcast message / system announcement
 */
export async function POST(request: Request) {
  try {
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()
    const validation = createMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { title, content, priority, target_roles, expires_at } = validation.data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create as system notification
    const { data: message, error } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'system',
        title,
        message: content,
        priority,
        metadata: {
          target_roles: target_roles || ['admin', 'vendedor'],
          is_broadcast: true,
        },
        expires_at: expires_at || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/messages:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
