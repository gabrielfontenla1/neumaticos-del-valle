import { NextRequest, NextResponse } from 'next/server'
import { findConversationById, addMessage } from '@/lib/whatsapp/repository'
import { TwilioClient } from '@/lib/twilio'
import { sendMessage as sendBaileysMessage } from '@/lib/baileys/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/send
 * Send a message to the user via Twilio or Baileys (human intervention)
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

    // Get conversation to get the phone number and source
    const conversation = await findConversationById(id)
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    let sendResult: { sid?: string; success?: boolean; error?: string }

    // Route by provider source
    if (conversation.source === 'baileys') {
      // Send via Baileys service
      const baileysInstanceId = (conversation as unknown as Record<string, unknown>).baileys_instance_id as string | undefined
      if (!baileysInstanceId) {
        return NextResponse.json(
          { success: false, error: 'No Baileys instance associated with this conversation' },
          { status: 400 }
        )
      }

      const result = await sendBaileysMessage(baileysInstanceId, conversation.phone, content.trim())
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to send via Baileys' },
          { status: 500 }
        )
      }

      sendResult = { success: true, sid: result.data?.message_id }
    } else {
      // Default: Send via Twilio
      const twilioClient = await TwilioClient.create()
      const result = await twilioClient.sendMessage(conversation.phone, content.trim())

      if (result.status === 'failed') {
        return NextResponse.json(
          { success: false, error: result.errorMessage || 'Failed to send message' },
          { status: 500 }
        )
      }

      sendResult = { sid: result.sid }
    }

    // Save message to database as human-sent
    const message = await addMessage({
      conversationId: id,
      role: 'assistant',
      content: content.trim(),
      sentByHuman: true,
      sentByUserId: user_id || undefined,
      source: conversation.source || 'twilio'
    })

    console.log(`[API] Human message sent to ${conversation.phone} via ${conversation.source || 'twilio'}`)

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message_id: message.id,
        provider: conversation.source || 'twilio',
        external_id: sendResult.sid
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
