// ===========================================
// Message Handler - Forward incoming messages to Next.js webhook
// ===========================================

import { logger } from './utils/logger'
import { jidToPhone } from './utils/phone-format'

interface IncomingMessage {
  instanceId: string
  from: string
  body: string
  messageId: string
  pushName?: string
  isGroup: boolean
  timestamp: number
}

interface WebhookPayload {
  instance_id: string
  event: string
  data: {
    from: string
    body: string
    message_id: string
    push_name?: string
    is_group: boolean
    phone?: string
  }
  timestamp: string
}

const WEBHOOK_URL = process.env.NEXT_APP_WEBHOOK_URL || 'http://localhost:6001/api/baileys/webhook'

/**
 * Process incoming message and forward to Next.js webhook
 */
export async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const { instanceId, from, body, messageId, pushName, isGroup } = message

  // Skip group messages
  if (isGroup) {
    logger.debug({ instanceId, from }, 'Skipping group message')
    return
  }

  // Skip empty messages
  if (!body || body.trim() === '') {
    logger.debug({ instanceId, from }, 'Skipping empty message')
    return
  }

  const phone = jidToPhone(from)

  logger.info({ instanceId, from: phone, messageId }, 'Processing incoming message')

  const payload: WebhookPayload = {
    instance_id: instanceId,
    event: 'message_received',
    data: {
      from,
      body,
      message_id: messageId,
      push_name: pushName,
      is_group: isGroup,
      phone,
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Baileys-API-Key': process.env.BAILEYS_API_KEY || '',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      logger.error(
        { instanceId, status: response.status, body: text },
        'Webhook request failed'
      )
    } else {
      logger.debug({ instanceId, messageId }, 'Message forwarded to webhook')
    }
  } catch (error) {
    logger.error({ error, instanceId }, 'Error forwarding message to webhook')
  }
}

/**
 * Extract text content from a Baileys message
 */
export function extractMessageContent(message: unknown): string | null {
  const msg = message as Record<string, unknown>

  if (msg.conversation) return msg.conversation as string

  const extendedText = msg.extendedTextMessage as Record<string, unknown> | undefined
  if (extendedText?.text) return extendedText.text as string

  const imageMessage = msg.imageMessage as Record<string, unknown> | undefined
  if (imageMessage?.caption) return imageMessage.caption as string

  const videoMessage = msg.videoMessage as Record<string, unknown> | undefined
  if (videoMessage?.caption) return videoMessage.caption as string

  const documentMessage = msg.documentMessage as Record<string, unknown> | undefined
  if (documentMessage?.caption) return documentMessage.caption as string

  const buttonsResponse = msg.buttonsResponseMessage as Record<string, unknown> | undefined
  if (buttonsResponse?.selectedButtonId) return buttonsResponse.selectedButtonId as string

  const listResponse = msg.listResponseMessage as Record<string, unknown> | undefined
  if (listResponse?.singleSelectReply) {
    const reply = listResponse.singleSelectReply as Record<string, unknown>
    return reply.selectedRowId as string
  }

  return null
}

/**
 * Notify webhook about connection events
 */
export async function notifyConnectionEvent(
  instanceId: string,
  event: 'connected' | 'disconnected' | 'qr_generated' | 'error',
  data?: Record<string, unknown>
): Promise<void> {
  const payload = {
    instance_id: instanceId,
    event,
    data: data || {},
    timestamp: new Date().toISOString(),
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Baileys-API-Key': process.env.BAILEYS_API_KEY || '',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    logger.error({ error, instanceId, event }, 'Error notifying connection event')
  }
}
