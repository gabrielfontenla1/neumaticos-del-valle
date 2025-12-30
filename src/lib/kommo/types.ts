/**
 * Tipos TypeScript para la integración con Kommo CRM
 * Incluye tipos para webhooks, mensajes, y API responses
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

export interface KommoConfig {
  integrationId: string
  secretKey: string
  accountSubdomain: string
  chatScopeId: string
  chatChannelSecret: string
  webhookUrl?: string
}

// ============================================================================
// ENTIDADES PRINCIPALES
// ============================================================================

export interface KommoLead {
  id: number
  name: string
  price?: number
  responsible_user_id?: number
  status_id?: number
  pipeline_id?: number
  created_at?: number
  updated_at?: number
  account_id?: number
  custom_fields_values?: KommoCustomField[]
}

export interface KommoContact {
  id: number
  name?: string
  first_name?: string
  last_name?: string
  custom_fields_values?: KommoCustomField[]
  created_at?: number
  updated_at?: number
}

export interface KommoCustomField {
  field_id: number
  field_name?: string
  field_code?: string
  field_type?: string
  values: Array<{
    value: string
    enum_id?: number
    enum_code?: string
  }>
}

// ============================================================================
// WEBHOOK PAYLOADS
// ============================================================================

export interface KommoWebhookPayload {
  leads?: {
    status?: KommoLead[]
    add?: KommoLead[]
    update?: KommoLead[]
    delete?: Array<{ id: number }>
  }
  contacts?: {
    add?: KommoContact[]
    update?: KommoContact[]
    delete?: Array<{ id: number }>
  }
  account?: {
    subdomain: string
    id: string
    _links?: {
      self: string
    }
  }
  message?: {
    add?: KommoIncomingMessage[]
  }
  notes?: {
    add?: KommoNote[]
    update?: KommoNote[]
  }
  chat?: {
    message?: KommoChatMessage[]
  }
}

export interface KommoIncomingMessage {
  id: string
  chat_id: string
  contact_id: number
  text: string
  created_at: number
  origin: 'whatsapp' | 'instagram' | 'telegram' | 'facebook' | 'viber' | string
  author?: {
    id: number
    name: string
    type: 'contact' | 'user'
  }
  media?: KommoMedia[]
}

export interface KommoNote {
  id: number
  entity_id: number
  created_at: number
  updated_at: number
  responsible_user_id: number
  group_id?: number
  note_type: string
  params?: {
    text?: string
    service?: 'whatsapp' | 'instagram' | string
    phone?: string
  }
}

export interface KommoChatMessage {
  timestamp: number
  msec_timestamp?: number
  msgid: string
  conversation_id: string
  sender: {
    id: string
    name: string
    phone?: string
    email?: string
    avatar?: string
    profile_link?: string
  }
  message: {
    type: 'text' | 'picture' | 'file' | 'voice' | 'video' | 'sticker' | 'contact' | 'location'
    text?: string
    caption?: string
    media?: string
    file_name?: string
    file_size?: number
  }
  receiver?: {
    id: string
    phone?: string
  }
}

export interface KommoMedia {
  type: 'picture' | 'file' | 'voice' | 'video' | 'sticker'
  url: string
  name?: string
  size?: number
}

// ============================================================================
// API REQUESTS
// ============================================================================

export interface KommoSendMessageRequest {
  event_type: 'new_message' | 'edit_message'
  payload: {
    timestamp: number
    msec_timestamp: number
    msgid: string
    conversation_id: string
    sender?: KommoSender
    receiver?: KommoReceiver
    message: KommoMessageContent
    silent?: boolean
  }
}

export interface KommoSender {
  id: string
  name: string
  avatar?: string
  profile?: {
    phone?: string
    email?: string
  }
  profile_link?: string
}

export interface KommoReceiver {
  id: string
  phone?: string
  ref_id?: string // ID del manager o bot en Kommo
}

export interface KommoMessageContent {
  type: 'text' | 'picture' | 'file' | 'voice' | 'video' | 'sticker' | 'contact' | 'location'
  text?: string
  caption?: string
  media?: string
  file_name?: string
  file_size?: number
  contact?: {
    name: string
    phone: string
  }
  location?: {
    lat: number
    lon: number
  }
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface KommoSendMessageResponse {
  new_message?: {
    msgid: string
    ref_id: string
    conversation_id: string
    sender_id: string
    receiver_id: string
  }
  edit_message?: {
    msgid: string
  }
}

export interface KommoApiError {
  status: number
  title: string
  detail?: string
  'validation-errors'?: Array<{
    request_id: string
    errors: Array<{
      code: string
      path: string
      detail: string
    }>
  }>
}

// ============================================================================
// CONVERSACIONES (INTERNO)
// ============================================================================

export type ConversationStatus = 'active' | 'resolved' | 'escalated'

export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageIntent =
  | 'greeting'
  | 'product_inquiry'
  | 'price_inquiry'
  | 'availability_inquiry'
  | 'faq'
  | 'appointment'
  | 'complaint'
  | 'escalation'
  | 'other'

export interface Conversation {
  id: string
  kommo_chat_id: string
  kommo_contact_id?: string
  phone?: string
  contact_name?: string
  status: ConversationStatus
  message_count: number
  last_message_at?: Date
  escalated_at?: Date
  escalation_reason?: string
  metadata: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface Message {
  id: string
  conversation_id: string
  kommo_message_id?: string
  role: MessageRole
  content: string
  intent?: MessageIntent
  products_referenced?: string[]
  ai_model?: string
  tokens_used?: number
  response_time_ms?: number
  created_at: Date
}

// ============================================================================
// PROCESAMIENTO DE MENSAJES
// ============================================================================

export interface ProcessMessageInput {
  chatId: string
  contactId?: string
  senderName: string
  senderPhone?: string
  messageText: string
  messageId: string
  origin: string
  timestamp: number
}

export interface ProcessMessageResult {
  success: boolean
  responseText?: string
  intent?: MessageIntent
  shouldEscalate: boolean
  escalationReason?: string
  productsFound?: Array<{
    id: string
    name: string
    price: number
  }>
  error?: string
}

// ============================================================================
// HEADERS PARA API
// ============================================================================

export interface KommoApiHeaders {
  'Date': string
  'Content-Type': string
  'Content-MD5': string
  'X-Signature': string
}

// ============================================================================
// EVENTOS DEL SISTEMA
// ============================================================================

export type KommoEventType =
  | 'leads.add'
  | 'leads.update'
  | 'leads.status'
  | 'leads.delete'
  | 'contacts.add'
  | 'contacts.update'
  | 'contacts.delete'
  | 'message.add'
  | 'notes.add'
  | 'notes.update'
  | 'chat.message'

export interface ParsedWebhookEvent {
  type: KommoEventType
  data: KommoLead | KommoContact | KommoIncomingMessage | KommoNote | KommoChatMessage
  accountId?: string
  subdomain?: string
  timestamp: Date
}
