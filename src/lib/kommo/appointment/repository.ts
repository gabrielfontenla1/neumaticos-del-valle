/**
 * Repository functions for appointment flow state and creation
 */

import { createClient } from '@supabase/supabase-js'
import type { AppointmentFlowData } from './types'

// Cliente Supabase sin tipos estrictos (las tablas no están en tipos generados)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// FLOW STATE MANAGEMENT
// ============================================================================

// Tipos para las respuestas de Supabase
type ConversationRow = { metadata: Record<string, unknown> | null }
type AppointmentRow = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  appointment_services?: { name: string } | null
}

/**
 * Obtiene el estado del flujo de turnos desde metadata de la conversación
 */
export async function getAppointmentFlowState(
  conversationId: string
): Promise<AppointmentFlowData | null> {
  const { data, error } = await db
    .from('kommo_conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single()

  if (error) {
    console.error('[AppointmentRepository] Error fetching flow state:', error)
    return null
  }

  const row = data as ConversationRow | null
  const metadata = row?.metadata
  return (metadata?.appointmentFlow as AppointmentFlowData) || null
}

/**
 * Actualiza el estado del flujo de turnos en metadata de la conversación
 */
export async function updateAppointmentFlowState(
  conversationId: string,
  flowData: AppointmentFlowData
): Promise<void> {
  // Primero obtener metadata actual
  const { data: current } = await db
    .from('kommo_conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single()

  const row = current as ConversationRow | null
  const currentMetadata = row?.metadata || {}

  // Actualizar con el nuevo flow state
  const { error } = await db
    .from('kommo_conversations')
    .update({
      metadata: {
        ...currentMetadata,
        appointmentFlow: flowData
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[AppointmentRepository] Error updating flow state:', error)
    throw error
  }
}

/**
 * Limpia el estado del flujo de turnos
 */
export async function clearAppointmentFlowState(
  conversationId: string
): Promise<void> {
  const { data: current } = await db
    .from('kommo_conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single()

  const row = current as ConversationRow | null
  const currentMetadata = row?.metadata || {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { appointmentFlow: _, ...restMetadata } = currentMetadata

  const { error } = await db
    .from('kommo_conversations')
    .update({
      metadata: restMetadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[AppointmentRepository] Error clearing flow state:', error)
  }
}

// ============================================================================
// APPOINTMENT CREATION
// ============================================================================

interface CreateAppointmentParams {
  branchId: string
  branchName: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  conversationId: string
}

/**
 * Crea un turno desde WhatsApp
 */
export async function createAppointmentFromWhatsApp(
  params: CreateAppointmentParams
): Promise<{ id: string }> {
  const { data, error } = await db
    .from('appointments')
    .insert({
      store_id: params.branchId,
      branch: params.branchName,
      service_id: params.serviceId,
      service_type: params.serviceName,
      appointment_date: params.date,
      appointment_time: params.time,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail || null,
      status: 'confirmed',
      source: 'whatsapp',
      notes: `Reservado vía WhatsApp - Conversación: ${params.conversationId}`
    })
    .select('id')
    .single()

  if (error) {
    console.error('[AppointmentRepository] Error creating appointment:', error)
    throw new Error(`Error al crear turno: ${error.message}`)
  }

  const result = data as { id: string } | null
  if (!result) {
    throw new Error('Error al crear turno: no se obtuvo ID')
  }

  console.log('[AppointmentRepository] Appointment created:', result.id)
  return { id: result.id }
}

/**
 * Verifica si ya existe un turno para el mismo cliente en la misma fecha
 */
export async function hasExistingAppointment(
  customerPhone: string,
  date: string
): Promise<boolean> {
  const { data, error } = await db
    .from('appointments')
    .select('id')
    .eq('customer_phone', customerPhone)
    .eq('appointment_date', date)
    .not('status', 'in', '("cancelled","no_show")')
    .limit(1)

  if (error) {
    console.error('[AppointmentRepository] Error checking existing appointment:', error)
    return false
  }

  const results = (data || []) as Array<{ id: string }>
  return results.length > 0
}

/**
 * Obtiene los últimos turnos de un cliente por teléfono
 */
export async function getCustomerAppointments(
  customerPhone: string,
  limit: number = 5
): Promise<Array<{
  id: string
  date: string
  time: string
  serviceName: string
  status: string
}>> {
  const { data, error } = await db
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      appointment_services (name)
    `)
    .eq('customer_phone', customerPhone)
    .order('appointment_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[AppointmentRepository] Error fetching customer appointments:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((apt: any) => ({
    id: apt.id,
    date: apt.appointment_date,
    time: apt.appointment_time,
    serviceName: apt.appointment_services?.name || 'Servicio',
    status: apt.status
  }))
}
