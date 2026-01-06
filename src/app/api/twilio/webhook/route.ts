import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  TwilioClient,
  validateTwilioSignature,
  parseTwilioWebhook,
  type TwilioWebhookPayload
} from '@/lib/twilio'
import { openai, models, temperatures } from '@/lib/ai/openai'
import {
  generateEmbedding,
  searchSimilarContent,
  searchFAQs
} from '@/lib/ai/embeddings'
import {
  formatWhatsAppPrompt,
  detectIntent,
  extractTireSize,
  detectTypoInSize,
  getQuickResponse
} from '@/lib/ai/prompts/kommo-agent'
import { shouldEscalate } from '@/lib/kommo/escalation'
import {
  processAppointmentFlow,
  getAppointmentFlowState,
  updateAppointmentFlowState,
  isAppointmentFlowActive
} from '@/lib/kommo/appointment'
import type {
  ConversationStatus,
  MessageRole,
  MessageIntent
} from '@/lib/kommo/types'

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENABLE_SIGNATURE_VERIFICATION = process.env.NODE_ENV === 'production'
const MAX_RESPONSE_TOKENS = 300
const MAX_HISTORY_MESSAGES = 10
const RESPONSE_TIMEOUT_MS = 25000

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// DATABASE TYPES
// ============================================================================

interface DbConversation {
  id: string
  provider: string
  kommo_chat_id: string | null
  kommo_contact_id: string | null
  phone: string | null
  contact_name: string | null
  status: ConversationStatus
  message_count: number
  last_message_at: string | null
  last_user_message_at: string | null
  escalated_at: string | null
  escalation_reason: string | null
  channel: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface DbMessage {
  id: string
  conversation_id: string
  provider: string
  kommo_message_id: string | null
  role: MessageRole
  content: string
  content_type: string
  intent: MessageIntent | null
  ai_model: string | null
  response_time_ms: number | null
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('\n' + '='.repeat(60))
    console.log('[Twilio Webhook] Incoming request')
    console.log('Timestamp:', new Date().toISOString())

    // Validate Twilio signature in production
    if (ENABLE_SIGNATURE_VERIFICATION) {
      const isValid = await validateTwilioSignature(request.clone())
      if (!isValid) {
        console.error('[Twilio Webhook] Invalid signature')
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          {
            status: 401,
            headers: { 'Content-Type': 'text/xml' }
          }
        )
      }
      console.log('[Twilio Webhook] Signature verified')
    }

    // Parse form-urlencoded webhook payload
    const formData = await request.formData()
    const payload = parseTwilioWebhook(formData) as unknown as TwilioWebhookPayload

    // Extract message data
    const messageSid = payload.MessageSid
    const from = payload.From // whatsapp:+5492622555555
    const body = payload.Body
    const profileName = payload.ProfileName || 'Cliente'
    const waId = payload.WaId // WhatsApp ID without +

    if (!from || !body) {
      console.log('[Twilio Webhook] Missing required fields (From or Body)')
      return createTwiMLResponse()
    }

    // Extract phone number from WhatsApp format
    const phoneNumber = extractPhoneFromWhatsApp(from)

    console.log('[Twilio Webhook] Message received:', {
      messageSid,
      from: phoneNumber,
      profileName,
      bodyPreview: body.slice(0, 50) + (body.length > 50 ? '...' : '')
    })

    // Process message asynchronously to respond quickly to Twilio
    processMessageAsync({
      messageSid,
      phoneNumber,
      profileName,
      messageText: body,
      waId: waId || phoneNumber,
      startTime
    })

    // Return empty TwiML response immediately
    const responseTime = Date.now() - startTime
    console.log(`[Twilio Webhook] Acknowledged in ${responseTime}ms`)
    console.log('='.repeat(60) + '\n')

    return createTwiMLResponse()

  } catch (error) {
    console.error('[Twilio Webhook] Error:', error)
    return createTwiMLResponse()
  }
}

// ============================================================================
// MESSAGE PROCESSING
// ============================================================================

interface ProcessMessageParams {
  messageSid: string
  phoneNumber: string
  profileName: string
  messageText: string
  waId: string
  startTime: number
}

async function processMessageAsync(params: ProcessMessageParams): Promise<void> {
  const { messageSid, phoneNumber, profileName, messageText, startTime } = params

  try {
    // 1. Find or create conversation
    const conversation = await getOrCreateTwilioConversation({
      phone: phoneNumber,
      contactName: profileName
    })

    console.log('[Twilio] Conversation:', conversation.id)

    // 2. Detect intent
    const intent = detectIntent(messageText)
    console.log('[Twilio] Intent:', intent)

    // 3. Save incoming message
    await addMessage({
      conversationId: conversation.id,
      provider: 'twilio',
      messageId: messageSid,
      role: 'user',
      content: messageText,
      intent
    })

    // 4. Check for active appointment flow or appointment intent
    const currentFlowState = await getAppointmentFlowState(conversation.id)

    if (isAppointmentFlowActive(currentFlowState) || intent === 'appointment') {
      console.log('[Twilio] Processing appointment flow, state:', currentFlowState?.state || 'idle')

      const flowResult = await processAppointmentFlow(
        currentFlowState?.state || 'idle',
        currentFlowState || {
          state: 'idle',
          lastUpdated: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          attempts: 0
        },
        messageText,
        {
          name: profileName,
          phone: phoneNumber
        },
        conversation.id
      )

      // Update flow state
      await updateAppointmentFlowState(conversation.id, flowResult.flowData)

      // Save bot response
      await addMessage({
        conversationId: conversation.id,
        provider: 'twilio',
        role: 'assistant',
        content: flowResult.responseMessage,
        intent: 'appointment',
        responseTimeMs: Date.now() - startTime
      })

      // Send response via Twilio
      await sendTwilioResponse(phoneNumber, flowResult.responseMessage)

      // Handle escalation if needed
      if (flowResult.shouldEscalate) {
        await updateConversationStatus(
          conversation.id,
          'escalated',
          flowResult.escalationReason || 'Error en flujo de turnos'
        )
      }

      return
    }

    // 5. Check if should escalate to human
    const history = await getMessageHistoryForLLM(conversation.id, MAX_HISTORY_MESSAGES)
    const escalationCheck = shouldEscalate(messageText, intent, history.length)

    if (escalationCheck.shouldEscalate) {
      console.log('[Twilio] Escalating:', escalationCheck.reason)

      await updateConversationStatus(
        conversation.id,
        'escalated',
        escalationCheck.reason
      )

      const escalationResponse = getQuickResponse('escalate')

      await addMessage({
        conversationId: conversation.id,
        provider: 'twilio',
        role: 'assistant',
        content: escalationResponse,
        intent: 'escalation',
        responseTimeMs: Date.now() - startTime
      })

      await sendTwilioResponse(phoneNumber, escalationResponse)
      return
    }

    // 6. Search for relevant products
    const products = await searchRelevantProducts(messageText, intent)
    console.log('[Twilio] Products found:', products.length)

    // 7. Search FAQs
    let faqs: Array<{ question: string; answer: string }> = []
    try {
      faqs = await searchFAQs(messageText, 3)
    } catch (error) {
      console.log('[Twilio] FAQ search failed:', error)
    }

    // 8. Generate AI response
    const responseText = await generateAIResponse({
      message: messageText,
      intent,
      products,
      faqs,
      conversationHistory: history,
      contactName: profileName
    })

    const responseTime = Date.now() - startTime
    console.log('[Twilio] Response generated in', responseTime, 'ms')

    // 9. Save bot response
    await addMessage({
      conversationId: conversation.id,
      provider: 'twilio',
      role: 'assistant',
      content: responseText,
      intent,
      aiModel: models.chat,
      responseTimeMs: responseTime
    })

    // 10. Send response via Twilio
    await sendTwilioResponse(phoneNumber, responseText)

    console.log('[Twilio] Message processing completed successfully')

  } catch (error) {
    console.error('[Twilio] Error processing message:', error)
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function getOrCreateTwilioConversation(input: {
  phone: string
  contactName?: string
}): Promise<DbConversation> {
  const normalizedPhone = normalizePhoneNumber(input.phone)

  // Try to find existing Twilio conversation by phone
  const { data: existing, error: findError } = await db
    .from('kommo_conversations')
    .select('*')
    .eq('provider', 'twilio')
    .eq('phone', normalizedPhone)
    .single()

  if (existing && !findError) {
    // Update contact name if provided and different
    if (input.contactName && existing.contact_name !== input.contactName) {
      await db
        .from('kommo_conversations')
        .update({ contact_name: input.contactName })
        .eq('id', existing.id)
    }
    return existing
  }

  // Create new conversation
  const { data: created, error: createError } = await db
    .from('kommo_conversations')
    .insert({
      provider: 'twilio',
      kommo_chat_id: null, // Twilio doesn't use kommo_chat_id
      phone: normalizedPhone,
      contact_name: input.contactName || null,
      channel: 'whatsapp',
      status: 'active',
      metadata: { source: 'twilio_whatsapp' }
    })
    .select()
    .single()

  if (createError) {
    console.error('[Twilio] Error creating conversation:', createError)
    throw createError
  }

  console.log('[Twilio] Created new conversation:', created.id)
  return created
}

async function addMessage(input: {
  conversationId: string
  provider: string
  messageId?: string
  role: MessageRole
  content: string
  intent?: MessageIntent
  aiModel?: string
  responseTimeMs?: number
}): Promise<DbMessage> {
  const { data, error } = await db
    .from('kommo_messages')
    .insert({
      conversation_id: input.conversationId,
      provider: input.provider,
      kommo_message_id: input.messageId || null,
      role: input.role,
      content: input.content,
      content_type: 'text',
      intent: input.intent || null,
      ai_model: input.aiModel || null,
      response_time_ms: input.responseTimeMs || null,
      metadata: {}
    })
    .select()
    .single()

  if (error) {
    console.error('[Twilio] Error adding message:', error)
    throw error
  }

  return data
}

async function getMessageHistoryForLLM(
  conversationId: string,
  limit: number = 10
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const { data, error } = await db
    .from('kommo_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Twilio] Error getting message history:', error)
    return []
  }

  // Reverse for chronological order
  return (data || []).reverse().map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }))
}

async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
  reason?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status }

  if (status === 'escalated') {
    updates.escalated_at = new Date().toISOString()
    updates.escalation_reason = reason || null
  } else if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await db
    .from('kommo_conversations')
    .update(updates)
    .eq('id', conversationId)

  if (error) {
    console.error('[Twilio] Error updating conversation status:', error)
    throw error
  }
}

// ============================================================================
// PRODUCT SEARCH
// ============================================================================

interface ProductResult {
  id?: string
  name?: string
  brand?: string
  model?: string
  width?: number
  profile?: number
  diameter?: number
  price?: number
}

async function searchRelevantProducts(
  message: string,
  intent: MessageIntent
): Promise<ProductResult[]> {
  const productIntents: MessageIntent[] = [
    'product_inquiry',
    'price_inquiry',
    'availability_inquiry'
  ]

  if (!productIntents.includes(intent)) {
    return []
  }

  try {
    // Extract tire size from message
    const tireSize = extractTireSize(message)

    if (tireSize) {
      const correctedWidth = detectTypoInSize(tireSize.width)
      const searchWidth = correctedWidth || tireSize.width

      const { data } = await db
        .from('products')
        .select('*')
        .eq('width', searchWidth)
        .eq('profile', tireSize.profile)
        .eq('diameter', tireSize.diameter)
        .gt('stock', 0)
        .order('price', { ascending: true })
        .limit(10)

      if (data && data.length > 0) {
        return data
      }
    }

    // Semantic search fallback
    const queryEmbedding = await generateEmbedding(message)
    const semanticResults = await searchSimilarContent(queryEmbedding, {
      matchThreshold: 0.65,
      matchCount: 10,
      contentType: 'product'
    }) as Array<{ product_id?: number; similarity: number }>

    if (semanticResults && semanticResults.length > 0) {
      const productIds = semanticResults
        .filter(r => r.product_id)
        .map(r => r.product_id)

      if (productIds.length > 0) {
        const { data } = await db
          .from('products')
          .select('*')
          .in('id', productIds)
          .gt('stock', 0)
          .limit(10)

        if (data) {
          return data
        }
      }
    }

    // Brand search fallback
    const brandTerms = ['bridgestone', 'pirelli', 'michelin', 'goodyear', 'fate', 'firestone']
    const foundBrand = brandTerms.find(brand =>
      message.toLowerCase().includes(brand)
    )

    if (foundBrand) {
      const { data } = await db
        .from('products')
        .select('*')
        .ilike('brand', `%${foundBrand}%`)
        .gt('stock', 0)
        .order('price', { ascending: true })
        .limit(10)

      return data || []
    }

    return []

  } catch (error) {
    console.error('[Twilio] Error searching products:', error)
    return []
  }
}

// ============================================================================
// AI RESPONSE GENERATION
// ============================================================================

async function generateAIResponse(context: {
  message: string
  intent: MessageIntent
  products: ProductResult[]
  faqs: Array<{ question: string; answer: string }>
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  contactName?: string
}): Promise<string> {
  const systemPrompt = formatWhatsAppPrompt({
    products: context.products,
    faqs: context.faqs,
    conversationHistory: context.conversationHistory,
    contactName: context.contactName
  })

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...context.conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    { role: 'user' as const, content: context.message }
  ]

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: models.chat,
        messages,
        temperature: temperatures.balanced,
        max_tokens: MAX_RESPONSE_TOKENS
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timeout')), RESPONSE_TIMEOUT_MS)
      )
    ])

    const content = response.choices[0]?.message?.content || ''
    return formatResponseForWhatsApp(content)

  } catch (error) {
    console.error('[Twilio] AI generation failed:', error)
    return getFallbackResponse(context.intent)
  }
}

function formatResponseForWhatsApp(text: string): string {
  let formatted = text

  // Remove complex markdown
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1')
  formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  formatted = formatted.replace(/#{1,6}\s*/g, '')

  // Limit length
  if (formatted.length > 1000) {
    formatted = formatted.slice(0, 997) + '...'
  }

  // Don't end mid-word
  if (formatted.endsWith('...')) {
    const lastSpace = formatted.lastIndexOf(' ', formatted.length - 4)
    if (lastSpace > formatted.length - 50) {
      formatted = formatted.slice(0, lastSpace) + '...'
    }
  }

  return formatted.trim()
}

function getFallbackResponse(intent: MessageIntent): string {
  const fallbacks: Record<MessageIntent, string> = {
    greeting: 'Hola! En que te puedo ayudar hoy?',
    product_inquiry: 'Que medida de neumatico necesitas? La podes ver en el costado del neumatico actual.',
    price_inquiry: 'Decime que medida necesitas y te paso el precio.',
    availability_inquiry: 'Que medida estas buscando? Te confirmo disponibilidad.',
    faq: 'Nuestro horario es Lun-Vie 8:30-18:30, Sab 9:00-13:00. Te puedo ayudar con algo mas?',
    appointment: 'Queres agendar un turno para instalacion? Decime que dia te queda comodo.',
    complaint: 'Lamentamos el inconveniente. Te paso con un asesor para ayudarte mejor.',
    escalation: 'Te comunico con un asesor ahora mismo. Un momento por favor.',
    other: 'En que te puedo ayudar?'
  }

  return fallbacks[intent] || fallbacks.other
}

// ============================================================================
// TWILIO RESPONSE
// ============================================================================

async function sendTwilioResponse(to: string, body: string): Promise<void> {
  try {
    const twilioClient = await TwilioClient.create()
    const result = await twilioClient.sendMessage(to, body)

    if (result.status === 'failed') {
      console.error('[Twilio] Failed to send message:', result.errorMessage)
    } else {
      console.log('[Twilio] Message sent:', result.sid)
    }
  } catch (error) {
    console.error('[Twilio] Error sending message:', error)
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function createTwiMLResponse(): NextResponse {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    }
  )
}

function extractPhoneFromWhatsApp(waNumber: string): string {
  // Remove 'whatsapp:' prefix and keep the phone number with +
  return waNumber.replace(/^whatsapp:/, '')
}

function normalizePhoneNumber(phone: string): string {
  // Remove everything except digits
  return phone.replace(/\D/g, '')
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Twilio WhatsApp Webhook + AI Bot',
    version: '1.0.0',
    features: {
      aiProcessing: true,
      whatsappSupport: true,
      appointmentFlow: true,
      escalation: true,
      persistence: true,
      provider: 'twilio'
    },
    timestamp: new Date().toISOString()
  })
}
