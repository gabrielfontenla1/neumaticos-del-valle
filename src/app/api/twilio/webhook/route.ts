import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TwilioClient, validateTwilioSignature, parseTwilioWebhook } from '@/lib/twilio'
import { openai, models, temperatures } from '@/lib/ai/openai'
import { PRODUCT_AGENT_PROMPT, formatSystemPrompt } from '@/lib/ai/prompts/system'
import { searchFAQs } from '@/lib/ai/embeddings'

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

interface Conversation {
  id: string
  phone: string
  contact_name: string | null
  created_at: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

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
    /(\d{3})[\/\-\s](\d{2})[\/\-\s]?[rR]?(\d{2})/,  // More flexible
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
    // 1. Get or create conversation
    const conversation = await getOrCreateConversation(phoneNumber, profileName)
    console.log('[Twilio] Conversation:', conversation.id)

    // 2. Save user message
    await saveMessage(conversation.id, 'user', messageText)

    // 3. Get conversation history
    const history = await getConversationHistory(conversation.id)

    // 4. Search for relevant products (multi-tier with fallbacks)
    const products = await searchProducts(messageText)
    console.log('[Twilio] Products found:', products.length)

    // 5. Search FAQs (optional, don't fail if error)
    let faqs: Array<{ question: string; answer: string }> = []
    try {
      faqs = await searchFAQs(messageText, 3)
    } catch (error) {
      console.log('[Twilio] FAQ search skipped')
    }

    // 6. Generate AI response
    const responseText = await generateAIResponse({
      message: messageText,
      products,
      faqs,
      conversationHistory: history
    })

    const responseTime = Date.now() - startTime
    console.log(`[Twilio] Response generated in ${responseTime}ms`)

    // 7. Save bot response
    await saveMessage(conversation.id, 'assistant', responseText)

    // 8. Send response via Twilio
    await sendTwilioResponse(phoneNumber, responseText)
    console.log('[Twilio] Message sent successfully')

  } catch (error) {
    console.error('[Twilio] Error processing message:', error)

    // Send fallback response on error
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
// DATABASE OPERATIONS
// ============================================================================

async function getOrCreateConversation(phone: string, contactName: string): Promise<Conversation> {
  const normalizedPhone = phone.replace(/\D/g, '')

  // Try to find existing conversation
  const { data: existing } = await db
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone', normalizedPhone)
    .single()

  if (existing) {
    // Update contact name if changed
    if (contactName && existing.contact_name !== contactName) {
      await db.from('whatsapp_conversations')
        .update({ contact_name: contactName })
        .eq('id', existing.id)
    }
    return existing
  }

  // Create new conversation
  const { data: created, error } = await db
    .from('whatsapp_conversations')
    .insert({
      phone: normalizedPhone,
      contact_name: contactName
    })
    .select()
    .single()

  if (error) {
    console.error('[Twilio] Error creating conversation:', error)
    return {
      id: 'temp-' + Date.now(),
      phone: normalizedPhone,
      contact_name: contactName,
      created_at: new Date().toISOString()
    }
  }

  return created
}

async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  if (conversationId.startsWith('temp-')) return

  try {
    await db.from('whatsapp_messages').insert({
      conversation_id: conversationId,
      role,
      content
    })
  } catch (error) {
    console.error('[Twilio] Error saving message:', error)
  }
}

async function getConversationHistory(conversationId: string): Promise<Message[]> {
  if (conversationId.startsWith('temp-')) return []

  try {
    const { data } = await db
      .from('whatsapp_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_MESSAGES)

    return (data || []).reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))
  } catch (error) {
    console.error('[Twilio] Error getting history:', error)
    return []
  }
}

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
