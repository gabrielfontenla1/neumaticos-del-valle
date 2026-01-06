/**
 * Manejo de slots de tiempo y disponibilidad
 */

import { createClient } from '@supabase/supabase-js'
import type { TimeSlot } from './types'
import { APPOINTMENT_CONFIG } from './types'

// Cliente Supabase sin tipos estrictos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// GENERACIÓN DE SLOTS
// ============================================================================

/**
 * Genera todos los slots posibles para un día
 */
export function generateDaySlots(date: string): TimeSlot[] {
  const slots: TimeSlot[] = []
  const { start, end, lunchStart, lunchEnd } = APPOINTMENT_CONFIG.workingHours
  const slotDuration = APPOINTMENT_CONFIG.defaultSlotDuration

  let currentTime = parseTime(start)
  const endTime = parseTime(end)
  const lunchStartTime = parseTime(lunchStart)
  const lunchEndTime = parseTime(lunchEnd)

  while (currentTime < endTime) {
    const timeString = formatTime(currentTime)

    // Verificar si está en horario de almuerzo
    const isLunchTime = currentTime >= lunchStartTime && currentTime < lunchEndTime

    if (!isLunchTime) {
      slots.push({
        time: timeString,
        available: true // Por defecto disponible, se actualiza después
      })
    }

    currentTime += slotDuration
  }

  return slots
}

/**
 * Obtiene slots disponibles para una fecha y sucursal específica
 */
export async function getAvailableSlots(
  branchId: string,
  date: string,
  serviceDuration: number = 30
): Promise<TimeSlot[]> {
  // Generar todos los slots posibles
  const allSlots = generateDaySlots(date)

  // Obtener turnos existentes para ese día y sucursal
  const { data: existingAppointments, error } = await db
    .from('appointments')
    .select('appointment_time')
    .eq('store_id', branchId)
    .eq('appointment_date', date)
    .not('status', 'in', '("cancelled","no_show")')

  if (error) {
    console.error('[SlotFormatter] Error fetching appointments:', error)
    return allSlots // Retornar todos como disponibles si hay error
  }

  // Contar cuántos turnos hay en cada slot
  const appointmentCounts: Record<string, number> = {}
  for (const apt of (existingAppointments || []) as Array<{ appointment_time: string | null }>) {
    const time = apt.appointment_time?.slice(0, 5) // "HH:MM"
    if (time) {
      appointmentCounts[time] = (appointmentCounts[time] || 0) + 1
    }
  }

  // Marcar slots no disponibles si superan el máximo
  const maxPerSlot = APPOINTMENT_CONFIG.maxAppointmentsPerSlot

  return allSlots.map(slot => {
    const count = appointmentCounts[slot.time] || 0
    const available = count < maxPerSlot

    return {
      ...slot,
      available,
      reason: available ? undefined : 'Horario completo'
    }
  })
}

/**
 * Verifica si un slot específico está disponible
 */
export async function isSlotAvailable(
  branchId: string,
  date: string,
  time: string
): Promise<boolean> {
  const slots = await getAvailableSlots(branchId, date)
  const slot = slots.find(s => s.time === time)
  return slot?.available ?? false
}

/**
 * Encuentra el próximo slot disponible a partir de una fecha
 */
export async function findNextAvailableSlot(
  branchId: string,
  startDate: string,
  maxDays: number = 7
): Promise<{ date: string; time: string } | null> {
  const startDateObj = new Date(startDate + 'T12:00:00')

  for (let i = 0; i < maxDays; i++) {
    const checkDate = new Date(startDateObj)
    checkDate.setDate(checkDate.getDate() + i)

    // Saltar domingos
    if (checkDate.getDay() === 0) continue

    const dateString = formatDate(checkDate)
    const slots = await getAvailableSlots(branchId, dateString)
    const availableSlot = slots.find(s => s.available)

    if (availableSlot) {
      return {
        date: dateString,
        time: availableSlot.time
      }
    }
  }

  return null
}

// ============================================================================
// MATCHING DE HORARIO
// ============================================================================

/**
 * Encuentra el slot más cercano al horario solicitado
 */
export function findClosestSlot(
  requestedTime: string,
  availableSlots: TimeSlot[]
): TimeSlot | null {
  const available = availableSlots.filter(s => s.available)
  if (available.length === 0) return null

  const requestedMinutes = parseTime(requestedTime)

  // Buscar coincidencia exacta primero
  const exactMatch = available.find(s => s.time === requestedTime)
  if (exactMatch) return exactMatch

  // Buscar el más cercano
  let closestSlot = available[0]
  let closestDiff = Math.abs(parseTime(closestSlot.time) - requestedMinutes)

  for (const slot of available) {
    const diff = Math.abs(parseTime(slot.time) - requestedMinutes)
    if (diff < closestDiff) {
      closestDiff = diff
      closestSlot = slot
    }
  }

  // Solo retornar si está dentro de 30 minutos de diferencia
  if (closestDiff <= 30) {
    return closestSlot
  }

  return null
}

/**
 * Parsea un string de hora a minutos desde medianoche
 */
export function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

/**
 * Formatea minutos desde medianoche a string HH:MM
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Formatea una fecha a YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============================================================================
// FORMATEO PARA DISPLAY
// ============================================================================

/**
 * Agrupa slots por período del día para mejor visualización
 */
export function groupSlotsByPeriod(slots: TimeSlot[]): {
  morning: TimeSlot[]   // 09:00 - 12:00
  afternoon: TimeSlot[] // 14:00 - 17:30
} {
  const morning = slots.filter(s => {
    const minutes = parseTime(s.time)
    return minutes >= parseTime('09:00') && minutes < parseTime('12:30')
  })

  const afternoon = slots.filter(s => {
    const minutes = parseTime(s.time)
    return minutes >= parseTime('14:00') && minutes <= parseTime('17:30')
  })

  return { morning, afternoon }
}

/**
 * Formatea slots para mensaje de WhatsApp
 */
export function formatSlotsForWhatsApp(slots: TimeSlot[]): string {
  const available = slots.filter(s => s.available)

  if (available.length === 0) {
    return 'No hay horarios disponibles'
  }

  // Mostrar máximo 8 slots para no saturar WhatsApp
  const toShow = available.slice(0, 8)

  return toShow
    .map(s => `🕐 ${s.time}`)
    .join('\n')
}
