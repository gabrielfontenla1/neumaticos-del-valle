/**
 * Appointment Handler for WhatsApp Bot
 * State machine for multi-step appointment booking flow
 */

import type { WhatsAppConversation, PendingAppointment, AppointmentFlowState } from '../types'
import { updateConversation } from '../repository'
import {
  PROVINCES,
  parseProvinceInput,
  getBranchesByProvince,
  parseBranchInput,
  getServices,
  parseServiceInput,
  getServiceById,
  getAvailableDates,
  parseDateInput,
  getAvailableSlots,
  parseTimeInput,
  createWhatsAppAppointment,
  isGoBackCommand,
  isCancelCommand,
  isConfirmCommand
} from '../services/appointment-service'
import * as templates from '../templates/appointment-responses'
import type { Branch } from '@/features/appointments/types'

// ============================================================================
// INTENT DETECTION
// ============================================================================

/**
 * Detect if user wants to book an appointment
 */
export function detectAppointmentIntent(message: string): boolean {
  const normalized = message.toLowerCase().trim()
  const keywords = [
    'turno', 'turnos', 'cita', 'reservar', 'reserva', 'agendar', 'agenda',
    'sacar turno', 'pedir turno', 'quiero turno', 'necesito turno',
    'appointment', 'book', 'booking'
  ]

  return keywords.some(keyword => normalized.includes(keyword))
}

/**
 * Check if conversation is in appointment flow
 */
export function isAppointmentState(state: string): state is AppointmentFlowState {
  return state.startsWith('apt_')
}

// ============================================================================
// STATE RESULT TYPE
// ============================================================================

export interface StateResult {
  handled: boolean
  response?: string
  newState?: AppointmentFlowState | 'idle'
  pendingAppointment?: PendingAppointment | null
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Start appointment flow
 */
export async function startAppointmentFlow(
  conversation: WhatsAppConversation,
  phoneNumber: string
): Promise<StateResult> {
  const pendingAppointment: PendingAppointment = {
    selected_services: [],
    customer_phone: phoneNumber,
    started_at: new Date().toISOString()
  }

  await updateConversation(conversation.id, {
    conversation_state: 'apt_province',
    pending_appointment: pendingAppointment
  })

  return {
    handled: true,
    response: templates.welcomeAndProvinces(),
    newState: 'apt_province',
    pendingAppointment
  }
}

/**
 * Main state router for appointment flow
 */
export async function handleAppointmentState(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  startTime: number
): Promise<StateResult> {
  const state = conversation.conversation_state as AppointmentFlowState
  const pending = conversation.pending_appointment || {
    selected_services: [],
    customer_phone: phoneNumber,
    started_at: new Date().toISOString()
  }

  // Check for cancel command
  if (isCancelCommand(messageText)) {
    return handleCancel(conversation)
  }

  // Check for go back command
  if (isGoBackCommand(messageText)) {
    return handleGoBack(conversation, state, pending)
  }

  // Route to specific handler based on state
  switch (state) {
    case 'apt_province':
      return handleProvinceSelection(conversation, messageText, pending)
    case 'apt_branch':
      return handleBranchSelection(conversation, messageText, pending)
    case 'apt_service':
      return handleServiceSelection(conversation, messageText, pending)
    case 'apt_date':
      return handleDateSelection(conversation, messageText, pending)
    case 'apt_time':
      return handleTimeSelection(conversation, messageText, pending)
    case 'apt_contact':
      return handleContactInput(conversation, messageText, pending)
    case 'apt_confirm':
      return handleConfirmation(conversation, messageText, pending, phoneNumber)
    default:
      return { handled: false }
  }
}

// ============================================================================
// STATE HANDLERS
// ============================================================================

/**
 * Handle province selection
 */
async function handleProvinceSelection(
  conversation: WhatsAppConversation,
  messageText: string,
  pending: PendingAppointment
): Promise<StateResult> {
  const province = parseProvinceInput(messageText)

  if (!province) {
    return {
      handled: true,
      response: templates.provinceNotRecognized()
    }
  }

  // Get branches for this province
  const branches = await getBranchesByProvince(province.id)

  // Update pending with province
  const updatedPending: PendingAppointment = {
    ...pending,
    province: province.id
  }

  await updateConversation(conversation.id, {
    conversation_state: 'apt_branch',
    pending_appointment: updatedPending
  })

  return {
    handled: true,
    response: templates.branchSelection(province.name, branches),
    newState: 'apt_branch',
    pendingAppointment: updatedPending
  }
}

/**
 * Handle branch selection
 */
async function handleBranchSelection(
  conversation: WhatsAppConversation,
  messageText: string,
  pending: PendingAppointment
): Promise<StateResult> {
  // Get branches for current province
  const branches = await getBranchesByProvince(pending.province || '')
  const branch = parseBranchInput(messageText, branches)

  if (!branch) {
    return {
      handled: true,
      response: templates.branchNotRecognized(branches)
    }
  }

  // Update pending with branch
  const updatedPending: PendingAppointment = {
    ...pending,
    branch_id: branch.id,
    branch_name: branch.name
  }

  await updateConversation(conversation.id, {
    conversation_state: 'apt_service',
    pending_appointment: updatedPending
  })

  return {
    handled: true,
    response: templates.serviceSelection(getServices()),
    newState: 'apt_service',
    pendingAppointment: updatedPending
  }
}

/**
 * Handle service selection (multi-select)
 */
async function handleServiceSelection(
  conversation: WhatsAppConversation,
  messageText: string,
  pending: PendingAppointment
): Promise<StateResult> {
  const result = parseServiceInput(messageText, pending.selected_services)

  // If user typed "listo" or similar
  if (result.isComplete) {
    if (pending.selected_services.length === 0) {
      return {
        handled: true,
        response: templates.noServicesSelected()
      }
    }

    // Move to date selection
    const dates = getAvailableDates()

    await updateConversation(conversation.id, {
      conversation_state: 'apt_date',
      pending_appointment: pending
    })

    return {
      handled: true,
      response: templates.dateSelection(dates),
      newState: 'apt_date',
      pendingAppointment: pending
    }
  }

  // If a service was added
  if (result.services.length > pending.selected_services.length) {
    const newServiceId = result.services[result.services.length - 1]
    const newService = getServiceById(newServiceId)

    if (!newService) {
      return {
        handled: true,
        response: templates.serviceNotRecognized(getServices())
      }
    }

    const updatedPending: PendingAppointment = {
      ...pending,
      selected_services: result.services
    }

    await updateConversation(conversation.id, {
      pending_appointment: updatedPending
    })

    return {
      handled: true,
      response: templates.serviceAdded(newService, result.services),
      pendingAppointment: updatedPending
    }
  }

  // Service not recognized
  return {
    handled: true,
    response: templates.serviceNotRecognized(getServices())
  }
}

/**
 * Handle date selection
 */
async function handleDateSelection(
  conversation: WhatsAppConversation,
  messageText: string,
  pending: PendingAppointment
): Promise<StateResult> {
  const dates = getAvailableDates()
  const selectedDate = parseDateInput(messageText, dates)

  if (!selectedDate) {
    return {
      handled: true,
      response: templates.dateNotRecognized(dates)
    }
  }

  // Get available slots for this date
  const slots = await getAvailableSlots(pending.branch_id || '', selectedDate.date)

  // Update pending with date
  const updatedPending: PendingAppointment = {
    ...pending,
    preferred_date: selectedDate.date
  }

  await updateConversation(conversation.id, {
    conversation_state: 'apt_time',
    pending_appointment: updatedPending
  })

  return {
    handled: true,
    response: templates.timeSelection(selectedDate.dayName, slots),
    newState: 'apt_time',
    pendingAppointment: updatedPending
  }
}

/**
 * Handle time selection
 */
async function handleTimeSelection(
  conversation: WhatsAppConversation,
  messageText: string,
  pending: PendingAppointment
): Promise<StateResult> {
  const slots = await getAvailableSlots(pending.branch_id || '', pending.preferred_date || '')
  const selectedTime = parseTimeInput(messageText, slots)

  if (!selectedTime) {
    return {
      handled: true,
      response: templates.timeNotRecognized(slots)
    }
  }

  // Check if slot is still available
  if (!slots.includes(selectedTime)) {
    // Find alternatives
    const alternatives = slots.slice(0, 4)
    return {
      handled: true,
      response: templates.slotUnavailable(selectedTime, alternatives)
    }
  }

  // Update pending with time
  const updatedPending: PendingAppointment = {
    ...pending,
    preferred_time: selectedTime
  }

  await updateConversation(conversation.id, {
    conversation_state: 'apt_contact',
    pending_appointment: updatedPending
  })

  return {
    handled: true,
    response: templates.contactPrompt(),
    newState: 'apt_contact',
    pendingAppointment: updatedPending
  }
}

/**
 * Handle contact name input
 */
async function handleContactInput(
  conversation: WhatsAppConversation,
  messageText: string,
  pending: PendingAppointment
): Promise<StateResult> {
  const name = messageText.trim()

  // Validate name length
  if (name.length < 3) {
    return {
      handled: true,
      response: templates.nameTooShort()
    }
  }

  // Update pending with name
  const updatedPending: PendingAppointment = {
    ...pending,
    customer_name: name
  }

  await updateConversation(conversation.id, {
    conversation_state: 'apt_confirm',
    pending_appointment: updatedPending
  })

  return {
    handled: true,
    response: templates.confirmationSummary(updatedPending),
    newState: 'apt_confirm',
    pendingAppointment: updatedPending
  }
}

/**
 * Handle confirmation
 */
async function handleConfirmation(
  conversation: WhatsAppConversation,
  messageText: string,
  pending: PendingAppointment,
  phoneNumber: string
): Promise<StateResult> {
  if (!isConfirmCommand(messageText)) {
    // User didn't confirm - show summary again
    return {
      handled: true,
      response: `Para confirmar, escribí *CONFIRMAR*.

Para cancelar, escribí *cancelar*.`
    }
  }

  // Create the appointment
  const result = await createWhatsAppAppointment(pending, phoneNumber)

  if (!result.success) {
    return {
      handled: true,
      response: templates.appointmentError(result.error || 'Error desconocido')
    }
  }

  // Clear pending and reset state
  await updateConversation(conversation.id, {
    conversation_state: 'idle',
    pending_appointment: null
  })

  return {
    handled: true,
    response: templates.appointmentSuccess(
      result.appointmentId || '',
      pending.branch_name || '',
      pending.preferred_date || '',
      pending.preferred_time || ''
    ),
    newState: 'idle',
    pendingAppointment: null
  }
}

// ============================================================================
// NAVIGATION HANDLERS
// ============================================================================

/**
 * Get previous state for go back navigation
 */
function getPreviousState(currentState: AppointmentFlowState): AppointmentFlowState | 'idle' {
  const stateOrder: (AppointmentFlowState | 'idle')[] = [
    'idle',
    'apt_province',
    'apt_branch',
    'apt_service',
    'apt_date',
    'apt_time',
    'apt_contact',
    'apt_confirm'
  ]

  const currentIndex = stateOrder.indexOf(currentState)
  if (currentIndex <= 0) return 'idle'
  return stateOrder[currentIndex - 1]
}

/**
 * Handle go back command
 */
async function handleGoBack(
  conversation: WhatsAppConversation,
  currentState: AppointmentFlowState,
  pending: PendingAppointment
): Promise<StateResult> {
  const prevState = getPreviousState(currentState)

  if (prevState === 'idle') {
    return handleCancel(conversation)
  }

  // Clear relevant pending data based on the state we're going back to
  let updatedPending = { ...pending }

  switch (prevState) {
    case 'apt_province':
      updatedPending = {
        selected_services: [],
        customer_phone: pending.customer_phone,
        started_at: pending.started_at
      }
      break
    case 'apt_branch':
      updatedPending.branch_id = undefined
      updatedPending.branch_name = undefined
      updatedPending.selected_services = []
      break
    case 'apt_service':
      updatedPending.preferred_date = undefined
      break
    case 'apt_date':
      updatedPending.preferred_time = undefined
      break
    case 'apt_time':
      updatedPending.customer_name = undefined
      break
  }

  await updateConversation(conversation.id, {
    conversation_state: prevState as AppointmentFlowState,
    pending_appointment: updatedPending
  })

  // Generate response for the previous state
  let response: string

  switch (prevState) {
    case 'apt_province':
      response = templates.welcomeAndProvinces()
      break
    case 'apt_branch': {
      const branches = await getBranchesByProvince(pending.province || '')
      const province = PROVINCES.find(p => p.id === pending.province)
      response = templates.branchSelection(province?.name || '', branches)
      break
    }
    case 'apt_service':
      response = templates.serviceSelection(getServices())
      break
    case 'apt_date':
      response = templates.dateSelection(getAvailableDates())
      break
    case 'apt_time': {
      const slots = await getAvailableSlots(pending.branch_id || '', pending.preferred_date || '')
      const dates = getAvailableDates()
      const dateInfo = dates.find(d => d.date === pending.preferred_date)
      response = templates.timeSelection(dateInfo?.dayName || '', slots)
      break
    }
    case 'apt_contact':
      response = templates.contactPrompt()
      break
    default:
      response = templates.welcomeAndProvinces()
  }

  return {
    handled: true,
    response,
    newState: prevState as AppointmentFlowState,
    pendingAppointment: updatedPending
  }
}

/**
 * Handle cancel command
 */
async function handleCancel(
  conversation: WhatsAppConversation
): Promise<StateResult> {
  await updateConversation(conversation.id, {
    conversation_state: 'idle',
    pending_appointment: null
  })

  return {
    handled: true,
    response: templates.bookingCancelled(),
    newState: 'idle',
    pendingAppointment: null
  }
}
