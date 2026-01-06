/**
 * WhatsApp 24-Hour Window Utilities
 *
 * WhatsApp Business API enforces a 24-hour messaging window.
 * After 24 hours of the last user message, only template messages can be sent.
 */

import { createClient } from '@supabase/supabase-js'
import type { WhatsAppWindowStatus } from './types'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * Check if we can send a proactive message within the 24-hour window
 */
export async function checkWhatsApp24HourWindow(
  conversationId: string
): Promise<WhatsAppWindowStatus> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('kommo_conversations')
    .select('last_user_message_at, provider')
    .eq('id', conversationId)
    .single()

  if (error || !data) {
    console.error('Error fetching conversation:', error)
    return {
      canSendProactive: false,
      lastUserMessageAt: null,
      windowExpiresAt: null,
      minutesRemaining: null
    }
  }

  // Only WhatsApp providers need window checking
  if (data.provider !== 'twilio' && data.provider !== 'meta') {
    return {
      canSendProactive: true, // No window restriction for non-WhatsApp
      lastUserMessageAt: null,
      windowExpiresAt: null,
      minutesRemaining: null
    }
  }

  // If user has never messaged, can't send proactive
  if (!data.last_user_message_at) {
    return {
      canSendProactive: false,
      lastUserMessageAt: null,
      windowExpiresAt: null,
      minutesRemaining: null
    }
  }

  const lastUserMessageAt = new Date(data.last_user_message_at)
  const windowExpiresAt = new Date(lastUserMessageAt.getTime() + TWENTY_FOUR_HOURS_MS)
  const now = new Date()
  const msRemaining = windowExpiresAt.getTime() - now.getTime()
  const minutesRemaining = Math.max(0, Math.floor(msRemaining / (60 * 1000)))

  return {
    canSendProactive: msRemaining > 0,
    lastUserMessageAt,
    windowExpiresAt,
    minutesRemaining
  }
}

/**
 * Get window status for multiple conversations
 */
export async function getBulkWindowStatus(
  conversationIds: string[]
): Promise<Map<string, WhatsAppWindowStatus>> {
  const results = new Map<string, WhatsAppWindowStatus>()

  await Promise.all(
    conversationIds.map(async (id) => {
      const status = await checkWhatsApp24HourWindow(id)
      results.set(id, status)
    })
  )

  return results
}

/**
 * Format window status for user display
 */
export function formatWindowStatus(status: WhatsAppWindowStatus): string {
  if (!status.canSendProactive) {
    if (!status.lastUserMessageAt) {
      return 'User has not sent a message yet. Cannot send proactive messages.'
    }
    return 'Message window expired. Can only send template messages.'
  }

  const hours = Math.floor(status.minutesRemaining! / 60)
  const minutes = status.minutesRemaining! % 60

  if (hours > 0) {
    return `Window active for ${hours}h ${minutes}m`
  }
  return `Window active for ${minutes}m`
}

/**
 * Check if conversation is within window (simplified)
 */
export function isWithin24HourWindow(lastUserMessageAt: Date | null): boolean {
  if (!lastUserMessageAt) return false

  const now = Date.now()
  const lastMessageTime = new Date(lastUserMessageAt).getTime()
  const timeSinceLastMessage = now - lastMessageTime

  return timeSinceLastMessage < TWENTY_FOUR_HOURS_MS
}

/**
 * Get conversations that need template messages
 */
export async function getConversationsNeedingTemplates(
  provider: 'twilio' | 'meta' = 'twilio'
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const twentyFourHoursAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_MS)

  const { data, error } = await supabase
    .from('kommo_conversations')
    .select('id, phone, contact_name, last_user_message_at')
    .eq('provider', provider)
    .eq('status', 'active')
    .lt('last_user_message_at', twentyFourHoursAgo.toISOString())

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data || []
}

/**
 * Monitor window expiration and trigger alerts
 */
export async function monitorWindowExpirations(
  onExpiringSoon?: (conversationId: string, minutesRemaining: number) => void,
  thresholdMinutes: number = 60
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('kommo_conversations')
    .select('id, last_user_message_at')
    .in('provider', ['twilio', 'meta'])
    .eq('status', 'active')
    .not('last_user_message_at', 'is', null)

  if (error || !data) return

  for (const conversation of data) {
    const status = await checkWhatsApp24HourWindow(conversation.id)

    if (
      status.canSendProactive &&
      status.minutesRemaining !== null &&
      status.minutesRemaining <= thresholdMinutes &&
      onExpiringSoon
    ) {
      onExpiringSoon(conversation.id, status.minutesRemaining)
    }
  }
}
