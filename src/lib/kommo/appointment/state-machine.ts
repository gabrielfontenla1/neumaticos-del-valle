/**
 * State Machine para el flujo de reserva de turnos
 * Maneja las transiciones entre estados del flujo conversacional
 */

import type {
  AppointmentFlowState,
  AppointmentFlowData,
  FlowTransitionResult,
  ContactInfo
} from './types'
import { APPOINTMENT_CONFIG } from './types'
import { parseNaturalDate, parseTimeFromMessage, isWorkingDay } from './date-parser'
import { matchService, getAvailableServices } from './service-matcher'
import { matchBranch, getAvailableBranches } from './branch-matcher'
import { getAvailableSlots, findClosestSlot, isSlotAvailable } from './slot-formatter'
import {
  getAskBranchMessage,
  getBranchConfirmMessage,
  getBranchNotFoundMessage,
  getAskServiceMessage,
  getServiceConfirmMessage,
  getServiceNotFoundMessage,
  getAskDateMessage,
  getDateConfirmMessage,
  getDatePastMessage,
  getSundayMessage,
  getDateTooFarMessage,
  getInvalidDateMessage,
  getShowSlotsMessage,
  getTimeConfirmMessage,
  getTimeNotFoundMessage,
  getNoSlotsMessage,
  getConfirmationSummaryMessage,
  getSuccessMessage,
  getCancelledMessage,
  getTimeoutMessage,
  getErrorMessage,
  formatDateForDisplay,
  isCancelIntent,
  isConfirmIntent
} from './messages'
import { createAppointmentFromWhatsApp } from './repository'

// ============================================================================
// PROCESADOR PRINCIPAL
// ============================================================================

/**
 * Procesa un mensaje del usuario y retorna el siguiente estado del flujo
 */
export async function processAppointmentFlow(
  currentState: AppointmentFlowState,
  flowData: AppointmentFlowData,
  userMessage: string,
  contactInfo: ContactInfo,
  conversationId: string
): Promise<FlowTransitionResult> {
  const now = new Date().toISOString()

  // Verificar timeout del flujo
  if (flowData.startedAt) {
    const startTime = new Date(flowData.startedAt).getTime()
    const elapsed = Date.now() - startTime
    const timeoutMs = APPOINTMENT_CONFIG.flowTimeoutMinutes * 60 * 1000

    if (elapsed > timeoutMs && currentState !== 'idle') {
      return resetFlow(flowData, getTimeoutMessage())
    }
  }

  // Verificar si el usuario quiere cancelar
  if (isCancelIntent(userMessage) && currentState !== 'idle') {
    return resetFlow(flowData, getCancelledMessage())
  }

  // Procesar según el estado actual
  try {
    switch (currentState) {
      case 'idle':
        return await handleIdleState(flowData, contactInfo, now)

      case 'awaiting_branch':
        return await handleAwaitingBranch(flowData, userMessage, now)

      case 'awaiting_service':
        return await handleAwaitingService(flowData, userMessage, now)

      case 'awaiting_date':
        return await handleAwaitingDate(flowData, userMessage, now)

      case 'awaiting_time':
        return await handleAwaitingTime(flowData, userMessage, now)

      case 'awaiting_confirmation':
        return await handleAwaitingConfirmation(flowData, userMessage, contactInfo, conversationId, now)

      default:
        return resetFlow(flowData, getErrorMessage())
    }
  } catch (error) {
    console.error('[AppointmentStateMachine] Error:', error)
    return {
      newState: 'idle',
      responseMessage: getErrorMessage(),
      flowData: createInitialFlowData(now),
      shouldEscalate: true,
      escalationReason: 'Error en flujo de turnos'
    }
  }
}

// ============================================================================
// HANDLERS POR ESTADO
// ============================================================================

/**
 * Estado IDLE: Inicia el flujo mostrando sucursales
 */
async function handleIdleState(
  flowData: AppointmentFlowData,
  contactInfo: ContactInfo,
  now: string
): Promise<FlowTransitionResult> {
  const branches = await getAvailableBranches()

  return {
    newState: 'awaiting_branch',
    responseMessage: getAskBranchMessage(branches),
    flowData: {
      ...createInitialFlowData(now),
      state: 'awaiting_branch', // Actualizar estado en flowData
      customerName: contactInfo.name,
      customerPhone: contactInfo.phone,
      customerEmail: contactInfo.email
    }
  }
}

/**
 * Estado AWAITING_BRANCH: Procesa selección de sucursal
 */
async function handleAwaitingBranch(
  flowData: AppointmentFlowData,
  userMessage: string,
  now: string
): Promise<FlowTransitionResult> {
  const match = await matchBranch(userMessage)

  if (!match || match.confidence < 0.5) {
    const branches = await getAvailableBranches()
    return {
      newState: 'awaiting_branch',
      responseMessage: getBranchNotFoundMessage(branches),
      flowData: {
        ...flowData,
        state: 'awaiting_branch',
        lastUpdated: now,
        attempts: flowData.attempts + 1
      }
    }
  }

  const services = await getAvailableServices()

  return {
    newState: 'awaiting_service',
    responseMessage: `${getBranchConfirmMessage(match.branch.name)}\n\n${getAskServiceMessage(services)}`,
    flowData: {
      ...flowData,
      state: 'awaiting_service',
      branchId: match.branch.id,
      branchName: match.branch.name,
      lastUpdated: now,
      attempts: 0
    }
  }
}

/**
 * Estado AWAITING_SERVICE: Procesa selección de servicio
 */
async function handleAwaitingService(
  flowData: AppointmentFlowData,
  userMessage: string,
  now: string
): Promise<FlowTransitionResult> {
  const match = await matchService(userMessage)

  if (!match || match.confidence < 0.5) {
    const services = await getAvailableServices()
    return {
      newState: 'awaiting_service',
      responseMessage: getServiceNotFoundMessage(services),
      flowData: {
        ...flowData,
        state: 'awaiting_service',
        lastUpdated: now,
        attempts: flowData.attempts + 1
      }
    }
  }

  return {
    newState: 'awaiting_date',
    responseMessage: `${getServiceConfirmMessage(match.service.name)}\n\n${getAskDateMessage()}`,
    flowData: {
      ...flowData,
      state: 'awaiting_date',
      serviceId: match.service.id,
      serviceName: match.service.name,
      serviceDuration: match.service.duration,
      lastUpdated: now,
      attempts: 0
    }
  }
}

/**
 * Estado AWAITING_DATE: Procesa selección de fecha
 */
async function handleAwaitingDate(
  flowData: AppointmentFlowData,
  userMessage: string,
  now: string
): Promise<FlowTransitionResult> {
  const parsedDate = parseNaturalDate(userMessage)

  if (!parsedDate) {
    return {
      newState: 'awaiting_date',
      responseMessage: getInvalidDateMessage(),
      flowData: {
        ...flowData,
        state: 'awaiting_date',
        lastUpdated: now,
        attempts: flowData.attempts + 1
      }
    }
  }

  // Verificar fecha pasada
  if (parsedDate.isPast) {
    return {
      newState: 'awaiting_date',
      responseMessage: getDatePastMessage(),
      flowData: { ...flowData, state: 'awaiting_date', lastUpdated: now }
    }
  }

  // Verificar domingo
  if (parsedDate.isSunday) {
    return {
      newState: 'awaiting_date',
      responseMessage: getSundayMessage(),
      flowData: { ...flowData, state: 'awaiting_date', lastUpdated: now }
    }
  }

  // Verificar si es día laboral
  if (!isWorkingDay(parsedDate.date)) {
    return {
      newState: 'awaiting_date',
      responseMessage: getSundayMessage(), // Mismo mensaje para no laborales
      flowData: { ...flowData, state: 'awaiting_date', lastUpdated: now }
    }
  }

  // Obtener slots disponibles
  const slots = await getAvailableSlots(
    flowData.branchId!,
    parsedDate.dateString,
    flowData.serviceDuration
  )

  const availableSlots = slots.filter(s => s.available)

  if (availableSlots.length === 0) {
    return {
      newState: 'awaiting_date',
      responseMessage: getNoSlotsMessage(),
      flowData: { ...flowData, state: 'awaiting_date', lastUpdated: now }
    }
  }

  return {
    newState: 'awaiting_time',
    responseMessage: getShowSlotsMessage(parsedDate.displayText, slots),
    flowData: {
      ...flowData,
      state: 'awaiting_time',
      selectedDate: parsedDate.dateString,
      lastUpdated: now,
      attempts: 0
    }
  }
}

/**
 * Estado AWAITING_TIME: Procesa selección de horario
 */
async function handleAwaitingTime(
  flowData: AppointmentFlowData,
  userMessage: string,
  now: string
): Promise<FlowTransitionResult> {
  const requestedTime = parseTimeFromMessage(userMessage)

  if (!requestedTime) {
    const slots = await getAvailableSlots(flowData.branchId!, flowData.selectedDate!)
    return {
      newState: 'awaiting_time',
      responseMessage: getTimeNotFoundMessage(slots),
      flowData: {
        ...flowData,
        state: 'awaiting_time',
        lastUpdated: now,
        attempts: flowData.attempts + 1
      }
    }
  }

  // Verificar disponibilidad
  const slots = await getAvailableSlots(flowData.branchId!, flowData.selectedDate!)
  const matchedSlot = findClosestSlot(requestedTime, slots)

  if (!matchedSlot) {
    return {
      newState: 'awaiting_time',
      responseMessage: getTimeNotFoundMessage(slots),
      flowData: {
        ...flowData,
        state: 'awaiting_time',
        lastUpdated: now,
        attempts: flowData.attempts + 1
      }
    }
  }

  // Verificar disponibilidad real del slot
  const isAvailable = await isSlotAvailable(
    flowData.branchId!,
    flowData.selectedDate!,
    matchedSlot.time
  )

  if (!isAvailable) {
    return {
      newState: 'awaiting_time',
      responseMessage: getTimeNotFoundMessage(slots),
      flowData: { ...flowData, state: 'awaiting_time', lastUpdated: now }
    }
  }

  const updatedFlowData = {
    ...flowData,
    state: 'awaiting_confirmation' as const,
    selectedTime: matchedSlot.time,
    lastUpdated: now,
    attempts: 0
  }

  return {
    newState: 'awaiting_confirmation',
    responseMessage: `${getTimeConfirmMessage(matchedSlot.time)}\n\n${getConfirmationSummaryMessage(updatedFlowData)}`,
    flowData: updatedFlowData
  }
}

/**
 * Estado AWAITING_CONFIRMATION: Procesa confirmación final
 */
async function handleAwaitingConfirmation(
  flowData: AppointmentFlowData,
  userMessage: string,
  contactInfo: ContactInfo,
  conversationId: string,
  now: string
): Promise<FlowTransitionResult> {
  if (!isConfirmIntent(userMessage)) {
    // Si no confirma, preguntar de nuevo o cancelar
    if (isCancelIntent(userMessage)) {
      return resetFlow(flowData, getCancelledMessage())
    }

    return {
      newState: 'awaiting_confirmation',
      responseMessage: '¿Confirmamos el turno? Respondé "Sí" o "No"',
      flowData: {
        ...flowData,
        state: 'awaiting_confirmation',
        lastUpdated: now,
        attempts: flowData.attempts + 1
      }
    }
  }

  // Crear el turno
  try {
    const appointment = await createAppointmentFromWhatsApp({
      branchId: flowData.branchId!,
      branchName: flowData.branchName!,
      serviceId: flowData.serviceId!,
      serviceName: flowData.serviceName!,
      date: flowData.selectedDate!,
      time: flowData.selectedTime!,
      customerName: contactInfo.name || flowData.customerName || 'Cliente WhatsApp',
      customerPhone: contactInfo.phone || flowData.customerPhone || '',
      customerEmail: contactInfo.email || flowData.customerEmail,
      conversationId
    })

    return {
      newState: 'completed',
      responseMessage: getSuccessMessage(appointment.id),
      flowData: createInitialFlowData(now),
      appointmentCreated: true,
      appointmentId: appointment.id
    }
  } catch (error) {
    console.error('[AppointmentStateMachine] Error creating appointment:', error)
    return {
      newState: 'idle',
      responseMessage: getErrorMessage(),
      flowData: createInitialFlowData(now),
      shouldEscalate: true,
      escalationReason: 'Error al crear turno'
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Crea datos iniciales del flujo
 */
function createInitialFlowData(now: string): AppointmentFlowData {
  return {
    state: 'idle',
    lastUpdated: now,
    startedAt: now,
    attempts: 0
  }
}

/**
 * Resetea el flujo al estado inicial
 */
function resetFlow(
  _flowData: AppointmentFlowData,
  message: string
): FlowTransitionResult {
  return {
    newState: 'idle',
    responseMessage: message,
    flowData: createInitialFlowData(new Date().toISOString())
  }
}

/**
 * Verifica si hay un flujo de turno activo
 */
export function isAppointmentFlowActive(flowData: AppointmentFlowData | null): boolean {
  if (!flowData) return false
  return flowData.state !== 'idle' && flowData.state !== 'completed'
}
