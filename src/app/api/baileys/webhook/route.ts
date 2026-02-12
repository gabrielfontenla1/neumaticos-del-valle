/**
 * Baileys WhatsApp Webhook
 * Receives messages from Baileys service and delegates to shared processor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processIncomingMessage } from '@/lib/whatsapp/processor'
import { sendMessage } from '@/lib/baileys/client'
import type { BaileysWebhookPayload } from '@/types/baileys'

const BAILEYS_API_KEY = process.env.BAILEYS_SERVICE_API_KEY || ''

async function sendBaileysResponse(instanceId: string, to: string, body: string, originalJid?: string): Promise<void> {
  // Never pass LID JIDs for sending — use phone number only
  const safeJid = (originalJid && !originalJid.endsWith('@lid')) ? originalJid : undefined
  const result = await sendMessage(instanceId, to, body, safeJid)
  if (!result.success) {
    console.error('[Baileys Webhook] Send failed:', result.error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-baileys-api-key') || ''
    if (BAILEYS_API_KEY && apiKey !== BAILEYS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: BaileysWebhookPayload = await request.json()
    const { instance_id, event, data } = payload

    // Handle message received
    if (event === 'message_received' && data.body) {
      // Prefer resolved_phone (real phone from senderPn), fall back to data.phone
      const rawPhone = data.resolved_phone || (data.phone || '').replace(/^\+/, '')
      if (!rawPhone) {
        console.error(`[Baileys Webhook] No phone number available in payload`, { from: data.from })
        return NextResponse.json({ error: 'No phone number in payload' }, { status: 400 })
      }
      const phoneNumber = rawPhone.replace(/^\+/, '')
      const originalJid = data.from

      processIncomingMessage(
        {
          phoneNumber,
          profileName: data.push_name || 'Cliente',
          messageText: data.body,
        },
        {
          source: 'baileys',
          sendResponse: (to: string, text: string) => sendBaileysResponse(instance_id, to, text, originalJid),
          baileysInstanceId: instance_id,
          baileysRemoteJid: originalJid,
        }
      )

      return NextResponse.json({ success: true, event: 'message_queued' })
    }

    // Handle connection events (log only)
    if (['connected', 'disconnected', 'qr_generated', 'error'].includes(event)) {
      return NextResponse.json({ success: true, event })
    }

    return NextResponse.json({ success: true, event: 'ignored' })

  } catch (error) {
    console.error('[Baileys Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Baileys WhatsApp Webhook',
    timestamp: new Date().toISOString()
  })
}
