// ===========================================
// Supabase Session Store for Baileys
// ===========================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from './utils/logger'

interface BaileysInstanceRow {
  id: string
  name: string
  phone_number: string | null
  status: string
  qr_code: string | null
  qr_expires_at: string | null
  session_data: Record<string, unknown> | null
  last_connected_at: string | null
  error_message: string | null
  settings: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

let supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY

    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
    }

    supabase = createClient(url, key)
  }
  return supabase
}

// ===========================================
// Instance Operations
// ===========================================

export async function getInstance(instanceId: string): Promise<BaileysInstanceRow | null> {
  const { data, error } = await getSupabase()
    .from('baileys_instances')
    .select('*')
    .eq('id', instanceId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    logger.error({ error, instanceId }, 'Error fetching instance')
    throw error
  }

  return data
}

export async function updateInstanceStatus(
  instanceId: string,
  status: string,
  extra?: {
    phone_number?: string | null
    qr_code?: string | null
    qr_expires_at?: string | null
    error_message?: string | null
    last_connected_at?: string | null
  }
): Promise<void> {
  const updates: Record<string, unknown> = { status, ...extra }

  const { error } = await getSupabase()
    .from('baileys_instances')
    .update(updates)
    .eq('id', instanceId)

  if (error) {
    logger.error({ error, instanceId, status }, 'Error updating instance status')
    throw error
  }

  logger.info({ instanceId, status }, 'Instance status updated')
}

export async function logSessionEvent(
  instanceId: string,
  eventType: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { error } = await getSupabase()
    .from('baileys_session_logs')
    .insert({
      instance_id: instanceId,
      event_type: eventType,
      details,
    })

  if (error) {
    logger.error({ error, instanceId, eventType }, 'Error logging session event')
    // Don't throw - logging should not break the flow
  }
}

export async function getRecentLogs(
  instanceId: string,
  limit = 50
): Promise<unknown[]> {
  const { data, error } = await getSupabase()
    .from('baileys_session_logs')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error({ error, instanceId }, 'Error fetching logs')
    throw error
  }

  return data || []
}

export async function getActiveInstances(): Promise<BaileysInstanceRow[]> {
  const { data, error } = await getSupabase()
    .from('baileys_instances')
    .select('*')
    .eq('is_active', true)
    .in('status', ['connected', 'reconnecting'])

  if (error) {
    logger.error({ error }, 'Error fetching active instances')
    throw error
  }

  return data || []
}
