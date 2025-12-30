import { NextRequest, NextResponse } from 'next/server'
import { processMessageAsync } from '@/lib/kommo/message-processor'
import { verifyWebhookSignature } from '@/lib/kommo/signature'
import type {
  KommoWebhookPayload,
  KommoIncomingMessage,
  KommoChatMessage,
  KommoNote,
  ProcessMessageInput
} from '@/lib/kommo/types'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const ENABLE_SIGNATURE_VERIFICATION = process.env.NODE_ENV === 'production'
const CHANNEL_SECRET = process.env.KOMMO_CHAT_CHANNEL_SECRET || ''

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Obtener body como texto para verificación de firma
    const bodyText = await request.text()

    // Log de inicio
    console.log('\n' + '='.repeat(60))
    console.log('🔔 WEBHOOK KOMMO RECIBIDO')
    console.log('Timestamp:', new Date().toISOString())

    // Verificar firma en producción
    if (ENABLE_SIGNATURE_VERIFICATION && CHANNEL_SECRET) {
      const signature = request.headers.get('X-Signature')

      if (!signature) {
        console.warn('⚠️ Webhook sin firma X-Signature')
      } else {
        const isValid = verifyWebhookSignature(bodyText, signature, CHANNEL_SECRET)
        if (!isValid) {
          console.error('❌ Firma de webhook inválida')
          return NextResponse.json(
            { status: 'error', message: 'Invalid signature' },
            { status: 401 }
          )
        }
        console.log('✅ Firma verificada correctamente')
      }
    }

    // Parsear body
    const body = JSON.parse(bodyText) as KommoWebhookPayload

    // Log del account info
    if (body.account) {
      console.log('📍 Account:', body.account.subdomain, '(ID:', body.account.id, ')')
    }

    // Procesar diferentes tipos de eventos
    let processedCount = 0

    // 1. Mensajes de chat (message.add)
    if (body.message?.add && body.message.add.length > 0) {
      console.log(`\n💬 ${body.message.add.length} mensaje(s) de chat`)

      for (const msg of body.message.add) {
        if (shouldProcessMessage(msg)) {
          const input = extractMessageInput(msg)
          if (input) {
            console.log(`   📱 Procesando mensaje de ${msg.origin}:`, msg.text?.slice(0, 50))
            processMessageAsync(input)
            processedCount++
          }
        }
      }
    }

    // 2. Eventos de chat (chat.message)
    if (body.chat?.message && body.chat.message.length > 0) {
      console.log(`\n💬 ${body.chat.message.length} evento(s) de chat`)

      for (const chat of body.chat.message) {
        if (shouldProcessChatMessage(chat)) {
          const input = extractChatMessageInput(chat)
          if (input) {
            console.log(`   📱 Procesando chat:`, chat.message.text?.slice(0, 50))
            processMessageAsync(input)
            processedCount++
          }
        }
      }
    }

    // 3. Notas de WhatsApp (notes.add)
    if (body.notes?.add && body.notes.add.length > 0) {
      const whatsappNotes = body.notes.add.filter(
        note => note.params?.service === 'whatsapp' && note.params?.text
      )

      if (whatsappNotes.length > 0) {
        console.log(`\n📝 ${whatsappNotes.length} nota(s) de WhatsApp`)

        for (const note of whatsappNotes) {
          const input = extractNoteInput(note)
          if (input) {
            console.log(`   📱 Procesando nota:`, note.params?.text?.slice(0, 50))
            processMessageAsync(input)
            processedCount++
          }
        }
      }
    }

    // 4. Eventos de leads (logging only)
    if (body.leads) {
      if (body.leads.add?.length) {
        console.log(`\n📊 ${body.leads.add.length} nuevo(s) lead(s)`)
        body.leads.add.forEach(lead => {
          console.log(`   - Lead #${lead.id}: ${lead.name}`)
        })
      }
      if (body.leads.status?.length) {
        console.log(`\n🎯 ${body.leads.status.length} cambio(s) de estado`)
      }
    }

    // 5. Eventos de contactos (logging only)
    if (body.contacts) {
      if (body.contacts.add?.length) {
        console.log(`\n👥 ${body.contacts.add.length} nuevo(s) contacto(s)`)
      }
    }

    // Respuesta exitosa
    const responseTime = Date.now() - startTime
    console.log(`\n✅ Webhook procesado en ${responseTime}ms`)
    console.log(`   Mensajes en cola: ${processedCount}`)
    console.log('='.repeat(60) + '\n')

    return NextResponse.json({
      status: 'success',
      message: 'Webhook procesado correctamente',
      timestamp: new Date().toISOString(),
      processingTimeMs: responseTime,
      messagesQueued: processedCount
    }, { status: 200 })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('\n❌ ERROR EN WEBHOOK:')
    console.error(error)
    console.error('='.repeat(60) + '\n')

    // Siempre responder 200 para evitar reintentos de Kommo
    return NextResponse.json({
      status: 'error',
      message: 'Error procesando webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: responseTime
    }, { status: 200 })
  }
}

// ============================================================================
// FILTROS
// ============================================================================

/**
 * Determina si un mensaje debe ser procesado
 */
function shouldProcessMessage(msg: KommoIncomingMessage): boolean {
  // Solo procesar mensajes de clientes (no de operadores)
  if (msg.author?.type === 'user') {
    return false
  }

  // Solo procesar ciertos canales
  const supportedOrigins = ['whatsapp', 'instagram', 'telegram']
  if (!supportedOrigins.includes(msg.origin)) {
    return false
  }

  // Debe tener texto
  if (!msg.text || msg.text.trim().length === 0) {
    return false
  }

  return true
}

/**
 * Determina si un evento de chat debe ser procesado
 */
function shouldProcessChatMessage(chat: KommoChatMessage): boolean {
  // Solo procesar mensajes de texto
  if (chat.message.type !== 'text') {
    return false
  }

  // Debe tener contenido
  if (!chat.message.text || chat.message.text.trim().length === 0) {
    return false
  }

  return true
}

// ============================================================================
// EXTRACTORES
// ============================================================================

/**
 * Extrae datos de un mensaje de Kommo
 */
function extractMessageInput(msg: KommoIncomingMessage): ProcessMessageInput | null {
  if (!msg.text) return null

  return {
    chatId: msg.chat_id,
    contactId: msg.contact_id?.toString(),
    senderName: msg.author?.name || 'Cliente',
    senderPhone: undefined, // No disponible en este formato
    messageText: msg.text,
    messageId: msg.id,
    origin: msg.origin,
    timestamp: msg.created_at * 1000 // Convertir a ms
  }
}

/**
 * Extrae datos de un evento de chat
 */
function extractChatMessageInput(chat: KommoChatMessage): ProcessMessageInput | null {
  if (!chat.message.text) return null

  return {
    chatId: chat.conversation_id,
    contactId: chat.sender.id,
    senderName: chat.sender.name,
    senderPhone: chat.sender.phone,
    messageText: chat.message.text,
    messageId: chat.msgid,
    origin: 'whatsapp', // Asumir WhatsApp para chat.message
    timestamp: chat.msec_timestamp || chat.timestamp * 1000
  }
}

/**
 * Extrae datos de una nota de WhatsApp
 */
function extractNoteInput(note: KommoNote): ProcessMessageInput | null {
  if (!note.params?.text) return null

  return {
    chatId: note.entity_id.toString(),
    contactId: note.entity_id.toString(),
    senderName: 'Cliente',
    senderPhone: note.params.phone,
    messageText: note.params.text,
    messageId: note.id.toString(),
    origin: note.params.service || 'whatsapp',
    timestamp: note.created_at * 1000
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Kommo Webhook + AI Bot',
    version: '2.0.0',
    features: {
      aiProcessing: true,
      whatsappSupport: true,
      instagramSupport: true,
      escalation: true,
      persistence: true
    },
    timestamp: new Date().toISOString()
  })
}
