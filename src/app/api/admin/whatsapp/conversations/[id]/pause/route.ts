import { NextRequest, NextResponse } from 'next/server'
import { pauseConversation, resumeConversation, findConversationById } from '@/lib/whatsapp/repository'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/pause
 * Pause a conversation (human takeover)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { paused_by, reason } = body

    if (!paused_by) {
      return NextResponse.json(
        { success: false, error: 'paused_by is required' },
        { status: 400 }
      )
    }

    // Verify conversation exists
    const conversation = await findConversationById(id)
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Pause the conversation
    await pauseConversation(id, {
      pausedBy: paused_by,
      reason: reason || undefined
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation paused - AI bot disabled'
    })

  } catch (error) {
    console.error('[API] Error pausing conversation:', error)
    return NextResponse.json(
      { success: false, error: 'Error pausing conversation' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/whatsapp/conversations/[id]/pause
 * Resume a conversation (bot takeover)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Verify conversation exists
    const conversation = await findConversationById(id)
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Resume the conversation
    await resumeConversation(id)

    return NextResponse.json({
      success: true,
      message: 'Conversation resumed - AI bot enabled'
    })

  } catch (error) {
    console.error('[API] Error resuming conversation:', error)
    return NextResponse.json(
      { success: false, error: 'Error resuming conversation' },
      { status: 500 }
    )
  }
}
