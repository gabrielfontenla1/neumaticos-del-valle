/**
 * Repository for WhatsApp conversations and messages
 * Handles persistence in Supabase whatsapp_* tables
 */

import { createClient } from '@supabase/supabase-js'
import type {
  WhatsAppConversation,
  WhatsAppMessage,
  DbConversation,
  DbMessage,
  ConversationStatus,
  ConversationState,
  MessageRole,
  CreateConversationInput,
  CreateMessageInput,
  PauseConversationInput,
  ListConversationsFilters,
  UpdateConversationInput
} from './types'

// Supabase client with service role for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizePhoneNumber(phone: string): string {
  // Remove everything except numbers
  return phone.replace(/\D/g, '')
}

function mapDbToConversation(row: DbConversation): WhatsAppConversation {
  return {
    id: row.id,
    phone: row.phone,
    contact_name: row.contact_name,
    status: row.status as ConversationStatus,
    is_paused: row.is_paused,
    paused_at: row.paused_at ? new Date(row.paused_at) : null,
    paused_by: row.paused_by,
    pause_reason: row.pause_reason,
    message_count: row.message_count,
    last_message_at: row.last_message_at ? new Date(row.last_message_at) : null,
    user_city: row.user_city,
    preferred_branch_id: row.preferred_branch_id,
    conversation_state: (row.conversation_state || 'idle') as ConversationState,
    pending_tire_search: row.pending_tire_search,
    pending_appointment: row.pending_appointment,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  }
}

function mapDbToMessage(row: DbMessage): WhatsAppMessage {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    role: row.role as MessageRole,
    content: row.content,
    sent_by_human: row.sent_by_human,
    sent_by_user_id: row.sent_by_user_id,
    intent: row.intent,
    response_time_ms: row.response_time_ms,
    created_at: new Date(row.created_at)
  }
}

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Find a conversation by phone number
 */
export async function findConversationByPhone(
  phone: string
): Promise<WhatsAppConversation | null> {
  const normalizedPhone = normalizePhoneNumber(phone)

  const { data, error } = await db
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone', normalizedPhone)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('[WhatsAppRepository] Error finding conversation:', error)
    throw error
  }

  return mapDbToConversation(data)
}

/**
 * Find a conversation by ID
 */
export async function findConversationById(
  id: string
): Promise<WhatsAppConversation | null> {
  const { data, error } = await db
    .from('whatsapp_conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[WhatsAppRepository] Error finding conversation by id:', error)
    throw error
  }

  return mapDbToConversation(data)
}

/**
 * Create a new conversation
 */
export async function createConversation(
  input: CreateConversationInput
): Promise<WhatsAppConversation> {
  const normalizedPhone = normalizePhoneNumber(input.phone)

  const { data, error } = await db
    .from('whatsapp_conversations')
    .insert({
      phone: normalizedPhone,
      contact_name: input.contactName || null,
      status: 'active',
      is_paused: false,
      message_count: 0
    })
    .select()
    .single()

  if (error) {
    console.error('[WhatsAppRepository] Error creating conversation:', error)
    throw error
  }

  console.log('[WhatsAppRepository] Created conversation:', data.id, 'phone:', normalizedPhone)
  return mapDbToConversation(data)
}

/**
 * Get or create a conversation by phone number
 */
export async function getOrCreateConversation(
  phone: string,
  contactName?: string
): Promise<WhatsAppConversation> {
  const existing = await findConversationByPhone(phone)
  if (existing) {
    // Update contact name if provided and different
    if (contactName && contactName !== existing.contact_name) {
      await updateConversationContactName(existing.id, contactName)
      existing.contact_name = contactName
    }
    return existing
  }

  return createConversation({ phone, contactName })
}

/**
 * Update conversation contact name
 */
export async function updateConversationContactName(
  conversationId: string,
  contactName: string
): Promise<void> {
  const { error } = await db
    .from('whatsapp_conversations')
    .update({ contact_name: contactName })
    .eq('id', conversationId)

  if (error) {
    console.error('[WhatsAppRepository] Error updating contact name:', error)
    throw error
  }
}

/**
 * Pause a conversation (human takeover)
 */
export async function pauseConversation(
  conversationId: string,
  input: PauseConversationInput
): Promise<void> {
  const { error } = await db
    .from('whatsapp_conversations')
    .update({
      is_paused: true,
      paused_at: new Date().toISOString(),
      paused_by: input.pausedBy,
      pause_reason: input.reason || null
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[WhatsAppRepository] Error pausing conversation:', error)
    throw error
  }

  console.log('[WhatsAppRepository] Paused conversation:', conversationId)
}

/**
 * Resume a conversation (bot takeover)
 */
export async function resumeConversation(
  conversationId: string
): Promise<void> {
  const { error } = await db
    .from('whatsapp_conversations')
    .update({
      is_paused: false,
      paused_at: null,
      paused_by: null,
      pause_reason: null
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[WhatsAppRepository] Error resuming conversation:', error)
    throw error
  }

  console.log('[WhatsAppRepository] Resumed conversation:', conversationId)
}

/**
 * Update conversation fields (for stock location flow)
 */
export async function updateConversation(
  conversationId: string,
  input: UpdateConversationInput
): Promise<WhatsAppConversation> {
  const { data, error } = await db
    .from('whatsapp_conversations')
    .update(input)
    .eq('id', conversationId)
    .select()
    .single()

  if (error) {
    console.error('[WhatsAppRepository] Error updating conversation:', error)
    throw error
  }

  console.log('[WhatsAppRepository] Updated conversation:', conversationId, 'state:', input.conversation_state)
  return mapDbToConversation(data)
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<void> {
  const { error } = await db
    .from('whatsapp_conversations')
    .update({ status })
    .eq('id', conversationId)

  if (error) {
    console.error('[WhatsAppRepository] Error updating status:', error)
    throw error
  }
}

/**
 * List conversations with filters
 */
export async function listConversations(
  filters?: ListConversationsFilters
): Promise<WhatsAppConversation[]> {
  let query = db
    .from('whatsapp_conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.isPaused !== undefined) {
    query = query.eq('is_paused', filters.isPaused)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('[WhatsAppRepository] Error listing conversations:', error)
    throw error
  }

  return (data || []).map(mapDbToConversation)
}

/**
 * List paused conversations (for human attention)
 */
export async function listPausedConversations(
  limit: number = 50
): Promise<WhatsAppConversation[]> {
  return listConversations({ isPaused: true, limit })
}

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Add a message to a conversation
 */
export async function addMessage(
  input: CreateMessageInput
): Promise<WhatsAppMessage> {
  const { data, error } = await db
    .from('whatsapp_messages')
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      sent_by_human: input.sentByHuman || false,
      sent_by_user_id: input.sentByUserId || null,
      intent: input.intent || null,
      response_time_ms: input.responseTimeMs || null
    })
    .select()
    .single()

  if (error) {
    console.error('[WhatsAppRepository] Error adding message:', error)
    throw error
  }

  return mapDbToMessage(data)
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<WhatsAppMessage[]> {
  const { data, error } = await db
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[WhatsAppRepository] Error getting messages:', error)
    throw error
  }

  // Reverse for chronological order
  return (data || []).reverse().map(mapDbToMessage)
}

/**
 * Get message history formatted for LLM
 */
export async function getMessageHistoryForLLM(
  conversationId: string,
  limit: number = 10
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const messages = await getConversationMessages(conversationId, limit)

  return messages.map(m => ({
    role: m.role,
    content: m.content
  }))
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get conversation statistics
 */
export async function getConversationStats(
  days: number = 7
): Promise<{
  totalConversations: number
  activeConversations: number
  pausedConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
}> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: convData, error: convError } = await db
    .from('whatsapp_conversations')
    .select('id, status, is_paused, message_count')
    .gte('created_at', since.toISOString())

  if (convError) {
    console.error('[WhatsAppRepository] Error getting stats:', convError)
    throw convError
  }

  const conversations = convData || []
  const totalConversations = conversations.length
  const activeConversations = conversations.filter(c => c.status === 'active' && !c.is_paused).length
  const pausedConversations = conversations.filter(c => c.is_paused).length
  const totalMessages = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0)
  const avgMessagesPerConversation = totalConversations > 0
    ? totalMessages / totalConversations
    : 0

  return {
    totalConversations,
    activeConversations,
    pausedConversations,
    totalMessages,
    avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10
  }
}
