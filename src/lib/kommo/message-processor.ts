/**
 * Procesador de mensajes para Kommo/WhatsApp/Twilio
 * Orquesta la conversación con IA y envío de respuestas
 *
 * Supports multiple messaging providers:
 * - Kommo: Traditional CRM integration (default)
 * - Twilio: WhatsApp Business API via Twilio
 * - Meta: Direct WhatsApp Business API (future)
 */

import { openai, models, temperatures } from '@/lib/ai/openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
import {
  getOrCreateConversation,
  findConversationByPhoneAndProvider,
  addMessage,
  getMessageHistoryForLLM,
  updateConversationStatus
} from './repository'
import { getKommoClient } from './client'
import { TwilioClient } from '@/lib/twilio'
import { shouldEscalate, getEscalationReason } from './escalation'
import {
  processAppointmentFlow,
  getAppointmentFlowState,
  updateAppointmentFlowState,
  isAppointmentFlowActive
} from './appointment'
import { emitWorkflowEvent, createExecutionId } from '@/lib/automations/event-emitter'
import type {
  ProcessMessageInput,
  ProcessMessageResult,
  MessageIntent,
  MessageProvider
} from './types'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const MAX_RESPONSE_TOKENS = 300 // Respuestas cortas para WhatsApp
const MAX_HISTORY_MESSAGES = 10
const RESPONSE_TIMEOUT_MS = 25000 // 25 segundos máximo

// Twilio client singleton (lazily initialized)
let twilioClient: TwilioClient | null = null

function getTwilioClient(): TwilioClient {
  if (!twilioClient) {
    twilioClient = new TwilioClient()
  }
  return twilioClient
}

// ============================================================================
// PROCESADOR PRINCIPAL
// ============================================================================

/**
 * Procesa un mensaje entrante y genera una respuesta
 *
 * @param input - Message input data
 * @param provider - Messaging provider ('kommo' | 'twilio' | 'meta'), defaults to 'kommo'
 */
export async function processIncomingMessage(
  input: ProcessMessageInput,
  provider: MessageProvider = 'kommo'
): Promise<ProcessMessageResult> {
  const startTime = Date.now()
  const executionId = createExecutionId()

  console.log('[MessageProcessor] Processing message:', {
    provider,
    chatId: input.chatId,
    phone: input.senderPhone,
    from: input.senderName,
    text: input.messageText.slice(0, 50) + '...',
    executionId
  })

  // Emit workflow start event
  emitWorkflowEvent('kommo-webhook', 'trigger-webhook', 'running', executionId, {
    input: { provider, chatId: input.chatId, phone: input.senderPhone }
  })
  emitWorkflowEvent('kommo-webhook', 'trigger-webhook', 'success', executionId)

  // Extract message step
  emitWorkflowEvent('kommo-webhook', 'extract-message', 'running', executionId)
  emitWorkflowEvent('kommo-webhook', 'extract-message', 'success', executionId, {
    output: { messageLength: input.messageText.length, sender: input.senderName }
  })

  try {
    // 1. Obtener o crear conversación (provider-aware)
    emitWorkflowEvent('kommo-webhook', 'db-conversation', 'running', executionId)
    const conversation = await getOrCreateConversationForProvider({
      chatId: input.chatId,
      contactId: input.contactId,
      phone: input.senderPhone,
      contactName: input.senderName,
      channel: input.origin || 'whatsapp',
      provider
    })
    emitWorkflowEvent('kommo-webhook', 'db-conversation', 'success', executionId, {
      output: { conversationId: conversation.id }
    })

    // 2. Detectar intención del mensaje
    emitWorkflowEvent('kommo-webhook', 'ai-intent', 'running', executionId)
    const intent = detectIntent(input.messageText)
    console.log('[MessageProcessor] Detected intent:', intent)
    emitWorkflowEvent('kommo-webhook', 'ai-intent', 'success', executionId, {
      output: { intent }
    })

    // 3. Guardar mensaje del usuario
    emitWorkflowEvent('kommo-webhook', 'db-save-user', 'running', executionId)
    await addMessage({
      conversationId: conversation.id,
      kommoMessageId: input.messageId,
      role: 'user',
      content: input.messageText,
      intent,
      provider
    })
    emitWorkflowEvent('kommo-webhook', 'db-save-user', 'success', executionId)

    // 4. Verificar si hay flujo de turno activo o si es intent de appointment
    const currentFlowState = await getAppointmentFlowState(conversation.id)

    // Emit condition node - checking intent type
    emitWorkflowEvent('kommo-webhook', 'condition-appointment', 'running', executionId)

    if (isAppointmentFlowActive(currentFlowState) || intent === 'appointment') {
      console.log('[MessageProcessor] Processing appointment flow, state:', currentFlowState?.state || 'idle')
      emitWorkflowEvent('kommo-webhook', 'condition-appointment', 'success', executionId, {
        output: { branch: 'appointment', flowState: currentFlowState?.state || 'idle' }
      })

      // Process appointment flow
      emitWorkflowEvent('kommo-webhook', 'ai-appointment-flow', 'running', executionId)
      const flowResult = await processAppointmentFlow(
        currentFlowState?.state || 'idle',
        currentFlowState || {
          state: 'idle',
          lastUpdated: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          attempts: 0
        },
        input.messageText,
        {
          name: input.senderName,
          phone: input.senderPhone
        },
        conversation.id
      )
      emitWorkflowEvent('kommo-webhook', 'ai-appointment-flow', 'success', executionId, {
        output: { newState: flowResult.flowData.state, appointmentCreated: flowResult.appointmentCreated }
      })

      // Actualizar estado del flujo
      await updateAppointmentFlowState(conversation.id, flowResult.flowData)

      // Guardar respuesta del bot
      emitWorkflowEvent('kommo-webhook', 'db-save-response', 'running', executionId)
      await addMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: flowResult.responseMessage,
        intent: 'appointment',
        responseTimeMs: Date.now() - startTime,
        provider
      })
      emitWorkflowEvent('kommo-webhook', 'db-save-response', 'success', executionId)

      // Enviar respuesta según el proveedor
      emitWorkflowEvent('kommo-webhook', 'http-send', 'running', executionId)
      try {
        await sendResponseToProvider({
          provider,
          chatId: input.chatId,
          phone: input.senderPhone,
          message: flowResult.responseMessage
        })
        emitWorkflowEvent('kommo-webhook', 'http-send', 'success', executionId, {
          output: { provider, messageLength: flowResult.responseMessage.length }
        })
      } catch (sendError) {
        emitWorkflowEvent('kommo-webhook', 'http-send', 'error', executionId, {
          error: sendError instanceof Error ? sendError.message : 'Send failed'
        })
        throw sendError
      }
      console.log(`[MessageProcessor] Appointment flow response sent via ${provider}`)

      // Si debe escalar, actualizar estado
      if (flowResult.shouldEscalate) {
        await updateConversationStatus(
          conversation.id,
          'escalated',
          flowResult.escalationReason || 'Error en flujo de turnos'
        )
      }

      // Emit end event
      emitWorkflowEvent('kommo-webhook', 'end', 'success', executionId, {
        output: { flow: 'appointment', duration: Date.now() - startTime }
      })

      return {
        success: true,
        responseText: flowResult.responseMessage,
        intent: 'appointment',
        shouldEscalate: flowResult.shouldEscalate || false,
        escalationReason: flowResult.escalationReason,
        appointmentCreated: flowResult.appointmentCreated,
        appointmentId: flowResult.appointmentId
      }
    }

    // For non-appointment flow, emit condition result
    emitWorkflowEvent('kommo-webhook', 'condition-appointment', 'success', executionId, {
      output: { branch: intent === 'escalation' ? 'escalation' : 'product-search', intent }
    })

    // 5. Verificar si debe escalar a humano
    const history = await getMessageHistoryForLLM(conversation.id, MAX_HISTORY_MESSAGES)
    const escalationCheck = shouldEscalate(input.messageText, intent, history.length)

    if (escalationCheck.shouldEscalate) {
      console.log('[MessageProcessor] Escalating to human:', escalationCheck.reason)
      emitWorkflowEvent('kommo-webhook', 'condition-escalation', 'success', executionId, {
        output: { shouldEscalate: true, reason: escalationCheck.reason }
      })

      await updateConversationStatus(
        conversation.id,
        'escalated',
        escalationCheck.reason
      )

      const escalationResponse = getQuickResponse('escalate')

      emitWorkflowEvent('kommo-webhook', 'db-save-response', 'running', executionId)
      await addMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: escalationResponse,
        intent: 'escalation',
        responseTimeMs: Date.now() - startTime,
        provider
      })
      emitWorkflowEvent('kommo-webhook', 'db-save-response', 'success', executionId)

      // Enviar respuesta de escalación según el proveedor
      emitWorkflowEvent('kommo-webhook', 'http-send', 'running', executionId)
      try {
        await sendResponseToProvider({
          provider,
          chatId: input.chatId,
          phone: input.senderPhone,
          message: escalationResponse
        })
        emitWorkflowEvent('kommo-webhook', 'http-send', 'success', executionId, {
          output: { provider, escalation: true }
        })
      } catch (sendError) {
        emitWorkflowEvent('kommo-webhook', 'http-send', 'error', executionId, {
          error: sendError instanceof Error ? sendError.message : 'Send failed'
        })
        throw sendError
      }

      // Emit end event
      emitWorkflowEvent('kommo-webhook', 'end', 'success', executionId, {
        output: { flow: 'escalation', duration: Date.now() - startTime }
      })

      return {
        success: true,
        responseText: escalationResponse,
        intent: 'escalation',
        shouldEscalate: true,
        escalationReason: escalationCheck.reason
      }
    }

    // 6. Buscar productos relevantes (si aplica)
    emitWorkflowEvent('kommo-webhook', 'ai-search-products', 'running', executionId)
    const products = await searchRelevantProducts(input.messageText, intent)
    console.log('[MessageProcessor] Found products:', products.length)
    emitWorkflowEvent('kommo-webhook', 'ai-search-products', 'success', executionId, {
      output: { productsFound: products.length, intent }
    })

    // 7. Buscar FAQs relevantes
    emitWorkflowEvent('kommo-webhook', 'ai-search-faqs', 'running', executionId)
    let faqs: Array<{ question: string; answer: string }> = []
    try {
      faqs = await searchFAQs(input.messageText, 3)
      emitWorkflowEvent('kommo-webhook', 'ai-search-faqs', 'success', executionId, {
        output: { faqsFound: faqs.length }
      })
    } catch (error) {
      console.log('[MessageProcessor] FAQ search failed:', error)
      emitWorkflowEvent('kommo-webhook', 'ai-search-faqs', 'error', executionId, {
        error: error instanceof Error ? error.message : 'FAQ search failed'
      })
    }

    // 8. Generar respuesta con IA
    emitWorkflowEvent('kommo-webhook', 'ai-generate', 'running', executionId)
    const responseText = await generateAIResponse({
      message: input.messageText,
      intent,
      products,
      faqs,
      conversationHistory: history,
      contactName: input.senderName
    })

    const responseTime = Date.now() - startTime
    console.log('[MessageProcessor] Generated response in', responseTime, 'ms')
    emitWorkflowEvent('kommo-webhook', 'ai-generate', 'success', executionId, {
      output: { responseLength: responseText.length, responseTimeMs: responseTime }
    })

    // 9. Guardar respuesta del bot
    emitWorkflowEvent('kommo-webhook', 'db-save-response', 'running', executionId)
    await addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: responseText,
      intent,
      productsReferenced: products.map(p => p.id).filter(Boolean) as string[],
      aiModel: models.chat,
      responseTimeMs: responseTime,
      provider
    })
    emitWorkflowEvent('kommo-webhook', 'db-save-response', 'success', executionId)

    // 10. Enviar respuesta según el proveedor
    emitWorkflowEvent('kommo-webhook', 'http-send', 'running', executionId)
    try {
      await sendResponseToProvider({
        provider,
        chatId: input.chatId,
        phone: input.senderPhone,
        message: responseText
      })
      emitWorkflowEvent('kommo-webhook', 'http-send', 'success', executionId, {
        output: { provider, messageLength: responseText.length }
      })
    } catch (sendError) {
      emitWorkflowEvent('kommo-webhook', 'http-send', 'error', executionId, {
        error: sendError instanceof Error ? sendError.message : 'Send failed'
      })
      throw sendError
    }
    console.log(`[MessageProcessor] Message sent via ${provider} successfully`)

    // Emit end event
    emitWorkflowEvent('kommo-webhook', 'end', 'success', executionId, {
      output: {
        flow: 'standard',
        duration: Date.now() - startTime,
        productsFound: products.length,
        intent
      }
    })

    return {
      success: true,
      responseText,
      intent,
      shouldEscalate: false,
      productsFound: products.slice(0, 5).map(p => ({
        id: p.id || '',
        name: `${p.brand} ${p.width}/${p.profile}R${p.diameter}`,
        price: p.price || 0
      }))
    }

  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error)

    // Emit error event
    emitWorkflowEvent('kommo-webhook', 'end', 'error', executionId, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })

    return {
      success: false,
      shouldEscalate: true,
      escalationReason: 'Error en procesamiento',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
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

/**
 * Busca productos relevantes para el mensaje
 */
async function searchRelevantProducts(
  message: string,
  intent: MessageIntent
): Promise<ProductResult[]> {
  // Si no es una consulta de productos, no buscar
  const productIntents: MessageIntent[] = [
    'product_inquiry',
    'price_inquiry',
    'availability_inquiry'
  ]

  if (!productIntents.includes(intent)) {
    return []
  }

  try {
    // Extraer medida del mensaje si existe
    const tireSize = extractTireSize(message)

    if (tireSize) {
      // Verificar si hay error tipográfico
      const correctedWidth = detectTypoInSize(tireSize.width)

      // Buscar por medida exacta
      const searchWidth = correctedWidth || tireSize.width

      const { data } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('width', searchWidth)
        .eq('profile', tireSize.profile)
        .eq('diameter', tireSize.diameter)
        .gt('stock', 0) // Solo productos con stock
        .order('price', { ascending: true })
        .limit(10)

      if (data && data.length > 0) {
        return data
      }
    }

    // Búsqueda semántica como fallback
    const queryEmbedding = await generateEmbedding(message)
    const semanticResults = await searchSimilarContent(queryEmbedding, {
      matchThreshold: 0.65,
      matchCount: 10,
      contentType: 'product'
    }) as Array<{ product_id?: number; similarity: number; metadata?: Record<string, unknown> }>

    if (semanticResults && semanticResults.length > 0) {
      // Buscar productos por IDs encontrados
      const productIds = semanticResults
        .filter(r => r.product_id)
        .map(r => r.product_id)

      if (productIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('products')
          .select('*')
          .in('id', productIds)
          .gt('stock', 0) // Solo productos con stock
          .limit(10)

        if (data) {
          return data
        }
      }
    }

    // Búsqueda por marca como último recurso
    const brandTerms = ['bridgestone', 'pirelli', 'michelin', 'goodyear', 'fate', 'firestone']
    const foundBrand = brandTerms.find(brand =>
      message.toLowerCase().includes(brand)
    )

    if (foundBrand) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('*')
        .ilike('brand', `%${foundBrand}%`)
        .gt('stock', 0) // Solo productos con stock
        .order('price', { ascending: true })
        .limit(10)

      return data || []
    }

    return []

  } catch (error) {
    console.error('[MessageProcessor] Error searching products:', error)
    return []
  }
}

/**
 * Genera respuesta con IA
 */
async function generateAIResponse(context: {
  message: string
  intent: MessageIntent
  products: ProductResult[]
  faqs: Array<{ question: string; answer: string }>
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  contactName?: string
}): Promise<string> {
  // Formatear prompt para WhatsApp
  const systemPrompt = formatWhatsAppPrompt({
    products: context.products,
    faqs: context.faqs,
    conversationHistory: context.conversationHistory,
    contactName: context.contactName
  })

  // Preparar mensajes para OpenAI
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

    // Post-procesar respuesta para WhatsApp
    return formatResponseForWhatsApp(content)

  } catch (error) {
    console.error('[MessageProcessor] AI generation failed:', error)

    // Respuesta de fallback según la intención
    return getFallbackResponse(context.intent)
  }
}

/**
 * Formatea la respuesta para WhatsApp
 */
function formatResponseForWhatsApp(text: string): string {
  let formatted = text

  // Remover markdown complejo
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
  formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
  formatted = formatted.replace(/#{1,6}\s*/g, '') // Headers

  // Limitar longitud
  if (formatted.length > 1000) {
    formatted = formatted.slice(0, 997) + '...'
  }

  // Asegurar que no termine en medio de una palabra
  if (formatted.endsWith('...')) {
    const lastSpace = formatted.lastIndexOf(' ', formatted.length - 4)
    if (lastSpace > formatted.length - 50) {
      formatted = formatted.slice(0, lastSpace) + '...'
    }
  }

  return formatted.trim()
}

/**
 * Respuesta de fallback cuando falla la IA
 */
function getFallbackResponse(intent: MessageIntent): string {
  const fallbacks: Record<MessageIntent, string> = {
    greeting: '¡Hola! 👋 ¿En qué te puedo ayudar hoy?',
    product_inquiry: '¿Qué medida de neumático necesitás? La podés ver en el costado del neumático actual.',
    price_inquiry: 'Decime qué medida necesitás y te paso el precio 💰',
    availability_inquiry: '¿Qué medida estás buscando? Te confirmo disponibilidad.',
    faq: 'Nuestro horario es Lun-Vie 8:30-18:30, Sáb 9:00-13:00. ¿Te puedo ayudar con algo más?',
    appointment: '¿Querés agendar un turno para instalación? Decime qué día te queda cómodo.',
    complaint: 'Lamentamos el inconveniente. Te paso con un asesor para ayudarte mejor.',
    escalation: 'Te comunico con un asesor ahora mismo. Un momento por favor.',
    other: '¿En qué te puedo ayudar? 🛞'
  }

  return fallbacks[intent] || fallbacks.other
}

// ============================================================================
// PROCESAMIENTO ASÍNCRONO
// ============================================================================

/**
 * Procesa el mensaje en background (para no bloquear el webhook)
 *
 * @param input - Message input data
 * @param provider - Messaging provider ('kommo' | 'twilio' | 'meta'), defaults to 'kommo'
 */
export function processMessageAsync(
  input: ProcessMessageInput,
  provider: MessageProvider = 'kommo'
): void {
  // Ejecutar en background sin esperar
  processIncomingMessage(input, provider)
    .then(result => {
      if (result.success) {
        console.log(`[MessageProcessor] Async processing completed successfully via ${provider}`)
      } else {
        console.error('[MessageProcessor] Async processing failed:', result.error)
      }
    })
    .catch(error => {
      console.error('[MessageProcessor] Async processing error:', error)
    })
}

// ============================================================================
// PROVIDER-SPECIFIC HELPERS
// ============================================================================

/**
 * Gets or creates a conversation based on the provider
 * - Kommo: Uses chat ID as primary identifier
 * - Twilio: Uses phone + provider as identifier
 */
async function getOrCreateConversationForProvider(input: {
  chatId: string
  contactId?: string
  phone?: string
  contactName?: string
  channel: string
  provider: MessageProvider
}) {
  if (input.provider === 'kommo') {
    // Kommo uses chat ID as the primary identifier
    return getOrCreateConversation({
      kommoChatId: input.chatId,
      kommoContactId: input.contactId,
      phone: input.phone,
      contactName: input.contactName,
      channel: input.channel,
      provider: 'kommo'
    })
  }

  // Twilio/Meta: Use phone + provider to find existing conversation
  if (input.phone) {
    const existing = await findConversationByPhoneAndProvider(input.phone, input.provider)
    if (existing) {
      return existing
    }
  }

  // Create new conversation for Twilio/Meta
  // For non-Kommo providers, chatId might be the phone number or a generated ID
  return getOrCreateConversation({
    kommoChatId: input.chatId || `${input.provider}_${input.phone}`,
    phone: input.phone,
    contactName: input.contactName,
    channel: input.channel,
    provider: input.provider
  })
}

/**
 * Sends a response message using the appropriate provider
 */
async function sendResponseToProvider(input: {
  provider: MessageProvider
  chatId: string
  phone?: string
  message: string
}): Promise<void> {
  const { provider, chatId, phone, message } = input

  try {
    switch (provider) {
      case 'kommo': {
        const kommoClient = getKommoClient()
        await kommoClient.sendMessage(chatId, message, { receiverPhone: phone })
        break
      }

      case 'twilio': {
        if (!phone) {
          throw new Error('Phone number required for Twilio provider')
        }
        const client = getTwilioClient()
        const result = await client.sendMessage(phone, message)
        if (result.status === 'failed') {
          throw new Error(result.errorMessage || 'Twilio send failed')
        }
        break
      }

      case 'meta': {
        // Meta WhatsApp Business API - future implementation
        console.warn('[MessageProcessor] Meta provider not yet implemented')
        throw new Error('Meta provider not yet implemented')
      }

      default: {
        const _exhaustive: never = provider
        throw new Error(`Unknown provider: ${_exhaustive}`)
      }
    }
  } catch (error) {
    console.error(`[MessageProcessor] Failed to send via ${provider}:`, error)
    // Re-throw to let caller handle (or not - message is already saved)
    throw error
  }
}
