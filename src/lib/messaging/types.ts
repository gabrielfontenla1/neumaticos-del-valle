/**
 * Multi-provider messaging abstraction types
 * Supports Kommo, Twilio, and Meta (WhatsApp Business API)
 */

export type ProviderType = 'kommo' | 'twilio' | 'meta'

/**
 * Normalized incoming message format
 * All providers must transform their webhook payloads to this structure
 */
export interface IncomingMessage {
  messageId: string
  conversationId: string
  phone: string              // Normalized: +5492622555555
  senderName: string
  text: string
  mediaUrls?: string[]
  timestamp: Date
  provider: ProviderType
  raw: unknown
}

/**
 * Outgoing message format
 * Providers transform this to their specific API format
 */
export interface OutgoingMessage {
  to: string
  text: string
  mediaUrl?: string
}

/**
 * Result of sending a message
 */
export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Conversation context for tracking active conversations
 */
export interface ConversationContext {
  conversationId: string
  provider: ProviderType
  phone: string
  lastUserMessageAt?: Date
}
