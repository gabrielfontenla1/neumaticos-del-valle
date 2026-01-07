/**
 * Appointment Service for WhatsApp Bot
 * Handles appointment booking flow, integrating with existing appointment system
 */

import { createClient } from '@supabase/supabase-js'
import {
  getBranches,
  checkAvailability,
  createAppointment,
  getAppointmentsByDate
} from '@/features/appointments/api'
import { SERVICES, TIME_SLOTS } from '@/features/appointments/types'
import type { Branch, Service, AppointmentFormData } from '@/features/appointments/types'
import type { PendingAppointment } from '../types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// PROVINCES
// ============================================================================

export interface Province {
  id: string
  name: string
}

export const PROVINCES: Province[] = [
  { id: 'catamarca', name: 'Catamarca' },
  { id: 'santiago', name: 'Santiago del Estero' },
  { id: 'salta', name: 'Salta' },
  { id: 'tucuman', name: 'Tucumán' }
]

/**
 * Parse user input for province selection
 * Supports: number (1-4), province name, partial match
 */
export function parseProvinceInput(input: string): Province | null {
  const normalized = input.toLowerCase().trim()

  // Try number selection (1-4)
  const num = parseInt(normalized)
  if (num >= 1 && num <= PROVINCES.length) {
    return PROVINCES[num - 1]
  }

  // Try exact or partial match
  for (const province of PROVINCES) {
    const provinceName = province.name.toLowerCase()
    if (provinceName === normalized || provinceName.includes(normalized) || normalized.includes(provinceName)) {
      return province
    }
  }

  // Common variations
  const variations: Record<string, string> = {
    'sgo': 'santiago',
    'stgo': 'santiago',
    'tucuman': 'tucuman',
    'tuc': 'tucuman',
    'cat': 'catamarca',
    'salta': 'salta'
  }

  if (variations[normalized]) {
    return PROVINCES.find(p => p.id === variations[normalized]) || null
  }

  return null
}

// ============================================================================
// BRANCHES
// ============================================================================

/**
 * Get branches filtered by province
 */
export async function getBranchesByProvince(province: string): Promise<Branch[]> {
  try {
    const result = await getBranches()
    if ('error' in result) {
      console.error('[AppointmentService] Error getting branches:', result.error)
      return []
    }

    // Filter by province (case-insensitive match)
    const normalizedProvince = province.toLowerCase()
    return (result.data || []).filter(branch => {
      const branchProvince = (branch.province || '').toLowerCase()
      return branchProvince.includes(normalizedProvince) || normalizedProvince.includes(branchProvince)
    })
  } catch (error) {
    console.error('[AppointmentService] Error getting branches:', error)
    return []
  }
}

/**
 * Parse user input for branch selection
 * Supports: number, branch name, partial match
 */
export function parseBranchInput(input: string, branches: Branch[]): Branch | null {
  const normalized = input.toLowerCase().trim()

  // Try number selection
  const num = parseInt(normalized)
  if (num >= 1 && num <= branches.length) {
    return branches[num - 1]
  }

  // Try exact or partial match on name
  for (const branch of branches) {
    const branchName = branch.name.toLowerCase()
    if (branchName === normalized || branchName.includes(normalized)) {
      return branch
    }
  }

  return null
}

// ============================================================================
// SERVICES
// ============================================================================

/**
 * Get all available services
 */
export function getServices(): Service[] {
  return SERVICES
}

/**
 * Get service by ID
 */
export function getServiceById(serviceId: string): Service | undefined {
  return SERVICES.find(s => s.id === serviceId)
}

/**
 * Parse user input for service selection
 * Supports: number, service name, service ID, multiple services comma-separated
 * Returns array of service IDs
 */
export function parseServiceInput(input: string, currentServices: string[] = []): {
  services: string[]
  isComplete: boolean  // true if user typed "listo" or similar
} {
  const normalized = input.toLowerCase().trim()

  // Check for completion keywords
  const completionKeywords = ['listo', 'terminé', 'ok', 'continuar', 'siguiente', 'ready', 'done']
  if (completionKeywords.includes(normalized)) {
    return { services: currentServices, isComplete: true }
  }

  // Try number selection
  const num = parseInt(normalized)
  if (num >= 1 && num <= SERVICES.length) {
    const serviceId = SERVICES[num - 1].id
    if (!currentServices.includes(serviceId)) {
      return { services: [...currentServices, serviceId], isComplete: false }
    }
    return { services: currentServices, isComplete: false }
  }

  // Try service ID or name match
  for (const service of SERVICES) {
    const serviceName = service.name.toLowerCase()
    const serviceId = service.id.toLowerCase()
    if (serviceId === normalized || serviceName === normalized || serviceName.includes(normalized)) {
      if (!currentServices.includes(service.id)) {
        return { services: [...currentServices, service.id], isComplete: false }
      }
      return { services: currentServices, isComplete: false }
    }
  }

  return { services: currentServices, isComplete: false }
}

/**
 * Format price in Argentine Pesos
 */
export function formatPrice(price: number): string {
  if (price === 0) return 'GRATIS'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// ============================================================================
// DATES
// ============================================================================

export interface AvailableDate {
  date: string      // YYYY-MM-DD
  dayName: string   // "Lunes 15/01"
  dayOfWeek: number // 0-6
}

/**
 * Get available dates for the next 7 days (excluding Sundays)
 */
export function getAvailableDates(): AvailableDate[] {
  const dates: AvailableDate[] = []
  const today = new Date()

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  for (let i = 0; i < 10 && dates.length < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    const dayOfWeek = date.getDay()

    // Skip Sundays
    if (dayOfWeek === 0) continue

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    dates.push({
      date: `${year}-${month}-${day}`,
      dayName: `${dayNames[dayOfWeek]} ${day}/${month}`,
      dayOfWeek
    })
  }

  return dates
}

/**
 * Parse user input for date selection
 * Supports: number (1-7), date format DD/MM
 */
export function parseDateInput(input: string, availableDates: AvailableDate[]): AvailableDate | null {
  const normalized = input.toLowerCase().trim()

  // Try number selection (1-7)
  const num = parseInt(normalized)
  if (num >= 1 && num <= availableDates.length) {
    return availableDates[num - 1]
  }

  // Try DD/MM format
  const dateMatch = normalized.match(/(\d{1,2})\/(\d{1,2})/)
  if (dateMatch) {
    const day = String(parseInt(dateMatch[1])).padStart(2, '0')
    const month = String(parseInt(dateMatch[2])).padStart(2, '0')
    const matchPattern = `${day}/${month}`

    for (const date of availableDates) {
      if (date.dayName.includes(matchPattern)) {
        return date
      }
    }
  }

  // Try day name
  const dayNames: Record<string, number> = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
  }

  for (const [dayName, dayNum] of Object.entries(dayNames)) {
    if (normalized.includes(dayName)) {
      const foundDate = availableDates.find(d => d.dayOfWeek === dayNum)
      if (foundDate) return foundDate
    }
  }

  return null
}

// ============================================================================
// TIME SLOTS
// ============================================================================

/**
 * Get available time slots for a branch on a specific date
 * Filters out slots that are full (2 appointments) or past (for today)
 */
export async function getAvailableSlots(branchId: string, date: string): Promise<string[]> {
  try {
    // Get all appointments for the date
    const result = await getAppointmentsByDate(branchId, date)
    if ('error' in result) {
      console.error('[AppointmentService] Error getting appointments:', result.error)
      return TIME_SLOTS
    }

    // Count appointments per slot
    const slotCounts: Record<string, number> = {}
    const appointments = 'data' in result ? (result.data || []) : []
    for (const apt of appointments) {
      const time = (apt as { preferred_time?: string }).preferred_time
      if (time) {
        slotCounts[time] = (slotCounts[time] || 0) + 1
      }
    }

    // Filter available slots
    const today = new Date()
    const isToday = date === today.toISOString().split('T')[0]
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()

    // Check if it's Saturday (different hours)
    const dateObj = new Date(date)
    const isSaturday = dateObj.getDay() === 6
    const maxSlot = isSaturday ? '13:00' : '17:30'

    return TIME_SLOTS.filter(slot => {
      // Check if slot is full (max 2 per slot)
      if ((slotCounts[slot] || 0) >= 2) return false

      // Check if slot is past (for today)
      if (isToday) {
        const [slotHour, slotMinute] = slot.split(':').map(Number)
        if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
          return false
        }
      }

      // Check Saturday hours (only until 13:00)
      if (slot > maxSlot) return false

      return true
    })
  } catch (error) {
    console.error('[AppointmentService] Error getting available slots:', error)
    return TIME_SLOTS
  }
}

/**
 * Parse user input for time selection
 * Supports: number, time format HH:MM
 */
export function parseTimeInput(input: string, availableSlots: string[]): string | null {
  const normalized = input.toLowerCase().trim()

  // Try number selection
  const num = parseInt(normalized)
  if (num >= 1 && num <= availableSlots.length) {
    return availableSlots[num - 1]
  }

  // Try HH:MM format or HH format
  const timeMatch = normalized.match(/(\d{1,2}):?(\d{2})?/)
  if (timeMatch) {
    const hour = String(parseInt(timeMatch[1])).padStart(2, '0')
    const minute = timeMatch[2] ? timeMatch[2] : '00'
    const timeStr = `${hour}:${minute}`

    if (availableSlots.includes(timeStr)) {
      return timeStr
    }

    // Try to find closest match
    const halfHour = parseInt(minute) < 30 ? '00' : '30'
    const altTime = `${hour}:${halfHour}`
    if (availableSlots.includes(altTime)) {
      return altTime
    }
  }

  return null
}

// ============================================================================
// APPOINTMENT CREATION
// ============================================================================

export interface CreateAppointmentResult {
  success: boolean
  appointmentId?: string
  error?: string
}

/**
 * Create appointment from WhatsApp pending data
 */
export async function createWhatsAppAppointment(
  pending: PendingAppointment,
  phoneNumber: string
): Promise<CreateAppointmentResult> {
  try {
    // Validate required fields
    if (!pending.branch_id || !pending.preferred_date || !pending.preferred_time || !pending.customer_name) {
      return { success: false, error: 'Datos incompletos' }
    }

    if (pending.selected_services.length === 0) {
      return { success: false, error: 'No se seleccionaron servicios' }
    }

    // Check availability one more time
    const availability = await checkAvailability(
      pending.branch_id,
      pending.preferred_date,
      pending.preferred_time
    )

    if ('error' in availability) {
      return { success: false, error: 'Error verificando disponibilidad' }
    }

    if (!availability.available) {
      return { success: false, error: 'El horario ya no está disponible' }
    }

    // Build form data for createAppointment
    const formData: AppointmentFormData = {
      customer_name: pending.customer_name,
      customer_phone: phoneNumber,
      branch_id: pending.branch_id,
      selectedServices: pending.selected_services,
      preferred_date: pending.preferred_date,
      preferred_time: pending.preferred_time,
      notes: `Reservado via WhatsApp`
    }

    // Create appointment
    const result = await createAppointment(formData)

    if ('error' in result && result.error) {
      return { success: false, error: result.error as string }
    }

    if (!('data' in result) || !result.data) {
      return { success: false, error: 'Error al crear el turno' }
    }

    return {
      success: true,
      appointmentId: (result.data as { id: string }).id
    }
  } catch (error) {
    console.error('[AppointmentService] Error creating appointment:', error)
    return { success: false, error: 'Error interno al crear el turno' }
  }
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Check if user wants to go back
 */
export function isGoBackCommand(input: string): boolean {
  const normalized = input.toLowerCase().trim()
  const backKeywords = ['volver', 'atras', 'atrás', 'back', 'anterior', 'regresar']
  return backKeywords.includes(normalized)
}

/**
 * Check if user wants to cancel
 */
export function isCancelCommand(input: string): boolean {
  const normalized = input.toLowerCase().trim()
  const cancelKeywords = ['cancelar', 'salir', 'exit', 'cancel', 'no', 'terminar']
  return cancelKeywords.includes(normalized)
}

/**
 * Check if user wants to confirm
 */
export function isConfirmCommand(input: string): boolean {
  const normalized = input.toLowerCase().trim()
  const confirmKeywords = ['confirmar', 'si', 'sí', 'yes', 'ok', 'dale', 'confirmo', 'acepto']
  return confirmKeywords.includes(normalized)
}
