/**
 * Appointment Flow Module
 *
 * Maneja el flujo conversacional de reserva de turnos vía WhatsApp
 */

// Types
export type {
  AppointmentFlowState,
  AppointmentFlowData,
  FlowTransitionResult,
  ContactInfo,
  TimeSlot,
  Branch,
  AppointmentService,
  ParsedDate,
  ServiceMatch,
  BranchMatch
} from './types'

export { APPOINTMENT_CONFIG } from './types'

// State Machine (main entry point)
export {
  processAppointmentFlow,
  isAppointmentFlowActive
} from './state-machine'

// Repository
export {
  getAppointmentFlowState,
  updateAppointmentFlowState,
  clearAppointmentFlowState,
  createAppointmentFromWhatsApp,
  hasExistingAppointment,
  getCustomerAppointments
} from './repository'

// Parsers
export {
  parseNaturalDate,
  parseTimeFromMessage,
  isWorkingDay
} from './date-parser'

// Matchers
export {
  matchService,
  getAvailableServices,
  findSimilarServices
} from './service-matcher'

export {
  matchBranch,
  getAvailableBranches,
  getBranchById
} from './branch-matcher'

// Slots
export {
  getAvailableSlots,
  isSlotAvailable,
  findNextAvailableSlot,
  findClosestSlot,
  formatSlotsForWhatsApp
} from './slot-formatter'

// Messages
export {
  isCancelIntent,
  isConfirmIntent,
  formatDateForDisplay
} from './messages'
