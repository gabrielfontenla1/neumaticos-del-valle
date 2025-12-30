/**
 * Procesador de mensajes para Kommo/WhatsApp
 * Orquesta la conversación con IA y envío de respuestas
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
  addMessage,
  getMessageHistoryForLLM,
  updateConversationStatus
} from './repository'
import { getKommoClient } from './client'
import { shouldEscalate, getEscalationReason } from './escalation'
import type {
  ProcessMessageInput,
  ProcessMessageResult,
  MessageIntent
} from './types'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const MAX_RESPONSE_TOKENS = 300 // Respuestas cortas para WhatsApp
const MAX_HISTORY_MESSAGES = 10
const RESPONSE_TIMEOUT_MS = 25000 // 25 segundos máximo

// ============================================================================
// PROCESADOR PRINCIPAL
// ============================================================================

/**
 * Procesa un mensaje entrante y genera una respuesta
 */
export async function processIncomingMessage(
  input: ProcessMessageInput
): Promise<ProcessMessageResult> {
  const startTime = Date.now()

  console.log('[MessageProcessor] Processing message:', {
    chatId: input.chatId,
    from: input.senderName,
    text: input.messageText.slice(0, 50) + '...'
  })

  try {
    // 1. Obtener o crear conversación
    const conversation = await getOrCreateConversation({
      kommoChatId: input.chatId,
      kommoContactId: input.contactId,
      phone: input.senderPhone,
      contactName: input.senderName,
      channel: input.origin || 'whatsapp'
    })

    // 2. Detectar intención del mensaje
    const intent = detectIntent(input.messageText)
    console.log('[MessageProcessor] Detected intent:', intent)

    // 3. Guardar mensaje del usuario
    await addMessage({
      conversationId: conversation.id,
      kommoMessageId: input.messageId,
      role: 'user',
      content: input.messageText,
      intent
    })

    // 4. Verificar si debe escalar a humano
    const history = await getMessageHistoryForLLM(conversation.id, MAX_HISTORY_MESSAGES)
    const escalationCheck = shouldEscalate(input.messageText, intent, history.length)

    if (escalationCheck.shouldEscalate) {
      console.log('[MessageProcessor] Escalating to human:', escalationCheck.reason)

      await updateConversationStatus(
        conversation.id,
        'escalated',
        escalationCheck.reason
      )

      const escalationResponse = getQuickResponse('escalate')

      await addMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: escalationResponse,
        intent: 'escalation',
        responseTimeMs: Date.now() - startTime
      })

      return {
        success: true,
        responseText: escalationResponse,
        intent: 'escalation',
        shouldEscalate: true,
        escalationReason: escalationCheck.reason
      }
    }

    // 5. Buscar productos relevantes (si aplica)
    const products = await searchRelevantProducts(input.messageText, intent)
    console.log('[MessageProcessor] Found products:', products.length)

    // 6. Buscar FAQs relevantes
    let faqs: Array<{ question: string; answer: string }> = []
    try {
      faqs = await searchFAQs(input.messageText, 3)
    } catch (error) {
      console.log('[MessageProcessor] FAQ search failed:', error)
    }

    // 7. Generar respuesta con IA
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

    // 8. Guardar respuesta del bot
    await addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: responseText,
      intent,
      productsReferenced: products.map(p => p.id).filter(Boolean) as string[],
      aiModel: models.chat,
      responseTimeMs: responseTime
    })

    // 9. Enviar respuesta a Kommo
    try {
      const kommoClient = getKommoClient()
      await kommoClient.sendMessage(
        input.chatId,
        responseText,
        { receiverPhone: input.senderPhone }
      )
      console.log('[MessageProcessor] Message sent to Kommo successfully')
    } catch (kommoError) {
      console.error('[MessageProcessor] Failed to send to Kommo:', kommoError)
      // Continuamos aunque falle el envío, la respuesta está guardada
    }

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
 */
export function processMessageAsync(input: ProcessMessageInput): void {
  // Ejecutar en background sin esperar
  processIncomingMessage(input)
    .then(result => {
      if (result.success) {
        console.log('[MessageProcessor] Async processing completed successfully')
      } else {
        console.error('[MessageProcessor] Async processing failed:', result.error)
      }
    })
    .catch(error => {
      console.error('[MessageProcessor] Async processing error:', error)
    })
}
