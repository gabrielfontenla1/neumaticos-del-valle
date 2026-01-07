/**
 * WhatsApp Appointment Response Templates
 * Spanish-language responses for appointment booking flow
 */

import type { PendingAppointment } from '../types'
import type { Branch, Service } from '@/features/appointments/types'
import {
  PROVINCES,
  formatPrice,
  getServiceById,
  type AvailableDate
} from '../services/appointment-service'

// ============================================================================
// PROVINCE SELECTION
// ============================================================================

/**
 * Welcome message and province selection
 */
export function welcomeAndProvinces(): string {
  const provinceList = PROVINCES.map((p, i) => `${i + 1}. ${p.name}`).join('\n')

  return `*Reservar Turno*

Te ayudo a agendar un turno en nuestras sucursales.

*Seleccioná tu provincia:*
${provinceList}

_Escribí el número o nombre de tu provincia_`
}

/**
 * Province not recognized
 */
export function provinceNotRecognized(): string {
  const provinceList = PROVINCES.map((p, i) => `${i + 1}. ${p.name}`).join('\n')

  return `No reconocí esa provincia.

*Provincias disponibles:*
${provinceList}

_Escribí el número (1-4) o el nombre_`
}

// ============================================================================
// BRANCH SELECTION
// ============================================================================

/**
 * Branch selection after province
 */
export function branchSelection(provinceName: string, branches: Branch[]): string {
  if (branches.length === 0) {
    return `No tenemos sucursales activas en ${provinceName} en este momento.

_Escribí "volver" para elegir otra provincia_`
  }

  const branchList = branches.map((b, i) =>
    `${i + 1}. *${b.name}*\n   📍 ${b.address}`
  ).join('\n\n')

  return `Sucursales en *${provinceName}*:

${branchList}

_Escribí el número o nombre de la sucursal_`
}

/**
 * Branch not recognized
 */
export function branchNotRecognized(branches: Branch[]): string {
  const branchList = branches.map((b, i) => `${i + 1}. ${b.name}`).join('\n')

  return `No reconocí esa sucursal.

*Opciones:*
${branchList}

_Escribí el número o "volver" para cambiar provincia_`
}

// ============================================================================
// SERVICE SELECTION
// ============================================================================

/**
 * Service selection (multi-select)
 */
export function serviceSelection(services: Service[]): string {
  const serviceList = services.map((s, i) =>
    `${i + 1}. *${s.name}* - ${formatPrice(s.price)}\n   _${s.duration} min_`
  ).join('\n\n')

  return `*Servicios disponibles:*

${serviceList}

Podés elegir *varios servicios*.
_Escribí el número de cada servicio y después "listo"_`
}

/**
 * Service added confirmation
 */
export function serviceAdded(service: Service, selectedServices: string[]): string {
  const selectedList = selectedServices.map(id => {
    const s = getServiceById(id)
    return s ? `• ${s.name}` : null
  }).filter(Boolean).join('\n')

  return `Agregado: *${service.name}*

*Servicios seleccionados:*
${selectedList}

_Escribí otro número para agregar más, o "listo" para continuar_`
}

/**
 * Service not recognized
 */
export function serviceNotRecognized(services: Service[]): string {
  const serviceList = services.map((s, i) => `${i + 1}. ${s.name}`).join('\n')

  return `No reconocí ese servicio.

*Opciones:*
${serviceList}

_Escribí el número o "listo" para continuar_`
}

/**
 * No services selected warning
 */
export function noServicesSelected(): string {
  return `Tenés que elegir al menos un servicio.

_Escribí el número del servicio que querés_`
}

// ============================================================================
// DATE SELECTION
// ============================================================================

/**
 * Date selection
 */
export function dateSelection(dates: AvailableDate[]): string {
  const dateList = dates.map((d, i) => `${i + 1}. ${d.dayName}`).join('\n')

  return `*Elegí el día:*

${dateList}

_Escribí el número o la fecha (ej: 15/01)_`
}

/**
 * Date not recognized
 */
export function dateNotRecognized(dates: AvailableDate[]): string {
  const dateList = dates.map((d, i) => `${i + 1}. ${d.dayName}`).join('\n')

  return `No reconocí esa fecha.

*Días disponibles:*
${dateList}

_Escribí el número (1-${dates.length})_`
}

// ============================================================================
// TIME SELECTION
// ============================================================================

/**
 * Time slot selection
 */
export function timeSelection(dateName: string, slots: string[]): string {
  if (slots.length === 0) {
    return `No hay horarios disponibles para el ${dateName}.

_Escribí "volver" para elegir otro día_`
  }

  // Group slots in rows of 4 for better display
  const rows: string[] = []
  for (let i = 0; i < slots.length; i += 4) {
    const row = slots.slice(i, i + 4)
      .map((s, j) => `${i + j + 1}. ${s}`)
      .join('  |  ')
    rows.push(row)
  }

  return `*Horarios disponibles - ${dateName}:*

${rows.join('\n')}

_Escribí el número o la hora (ej: 10:30)_`
}

/**
 * Time not recognized
 */
export function timeNotRecognized(slots: string[]): string {
  const slotList = slots.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('  |  ')
  const more = slots.length > 6 ? `\n_...y ${slots.length - 6} más_` : ''

  return `No reconocí ese horario.

*Horarios:*
${slotList}${more}

_Escribí el número o la hora_`
}

/**
 * Slot unavailable with alternatives
 */
export function slotUnavailable(requestedTime: string, alternatives: string[]): string {
  const altList = alternatives.slice(0, 4).join(', ')

  return `El horario ${requestedTime} ya está ocupado.

*Horarios cercanos disponibles:*
${altList}

_Escribí otro horario o "volver" para otro día_`
}

// ============================================================================
// CONTACT INFO
// ============================================================================

/**
 * Contact name prompt
 */
export function contactPrompt(): string {
  return `*Último paso*

Decime tu *nombre completo* para la reserva.`
}

/**
 * Name too short
 */
export function nameTooShort(): string {
  return `El nombre es muy corto.

_Por favor escribí tu nombre completo_`
}

// ============================================================================
// CONFIRMATION
// ============================================================================

/**
 * Confirmation summary
 */
export function confirmationSummary(pending: PendingAppointment): string {
  const serviceList = pending.selected_services.map(id => {
    const s = getServiceById(id)
    return s ? `• ${s.name} - ${formatPrice(s.price)}` : null
  }).filter(Boolean).join('\n')

  // Calculate total
  const total = pending.selected_services.reduce((sum, id) => {
    const s = getServiceById(id)
    return sum + (s?.price || 0)
  }, 0)

  // Format date
  const [year, month, day] = (pending.preferred_date || '').split('-')
  const dateFormatted = `${day}/${month}/${year}`

  return `*Resumen de tu turno:*

Sucursal: *${pending.branch_name}*
Fecha: *${dateFormatted}*
Hora: *${pending.preferred_time}*
Nombre: *${pending.customer_name}*

*Servicios:*
${serviceList}

*Total estimado: ${formatPrice(total)}*

_Escribí "CONFIRMAR" para reservar o "cancelar" para anular_`
}

// ============================================================================
// SUCCESS / ERROR
// ============================================================================

/**
 * Appointment confirmed successfully
 */
export function appointmentSuccess(appointmentId: string, branchName: string, date: string, time: string): string {
  const [year, month, day] = date.split('-')
  const dateFormatted = `${day}/${month}/${year}`

  return `*TURNO CONFIRMADO*

Tu turno ha sido reservado con éxito.

Sucursal: *${branchName}*
Fecha: *${dateFormatted}*
Hora: *${time}*

_Te esperamos! Recordá llegar 5 minutos antes._

Si necesitás cancelar o modificar, contactanos por este medio.`
}

/**
 * Appointment creation failed
 */
export function appointmentError(reason: string): string {
  return `Hubo un problema al crear el turno.

_${reason}_

_Escribí "turno" para intentar de nuevo_`
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Booking cancelled
 */
export function bookingCancelled(): string {
  return `Reserva cancelada.

_Escribí "turno" si querés empezar de nuevo_`
}

/**
 * Generic help during booking
 */
export function bookingHelp(): string {
  return `*Comandos disponibles:*

• "volver" - Ir al paso anterior
• "cancelar" - Cancelar la reserva

_Seguí los pasos para completar tu turno_`
}
