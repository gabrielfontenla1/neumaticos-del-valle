import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TwilioClient, validateTwilioSignature, parseTwilioWebhook } from '@/lib/twilio'
import { openai, models, temperatures } from '@/lib/ai/openai'
import { PRODUCT_AGENT_PROMPT, formatSystemPrompt } from '@/lib/ai/prompts/system'
import { searchFAQs } from '@/lib/ai/embeddings'
import {
  getOrCreateConversation as getOrCreateConv,
  addMessage,
  getMessageHistoryForLLM,
  updateConversation
} from '@/lib/whatsapp/repository'
import type { WhatsAppConversation, PendingTireSearch } from '@/lib/whatsapp/types'

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

const ENABLE_SIGNATURE_VERIFICATION = process.env.NODE_ENV === 'production'
const MAX_RESPONSE_TOKENS = 500
const MAX_HISTORY_MESSAGES = 10
const RESPONSE_TIMEOUT_MS = 25000
const BRAND_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const db = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================================
// TYPES
// ============================================================================

interface TwilioWebhookPayload {
  MessageSid: string
  From: string
  To: string
  Body: string
  ProfileName?: string
  WaId?: string
}

// Conversation and Message types now in @/lib/whatsapp/types
// Simple message type for LLM context
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
    console.log('[Twilio] Brand cache updated:', uniqueBrands.length, 'brands')
    return uniqueBrands
  } catch (error) {
    console.error('[Twilio] Error fetching brands:', error)
    return ['bridgestone', 'pirelli', 'michelin', 'goodyear', 'fate', 'firestone']
  }
}

// ============================================================================
// TIRE SIZE PARSER (with typo correction)
// ============================================================================

function parseTireSize(query: string): ParsedSize | null {
  // Multiple patterns for flexibility
  const patterns = [
    /(\d{3})\s*[/-]\s*(\d{2})\s*[rR]?\s*(\d{2})/,   // 205/55R16, 205-55-16, 205 55 R 16
    /(\d{3})\s*(\d{2})\s*[rR]?\s*(\d{2})/,          // 2055516 (no separators)
    /(\d{3})[-/\s](\d{2})[-/\s]?[rR]?(\d{2})/,      // More flexible
  ]

  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match) {
      let width = parseInt(match[1])
      const profile = parseInt(match[2])
      const diameter = parseInt(match[3])

      // Validate ranges
      if (width < 100 || width > 400) continue
      if (profile < 20 || profile > 90) continue
      if (diameter < 12 || diameter > 24) continue

      // Typo correction: widths ending in 6 should be 5
      let wasCorrected = false
      let originalWidth: number | undefined

      if (width % 10 === 6) {
        originalWidth = width
        width = width - 1
        wasCorrected = true
        console.log(`[Twilio] Typo correction: ${originalWidth} -> ${width}`)
      }

      return { width, profile, diameter, wasCorrected, originalWidth }
    }
  }

  return null
}

// ============================================================================
// SIMILAR SIZES (for fallback)
// ============================================================================

async function getSimilarSizes(size: ParsedSize): Promise<ProductResult[]> {
  // Try adjacent widths with same profile/diameter
  const adjacentWidths = [size.width - 10, size.width + 10]

  try {
    const { data } = await db
      .from('products')
      .select('*')
      .eq('diameter', size.diameter)
      .in('width', adjacentWidths)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(5)

    if (data && data.length > 0) {
      console.log('[Twilio] Similar sizes found:', data.length)
      return data
    }

    // Try same diameter, different profile
    const { data: diffProfile } = await db
      .from('products')
      .select('*')
      .eq('diameter', size.diameter)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(5)

    return diffProfile || []
  } catch (error) {
    console.error('[Twilio] Error getting similar sizes:', error)
    return []
  }
}

// ============================================================================
// POPULAR PRODUCTS (final fallback - NEVER returns empty)
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
  // First: try popular sizes
  for (const size of POPULAR_SIZES) {
    try {
      const { data } = await db
        .from('products')
        .select('*')
        .eq('width', size.width)
        .eq('profile', size.profile)
        .eq('diameter', size.diameter)
        .gt('stock', 0)
        .order('price', { ascending: true })
        .limit(5)

      if (data && data.length > 0) {
        console.log('[Twilio] Popular products from size:', size, 'count:', data.length)
        return data
      }
    } catch (e) {
      continue
    }
  }

  // Second: any products with stock, cheapest first
  try {
    const { data } = await db
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(5)

    if (data && data.length > 0) {
      console.log('[Twilio] Fallback to any products with stock:', data.length)
      return data
    }
  } catch (e) {
    console.error('[Twilio] Error getting any products:', e)
  }

  // Third: any products at all
  try {
    const { data } = await db
      .from('products')
      .select('*')
      .order('price', { ascending: true })
      .limit(5)

    console.log('[Twilio] Final fallback - any products:', data?.length || 0)
    return data || []
  } catch (e) {
    console.error('[Twilio] Error in final fallback:', e)
    return []
  }
}

// ============================================================================
// PRODUCT SEARCH - Multi-tier with guaranteed results
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
                     /\d{3}/.test(query) // Any 3 digits might be a tire size

  if (!needsSearch) {
    console.log('[Twilio] No product keywords detected, skipping search')
    return []
  }

  console.log('[Twilio] Starting multi-tier search for:', query)

  // Get brands from DB (cached)
  const allBrands = await getAllBrands()
  const foundBrand = allBrands.find(b => lowerQuery.includes(b))
  if (foundBrand) console.log('[Twilio] Brand detected:', foundBrand)

  // ========================================================================
  // TIER 1: Exact size match (with brand if provided)
  // ========================================================================
  if (parsedSize) {
    console.log('[Twilio] TIER 1: Exact size search -', parsedSize.width, '/', parsedSize.profile, 'R', parsedSize.diameter)

    // 1a: With stock
    let sizeQuery = db
      .from('products')
      .select('*')
      .eq('width', parsedSize.width)
      .eq('profile', parsedSize.profile)
      .eq('diameter', parsedSize.diameter)

    if (foundBrand) {
      sizeQuery = sizeQuery.ilike('brand', `%${foundBrand}%`)
    }

    const { data: withStock } = await sizeQuery
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (withStock && withStock.length > 0) {
      console.log('[Twilio] TIER 1a SUCCESS: Found', withStock.length, 'products with stock')
      return withStock
    }

    // 1b: Without stock filter (show out of stock too)
    const { data: anyStock } = await db
      .from('products')
      .select('*')
      .eq('width', parsedSize.width)
      .eq('profile', parsedSize.profile)
      .eq('diameter', parsedSize.diameter)
      .order('price', { ascending: true })
      .limit(10)

    if (anyStock && anyStock.length > 0) {
      console.log('[Twilio] TIER 1b SUCCESS: Found', anyStock.length, 'products (any stock)')
      return anyStock
    }
  }

  // ========================================================================
  // TIER 2: Brand search
  // ========================================================================
  if (foundBrand) {
    console.log('[Twilio] TIER 2: Brand search for:', foundBrand)

    const { data } = await db
      .from('products')
      .select('*')
      .ilike('brand', `%${foundBrand}%`)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (data && data.length > 0) {
      console.log('[Twilio] TIER 2 SUCCESS: Found', data.length, 'products for brand', foundBrand)
      return data
    }
  }

  // ========================================================================
  // TIER 3: Multi-field text search (like ecommerce)
  // ========================================================================
  const searchTerm = query.replace(/[^\w\sáéíóúñ]/gi, '').trim()
  if (searchTerm.length >= 2) {
    console.log('[Twilio] TIER 3: Multi-field text search for:', searchTerm)

    const { data } = await db
      .from('products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (data && data.length > 0) {
      console.log('[Twilio] TIER 3 SUCCESS: Found', data.length, 'products')
      return data
    }
  }

  // ========================================================================
  // TIER 4: Similar sizes (if we had a size)
  // ========================================================================
  if (parsedSize) {
    console.log('[Twilio] TIER 4: Searching similar sizes')
    const similarProducts = await getSimilarSizes(parsedSize)

    if (similarProducts.length > 0) {
      console.log('[Twilio] TIER 4 SUCCESS: Found', similarProducts.length, 'similar products')
      return similarProducts
    }
  }

  // ========================================================================
  // TIER 5: Popular products (FINAL FALLBACK - NEVER EMPTY)
  // ========================================================================
  console.log('[Twilio] TIER 5: Popular products fallback')
  const popularProducts = await getPopularProducts()
  console.log('[Twilio] TIER 5 FALLBACK: Returning', popularProducts.length, 'popular products')
  return popularProducts
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('\n' + '='.repeat(60))
    console.log('[Twilio Webhook] Incoming request')

    // Validate Twilio signature in production
    if (ENABLE_SIGNATURE_VERIFICATION) {
      const isValid = await validateTwilioSignature(request.clone())
      if (!isValid) {
        console.error('[Twilio Webhook] Invalid signature')
        return createTwiMLResponse()
      }
    }

    // Parse webhook payload
    const formData = await request.formData()
    const payload = parseTwilioWebhook(formData) as unknown as TwilioWebhookPayload

    const { MessageSid, From, Body, ProfileName } = payload

    if (!From || !Body) {
      console.log('[Twilio Webhook] Missing required fields')
      return createTwiMLResponse()
    }

    const phoneNumber = From.replace(/^whatsapp:/, '')
    console.log(`[Twilio] Message from ${ProfileName || phoneNumber}: "${Body.slice(0, 50)}..."`)

    // Process message asynchronously
    processMessageAsync({
      messageSid: MessageSid,
      phoneNumber,
      profileName: ProfileName || 'Cliente',
      messageText: Body,
      startTime
    })

    console.log(`[Twilio] Acknowledged in ${Date.now() - startTime}ms`)
    return createTwiMLResponse()

  } catch (error) {
    console.error('[Twilio Webhook] Error:', error)
    return createTwiMLResponse()
  }
}

// ============================================================================
// MESSAGE PROCESSING
// ============================================================================

async function processMessageAsync(params: {
  messageSid: string
  phoneNumber: string
  profileName: string
  messageText: string
  startTime: number
}): Promise<void> {
  const { phoneNumber, profileName, messageText, startTime } = params

  try {
    // 1. Get or create conversation using the new repository
    const conversation = await getOrCreateConv(phoneNumber, profileName)
    console.log('[Twilio] Conversation:', conversation.id, 'State:', conversation.conversation_state)

    // 2. Save user message
    await addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: messageText
    })

    // 3. CHECK IF CONVERSATION IS PAUSED (human takeover)
    if (conversation.is_paused) {
      console.log('[Twilio] Conversation is PAUSED - skipping AI response (human takeover)')
      return
    }

    // 4. CONVERSATION STATE FLOW - Handle based on conversation state
    // (For active flows like appointment or stock location)
    const stateResult = await handleConversationState(conversation, messageText, phoneNumber, startTime)
    if (stateResult.handled) {
      console.log('[Twilio] Handled by state machine:', stateResult.state)
      return
    }

    // 5. OPENAI FUNCTION CALLING - Primary handler for idle state
    // Uses AI to intelligently route to appointments, stock, help, etc.
    if (conversation.conversation_state === 'idle') {
      console.log('[Twilio] Using OpenAI function calling...')
      const history = await getMessageHistoryForLLM(conversation.id, MAX_HISTORY_MESSAGES)

      try {
        const functionResult = await processWithFunctionCalling(
          conversation,
          messageText,
          phoneNumber,
          history
        )

        if (functionResult.handled) {
          console.log('[Twilio] Handled by function calling:', functionResult.functionName)
          await saveAndSendResponse(conversation.id, functionResult.response, phoneNumber, startTime)
          return
        }
      } catch (error) {
        console.error('[Twilio] Function calling error, falling back:', error)
        // Continue to fallback handlers
      }
    }

    // 6. LEGACY: Keyword-based appointment detection (backup)
    if (conversation.conversation_state === 'idle' && detectAppointmentIntent(messageText)) {
      console.log('[Twilio] Appointment intent detected (legacy), starting flow')
      const result = await startAppointmentFlow(conversation, phoneNumber)
      if (result.handled && result.response) {
        await saveAndSendResponse(conversation.id, result.response, phoneNumber, startTime)
        return
      }
    }

    // 7. Check for tire size in message - trigger stock flow
    const parsedSize = parseTireSize(messageText)
    if (parsedSize) {
      const stockFlowResult = await handleTireSizeQuery(conversation, parsedSize, messageText, phoneNumber, startTime)
      if (stockFlowResult.handled) {
        console.log('[Twilio] Handled by stock flow')
        return
      }
    }

    // 8. FALLBACK: Original AI flow for non-product queries
    const history = await getMessageHistoryForLLM(conversation.id, MAX_HISTORY_MESSAGES)
    const products = await searchProducts(messageText)
    console.log('[Twilio] Products found:', products.length)

    let faqs: Array<{ question: string; answer: string }> = []
    try {
      faqs = await searchFAQs(messageText, 3)
    } catch (error) {
      console.log('[Twilio] FAQ search skipped')
    }

    const responseText = await generateAIResponse({
      message: messageText,
      products,
      faqs,
      conversationHistory: history
    })

    const responseTime = Date.now() - startTime
    console.log(`[Twilio] Response generated in ${responseTime}ms`)

    await addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: responseText,
      responseTimeMs: responseTime
    })

    await sendTwilioResponse(phoneNumber, responseText)
    console.log('[Twilio] Message sent successfully')

  } catch (error) {
    console.error('[Twilio] Error processing message:', error)

    try {
      await sendTwilioResponse(
        params.phoneNumber,
        '¡Hola! Hubo un problema técnico. ¿Podés repetir tu consulta?'
      )
    } catch (e) {
      console.error('[Twilio] Failed to send error response:', e)
    }
  }
}

// ============================================================================
// STOCK LOCATION FLOW HANDLERS
// ============================================================================

interface StateResult {
  handled: boolean
  state?: string
}

/**
 * Handle conversation based on its current state
 */
async function handleConversationState(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  startTime: number
): Promise<StateResult> {
  // Handle appointment flow states
  if (isAppointmentState(conversation.conversation_state)) {
    const result = await handleAppointmentState(conversation, messageText, phoneNumber, startTime)
    if (result.handled && result.response) {
      await saveAndSendResponse(conversation.id, result.response, phoneNumber, startTime)
      return { handled: true, state: result.newState || conversation.conversation_state }
    }
    return { handled: result.handled }
  }

  // Handle stock flow states
  switch (conversation.conversation_state) {
    case 'awaiting_location':
      return handleLocationResponse(conversation, messageText, phoneNumber, startTime)

    case 'awaiting_transfer_confirm':
      return handleTransferConfirmation(conversation, messageText, phoneNumber, startTime)

    case 'idle':
    case 'showing_results':
    default:
      return { handled: false }
  }
}

/**
 * Handle location response from user
 */
async function handleLocationResponse(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  startTime: number
): Promise<StateResult> {
  console.log('[Twilio] Processing location response:', messageText)

  // Try to detect city from message
  const detectedCity = detectCityFromMessage(messageText)

  if (!detectedCity) {
    // Location not recognized
    const responseText = templates.locationNotRecognized()
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
    return { handled: true, state: 'awaiting_location' }
  }

  // Get branch info
  const branchCode = getBranchCodeFromCity(detectedCity)
  if (!branchCode) {
    const responseText = templates.locationNotRecognized()
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
    return { handled: true, state: 'awaiting_location' }
  }

  const branch = await getBranchByCode(branchCode)
  if (!branch) {
    const responseText = templates.locationNotRecognized()
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
    return { handled: true, state: 'awaiting_location' }
  }

  // Update conversation with location
  await updateConversation(conversation.id, {
    user_city: detectedCity,
    preferred_branch_id: branch.id,
    conversation_state: 'showing_results'
  })

  // Now search with the pending tire search
  const pendingSearch = conversation.pending_tire_search
  if (!pendingSearch) {
    console.error('[Twilio] No pending search found after location')
    await updateConversation(conversation.id, { conversation_state: 'idle' })
    return { handled: false }
  }

  // Confirm branch and search for products
  let responseText = templates.confirmBranch(branchCode) + '\n\n'
  responseText += await generateStockResponse(pendingSearch, branchCode, branch.id)

  // Clear pending search and set state
  await updateConversation(conversation.id, {
    pending_tire_search: null,
    conversation_state: 'idle'
  })

  await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
  return { handled: true, state: 'showing_results' }
}

/**
 * Handle tire size query - trigger location flow if needed
 */
async function handleTireSizeQuery(
  conversation: WhatsAppConversation,
  parsedSize: ParsedSize,
  messageText: string,
  phoneNumber: string,
  startTime: number
): Promise<StateResult> {
  const sizeDisplay = `${parsedSize.width}/${parsedSize.profile}R${parsedSize.diameter}`
  console.log('[Twilio] Tire size detected:', sizeDisplay)

  // If user has a preferred branch, search directly
  if (conversation.preferred_branch_id && conversation.user_city) {
    const branchCode = getBranchCodeFromCity(conversation.user_city)
    if (branchCode) {
      const responseText = await generateStockResponse(
        { width: parsedSize.width, profile: parsedSize.profile, diameter: parsedSize.diameter, originalMessage: messageText },
        branchCode,
        conversation.preferred_branch_id
      )
      await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
      return { handled: true, state: 'showing_results' }
    }
  }

  // No location - ask for it
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
  await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
  return { handled: true, state: 'awaiting_location' }
}

/**
 * Handle transfer confirmation
 */
async function handleTransferConfirmation(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  startTime: number
): Promise<StateResult> {
  const lowerMessage = messageText.toLowerCase()
  const affirmatives = ['si', 'sí', 'dale', 'ok', 'bueno', 'quiero', 'traeme', 'traelo', 'hacelo']
  const negatives = ['no', 'nah', 'mejor no', 'despues', 'después', 'otro dia']

  if (affirmatives.some(a => lowerMessage.includes(a))) {
    // User confirmed transfer
    const responseText = `Perfecto, un asesor te va a contactar para coordinar el envío entre sucursales.

¿Hay algo más en lo que te pueda ayudar?`

    await updateConversation(conversation.id, { conversation_state: 'idle' })
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
    return { handled: true, state: 'transfer_confirmed' }
  }

  if (negatives.some(n => lowerMessage.includes(n))) {
    const responseText = `Sin problema. ¿Hay algo más en lo que te pueda ayudar?`
    await updateConversation(conversation.id, { conversation_state: 'idle' })
    await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
    return { handled: true, state: 'transfer_cancelled' }
  }

  // Unclear response
  const responseText = `¿Querés que te lo traigamos desde otra sucursal? Respondé "sí" o "no".`
  await saveAndSendResponse(conversation.id, responseText, phoneNumber, startTime)
  return { handled: true, state: 'awaiting_transfer_confirm' }
}

/**
 * Generate stock response based on availability
 */
async function generateStockResponse(
  search: PendingTireSearch,
  branchCode: string,
  _branchId: string
): Promise<string> {
  const sizeDisplay = `${search.width}/${search.profile}R${search.diameter}`
  const size = { width: search.width, profile: search.profile, diameter: search.diameter }

  try {
    // Search products with stock at the branch
    const products = await searchProductsWithStock(size, branchCode)
    const groups = groupProductsByAvailability(products)

    console.log('[Twilio] Stock search results:', {
      available: groups.available.length,
      lastUnits: groups.lastUnits.length,
      singleUnit: groups.singleUnit.length,
      unavailable: groups.unavailable.length
    })

    // CASE 1: Products available (4+ units)
    if (groups.available.length > 0) {
      return templates.availableProducts(groups.available, branchCode, sizeDisplay)
    }

    // CASE 2: Last units (2-3 units)
    if (groups.lastUnits.length > 0) {
      return templates.lastUnitsProducts(groups.lastUnits, branchCode, sizeDisplay)
    }

    // CASE 3: Single unit warning
    if (groups.singleUnit.length > 0) {
      const product = groups.singleUnit[0]
      const equivalents = await findEquivalentsWithStock(size, branchCode)
      const productIds = products.map(p => p.product_id)
      const otherBranches = await findBranchesWithStock(productIds, 2)

      return templates.singleUnitWarning(product, branchCode, equivalents, otherBranches)
    }

    // CASE 4: No stock - check equivalents
    const equivalents = await findEquivalentsWithStock(size, branchCode)
    if (equivalents.length > 0) {
      return templates.noStockWithEquivalents(sizeDisplay, branchCode, equivalents)
    }

    // CASE 5: No stock locally - check other branches
    const allProducts = await searchProductsWithStock(size) // Without branch filter
    const productIds = allProducts.map(p => p.product_id)
    const otherBranches = await findBranchesWithStock(productIds, 2)

    if (otherBranches.length > 0) {
      return templates.availableInOtherBranch(sizeDisplay, branchCode, otherBranches)
    }

    // CASE 6: No stock anywhere
    return templates.noStockAnywhere(sizeDisplay)

  } catch (error) {
    console.error('[Twilio] Error generating stock response:', error)
    return templates.errorResponse()
  }
}

/**
 * Helper to save message and send response
 */
async function saveAndSendResponse(
  conversationId: string,
  responseText: string,
  phoneNumber: string,
  startTime: number
): Promise<void> {
  const responseTime = Date.now() - startTime

  await addMessage({
    conversationId,
    role: 'assistant',
    content: responseText,
    responseTimeMs: responseTime
  })

  await sendTwilioResponse(phoneNumber, responseText)
  console.log(`[Twilio] Response sent in ${responseTime}ms`)
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
  // Use the same prompt as the dashboard simulator
  const systemPrompt = formatSystemPrompt(PRODUCT_AGENT_PROMPT, {
    products: context.products,
    faqs: context.faqs,
    previousInteraction: context.conversationHistory.length > 0
      ? context.conversationHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`).join('\n')
      : undefined
  })

  // Add WhatsApp-specific instructions
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
        max_tokens: MAX_RESPONSE_TOKENS
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), RESPONSE_TIMEOUT_MS)
      )
    ])

    let content = response.choices[0]?.message?.content || ''

    // Clean up for WhatsApp
    content = content.replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    content = content.replace(/#{1,6}\s*/g, '') // Remove headers

    if (content.length > 1000) {
      content = content.slice(0, 997) + '...'
    }

    return content.trim()

  } catch (error) {
    console.error('[Twilio] AI error:', error)
    return '¡Hola! ¿En qué te puedo ayudar? Decime qué medida de neumático necesitás'
  }
}

// ============================================================================
// DATABASE OPERATIONS - Now handled by @/lib/whatsapp/repository
// ============================================================================

// ============================================================================
// TWILIO RESPONSE
// ============================================================================

async function sendTwilioResponse(to: string, body: string): Promise<void> {
  try {
    const twilioClient = await TwilioClient.create()
    const result = await twilioClient.sendMessage(to, body)

    if (result.status === 'failed') {
      console.error('[Twilio] Send failed:', result.errorMessage)
    }
  } catch (error) {
    console.error('[Twilio] Error sending:', error)
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function createTwiMLResponse(): NextResponse {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  )
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Twilio WhatsApp Bot (Multi-Tier Search)',
    timestamp: new Date().toISOString()
  })
}
