import { NextRequest, NextResponse } from 'next/server'
import { listConversations, getConversationStats, getOrCreateConversation } from '@/lib/whatsapp/repository'
import { getActiveInstance } from '@/lib/baileys/service'
import type { ConversationStatus, WhatsAppSource } from '@/lib/whatsapp/types'

/**
 * GET /api/admin/whatsapp/conversations
 * List WhatsApp conversations with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query params
    const status = searchParams.get('status') as ConversationStatus | null
    const isPausedStr = searchParams.get('is_paused')
    const limitStr = searchParams.get('limit')
    const offsetStr = searchParams.get('offset')
    const includeStats = searchParams.get('include_stats') === 'true'

    const filters = {
      status: status || undefined,
      isPaused: isPausedStr ? isPausedStr === 'true' : undefined,
      limit: limitStr ? parseInt(limitStr, 10) : 50,
      offset: offsetStr ? parseInt(offsetStr, 10) : undefined
    }

    // Get conversations
    const conversations = await listConversations(filters)

    // Optionally get stats
    let stats = null
    if (includeStats) {
      stats = await getConversationStats(7)
    }

    return NextResponse.json({
      success: true,
      data: conversations,
      stats,
      count: conversations.length
    })

  } catch (error) {
    console.error('[API] Error listing conversations:', error)
    return NextResponse.json(
      { success: false, error: 'Error listing conversations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/whatsapp/conversations
 * Create or find a conversation by phone number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, contactName, source } = body as {
      phone?: string
      contactName?: string
      source?: WhatsAppSource
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: 'Número de teléfono inválido' },
        { status: 400 }
      )
    }

    // If source is baileys, look up the active connected instance
    let baileysInstanceId: string | undefined
    if (source === 'baileys') {
      const activeInstance = await getActiveInstance()
      if (!activeInstance) {
        return NextResponse.json(
          { success: false, error: 'No hay ninguna instancia Baileys conectada' },
          { status: 400 }
        )
      }
      baileysInstanceId = activeInstance.id
    }

    const conversation = await getOrCreateConversation(
      phone.trim(),
      contactName || undefined,
      source,
      baileysInstanceId
    )

    return NextResponse.json({
      success: true,
      data: conversation
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error creating conversation:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear la conversación' },
      { status: 500 }
    )
  }
}
