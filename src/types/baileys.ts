// ===========================================
// Baileys WhatsApp Integration - Type Definitions
// ===========================================

// Instance Status Types
export type BaileysInstanceStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

// Session Event Types
export type BaileysEventType =
  | 'qr_generated'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'message_received'
  | 'message_sent'
  | 'error'
  | 'session_restored'
  | 'logout'

// Database Models
export interface BaileysInstance {
  id: string
  name: string
  phone_number: string | null
  status: BaileysInstanceStatus
  qr_code: string | null
  qr_expires_at: string | null
  session_data: Record<string, unknown> | null
  last_connected_at: string | null
  error_message: string | null
  settings: BaileysInstanceSettings
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BaileysSessionLog {
  id: string
  instance_id: string
  event_type: BaileysEventType
  details: Record<string, unknown> | null
  created_at: string
}

// Instance Settings (stored in JSONB)
export interface BaileysInstanceSettings {
  auto_reconnect?: boolean
  read_messages?: boolean
  typing_indicator?: boolean
  presence_update?: boolean
}

// API Request Types
export interface CreateInstanceRequest {
  name: string
  settings?: Partial<BaileysInstanceSettings>
}

export interface SendMessageRequest {
  to: string
  message: string
  instance_id?: string
}

// API Response Types
export interface QRCodeResponse {
  instance_id: string
  qr_code: string | null
  status: BaileysInstanceStatus
  expires_at: string | null
}

export interface ConnectionStatus {
  instance_id: string
  status: BaileysInstanceStatus
  phone_number: string | null
  last_connected_at: string | null
  error_message: string | null
}

// Webhook Payload (from Baileys service to Next.js)
export interface BaileysWebhookPayload {
  instance_id: string
  event: BaileysEventType
  data: BaileysWebhookData
  timestamp: string
}

export interface BaileysWebhookData {
  // For message events
  from?: string
  to?: string
  body?: string
  message_id?: string
  is_group?: boolean
  push_name?: string
  phone?: string

  // For connection events
  qr_code?: string
  phone_number?: string
  error?: string
  reason?: string
  message?: string
}

// Default settings
export const DEFAULT_INSTANCE_SETTINGS: BaileysInstanceSettings = {
  auto_reconnect: true,
  read_messages: false,
  typing_indicator: true,
  presence_update: false,
}
