import { NextRequest, NextResponse } from 'next/server'
import { listConversations, getConversationStats } from '@/lib/whatsapp/repository'
import type { ConversationStatus } from '@/lib/whatsapp/types'

/**
 * GET /api/admin/whatsapp/conversations
 * List WhatsApp conversations with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query params
    const status = searchParams.get('status') as ConversationStatus | null
    const isPausedStr = searchParams.get('is_paused')
    const limitStr = searchParams.get('limit')
    const offsetStr = searchParams.get('offset')
    const includeStats = searchParams.get('include_stats') === 'true'

    const filters = {
      status: status || undefined,
      isPaused: isPausedStr ? isPausedStr === 'true' : undefined,
      limit: limitStr ? parseInt(limitStr, 10) : 50,
      offset: offsetStr ? parseInt(offsetStr, 10) : undefined
    }

    // Get conversations
    const conversations = await listConversations(filters)

    // Optionally get stats
    let stats = null
    if (includeStats) {
      stats = await getConversationStats(7)
    }

    return NextResponse.json({
      success: true,
      data: conversations,
      stats,
      count: conversations.length
    })

  } catch (error) {
    console.error('[API] Error listing conversations:', error)
    return NextResponse.json(
      { success: false, error: 'Error listing conversations' },
      { status: 500 }
    )
  }
}
