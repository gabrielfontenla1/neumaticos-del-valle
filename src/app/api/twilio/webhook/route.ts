import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TwilioClient, validateTwilioSignature, parseTwilioWebhook } from '@/lib/twilio'
import { openai, models, temperatures } from '@/lib/ai/openai'
import { PRODUCT_AGENT_PROMPT, formatSystemPrompt } from '@/lib/ai/prompts/system'
import { generateEmbedding, searchSimilarContent, searchFAQs } from '@/lib/ai/embeddings'

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENABLE_SIGNATURE_VERIFICATION = process.env.NODE_ENV === 'production'
const MAX_RESPONSE_TOKENS = 500
const MAX_HISTORY_MESSAGES = 10
const RESPONSE_TIMEOUT_MS = 25000

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
  price_list?: number
  features?: { price_list?: number }
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
// MESSAGE PROCESSING (Same AI as Dashboard Simulator)
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

    // 4. Search for relevant products (same logic as /api/ai/chat)
    const products = await searchProducts(messageText)
    console.log('[Twilio] Products found:', products.length)

    // 5. Search FAQs
    let faqs: Array<{ question: string; answer: string }> = []
    try {
      faqs = await searchFAQs(messageText, 3)
    } catch (error) {
      console.log('[Twilio] FAQ search failed:', error)
    }

    // 6. Generate AI response (same as dashboard simulator)
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
        '¡Hola! Hubo un problema técnico. ¿Podés repetir tu consulta? 🙏'
      )
    } catch (e) {
      console.error('[Twilio] Failed to send error response:', e)
    }
  }
}

// ============================================================================
// AI RESPONSE (Same as Dashboard Simulator)
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
    return '¡Hola! ¿En qué te puedo ayudar? Decime qué medida de neumático necesitás 🚗'
  }
}

// ============================================================================
// PRODUCT SEARCH (Same as /api/ai/chat)
// ============================================================================

async function searchProducts(query: string): Promise<ProductResult[]> {
  // Check if query needs product search
  const productKeywords = [
    'neumático', 'neumatico', 'llanta', 'goma', 'cubierta',
    'precio', 'costo', 'vale', 'sale',
    'tiene', 'tienen', 'hay', 'disponible',
    'medida', 'tamaño', 'rodado',
    'marca', 'bridgestone', 'pirelli', 'michelin', 'goodyear',
    'necesito', 'busco', 'quiero', 'comprar'
  ]

  const lowerQuery = query.toLowerCase()
  const needsSearch = productKeywords.some(k => lowerQuery.includes(k)) ||
                     /\d{3}\/\d{2}[rR]?\d{2}/.test(query)

  if (!needsSearch) return []

  try {
    // Try semantic search first
    const queryEmbedding = await generateEmbedding(query)
    const semanticResults = await searchSimilarContent(queryEmbedding, {
      matchThreshold: 0.65,
      matchCount: 10,
      contentType: 'product'
    }) as Array<{ product?: ProductResult; similarity: number }>

    if (semanticResults?.length > 0) {
      const products = semanticResults.filter(r => r.product).map(r => r.product!)
      if (products.length > 0) return products
    }
  } catch (error) {
    console.log('[Twilio] Semantic search failed, trying keyword search')
  }

  // Fallback: Extract tire size
  const sizeMatch = query.match(/(\d{3})\s*[-/]\s*(\d{2})\s*[rR]?\s*(\d{2})/)
  if (sizeMatch) {
    const [, width, profile, diameter] = sizeMatch.map(Number)
    const { data } = await db
      .from('products')
      .select('*')
      .eq('width', width)
      .eq('profile', profile)
      .eq('diameter', diameter)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (data?.length) return data
  }

  // Fallback: Brand search
  const brands = ['bridgestone', 'pirelli', 'michelin', 'goodyear', 'fate', 'firestone']
  const foundBrand = brands.find(b => lowerQuery.includes(b))
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
    // Return a temporary conversation object
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
  if (conversationId.startsWith('temp-')) return // Don't save for temp conversations

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
    service: 'Twilio WhatsApp Bot (Same AI as Dashboard)',
    timestamp: new Date().toISOString()
  })
}
