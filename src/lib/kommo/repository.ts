/**
 * Repositorio para conversaciones y mensajes de Kommo
 * Maneja la persistencia en Supabase
 *
 * NOTA: Las tablas kommo_conversations y kommo_messages deben crearse
 * ejecutando la migración: supabase/migrations/20251229_create_kommo_tables.sql
 * Después de crear las tablas, regenerar tipos: npx supabase gen types typescript
 */

import { createClient } from '@supabase/supabase-js'
import type {
  Conversation,
  Message,
  ConversationStatus,
  MessageRole,
  MessageIntent
} from './types'

// Cliente Supabase sin tipos estrictos para tablas nuevas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// TIPOS DE BASE DE DATOS
// ============================================================================

interface DbConversation {
  id: string
  kommo_chat_id: string
  kommo_contact_id: string | null
  kommo_lead_id: string | null
  phone: string | null
  contact_name: string | null
  contact_email: string | null
  status: ConversationStatus
  message_count: number
  bot_message_count: number
  user_message_count: number
  last_message_at: string | null
  last_bot_response_at: string | null
  escalated_at: string | null
  resolved_at: string | null
  escalation_reason: string | null
  assigned_to: string | null
  channel: string
  metadata: Record<string, unknown>
  tags: string[]
  created_at: string
  updated_at: string
}

interface DbMessage {
  id: string
  conversation_id: string
  kommo_message_id: string | null
  role: MessageRole
  content: string
  content_type: string
  media_url: string | null
  intent: MessageIntent | null
  sentiment: string | null
  confidence_score: number | null
  products_referenced: unknown[]
  ai_model: string | null
  tokens_used: number | null
  response_time_ms: number | null
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================================================
// CONVERSACIONES
// ============================================================================

/**
 * Busca una conversación por ID de chat de Kommo
 */
export async function findConversationByChatId(
  kommoChatId: string
): Promise<Conversation | null> {
  const { data, error } = await db
    .from('kommo_conversations')
    .select('*')
    .eq('kommo_chat_id', kommoChatId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No encontrado
    }
    console.error('[KommoRepository] Error finding conversation:', error)
    throw error
  }

  return mapDbToConversation(data)
}

/**
 * Busca una conversación por número de teléfono
 */
export async function findConversationByPhone(
  phone: string
): Promise<Conversation | null> {
  // Normalizar número de teléfono
  const normalizedPhone = normalizePhoneNumber(phone)

  const { data, error } = await db
    .from('kommo_conversations')
    .select('*')
    .eq('phone', normalizedPhone)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[KommoRepository] Error finding conversation by phone:', error)
    throw error
  }

  return mapDbToConversation(data)
}

/**
 * Crea una nueva conversación
 */
export async function createConversation(input: {
  kommoChatId: string
  kommoContactId?: string
  phone?: string
  contactName?: string
  channel?: string
  metadata?: Record<string, unknown>
}): Promise<Conversation> {
  const { data, error } = await db
    .from('kommo_conversations')
    .insert({
      kommo_chat_id: input.kommoChatId,
      kommo_contact_id: input.kommoContactId || null,
      phone: input.phone ? normalizePhoneNumber(input.phone) : null,
      contact_name: input.contactName || null,
      channel: input.channel || 'whatsapp',
      status: 'active',
      metadata: input.metadata || {}
    })
    .select()
    .single()

  if (error) {
    console.error('[KommoRepository] Error creating conversation:', error)
    throw error
  }

  console.log('[KommoRepository] Created conversation:', data.id)
  return mapDbToConversation(data)
}

/**
 * Obtiene o crea una conversación
 */
export async function getOrCreateConversation(input: {
  kommoChatId: string
  kommoContactId?: string
  phone?: string
  contactName?: string
  channel?: string
}): Promise<Conversation> {
  // Intentar encontrar por chat ID
  const existing = await findConversationByChatId(input.kommoChatId)
  if (existing) {
    return existing
  }

  // Si no existe, crear nueva
  return createConversation(input)
}

/**
 * Actualiza el estado de una conversación
 */
export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
  reason?: string
): Promise<void> {
  const updates: Partial<DbConversation> = {
    status
  }

  if (status === 'escalated') {
    updates.escalated_at = new Date().toISOString()
    updates.escalation_reason = reason || null
  } else if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await db
    .from('kommo_conversations')
    .update(updates)
    .eq('id', conversationId)

  if (error) {
    console.error('[KommoRepository] Error updating conversation status:', error)
    throw error
  }
}

/**
 * Lista conversaciones activas
 */
export async function listActiveConversations(
  limit: number = 50
): Promise<Conversation[]> {
  const { data, error } = await db
    .from('kommo_conversations')
    .select('*')
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[KommoRepository] Error listing conversations:', error)
    throw error
  }

  return (data || []).map(mapDbToConversation)
}

/**
 * Lista conversaciones escaladas (para atención humana)
 */
export async function listEscalatedConversations(
  limit: number = 50
): Promise<Conversation[]> {
  const { data, error } = await db
    .from('kommo_conversations')
    .select('*')
    .eq('status', 'escalated')
    .order('escalated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[KommoRepository] Error listing escalated conversations:', error)
    throw error
  }

  return (data || []).map(mapDbToConversation)
}

// ============================================================================
// MENSAJES
// ============================================================================

/**
 * Agrega un mensaje a una conversación
 */
export async function addMessage(input: {
  conversationId: string
  kommoMessageId?: string
  role: MessageRole
  content: string
  contentType?: string
  mediaUrl?: string
  intent?: MessageIntent
  sentiment?: 'positive' | 'neutral' | 'negative'
  confidenceScore?: number
  productsReferenced?: string[]
  aiModel?: string
  tokensUsed?: number
  responseTimeMs?: number
  metadata?: Record<string, unknown>
}): Promise<Message> {
  const { data, error } = await db
    .from('kommo_messages')
    .insert({
      conversation_id: input.conversationId,
      kommo_message_id: input.kommoMessageId || null,
      role: input.role,
      content: input.content,
      content_type: input.contentType || 'text',
      media_url: input.mediaUrl || null,
      intent: input.intent || null,
      sentiment: input.sentiment || null,
      confidence_score: input.confidenceScore || null,
      products_referenced: input.productsReferenced || [],
      ai_model: input.aiModel || null,
      tokens_used: input.tokensUsed || null,
      response_time_ms: input.responseTimeMs || null,
      metadata: input.metadata || {}
    })
    .select()
    .single()

  if (error) {
    console.error('[KommoRepository] Error adding message:', error)
    throw error
  }

  return mapDbToMessage(data)
}

/**
 * Obtiene los últimos N mensajes de una conversación
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 10
): Promise<Message[]> {
  const { data, error } = await db
    .from('kommo_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[KommoRepository] Error getting messages:', error)
    throw error
  }

  // Revertir para orden cronológico
  return (data || []).reverse().map(mapDbToMessage)
}

/**
 * Obtiene el historial de mensajes formateado para el LLM
 */
export async function getMessageHistoryForLLM(
  conversationId: string,
  limit: number = 10
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const messages = await getConversationMessages(conversationId, limit)

  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Obtiene estadísticas de conversaciones
 */
export async function getConversationStats(
  days: number = 7
): Promise<{
  totalConversations: number
  activeConversations: number
  escalatedConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
  avgResponseTimeMs: number
}> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: convData, error: convError } = await db
    .from('kommo_conversations')
    .select('id, status, message_count')
    .gte('created_at', since.toISOString())

  if (convError) {
    console.error('[KommoRepository] Error getting stats:', convError)
    throw convError
  }

  const { data: msgData, error: msgError } = await db
    .from('kommo_messages')
    .select('response_time_ms')
    .eq('role', 'assistant')
    .gte('created_at', since.toISOString())
    .not('response_time_ms', 'is', null)

  if (msgError) {
    console.error('[KommoRepository] Error getting message stats:', msgError)
  }

  const conversations = convData || []
  const totalConversations = conversations.length
  const activeConversations = conversations.filter(c => c.status === 'active').length
  const escalatedConversations = conversations.filter(c => c.status === 'escalated').length
  const totalMessages = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0)
  const avgMessagesPerConversation = totalConversations > 0
    ? totalMessages / totalConversations
    : 0

  const responseTimes = (msgData || [])
    .map(m => m.response_time_ms)
    .filter((t): t is number => t !== null && t !== undefined)
  const avgResponseTimeMs = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0

  return {
    totalConversations,
    activeConversations,
    escalatedConversations,
    totalMessages,
    avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10,
    avgResponseTimeMs: Math.round(avgResponseTimeMs)
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizePhoneNumber(phone: string): string {
  // Remover todo excepto números
  return phone.replace(/\D/g, '')
}

function mapDbToConversation(db: DbConversation): Conversation {
  return {
    id: db.id,
    kommo_chat_id: db.kommo_chat_id,
    kommo_contact_id: db.kommo_contact_id || undefined,
    phone: db.phone || undefined,
    contact_name: db.contact_name || undefined,
    status: db.status,
    message_count: db.message_count,
    last_message_at: db.last_message_at ? new Date(db.last_message_at) : undefined,
    escalated_at: db.escalated_at ? new Date(db.escalated_at) : undefined,
    escalation_reason: db.escalation_reason || undefined,
    metadata: db.metadata,
    created_at: new Date(db.created_at),
    updated_at: new Date(db.updated_at)
  }
}

function mapDbToMessage(db: DbMessage): Message {
  return {
    id: db.id,
    conversation_id: db.conversation_id,
    kommo_message_id: db.kommo_message_id || undefined,
    role: db.role,
    content: db.content,
    intent: db.intent || undefined,
    products_referenced: db.products_referenced as string[] | undefined,
    ai_model: db.ai_model || undefined,
    tokens_used: db.tokens_used || undefined,
    response_time_ms: db.response_time_ms || undefined,
    created_at: new Date(db.created_at)
  }
}
