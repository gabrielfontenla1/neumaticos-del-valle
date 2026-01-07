import { NextRequest, NextResponse } from 'next/server'
import { findConversationById, addMessage } from '@/lib/whatsapp/repository'
import { TwilioClient } from '@/lib/twilio'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/send
 * Send a message to the user via Twilio (human intervention)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, user_id } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Get conversation to get the phone number
    const conversation = await findConversationById(id)
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Send message via Twilio
    const twilioClient = await TwilioClient.create()
    const result = await twilioClient.sendMessage(conversation.phone, content.trim())

    if (result.status === 'failed') {
      return NextResponse.json(
        { success: false, error: result.errorMessage || 'Failed to send message' },
        { status: 500 }
      )
    }

    // Save message to database as human-sent
    const message = await addMessage({
      conversationId: id,
      role: 'assistant', // Human messages appear as assistant (the business)
      content: content.trim(),
      sentByHuman: true,
      sentByUserId: user_id || undefined
    })

    console.log('[API] Human message sent to:', conversation.phone)

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message_id: message.id,
        twilio_sid: result.sid
      }
    })

  } catch (error) {
    console.error('[API] Error sending message:', error)
    return NextResponse.json(
      { success: false, error: 'Error sending message' },
      { status: 500 }
    )
  }
}
