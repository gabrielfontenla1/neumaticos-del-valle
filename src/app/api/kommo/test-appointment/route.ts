import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4, validate as isValidUuid } from 'uuid'
import {
  processAppointmentFlow,
  getAppointmentFlowState,
  updateAppointmentFlowState,
  isAppointmentFlowActive,
  clearAppointmentFlowState
} from '@/lib/kommo/appointment'
import { detectIntent } from '@/lib/ai/prompts/kommo-agent'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Supabase client for tables not in generated types (kommo_conversations)
// Using generic client since the table schema is not in generated types
const db = createClient(supabaseUrl, supabaseServiceKey)

// Mapa para convertir IDs de prueba a UUIDs
const testIdToUuid: Record<string, string> = {}

/**
 * Endpoint de prueba para simular el flujo de turnos vía WhatsApp
 * Permite probar sin necesidad de Kommo/WhatsApp real
 */
export async function POST(request: NextRequest) {
  // Block test endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const body = await request.json()
    const { conversationId, messageText, senderName, senderPhone } = body

    if (!conversationId || !messageText) {
      return NextResponse.json({
        error: 'conversationId y messageText son requeridos'
      }, { status: 400 })
    }

    // Convertir ID de prueba a UUID si no es válido
    let actualConversationId = conversationId
    if (!isValidUuid(conversationId)) {
      // Verificar si ya tenemos un UUID para este ID de prueba
      if (!testIdToUuid[conversationId]) {
        testIdToUuid[conversationId] = uuidv4()
      }
      actualConversationId = testIdToUuid[conversationId]
    }

    console.log('[TestAppointment] Processing:', { conversationId, actualConversationId, messageText })

    // Asegurar que existe una conversación de prueba
    await ensureTestConversation(actualConversationId, senderName, senderPhone)

    // Obtener estado actual del flujo
    const currentFlowState = await getAppointmentFlowState(actualConversationId)

    // Detectar intent solo si no hay flujo activo
    let intent: string | undefined
    if (!isAppointmentFlowActive(currentFlowState)) {
      // Detectar si el usuario quiere sacar turno
      intent = detectIntent(messageText)
      console.log('[TestAppointment] Intent detected:', intent)
    }

    // Verificar si debemos procesar con el flujo de turnos
    const shouldProcessAppointment = isAppointmentFlowActive(currentFlowState) || intent === 'appointment'

    if (!shouldProcessAppointment) {
      // No es un flujo de turnos, retornar mensaje genérico
      return NextResponse.json({
        responseText: 'Este simulador es solo para probar el flujo de turnos. Escribí "turno" o "quiero sacar un turno" para comenzar.',
        intent,
        appointmentCreated: false
      })
    }

    // Procesar el flujo de turnos
    const now = new Date().toISOString()
    const flowResult = await processAppointmentFlow(
      currentFlowState?.state || 'idle',
      currentFlowState || {
        state: 'idle',
        lastUpdated: now,
        startedAt: now,
        attempts: 0
      },
      messageText,
      {
        name: senderName || 'Usuario de Prueba',
        phone: senderPhone || '+5491100000000'
      },
      actualConversationId
    )

    console.log('[TestAppointment] Flow result:', {
      newState: flowResult.newState,
      appointmentCreated: flowResult.appointmentCreated
    })

    // Actualizar o limpiar el estado del flujo
    if (flowResult.newState === 'idle') {
      await clearAppointmentFlowState(actualConversationId)
    } else {
      await updateAppointmentFlowState(actualConversationId, flowResult.flowData)
    }

    return NextResponse.json({
      responseText: flowResult.responseMessage,
      intent: intent || 'appointment_flow',
      newState: flowResult.newState,
      appointmentCreated: flowResult.appointmentCreated || false,
      appointmentId: flowResult.appointmentId
    })

  } catch (error) {
    console.error('[TestAppointment] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido',
      responseText: 'Ocurrió un error procesando tu mensaje. Por favor, intentá de nuevo.'
    }, { status: 500 })
  }
}

/**
 * Asegura que existe una conversación de prueba en la base de datos
 */
async function ensureTestConversation(
  conversationId: string,
  senderName?: string,
  senderPhone?: string
): Promise<void> {
  // Verificar si ya existe
  const { data: existing } = await db
    .from('kommo_conversations')
    .select('id')
    .eq('id', conversationId)
    .single()

  if (existing) {
    return // Ya existe
  }

  // Crear conversación de prueba
  const { error } = await db
    .from('kommo_conversations')
    .insert({
      id: conversationId,
      kommo_chat_id: `test_chat_${Date.now()}`,
      kommo_contact_id: `test_contact_${Date.now()}`,
      contact_name: senderName || 'Usuario de Prueba',
      phone: senderPhone || '+5491100000000',
      status: 'active',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('[TestAppointment] Error creating test conversation:', error)
    // No lanzar error, puede que la conversación ya exista (race condition)
  }
}

/**
 * GET para resetear una conversación de prueba
 */
export async function DELETE(request: NextRequest) {
  // Block test endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({
        error: 'conversationId es requerido'
      }, { status: 400 })
    }

    await clearAppointmentFlowState(conversationId)

    return NextResponse.json({
      success: true,
      message: 'Flujo de turno reseteado'
    })

  } catch (error) {
    console.error('[TestAppointment] Error resetting:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
