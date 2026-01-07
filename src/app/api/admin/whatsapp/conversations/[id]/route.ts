import { NextRequest, NextResponse } from 'next/server'
import { findConversationById, getConversationMessages } from '@/lib/whatsapp/repository'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/whatsapp/conversations/[id]
 * Get a single conversation with its messages
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const messageLimit = parseInt(searchParams.get('message_limit') || '50', 10)

    // Get conversation
    const conversation = await findConversationById(id)

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get messages
    const messages = await getConversationMessages(id, messageLimit)

    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        messages
      }
    })

  } catch (error) {
    console.error('[API] Error getting conversation:', error)
    return NextResponse.json(
      { success: false, error: 'Error getting conversation' },
      { status: 500 }
    )
  }
}
