/**
 * Types for WhatsApp conversations and messages
 * Used by the Twilio webhook and admin dashboard
 */

export type ConversationStatus = 'active' | 'resolved' | 'archived'

export type MessageRole = 'user' | 'assistant'

// Stock flow states
export type StockFlowState = 'idle' | 'awaiting_location' | 'showing_results' | 'awaiting_transfer_confirm'

// Appointment flow states
export type AppointmentFlowState =
  | 'apt_province'      // Esperando selección de provincia
  | 'apt_branch'        // Esperando selección de sucursal
  | 'apt_service'       // Esperando selección de servicios (multi-select)
  | 'apt_date'          // Esperando selección de fecha
  | 'apt_time'          // Esperando selección de horario
  | 'apt_contact'       // Esperando nombre del cliente
  | 'apt_confirm'       // Esperando confirmación final

export type ConversationState = StockFlowState | AppointmentFlowState

export interface PendingTireSearch {
  width: number
  profile: number
  diameter: number
  originalMessage: string
}

export interface PendingAppointment {
  province?: string              // 'catamarca' | 'santiago' | 'salta' | 'tucuman'
  branch_id?: string             // UUID de stores
  branch_name?: string           // Nombre para mostrar
  selected_services: string[]    // ['alignment', 'tire-change']
  preferred_date?: string        // '2026-01-15'
  preferred_time?: string        // '10:30'
  customer_name?: string
  customer_phone?: string        // Auto del número WhatsApp
  started_at: string             // Timestamp inicio
}

export interface WhatsAppConversation {
  id: string
  phone: string
  contact_name: string | null
  status: ConversationStatus
  is_paused: boolean
  paused_at: Date | null
  paused_by: string | null
  pause_reason: string | null
  message_count: number
  last_message_at: Date | null
  // Stock location flow fields
  user_city: string | null
  preferred_branch_id: string | null
  conversation_state: ConversationState
  pending_tire_search: PendingTireSearch | null
  // Appointment flow fields
  pending_appointment: PendingAppointment | null
  created_at: Date
  updated_at: Date
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  sent_by_human: boolean
  sent_by_user_id: string | null
  intent: string | null
  response_time_ms: number | null
  created_at: Date
}

// Database row types (snake_case from Supabase)
export interface DbConversation {
  id: string
  phone: string
  contact_name: string | null
  status: string
  is_paused: boolean
  paused_at: string | null
  paused_by: string | null
  pause_reason: string | null
  message_count: number
  last_message_at: string | null
  user_city: string | null
  preferred_branch_id: string | null
  conversation_state: string
  pending_tire_search: PendingTireSearch | null
  pending_appointment: PendingAppointment | null
  created_at: string
  updated_at: string
}

export interface DbMessage {
  id: string
  conversation_id: string
  role: string
  content: string
  sent_by_human: boolean
  sent_by_user_id: string | null
  intent: string | null
  response_time_ms: number | null
  created_at: string
}

// Input types for creating/updating
export interface CreateConversationInput {
  phone: string
  contactName?: string
}

export interface CreateMessageInput {
  conversationId: string
  role: MessageRole
  content: string
  sentByHuman?: boolean
  sentByUserId?: string
  intent?: string
  responseTimeMs?: number
}

export interface PauseConversationInput {
  pausedBy: string
  reason?: string
}

export interface ListConversationsFilters {
  status?: ConversationStatus
  isPaused?: boolean
  limit?: number
  offset?: number
}

export interface UpdateConversationInput {
  user_city?: string | null
  preferred_branch_id?: string | null
  conversation_state?: ConversationState
  pending_tire_search?: PendingTireSearch | null
  pending_appointment?: PendingAppointment | null
}
