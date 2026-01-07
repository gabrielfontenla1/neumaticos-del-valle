/**
 * Messaging provider interface and utilities
 * All messaging providers (Twilio, Meta) must implement this interface
 */

import type { IncomingMessage, OutgoingMessage, SendResult, ProviderType } from './types'

/**
 * Core interface that all messaging providers must implement
 */
export interface MessagingProvider {
  readonly name: ProviderType

  /**
   * Send a text message (and optionally media) to a recipient
   */
  sendMessage(message: OutgoingMessage): Promise<SendResult>

  /**
   * Send a template message with variables
   * Templates are used for initiating conversations outside the 24-hour window
   */
  sendTemplate(
    to: string,
    templateId: string,
    vars: Record<string, string>
  ): Promise<SendResult>

  /**
   * Parse incoming webhook request into normalized message format
   * Returns null if the webhook is not a message event
   */
  parseWebhook(request: Request): Promise<IncomingMessage | null>

  /**
   * Validate webhook signature to ensure request authenticity
   */
  validateSignature(request: Request): Promise<boolean>

  /**
   * Format phone number according to provider requirements
   */
  formatPhone(phone: string): string
}

/**
 * Normalize phone number to international format
 * Removes whatsapp: prefix and ensures + prefix
 *
 * @example
 * normalizePhone('whatsapp:+5492622555555') // '+5492622555555'
 * normalizePhone('5492622555555') // '+5492622555555'
 * normalizePhone('+5492622555555') // '+5492622555555'
 */
export function normalizePhone(phone: string): string {
  // Remove whatsapp: prefix and normalize
  let cleaned = phone.replace(/^whatsapp:/, '').replace(/\D/g, '')
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  return cleaned
}

/**
 * Check if a message is within the 24-hour window for free-form replies
 * Outside this window, providers typically require template messages
 *
 * @param lastMessageAt - Timestamp of last user message
 * @returns true if within 24 hours, false otherwise
 */
export function isWithin24Hours(lastMessageAt: Date | null | undefined): boolean {
  if (!lastMessageAt) return false
  const hours = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60)
  return hours <= 24
}
