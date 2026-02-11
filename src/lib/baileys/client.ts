// ===========================================
// HTTP Client for Baileys Service
// ===========================================

import type {
  BaileysInstance,
  QRCodeResponse,
  ConnectionStatus,
} from '@/types/baileys'

const BAILEYS_SERVICE_URL = process.env.BAILEYS_SERVICE_URL || 'http://localhost:6002'
const BAILEYS_API_KEY = process.env.BAILEYS_SERVICE_API_KEY || ''

interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function fetchService<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ServiceResponse<T>> {
  try {
    const response = await fetch(`${BAILEYS_SERVICE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BAILEYS_API_KEY,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Baileys service request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Service unavailable',
    }
  }
}

// ===========================================
// Instance Operations
// ===========================================

export async function getInstanceStatus(
  instanceId: string
): Promise<ServiceResponse<BaileysInstance & { real_time_status: ConnectionStatus }>> {
  return fetchService(`/instances/${instanceId}`)
}

export async function connectInstance(
  instanceId: string
): Promise<ServiceResponse<{ message: string; instance_id: string }>> {
  return fetchService(`/instances/${instanceId}/connect`, {
    method: 'POST',
  })
}

export async function disconnectInstance(
  instanceId: string
): Promise<ServiceResponse<{ message: string }>> {
  return fetchService(`/instances/${instanceId}/disconnect`, {
    method: 'POST',
  })
}

export async function getQRCode(instanceId: string): Promise<ServiceResponse<QRCodeResponse>> {
  return fetchService(`/instances/${instanceId}/qr`)
}

export async function sendMessage(
  instanceId: string,
  to: string,
  message: string,
  jid?: string
): Promise<ServiceResponse<{ success: boolean; message_id?: string }>> {
  return fetchService(`/instances/${instanceId}/send`, {
    method: 'POST',
    body: JSON.stringify({ to, message, jid }),
  })
}

export async function getInstanceLogs(
  instanceId: string,
  limit = 50
): Promise<ServiceResponse<{ logs: unknown[] }>> {
  return fetchService(`/instances/${instanceId}/logs?limit=${limit}`)
}

// ===========================================
// Profile Picture
// ===========================================

export async function getProfilePicture(
  instanceId: string,
  jid: string
): Promise<ServiceResponse<{ success: boolean; url: string | null }>> {
  return fetchService(`/instances/${instanceId}/profile-picture?jid=${encodeURIComponent(jid)}`)
}

// ===========================================
// Health Check
// ===========================================

export async function checkServiceHealth(): Promise<ServiceResponse<{
  status: string
  timestamp: string
  active_connections: number
}>> {
  return fetchService('/health')
}

// ===========================================
// Send via Baileys (convenience function)
// ===========================================

export async function sendViaBaileys(
  instanceId: string,
  to: string,
  message: string
): Promise<boolean> {
  const result = await sendMessage(instanceId, to, message)
  return result.success
}
