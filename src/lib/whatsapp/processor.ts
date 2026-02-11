/**
 * Shared Message Processor
 * Extracted from Twilio webhook to be used by both Twilio and Baileys providers.
 * Contains the full AI pipeline: conversation state, function calling,
 * appointment booking, stock lookup, and fallback AI response.
 */

import { createClient } from '@supabase/supabase-js'
import { openai, models, temperatures } from '@/lib/ai/openai'
import { formatSystemPrompt, getBusinessContext } from '@/lib/ai/prompts/system'
import { getAIPromptsConfig, getWhatsAppContextConfig } from '@/lib/ai/config-service'
import { searchFAQs } from '@/lib/ai/embeddings'
import {
  getOrCreateConversation as getOrCreateConv,
  addMessage,
  getMessageHistoryForLLM,
  updateConversation
} from '@/lib/whatsapp/repository'
import type { WhatsAppConversation, PendingTireSearch, WhatsAppSource } from '@/lib/whatsapp/types'

// Stock location flow services
import {
  detectCityFromMessage,
  getBranchCodeFromCity,
  getBranchByCode
} from '@/lib/whatsapp/services/location-service'
import {
  searchProductsWithStock,
  findBranchesWithStock,
  groupProductsByAvailability
} from '@/lib/whatsapp/services/stock-service'
import { findEquivalentsWithStock } from '@/lib/whatsapp/services/equivalence-service'
import * as templates from '@/lib/whatsapp/templates/stock-responses'

// Appointment flow handler
import {
  detectAppointmentIntent,
  isAppointmentState,
  startAppointmentFlow,
  handleAppointmentState
} from '@/lib/whatsapp/handlers/appointment-handler'

// OpenAI Function Calling handler
import { processWithFunctionCalling } from '@/lib/whatsapp/ai/function-handler'

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_HISTORY_MESSAGES = 10
const RESPONSE_TIMEOUT_MS = 25000
const BRAND_CACHE_TTL = 5 * 60 * 1000

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const db = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================================
// TYPES
// ============================================================================

type Message = { role: 'user' | 'assistant'; content: string }

interface ProductResult {
  id?: string
  name?: string
  brand?: string
  model?: string
  width?: number
  profile?: number
  diameter?: number
  price?: number
  stock?: number
  price_list?: number
  features?: { price_list?: number }
}

interface ParsedSize {
  width: number
  profile: number
  diameter: number
  wasCorrected: boolean
  originalWidth?: number
}

/**
 * Configuration for the message processor.
 * Each provider (Twilio, Baileys) passes its own sendResponse callback.
 */
export interface MessageProcessorConfig {
  source: WhatsAppSource
  sendResponse: (phone: string, text: string) => Promise<void>
  baileysInstanceId?: string
}

interface StateResult {
  handled: boolean
  state?: string
}

// ============================================================================
// BRAND CACHE (Dynamic from DB)
// ============================================================================

let brandCache: { brands: string[]; timestamp: number } | null = null

async function getAllBrands(): Promise<string[]> {
  const now = Date.now()
  if (brandCache && (now - brandCache.timestamp) < BRAND_CACHE_TTL) {
    return brandCache.brands
  }

  try {
    const { data } = await db
      .from('products')
      .select('brand')
      .order('brand')

    const uniqueBrands = [...new Set(
      (data || [])
        .map(p => p.brand?.toLowerCase())
        .filter(Boolean)
    )] as string[]

    brandCache = { brands: uniqueBrands, timestamp: now }
    console.log('[Processor] Brand cache updated:', uniqueBrands.length, 'brands')
    return uniqueBrands
  } catch (error) {
    console.error('[Processor] Error fetching brands:', error)
    return ['bridgestone', 'pirelli', 'michelin', 'goodyear', 'fate', 'firestone']
  }
}

// ============================================================================
// TIRE SIZE PARSER
// ============================================================================

function parseTireSize(query: string): ParsedSize | null {
  const patterns = [
    /(\d{3})\s*[/-]\s*(\d{2})\s*[rR]?\s*(\d{2})/,
    /(\d{3})\s*(\d{2})\s*[rR]?\s*(\d{2})/,
    /(\d{3})[-/\s](\d{2})[-/\s]?[rR]?(\d{2})/,
  ]

  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match) {
      let width = parseInt(match[1])
      const profile = parseInt(match[2])
      const diameter = parseInt(match[3])

      if (width < 100 || width > 400) continue
      if (profile < 20 || profile > 90) continue
      if (diameter < 12 || diameter > 24) continue

      let wasCorrected = false
      let originalWidth: number | undefined

      if (width % 10 === 6) {
        originalWidth = width
        width = width - 1
        wasCorrected = true
        console.log(`[Processor] Typo correction: ${originalWidth} -> ${width}`)
      }

      return { width, profile, diameter, wasCorrected, originalWidth }
    }
  }

  return null
}

// ============================================================================
// SIMILAR SIZES
// ============================================================================

async function getSimilarSizes(size: ParsedSize): Promise<ProductResult[]> {
  const adjacentWidths = [size.width - 10, size.width + 10]

  try {
    const { data } = await db
      .from('products')
      .select('*')
      .eq('rim_diameter', size.diameter)
      .in('width', adjacentWidths)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(5)

    if (data && data.length > 0) {
      return data
    }

    const { data: diffProfile } = await db
      .from('products')
      .select('*')
      .eq('rim_diameter', size.diameter)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(5)

    return diffProfile || []
  } catch (error) {
    console.error('[Processor] Error getting similar sizes:', error)
    return []
  }
}

// ============================================================================
// POPULAR PRODUCTS
// ============================================================================

const POPULAR_SIZES = [
  { width: 185, profile: 65, diameter: 15 },
  { width: 175, profile: 65, diameter: 14 },
  { width: 195, profile: 55, diameter: 15 },
  { width: 205, profile: 55, diameter: 16 },
  { width: 185, profile: 60, diameter: 15 },
  { width: 195, profile: 65, diameter: 15 },
]

async function getPopularProducts(): Promise<ProductResult[]> {
  for (const size of POPULAR_SIZES) {
    try {
      const { data } = await db
        .from('products')
        .select('*')
        .eq('width', size.width)
        .eq('aspect_ratio', size.profile)
        .eq('rim_diameter', size.diameter)
        .gt('stock', 0)
        .order('price', { ascending: true })
        .limit(5)

      if (data && data.length > 0) return data
    } catch {
      continue
    }
  }

  try {
    const { data } = await db
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(5)

    if (data && data.length > 0) return data
  } catch (e) {
    console.error('[Processor] Error getting any products:', e)
  }

  try {
    const { data } = await db
      .from('products')
      .select('*')
      .order('price', { ascending: true })
      .limit(5)

    return data || []
  } catch (e) {
    console.error('[Processor] Error in final fallback:', e)
    return []
  }
}

// ============================================================================
// PRODUCT SEARCH
// ============================================================================

async function searchProducts(query: string): Promise<ProductResult[]> {
  const productKeywords = [
    'neumático', 'neumatico', 'llanta', 'goma', 'cubierta',
    'precio', 'costo', 'vale', 'sale', 'cuanto', 'cuánto',
    'tiene', 'tienen', 'hay', 'disponible', 'tenes', 'tenés',
    'medida', 'tamaño', 'rodado',
    'necesito', 'busco', 'quiero', 'comprar', 'conseguir'
  ]

  const lowerQuery = query.toLowerCase()
  const parsedSize = parseTireSize(query)
  const needsSearch = productKeywords.some(k => lowerQuery.includes(k)) ||
                     parsedSize !== null ||
                     /\d{3}/.test(query)

  if (!needsSearch) return []

  console.log('[Processor] Starting multi-tier search for:', query)

  const allBrands = await getAllBrands()
  const foundBrand = allBrands.find(b => lowerQuery.includes(b))

  // TIER 1: Exact size match
  if (parsedSize) {
    let sizeQuery = db
      .from('products')
      .select('*')
      .eq('width', parsedSize.width)
      .eq('aspect_ratio', parsedSize.profile)
      .eq('rim_diameter', parsedSize.diameter)

    if (foundBrand) {
      sizeQuery = sizeQuery.ilike('brand', `%${foundBrand}%`)
    }

    const { data: withStock } = await sizeQuery
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (withStock && withStock.length > 0) return withStock

    const { data: anyStock } = await db
      .from('products')
      .select('*')
      .eq('width', parsedSize.width)
      .eq('aspect_ratio', parsedSize.profile)
      .eq('rim_diameter', parsedSize.diameter)
      .order('price', { ascending: true })
      .limit(10)

    if (anyStock && anyStock.length > 0) return anyStock
  }

  // TIER 2: Brand search
  if (foundBrand) {
    const { data } = await db
      .from('products')
      .select('*')
      .ilike('brand', `%${foundBrand}%`)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (data && data.length > 0) return data
  }

  // TIER 3: Multi-field text search
  const searchTerm = query.replace(/[^\w\sáéíóúñ]/gi, '').trim()
  if (searchTerm.length >= 2) {
    const { data } = await db
      .from('products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (data && data.length > 0) return data
  }

  // TIER 4: Similar sizes
  if (parsedSize) {
    const similarProducts = await getSimilarSizes(parsedSize)
    if (similarProducts.length > 0) return similarProducts
  }

  // TIER 5: Popular products fallback
  return getPopularProducts()
}

// ============================================================================
// AI RESPONSE
// ============================================================================

async function generateAIResponse(context: {
  message: string
  products: ProductResult[]
  faqs: Array<{ question: string; answer: string }>
  conversationHistory: Message[]
}): Promise<string> {
  const [promptsConfig, ctxConfig, businessCtx] = await Promise.all([
    getAIPromptsConfig(),
    getWhatsAppContextConfig(),
    getBusinessContext(),
  ])
  const fallbackTokens = ctxConfig.fallbackMaxTokens

  const systemPrompt = formatSystemPrompt(promptsConfig.whatsappSystemPrompt, {
    products: context.products,
    faqs: context.faqs,
    businessContext: businessCtx,
    previousInteraction: context.conversationHistory.length > 0
      ? context.conversationHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`).join('\n')
      : undefined
  })

  const whatsappInstructions = `\n\n📱 FORMATO WHATSAPP:
- Mensajes CORTOS (máximo 4 líneas)
- UNA sola pregunta por mensaje
- Emojis moderados (1-2 máximo)
- Sin markdown complejo (no uses **, ##, etc.)`

  const messages = [
    { role: 'system' as const, content: systemPrompt + whatsappInstructions },
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
        max_tokens: fallbackTokens
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), RESPONSE_TIMEOUT_MS)
      )
    ])

    let content = response.choices[0]?.message?.content || ''

    content = content.replace(/\*\*([^*]+)\*\*/g, '$1')
    content = content.replace(/#{1,6}\s*/g, '')

    if (content.length > 1000) {
      content = content.slice(0, 997) + '...'
    }

    return content.trim()

  } catch (error) {
    console.error('[Processor] AI error:', error)
    return '¡Hola! ¿En qué te puedo ayudar? Decime qué medida de neumático necesitás'
  }
}

// ============================================================================
// STOCK RESPONSE GENERATION
// ============================================================================

async function generateStockResponse(
  search: PendingTireSearch,
  branchCode: string,
  _branchId: string
): Promise<string> {
  const sizeDisplay = `${search.width}/${search.profile}R${search.diameter}`
  const size = { width: search.width, profile: search.profile, diameter: search.diameter }

  try {
    const products = await searchProductsWithStock(size, branchCode)
    const groups = groupProductsByAvailability(products)

    if (groups.available.length > 0) {
      return templates.availableProducts(groups.available, branchCode, sizeDisplay)
    }

    if (groups.lastUnits.length > 0) {
      return templates.lastUnitsProducts(groups.lastUnits, branchCode, sizeDisplay)
    }

    if (groups.singleUnit.length > 0) {
      const product = groups.singleUnit[0]
      const equivalents = await findEquivalentsWithStock(size, branchCode)
      const productIds = products.map(p => p.product_id)
      const otherBranches = await findBranchesWithStock(productIds, 2)
      return templates.singleUnitWarning(product, branchCode, equivalents, otherBranches)
    }

    const equivalents = await findEquivalentsWithStock(size, branchCode)
    if (equivalents.length > 0) {
      return templates.noStockWithEquivalents(sizeDisplay, branchCode, equivalents)
    }

    const allProducts = await searchProductsWithStock(size)
    const productIds = allProducts.map(p => p.product_id)
    const otherBranches = await findBranchesWithStock(productIds, 2)

    if (otherBranches.length > 0) {
      return templates.availableInOtherBranch(sizeDisplay, branchCode, otherBranches)
    }

    return templates.noStockAnywhere(sizeDisplay)

  } catch (error) {
    console.error('[Processor] Error generating stock response:', error)
    return templates.errorResponse()
  }
}

// ============================================================================
// STATE HANDLERS
// ============================================================================

async function handleConversationState(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  startTime: number,
  config: MessageProcessorConfig
): Promise<StateResult> {
  if (isAppointmentState(conversation.conversation_state)) {
    const result = await handleAppointmentState(conversation, messageText, phoneNumber, startTime)
    if (result.handled && result.response) {
      await saveAndSendResponse(conversation.id, result.response, phoneNumber, startTime, config)
      return { handled: true, state: result.newState || conversation.conversation_state }
    }
    return { handled: result.handled }
  }

  switch (conversation.conversation_state) {
    case 'awaiting_location':
      return handleLocationResponse(conversation, messageText, phoneNumber, startTime, config)
    case 'awaiting_transfer_confirm':
      return handleTransferConfirmation(conversation, messageText, phoneNumber, startTime, config)
    case 'idle':
    case 'showing_results':
    default:
      return { handled: false }
  }
}

async function handleLocationResponse(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  startTime: number,
  config: MessageProcessorConfig
): Promise<StateResult> {
  const detectedCity = detectCityFromMessage(messageText)

  if (!detectedCity) {
    const responseText = templates.locationNotRecognized()
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
    return { handled: true, state: 'awaiting_location' }
  }

  const branchCode = getBranchCodeFromCity(detectedCity)
  if (!branchCode) {
    const responseText = templates.locationNotRecognized()
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
    return { handled: true, state: 'awaiting_location' }
  }

  const branch = await getBranchByCode(branchCode)
  if (!branch) {
    const responseText = templates.locationNotRecognized()
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
    return { handled: true, state: 'awaiting_location' }
  }

  await updateConversation(conversation.id, {
    user_city: detectedCity,
    preferred_branch_id: branch.id,
    conversation_state: 'showing_results'
  })

  const pendingSearch = conversation.pending_tire_search
  if (!pendingSearch) {
    await updateConversation(conversation.id, { conversation_state: 'idle' })
    return { handled: false }
  }

  let responseText = templates.confirmBranch(branchCode) + '\n\n'
  responseText += await generateStockResponse(pendingSearch, branchCode, branch.id)

  await updateConversation(conversation.id, {
    pending_tire_search: null,
    conversation_state: 'idle'
  })

  await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
  return { handled: true, state: 'showing_results' }
}

async function handleTireSizeQuery(
  conversation: WhatsAppConversation,
  parsedSize: ParsedSize,
  messageText: string,
  phoneNumber: string,
  startTime: number,
  config: MessageProcessorConfig
): Promise<StateResult> {
  const sizeDisplay = `${parsedSize.width}/${parsedSize.profile}R${parsedSize.diameter}`
  console.log('[Processor] Tire size detected:', sizeDisplay)

  if (conversation.preferred_branch_id && conversation.user_city) {
    const branchCode = getBranchCodeFromCity(conversation.user_city)
    if (branchCode) {
      const responseText = await generateStockResponse(
        { width: parsedSize.width, profile: parsedSize.profile, diameter: parsedSize.diameter, originalMessage: messageText },
        branchCode,
        conversation.preferred_branch_id
      )
      await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
      return { handled: true, state: 'showing_results' }
    }
  }

  const pendingSearch: PendingTireSearch = {
    width: parsedSize.width,
    profile: parsedSize.profile,
    diameter: parsedSize.diameter,
    originalMessage: messageText
  }

  await updateConversation(conversation.id, {
    conversation_state: 'awaiting_location',
    pending_tire_search: pendingSearch
  })

  const responseText = templates.askLocation()
  await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
  return { handled: true, state: 'awaiting_location' }
}

async function handleTransferConfirmation(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  startTime: number,
  config: MessageProcessorConfig
): Promise<StateResult> {
  const lowerMessage = messageText.toLowerCase()
  const affirmatives = ['si', 'sí', 'dale', 'ok', 'bueno', 'quiero', 'traeme', 'traelo', 'hacelo']
  const negatives = ['no', 'nah', 'mejor no', 'despues', 'después', 'otro dia']

  if (affirmatives.some(a => lowerMessage.includes(a))) {
    const responseText = `Perfecto, un asesor te va a contactar para coordinar el envío entre sucursales.

¿Hay algo más en lo que te pueda ayudar?`

    await updateConversation(conversation.id, { conversation_state: 'idle' })
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
    return { handled: true, state: 'transfer_confirmed' }
  }

  if (negatives.some(n => lowerMessage.includes(n))) {
    const responseText = `Sin problema. ¿Hay algo más en lo que te pueda ayudar?`
    await updateConversation(conversation.id, { conversation_state: 'idle' })
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
    return { handled: true, state: 'transfer_cancelled' }
  }

  const responseText = `¿Querés que te lo traigamos desde otra sucursal? Respondé "sí" o "no".`
  await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime, config)
  return { handled: true, state: 'awaiting_transfer_confirm' }
}

// ============================================================================
// SAVE & SEND HELPER
// ============================================================================

async function saveAndSendResponse(
  conversationId: string,
  responseText: string,
  phoneNumber: string,
  startTime: number,
  config: MessageProcessorConfig
): Promise<void> {
  const responseTime = Date.now() - startTime

  await addMessage({
    conversationId,
    role: 'assistant',
    content: responseText,
    responseTimeMs: responseTime,
    source: config.source
  })

  await config.sendResponse(phoneNumber, responseText)
  console.log(`[Processor:${config.source}] Response sent in ${responseTime}ms`)
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Process an incoming WhatsApp message through the full AI pipeline.
 * Used by both Twilio and Baileys webhooks.
 */
export async function processIncomingMessage(
  params: {
    phoneNumber: string
    profileName: string
    messageText: string
  },
  config: MessageProcessorConfig
): Promise<void> {
  const { phoneNumber, profileName, messageText } = params
  const startTime = Date.now()
  const tag = `[Processor:${config.source}]`

  try {
    // 1. Get or create conversation
    const conversation = await getOrCreateConv(
      phoneNumber,
      profileName,
      config.source,
      config.baileysInstanceId
    )
    console.log(tag, 'Conversation:', conversation.id, 'State:', conversation.conversation_state)

    // 2. Save user message
    await addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: messageText,
      source: config.source
    })

    // 3. Check if paused (human takeover)
    if (conversation.is_paused) {
      console.log(tag, 'Conversation is PAUSED - skipping AI response')
      return
    }

    // 4. Conversation state flow
    const stateResult = await handleConversationState(conversation, messageText, phoneNumber, startTime, config)
    if (stateResult.handled) {
      console.log(tag, 'Handled by state machine:', stateResult.state)
      return
    }

    // 5. OpenAI function calling (primary handler for idle state)
    if (conversation.conversation_state === 'idle') {
      console.log(tag, 'Using OpenAI function calling...')
      const history = await getMessageHistoryForLLM(conversation.id, MAX_HISTORY_MESSAGES)

      try {
        const functionResult = await processWithFunctionCalling(
          conversation,
          messageText,
          phoneNumber,
          history
        )

        if (functionResult.handled) {
          console.log(tag, 'Handled by function calling:', functionResult.functionName)
          await saveAndSendResponse(conversation.id, functionResult.response, phoneNumber, startTime, config)
          return
        }
      } catch (error) {
        console.error(tag, 'Function calling error, falling back:', error)
      }
    }

    // 6. Legacy: Keyword-based appointment detection
    if (conversation.conversation_state === 'idle' && detectAppointmentIntent(messageText)) {
      console.log(tag, 'Appointment intent detected (legacy)')
      const result = await startAppointmentFlow(conversation, phoneNumber)
      if (result.handled && result.response) {
        await saveAndSendResponse(conversation.id, result.response, phoneNumber, startTime, config)
        return
      }
    }

    // 7. Tire size in message -> stock flow
    const parsedSize = parseTireSize(messageText)
    if (parsedSize) {
      const stockFlowResult = await handleTireSizeQuery(conversation, parsedSize, messageText, phoneNumber, startTime, config)
      if (stockFlowResult.handled) {
        console.log(tag, 'Handled by stock flow')
        return
      }
    }

    // 8. Fallback: AI response
    const history = await getMessageHistoryForLLM(conversation.id, MAX_HISTORY_MESSAGES)
    const products = await searchProducts(messageText)

    let faqs: Array<{ question: string; answer: string }> = []
    try {
      faqs = await searchFAQs(messageText, 3)
    } catch {
      console.log(tag, 'FAQ search skipped')
    }

    const responseText = await generateAIResponse({
      message: messageText,
      products,
      faqs,
      conversationHistory: history
    })

    const responseTime = Date.now() - startTime
    console.log(`${tag} Response generated in ${responseTime}ms`)

    await addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: responseText,
      responseTimeMs: responseTime,
      source: config.source
    })

    await config.sendResponse(phoneNumber, responseText)
    console.log(tag, 'Message sent successfully')

  } catch (error) {
    console.error(`${tag} Error processing message:`, error)

    try {
      await config.sendResponse(
        params.phoneNumber,
        '¡Hola! Hubo un problema técnico. ¿Podés repetir tu consulta?'
      )
    } catch (e) {
      console.error(`${tag} Failed to send error response:`, e)
    }
  }
}
