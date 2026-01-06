/**
 * Tipos para el flujo de reserva de turnos vía WhatsApp
 */

// Estados del flujo conversacional
export type AppointmentFlowState =
  | 'idle'
  | 'awaiting_branch'
  | 'awaiting_service'
  | 'awaiting_date'
  | 'awaiting_time'
  | 'awaiting_confirmation'
  | 'completed'

// Datos acumulados durante el flujo
export interface AppointmentFlowData {
  state: AppointmentFlowState
  branchId?: string
  branchName?: string
  serviceId?: string
  serviceName?: string
  serviceDuration?: number    // Duración en minutos
  selectedDate?: string       // YYYY-MM-DD
  selectedTime?: string       // HH:MM
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  lastUpdated: string         // ISO timestamp
  attempts: number            // Para timeout/abandono
  startedAt: string           // Inicio del flujo
}

// Resultado de una transición de estado
export interface FlowTransitionResult {
  newState: AppointmentFlowState
  responseMessage: string
  flowData: AppointmentFlowData
  appointmentCreated?: boolean
  appointmentId?: string
  shouldEscalate?: boolean
  escalationReason?: string
}

// Información de contacto del cliente
export interface ContactInfo {
  name?: string
  phone?: string
  email?: string
}

// Slot de tiempo disponible
export interface TimeSlot {
  time: string          // HH:MM
  available: boolean
  reason?: string       // Razón si no está disponible
}

// Sucursal/Branch
export interface Branch {
  id: string
  name: string
  address: string
  phone?: string
  isActive: boolean
}

// Servicio
export interface AppointmentService {
  id: string
  name: string
  description?: string
  duration: number      // Duración en minutos
  price?: number
  isActive: boolean
}

// Resultado del parser de fechas
export interface ParsedDate {
  date: Date
  dateString: string    // YYYY-MM-DD
  displayText: string   // "Viernes 17/01"
  isWeekend: boolean
  isSunday: boolean
  isPast: boolean
}

// Match de servicio
export interface ServiceMatch {
  service: AppointmentService
  confidence: number    // 0-1
  matchedOn: string     // Qué término matcheó
}

// Match de sucursal
export interface BranchMatch {
  branch: Branch
  confidence: number
  matchedOn: string
}

// Configuración del sistema de turnos
export const APPOINTMENT_CONFIG = {
  // Horarios de atención
  workingHours: {
    start: '09:00',
    end: '17:30',
    lunchStart: '13:00',
    lunchEnd: '14:00'
  },
  // Días de trabajo (0 = Domingo, 6 = Sábado)
  workingDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
  // Duración de slot por defecto
  defaultSlotDuration: 30, // minutos
  // Máximo turnos por slot
  maxAppointmentsPerSlot: 2,
  // Timeout del flujo
  flowTimeoutMinutes: 10,
  // Días máximos para reservar
  maxDaysAhead: 30
} as const
