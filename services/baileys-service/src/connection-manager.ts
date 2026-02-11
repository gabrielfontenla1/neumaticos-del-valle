// ===========================================
// Baileys Connection Manager
// ===========================================

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import * as QRCode from 'qrcode'
import * as path from 'path'
import * as fs from 'fs'
import { logger, createInstanceLogger } from './utils/logger'
import {
  getInstance,
  updateInstanceStatus,
  logSessionEvent,
} from './session-store'
import {
  handleIncomingMessage,
  extractMessageContent,
  notifyConnectionEvent,
} from './message-handler'
import { jidToNumber } from './utils/phone-format'

// Store active connections
const connections = new Map<string, WASocket>()
const reconnectAttempts = new Map<string, number>()

const MAX_RECONNECT_ATTEMPTS = 5
const QR_EXPIRY_MS = 60000

// Sessions directory
const SESSIONS_DIR = path.join(process.cwd(), 'sessions')

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

function getSessionPath(instanceId: string): string {
  return path.join(SESSIONS_DIR, instanceId)
}

// ===========================================
// Connection Management
// ===========================================

export async function connectInstance(instanceId: string): Promise<void> {
  const log = createInstanceLogger(instanceId)

  if (connections.has(instanceId)) {
    const existing = connections.get(instanceId)
    if (existing?.user) {
      log.info('Instance already connected')
      return
    }
  }

  const instance = await getInstance(instanceId)
  if (!instance) {
    throw new Error(`Instance ${instanceId} not found`)
  }

  if (!instance.is_active) {
    throw new Error(`Instance ${instanceId} is not active`)
  }

  log.info({ name: instance.name }, 'Starting connection')

  try {
    await updateInstanceStatus(instanceId, 'connecting')

    const { version } = await fetchLatestBaileysVersion()
    log.debug({ version }, 'Using Baileys version')

    const sessionPath = getSessionPath(instanceId)
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: log as unknown as Parameters<typeof makeWASocket>[0]['logger'],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    })

    connections.set(instanceId, socket)
    reconnectAttempts.set(instanceId, 0)

    // Connection update handler
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        log.info('QR code generated')
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          })

          const expiresAt = new Date(Date.now() + QR_EXPIRY_MS).toISOString()

          await updateInstanceStatus(instanceId, 'connecting', {
            qr_code: qrCodeDataUrl,
            qr_expires_at: expiresAt,
          })

          await logSessionEvent(instanceId, 'qr_generated')
          await notifyConnectionEvent(instanceId, 'qr_generated', { qr_code: qrCodeDataUrl })
        } catch (error) {
          log.error({ error }, 'Error generating QR code')
        }
      }

      if (connection === 'open') {
        log.info('Connection opened')

        const phoneNumber = socket.user?.id
          ? jidToNumber(socket.user.id)
          : null

        await updateInstanceStatus(instanceId, 'connected', {
          phone_number: phoneNumber,
          qr_code: null,
          qr_expires_at: null,
          error_message: null,
          last_connected_at: new Date().toISOString(),
        })

        await logSessionEvent(instanceId, 'connected', { phone_number: phoneNumber })
        await notifyConnectionEvent(instanceId, 'connected', { phone_number: phoneNumber })
        reconnectAttempts.set(instanceId, 0)
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        log.warn({ statusCode, shouldReconnect }, 'Connection closed')

        if (statusCode === DisconnectReason.loggedOut) {
          const sessionPath = getSessionPath(instanceId)
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true })
            log.info('Session files cleared after logout')
          }
          await updateInstanceStatus(instanceId, 'disconnected', {
            qr_code: null,
            qr_expires_at: null,
            phone_number: null,
          })
          await logSessionEvent(instanceId, 'logout')
          await notifyConnectionEvent(instanceId, 'disconnected', { reason: 'logged_out' })
          connections.delete(instanceId)
        } else if (shouldReconnect) {
          const attempts = reconnectAttempts.get(instanceId) || 0

          if (attempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts.set(instanceId, attempts + 1)

            await updateInstanceStatus(instanceId, 'reconnecting', {
              error_message: `Reconnecting... (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
            })

            await logSessionEvent(instanceId, 'reconnecting', { attempt: attempts + 1 })

            const delay = Math.min(1000 * Math.pow(2, attempts), 30000)
            setTimeout(() => connectInstance(instanceId), delay)
          } else {
            await updateInstanceStatus(instanceId, 'error', {
              error_message: 'Max reconnection attempts reached',
            })

            await logSessionEvent(instanceId, 'error', {
              message: 'Max reconnection attempts reached',
            })

            await notifyConnectionEvent(instanceId, 'error', {
              message: 'Max reconnection attempts reached',
            })

            connections.delete(instanceId)
          }
        }
      }
    })

    socket.ev.on('creds.update', saveCreds)

    // Message handler
    socket.ev.on('messages.upsert', async (upsert) => {
      for (const message of upsert.messages) {
        if (upsert.type !== 'notify') continue
        if (message.key.fromMe) continue

        const from = message.key.remoteJid
        if (!from) continue

        const content = extractMessageContent(message.message)
        if (!content) continue

        await handleIncomingMessage({
          instanceId,
          from,
          body: content,
          messageId: message.key.id || '',
          pushName: message.pushName || undefined,
          isGroup: from.endsWith('@g.us'),
          timestamp: message.messageTimestamp as number,
        })

        await logSessionEvent(instanceId, 'message_received', {
          from,
          message_id: message.key.id,
        })
      }
    })

  } catch (error) {
    log.error({ error }, 'Error connecting instance')

    await updateInstanceStatus(instanceId, 'error', {
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })

    await logSessionEvent(instanceId, 'error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    throw error
  }
}

export async function disconnectInstance(instanceId: string): Promise<void> {
  const log = createInstanceLogger(instanceId)
  const socket = connections.get(instanceId)

  if (socket) {
    log.info('Disconnecting instance')

    try {
      await socket.logout()
    } catch (error) {
      log.warn({ error }, 'Error during logout')
    }
    connections.delete(instanceId)

    const sessionPath = getSessionPath(instanceId)
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true })
      log.info('Session files cleared')
    }
  }

  await updateInstanceStatus(instanceId, 'disconnected')
}

export async function sendMessage(
  instanceId: string,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const log = createInstanceLogger(instanceId)
  const socket = connections.get(instanceId)

  if (!socket) {
    return { success: false, error: 'Instance not connected' }
  }

  try {
    const result = await socket.sendMessage(to, { text: message })

    await logSessionEvent(instanceId, 'message_sent', {
      to,
      message_id: result?.key?.id,
    })

    log.debug({ to, messageId: result?.key?.id }, 'Message sent')
    return { success: true, messageId: result?.key?.id ?? undefined }
  } catch (error) {
    log.error({ error, to }, 'Error sending message')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function getConnectionStatus(instanceId: string): {
  connected: boolean
  user?: string
} {
  const socket = connections.get(instanceId)
  return {
    connected: !!socket?.user,
    user: socket?.user?.id,
  }
}

export function getActiveConnections(): string[] {
  return Array.from(connections.keys())
}
