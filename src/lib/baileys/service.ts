// ===========================================
// Baileys Service - Supabase Database Operations
// ===========================================

import { createClient } from '@supabase/supabase-js'
import type {
  BaileysInstance,
  BaileysSessionLog,
  CreateInstanceRequest,
} from '@/types/baileys'

// Use service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ===========================================
// Instance CRUD Operations
// ===========================================

export async function getInstances(): Promise<BaileysInstance[]> {
  const { data, error } = await db
    .from('baileys_instances')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching instances:', error)
    throw error
  }

  return (data || []) as BaileysInstance[]
}

export async function getInstance(
  instanceId: string
): Promise<BaileysInstance | null> {
  const { data, error } = await db
    .from('baileys_instances')
    .select('*')
    .eq('id', instanceId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching instance:', error)
    throw error
  }

  return data as BaileysInstance
}

export async function createInstance(
  request: CreateInstanceRequest
): Promise<BaileysInstance> {
  const { data, error } = await db
    .from('baileys_instances')
    .insert({
      name: request.name,
      settings: {
        auto_reconnect: true,
        read_messages: false,
        typing_indicator: true,
        presence_update: false,
        ...request.settings,
      },
      status: 'disconnected',
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating instance:', error)
    throw error
  }

  return data as BaileysInstance
}

export async function deleteInstance(
  instanceId: string
): Promise<void> {
  const { error } = await db
    .from('baileys_instances')
    .delete()
    .eq('id', instanceId)

  if (error) {
    console.error('Error deleting instance:', error)
    throw error
  }
}

// ===========================================
// Session Logs
// ===========================================

export async function getInstanceLogs(
  instanceId: string,
  limit = 50
): Promise<BaileysSessionLog[]> {
  const { data, error } = await db
    .from('baileys_session_logs')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching logs:', error)
    throw error
  }

  return (data || []) as BaileysSessionLog[]
}

// ===========================================
// Active Instance
// ===========================================

export async function getActiveInstance(): Promise<BaileysInstance | null> {
  const { data, error } = await db
    .from('baileys_instances')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'connected')
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching active instance:', error)
    return null
  }

  return data as BaileysInstance
}
