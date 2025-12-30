/**
 * Cliente HTTP para la API de Kommo
 * Maneja autenticación, envío de mensajes y manejo de errores
 */

import {
  generateKommoHeaders,
  generateMessageId,
  verifyWebhookSignature
} from './signature'
import type {
  KommoConfig,
  KommoSendMessageRequest,
  KommoSendMessageResponse,
  KommoMessageContent,
  KommoSender,
  KommoReceiver,
  KommoApiError
} from './types'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const KOMMO_CHAT_API_BASE = 'https://amojo.kommo.com'

function getConfig(): KommoConfig {
  const config: KommoConfig = {
    integrationId: process.env.KOMMO_INTEGRATION_ID || '',
    secretKey: process.env.KOMMO_SECRET_KEY || '',
    accountSubdomain: process.env.KOMMO_ACCOUNT_SUBDOMAIN || '',
    chatScopeId: process.env.KOMMO_CHAT_SCOPE_ID || '',
    chatChannelSecret: process.env.KOMMO_CHAT_CHANNEL_SECRET || '',
    webhookUrl: process.env.KOMMO_WEBHOOK_URL
  }

  return config
}

/**
 * Valida que la configuración esté completa
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const config = getConfig()
  const missing: string[] = []

  if (!config.integrationId) missing.push('KOMMO_INTEGRATION_ID')
  if (!config.secretKey) missing.push('KOMMO_SECRET_KEY')
  if (!config.accountSubdomain) missing.push('KOMMO_ACCOUNT_SUBDOMAIN')
  if (!config.chatScopeId) missing.push('KOMMO_CHAT_SCOPE_ID')
  if (!config.chatChannelSecret) missing.push('KOMMO_CHAT_CHANNEL_SECRET')

  return {
    valid: missing.length === 0,
    missing
  }
}

// ============================================================================
// CLIENTE PRINCIPAL
// ============================================================================

export class KommoClient {
  private config: KommoConfig
  private botId: string

  constructor(config?: Partial<KommoConfig>) {
    this.config = { ...getConfig(), ...config }
    this.botId = `bot-${this.config.integrationId.slice(0, 8)}`
  }

  /**
   * Envía un mensaje a través de la API de Kommo Chat
   */
  async sendMessage(
    conversationId: string,
    text: string,
    options: {
      receiverPhone?: string
      receiverRefId?: string
      silent?: boolean
    } = {}
  ): Promise<KommoSendMessageResponse> {
    const path = `/v2/origin/custom/${this.config.chatScopeId}`
    const url = `${KOMMO_CHAT_API_BASE}${path}`

    const now = Date.now()
    const msgid = generateMessageId()

    // Construir el payload
    const payload: KommoSendMessageRequest = {
      event_type: 'new_message',
      payload: {
        timestamp: Math.floor(now / 1000),
        msec_timestamp: now,
        msgid,
        conversation_id: conversationId,
        sender: {
          id: this.botId,
          name: 'Neumáticos del Valle Bot'
        },
        receiver: {
          id: options.receiverRefId || 'client',
          phone: options.receiverPhone,
          ref_id: options.receiverRefId
        },
        message: {
          type: 'text',
          text
        },
        silent: options.silent || false
      }
    }

    return this.makeRequest<KommoSendMessageResponse>(url, path, payload)
  }

  /**
   * Envía un mensaje con contenido personalizado (imagen, archivo, etc.)
   */
  async sendRichMessage(
    conversationId: string,
    content: KommoMessageContent,
    receiver: Partial<KommoReceiver> = {}
  ): Promise<KommoSendMessageResponse> {
    const path = `/v2/origin/custom/${this.config.chatScopeId}`
    const url = `${KOMMO_CHAT_API_BASE}${path}`

    const now = Date.now()
    const msgid = generateMessageId()

    const payload: KommoSendMessageRequest = {
      event_type: 'new_message',
      payload: {
        timestamp: Math.floor(now / 1000),
        msec_timestamp: now,
        msgid,
        conversation_id: conversationId,
        sender: {
          id: this.botId,
          name: 'Neumáticos del Valle Bot'
        },
        receiver: {
          id: receiver.id || 'client',
          phone: receiver.phone,
          ref_id: receiver.ref_id
        },
        message: content,
        silent: false
      }
    }

    return this.makeRequest<KommoSendMessageResponse>(url, path, payload)
  }

  /**
   * Edita un mensaje existente
   */
  async editMessage(
    conversationId: string,
    messageId: string,
    newText: string
  ): Promise<KommoSendMessageResponse> {
    const path = `/v2/origin/custom/${this.config.chatScopeId}`
    const url = `${KOMMO_CHAT_API_BASE}${path}`

    const now = Date.now()

    const payload: KommoSendMessageRequest = {
      event_type: 'edit_message',
      payload: {
        timestamp: Math.floor(now / 1000),
        msec_timestamp: now,
        msgid: messageId,
        conversation_id: conversationId,
        message: {
          type: 'text',
          text: newText
        }
      }
    }

    return this.makeRequest<KommoSendMessageResponse>(url, path, payload)
  }

  /**
   * Importa un mensaje histórico (útil para sincronización)
   */
  async importMessage(
    conversationId: string,
    sender: KommoSender,
    content: KommoMessageContent,
    timestamp: number,
    options: { silent?: boolean } = {}
  ): Promise<KommoSendMessageResponse> {
    const path = `/v2/origin/custom/${this.config.chatScopeId}`
    const url = `${KOMMO_CHAT_API_BASE}${path}`

    const msgid = generateMessageId('import')

    const payload: KommoSendMessageRequest = {
      event_type: 'new_message',
      payload: {
        timestamp: Math.floor(timestamp / 1000),
        msec_timestamp: timestamp,
        msgid,
        conversation_id: conversationId,
        sender,
        message: content,
        silent: options.silent ?? true // Por defecto silencioso para imports
      }
    }

    return this.makeRequest<KommoSendMessageResponse>(url, path, payload)
  }

  /**
   * Verifica la firma de un webhook entrante
   */
  verifyWebhook(body: string, signature: string): boolean {
    return verifyWebhookSignature(body, signature, this.config.chatChannelSecret)
  }

  /**
   * Realiza una petición HTTP autenticada a la API de Kommo
   */
  private async makeRequest<T>(
    url: string,
    path: string,
    body: object
  ): Promise<T> {
    const bodyString = JSON.stringify(body)
    const headers = generateKommoHeaders(
      'POST',
      path,
      bodyString,
      this.config.chatChannelSecret
    )

    console.log('[KommoClient] Sending request to:', url)
    console.log('[KommoClient] Headers:', {
      Date: headers.Date,
      'Content-MD5': headers['Content-MD5'],
      'X-Signature': headers['X-Signature'].slice(0, 10) + '...'
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Accept': 'application/json'
        },
        body: bodyString
      })

      const responseText = await response.text()

      if (!response.ok) {
        console.error('[KommoClient] Error response:', responseText)

        let errorData: KommoApiError
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = {
            status: response.status,
            title: 'Unknown error',
            detail: responseText
          }
        }

        throw new KommoApiClientError(
          `Kommo API error: ${errorData.title}`,
          response.status,
          errorData
        )
      }

      console.log('[KommoClient] Success response:', responseText.slice(0, 200))

      return JSON.parse(responseText) as T
    } catch (error) {
      if (error instanceof KommoApiClientError) {
        throw error
      }

      console.error('[KommoClient] Request failed:', error)
      throw new KommoApiClientError(
        `Failed to connect to Kommo API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        undefined
      )
    }
  }
}

// ============================================================================
// ERROR PERSONALIZADO
// ============================================================================

export class KommoApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly apiError?: KommoApiError
  ) {
    super(message)
    this.name = 'KommoApiClientError'
  }

  isRateLimit(): boolean {
    return this.statusCode === 429
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403
  }

  isNotFound(): boolean {
    return this.statusCode === 404
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let clientInstance: KommoClient | null = null

export function getKommoClient(): KommoClient {
  if (!clientInstance) {
    clientInstance = new KommoClient()
  }
  return clientInstance
}

/**
 * Crea un nuevo cliente con configuración personalizada
 */
export function createKommoClient(config: Partial<KommoConfig>): KommoClient {
  return new KommoClient(config)
}
