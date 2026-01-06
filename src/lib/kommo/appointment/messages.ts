/**
 * Templates de mensajes WhatsApp para el flujo de turnos
 * Optimizados para formato corto y conversacional
 */

import type { Branch, AppointmentService, TimeSlot, AppointmentFlowData } from './types'

// ============================================================================
// MENSAJES DE INICIO
// ============================================================================

export function getWelcomeMessage(): string {
  return `¡Hola! Te ayudo a agendar un turno 📅

¿En qué sucursal preferís atenderte?`
}

// ============================================================================
// MENSAJES DE SUCURSAL
// ============================================================================

export function formatBranchList(branches: Branch[]): string {
  const branchList = branches
    .filter(b => b.isActive)
    .map((b, i) => `${i + 1}️⃣ ${b.name}`)
    .join('\n')

  return branchList
}

export function getAskBranchMessage(branches: Branch[]): string {
  return `${getWelcomeMessage()}

${formatBranchList(branches)}`
}

export function getBranchConfirmMessage(branchName: string): string {
  return `Perfecto, ${branchName} 👍`
}

export function getBranchNotFoundMessage(branches: Branch[]): string {
  return `No encontré esa sucursal. ¿Cuál preferís?

${formatBranchList(branches)}`
}

// ============================================================================
// MENSAJES DE SERVICIO
// ============================================================================

export function formatServiceList(services: AppointmentService[]): string {
  const serviceList = services
    .filter(s => s.isActive)
    .slice(0, 6) // Mostrar máximo 6 para no saturar
    .map(s => `• ${s.name}`)
    .join('\n')

  const hasMore = services.filter(s => s.isActive).length > 6

  return hasMore ? `${serviceList}\n(y más...)` : serviceList
}

export function getAskServiceMessage(services: AppointmentService[]): string {
  return `¿Qué servicio necesitás?

${formatServiceList(services)}`
}

export function getServiceConfirmMessage(serviceName: string): string {
  return `${serviceName}, anotado ✅`
}

export function getServiceNotFoundMessage(services: AppointmentService[]): string {
  return `No encontré ese servicio. ¿Cuál necesitás?

${formatServiceList(services)}`
}

// ============================================================================
// MENSAJES DE FECHA
// ============================================================================

export function getAskDateMessage(): string {
  return `¿Qué día te queda cómodo? 📅

Podés decirme "mañana", "el lunes", o una fecha como "15/01"`
}

export function getDateConfirmMessage(displayDate: string): string {
  return `${displayDate}, perfecto 👌`
}

export function getDatePastMessage(): string {
  return `Esa fecha ya pasó 😅 ¿Qué otro día te queda bien?`
}

export function getSundayMessage(): string {
  return `Los domingos no atendemos 🙏 ¿Te sirve el lunes o sábado?`
}

export function getDateTooFarMessage(): string {
  return `Solo puedo reservar hasta 30 días adelante. ¿Otra fecha más cercana?`
}

export function getInvalidDateMessage(): string {
  return `No entendí la fecha 🤔

Podés decirme:
• "mañana" o "pasado mañana"
• "el lunes", "el viernes"
• "15/01" o "15 de enero"`
}

// ============================================================================
// MENSAJES DE HORARIO
// ============================================================================

export function formatTimeSlots(slots: TimeSlot[]): string {
  const availableSlots = slots.filter(s => s.available)

  if (availableSlots.length === 0) {
    return '(sin horarios disponibles)'
  }

  // Mostrar máximo 8 slots
  return availableSlots
    .slice(0, 8)
    .map(s => `🕐 ${s.time}`)
    .join('\n')
}

export function getShowSlotsMessage(displayDate: string, slots: TimeSlot[]): string {
  const availableSlots = slots.filter(s => s.available)

  if (availableSlots.length === 0) {
    return `😕 No hay turnos disponibles para ${displayDate}. ¿Querés probar con otra fecha?`
  }

  return `Horarios para ${displayDate}:

${formatTimeSlots(slots)}

¿Cuál preferís?`
}

export function getTimeConfirmMessage(time: string): string {
  return `${time} hs, anotado ✅`
}

export function getTimeNotFoundMessage(slots: TimeSlot[]): string {
  return `No encontré ese horario. Estos son los disponibles:

${formatTimeSlots(slots)}`
}

export function getNoSlotsMessage(): string {
  return `😕 No hay turnos disponibles para ese día. ¿Querés probar con otra fecha?`
}

// ============================================================================
// MENSAJES DE CONFIRMACIÓN
// ============================================================================

export function getConfirmationSummaryMessage(data: AppointmentFlowData): string {
  const dateParts = data.selectedDate?.split('-') || []
  const displayDate = dateParts.length === 3
    ? `${dateParts[2]}/${dateParts[1]}`
    : data.selectedDate

  return `📋 *Resumen de tu turno:*

🏪 ${data.branchName}
🔧 ${data.serviceName}
📅 ${displayDate}
🕐 ${data.selectedTime} hs

¿Confirmamos? (Sí/No)`
}

export function getSuccessMessage(appointmentId: string): string {
  // Formatear ID más corto para WhatsApp
  const shortId = appointmentId.slice(0, 8).toUpperCase()

  return `✅ ¡Listo! Tu turno quedó agendado.

Número: #${shortId}

¡Te esperamos! 🚗`
}

// ============================================================================
// MENSAJES DE CANCELACIÓN/ERROR
// ============================================================================

export function getCancelledMessage(): string {
  return `Entendido, cancelamos la reserva 👋

Si querés agendar después, escribime "turno"`
}

export function getTimeoutMessage(): string {
  return `Pasó un rato... ¿Seguís queriendo reservar turno?

Escribí "turno" para empezar de nuevo 📅`
}

export function getErrorMessage(): string {
  return `Ups, tuve un problema 😅

Te paso con un asesor para que te ayude con el turno.`
}

export function getEscalationMessage(): string {
  return `Te comunico con un asesor que te ayuda a agendar el turno 👤`
}

// ============================================================================
// HELPERS
// ============================================================================

export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00')
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const dayName = days[date.getDay()]
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')

  return `${dayName} ${day}/${month}`
}

// Detectar si el usuario quiere cancelar
export function isCancelIntent(message: string): boolean {
  const cancelPatterns = [
    /\b(cancelar?|no|salir|nada|dejá|olvida)\b/i,
    /^no$/i,
    /no\s*(quiero|gracias)/i
  ]
  return cancelPatterns.some(p => p.test(message))
}

// Detectar si el usuario confirma
export function isConfirmIntent(message: string): boolean {
  const confirmPatterns = [
    /^(si|sí|yes|ok|dale|listo|perfecto|confirmo|confirmado)$/i,
    /\b(si|sí|dale|ok)\b/i
  ]
  return confirmPatterns.some(p => p.test(message))
}
