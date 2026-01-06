import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  processAppointmentFlow,
  getAppointmentFlowState,
  updateAppointmentFlowState,
  isAppointmentFlowActive,
  clearAppointmentFlowState
} from '@/lib/kommo/appointment'
import {
  findConversationByPhoneAndProvider,
  createConversation,
  addMessage,
  getMessageHistoryForLLM
} from '@/lib/kommo/repository'
import { detectIntent } from '@/lib/ai/prompts/kommo-agent'
import type { MessageProvider } from '@/lib/kommo/types'

const PROVIDER: MessageProvider = 'twilio'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalizes a phone number by removing non-digit characters
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Gets or creates a test conversation for Twilio
 */
async function getOrCreateTestConversation(
  phone: string,
  senderName?: string
): Promise<{ id: string; isNew: boolean }> {
  const normalizedPhone = normalizePhoneNumber(phone)

  // Try to find existing conversation by phone and provider
  const existing = await findConversationByPhoneAndProvider(normalizedPhone, PROVIDER)

  if (existing) {
    return { id: existing.id, isNew: false }
  }

  // Create new conversation for Twilio
  const conversation = await createConversation({
    kommoChatId: `twilio_test_${normalizedPhone}_${Date.now()}`,
    phone: normalizedPhone,
    contactName: senderName || 'Twilio Test User',
    channel: 'whatsapp',
    provider: PROVIDER
  })

  console.log('[TwilioTest] Created new conversation:', conversation.id)
  return { id: conversation.id, isNew: true }
}

// ============================================================================
// POST - Simulate incoming Twilio message
// ============================================================================

/**
 * POST handler for simulating incoming Twilio WhatsApp messages
 *
 * Request body:
 * {
 *   phone: string,        // Sender phone number (required)
 *   messageText: string,  // Message content (required)
 *   senderName?: string   // Optional display name
 * }
 *
 * Response:
 * {
 *   responseText: string,
 *   intent: string,
 *   newState: string,
 *   appointmentCreated: boolean,
 *   appointmentId: string | null,
 *   conversationId: string
 * }
 */
export async function POST(request: NextRequest) {
  // Block test endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const body = await request.json()
    const { phone, messageText, senderName } = body

    // Validate required fields
    if (!phone || !messageText) {
      return NextResponse.json({
        error: 'phone and messageText are required'
      }, { status: 400 })
    }

    console.log('[TwilioTest] Processing message:', {
      phone,
      messageText: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
      senderName
    })

    // Get or create test conversation
    const { id: conversationId, isNew } = await getOrCreateTestConversation(phone, senderName)

    if (isNew) {
      console.log('[TwilioTest] New conversation created for phone:', phone)
    }

    // Get current appointment flow state
    const currentFlowState = await getAppointmentFlowState(conversationId)

    // Detect intent only if no active flow
    let intent: string | undefined
    if (!isAppointmentFlowActive(currentFlowState)) {
      intent = detectIntent(messageText)
      console.log('[TwilioTest] Intent detected:', intent)
    }

    // Check if we should process with appointment flow
    const shouldProcessAppointment = isAppointmentFlowActive(currentFlowState) || intent === 'appointment'

    // Save user message
    await addMessage({
      conversationId,
      role: 'user',
      content: messageText,
      intent: intent as any,
      provider: PROVIDER
    })

    if (!shouldProcessAppointment) {
      // Not an appointment flow - return generic response for test endpoint
      // Get conversation history for context
      const history = await getMessageHistoryForLLM(conversationId, 5)

      return NextResponse.json({
        responseText: 'Este simulador es para probar el flujo de turnos vía Twilio. Escribí "turno" o "quiero sacar un turno" para comenzar.',
        intent: intent || 'other',
        newState: 'idle',
        appointmentCreated: false,
        appointmentId: null,
        conversationId,
        messageHistory: history.length,
        isTestEndpoint: true
      })
    }

    // Process appointment flow
    const now = new Date().toISOString()
    const flowResult = await processAppointmentFlow(
      currentFlowState?.state || 'idle',
      currentFlowState || {
        state: 'idle',
        lastUpdated: now,
        startedAt: now,
        attempts: 0
      },
      messageText,
      {
        name: senderName || 'Usuario Twilio Test',
        phone: normalizePhoneNumber(phone)
      },
      conversationId
    )

    console.log('[TwilioTest] Flow result:', {
      newState: flowResult.newState,
      appointmentCreated: flowResult.appointmentCreated
    })

    // Update or clear flow state
    if (flowResult.newState === 'idle') {
      await clearAppointmentFlowState(conversationId)
    } else {
      await updateAppointmentFlowState(conversationId, flowResult.flowData)
    }

    // Save bot response
    await addMessage({
      conversationId,
      role: 'assistant',
      content: flowResult.responseMessage,
      intent: 'appointment',
      provider: PROVIDER
    })

    return NextResponse.json({
      responseText: flowResult.responseMessage,
      intent: intent || 'appointment_flow',
      newState: flowResult.newState,
      appointmentCreated: flowResult.appointmentCreated || false,
      appointmentId: flowResult.appointmentId || null,
      conversationId,
      provider: PROVIDER
    })

  } catch (error) {
    console.error('[TwilioTest] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      responseText: 'Ocurrió un error procesando tu mensaje. Por favor, intentá de nuevo.'
    }, { status: 500 })
  }
}

// ============================================================================
// DELETE - Reset test conversation
// ============================================================================

/**
 * DELETE handler for resetting test conversations
 *
 * Query params:
 * - phone: Phone number to reset (required)
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */
export async function DELETE(request: NextRequest) {
  // Block test endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({
        error: 'phone query parameter is required'
      }, { status: 400 })
    }

    const normalizedPhone = normalizePhoneNumber(phone)

    // Find conversation by phone
    const conversation = await findConversationByPhoneAndProvider(normalizedPhone, PROVIDER)

    if (!conversation) {
      return NextResponse.json({
        success: false,
        message: `No conversation found for phone: ${phone}`
      }, { status: 404 })
    }

    // Clear appointment flow state
    await clearAppointmentFlowState(conversation.id)

    console.log('[TwilioTest] Reset flow state for conversation:', conversation.id)

    return NextResponse.json({
      success: true,
      message: 'Appointment flow state reset successfully',
      conversationId: conversation.id
    })

  } catch (error) {
    console.error('[TwilioTest] Error resetting:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// ============================================================================
// GET - Health check and conversation info
// ============================================================================

/**
 * GET handler for health check and conversation info
 *
 * Query params:
 * - phone: Optional phone number to get conversation info
 *
 * Response (without phone):
 * {
 *   status: 'ok',
 *   provider: 'twilio',
 *   message: string
 * }
 *
 * Response (with phone):
 * {
 *   status: 'ok',
 *   provider: 'twilio',
 *   conversationId: string | null,
 *   flowState: object | null
 * }
 */
export async function GET(request: NextRequest) {
  // Block test endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      // Simple health check
      return NextResponse.json({
        status: 'ok',
        provider: PROVIDER,
        message: 'Twilio test endpoint is running. POST a message with {phone, messageText} to test.',
        endpoints: {
          POST: 'Simulate incoming message',
          DELETE: 'Reset conversation state (requires ?phone=)',
          GET: 'Health check or conversation info (optional ?phone=)'
        }
      })
    }

    // Get conversation info for phone
    const normalizedPhone = normalizePhoneNumber(phone)
    const conversation = await findConversationByPhoneAndProvider(normalizedPhone, PROVIDER)

    if (!conversation) {
      return NextResponse.json({
        status: 'ok',
        provider: PROVIDER,
        conversationId: null,
        flowState: null,
        message: `No existing conversation for phone: ${phone}`
      })
    }

    // Get flow state
    const flowState = await getAppointmentFlowState(conversation.id)

    // Get recent messages
    const history = await getMessageHistoryForLLM(conversation.id, 5)

    return NextResponse.json({
      status: 'ok',
      provider: PROVIDER,
      conversationId: conversation.id,
      phone: conversation.phone,
      contactName: conversation.contact_name,
      flowState: flowState || { state: 'idle' },
      flowActive: isAppointmentFlowActive(flowState),
      recentMessages: history.length,
      lastMessageAt: conversation.last_message_at
    })

  } catch (error) {
    console.error('[TwilioTest] Error in health check:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
