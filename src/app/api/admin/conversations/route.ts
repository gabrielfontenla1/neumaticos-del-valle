import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/admin/conversations
 * Fetch conversations with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') // 'kommo' | 'twilio' | 'all'
    const status = searchParams.get('status') // 'active' | 'escalated' | 'resolved' | 'all'
    const conversationId = searchParams.get('id') // Get specific conversation with messages
    const limit = parseInt(searchParams.get('limit') || '50')

    // If requesting a specific conversation, return it with messages
    if (conversationId) {
      return await getConversationWithMessages(conversationId)
    }

    // Build query for conversation list
    let query = db
      .from('kommo_conversations')
      .select(`
        id,
        provider,
        phone,
        contact_name,
        status,
        message_count,
        last_message_at,
        escalated_at,
        escalation_reason,
        channel,
        created_at
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    // Apply filters
    if (provider && provider !== 'all') {
      query = query.eq('provider', provider)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Conversations API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get last message preview for each conversation
    const conversationsWithPreview = await Promise.all(
      (data || []).map(async (conv) => {
        const { data: lastMessage } = await db
          .from('kommo_messages')
          .select('content, role, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conv,
          lastMessage: lastMessage ? {
            content: lastMessage.content?.slice(0, 100) + (lastMessage.content?.length > 100 ? '...' : ''),
            role: lastMessage.role,
            createdAt: lastMessage.created_at
          } : null
        }
      })
    )

    return NextResponse.json({
      conversations: conversationsWithPreview,
      total: conversationsWithPreview.length
    })

  } catch (error) {
    console.error('[Conversations API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get a specific conversation with all its messages
 */
async function getConversationWithMessages(conversationId: string) {
  // Get conversation details
  const { data: conversation, error: convError } = await db
    .from('kommo_conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 404 })
  }

  // Get all messages for this conversation
  const { data: messages, error: msgError } = await db
    .from('kommo_messages')
    .select(`
      id,
      role,
      content,
      intent,
      ai_model,
      response_time_ms,
      created_at,
      provider
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('[Conversations API] Messages error:', msgError)
  }

  return NextResponse.json({
    conversation,
    messages: messages || []
  })
}
