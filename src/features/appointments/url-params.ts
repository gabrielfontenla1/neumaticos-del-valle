/**
 * Appointment URL Parameter Serialization System
 * Handles conversion between appointment data and URL parameters
 * for pre-filling the /turnos wizard from WhatsApp bot links
 */

import { TIME_SLOTS } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface AppointmentURLParams {
  branch_id?: string
  services?: string[]
  preferred_date?: string
  preferred_time?: string
  customer_name?: string
  customer_phone?: string
  source?: 'wa' | 'web'
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ============================================================================
// URL PARAM KEYS
// ============================================================================

const URL_PARAM_KEYS = {
  branch_id: 'branch',
  services: 'services',
  preferred_date: 'date',
  preferred_time: 'time',
  customer_name: 'name',
  customer_phone: 'phone',
  source: 'src',
} as const

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^\d{2}:\d{2}$/
// Service ID slug format: lowercase alphanumeric with hyphens
const SERVICE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}

function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false
  const date = new Date(value + 'T00:00:00')
  if (isNaN(date.getTime())) return false
  // Check it's not a Sunday (0 = Sunday)
  if (date.getDay() === 0) return false
  return true
}

function isFutureDate(value: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(value + 'T00:00:00')
  return date >= today
}

function isValidTime(value: string): boolean {
  if (!TIME_REGEX.test(value)) return false
  return TIME_SLOTS.includes(value)
}

function isValidServiceId(value: string): boolean {
  // Accept both slug format (new) and UUID format (legacy)
  return SERVICE_SLUG_REGEX.test(value) || UUID_REGEX.test(value)
}

function sanitizeName(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"'&]/g, '') // Strip dangerous chars
    .trim()
    .slice(0, 100)
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Minimal encode: only encode chars that are truly unsafe in query values.
 * Preserves , : / @ - _ . ~ which are safe and improve readability.
 */
function encodeQueryValue(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/&/g, '%26')
    .replace(/\+/g, '%2B')
    .replace(/=/g, '%3D')
    .replace(/ /g, '+')
}

/**
 * Serializes appointment data to a clean query string.
 * Uses minimal encoding to keep URLs readable (preserves , and : unencoded).
 */
export function serializeAppointmentToURL(data: AppointmentURLParams): string {
  const parts: string[] = []

  if (data.branch_id) {
    parts.push(`${URL_PARAM_KEYS.branch_id}=${data.branch_id}`)
  }

  if (data.services && data.services.length > 0) {
    parts.push(`${URL_PARAM_KEYS.services}=${data.services.join(',')}`)
  }

  if (data.preferred_date) {
    parts.push(`${URL_PARAM_KEYS.preferred_date}=${data.preferred_date}`)
  }

  if (data.preferred_time) {
    parts.push(`${URL_PARAM_KEYS.preferred_time}=${data.preferred_time}`)
  }

  if (data.customer_name) {
    parts.push(`${URL_PARAM_KEYS.customer_name}=${encodeQueryValue(data.customer_name)}`)
  }

  if (data.customer_phone) {
    parts.push(`${URL_PARAM_KEYS.customer_phone}=${data.customer_phone}`)
  }

  if (data.source) {
    parts.push(`${URL_PARAM_KEYS.source}=${data.source}`)
  }

  return parts.join('&')
}

// ============================================================================
// DESERIALIZATION
// ============================================================================

/**
 * Deserializes URL search parameters to appointment data
 * Returns null if no appointment params are found
 */
export function deserializeAppointmentFromURL(
  searchParams: URLSearchParams
): AppointmentURLParams | null {
  // Check if any appointment params exist
  const hasParams = Object.values(URL_PARAM_KEYS).some(key => searchParams.has(key))
  if (!hasParams) return null

  const result: AppointmentURLParams = {}

  const branchId = searchParams.get(URL_PARAM_KEYS.branch_id)
  if (branchId) {
    result.branch_id = branchId
  }

  const services = searchParams.get(URL_PARAM_KEYS.services)
  if (services) {
    result.services = services.split(',').filter(s => s.trim().length > 0)
  }

  const date = searchParams.get(URL_PARAM_KEYS.preferred_date)
  if (date) {
    result.preferred_date = date
  }

  const time = searchParams.get(URL_PARAM_KEYS.preferred_time)
  if (time) {
    result.preferred_time = time
  }

  const name = searchParams.get(URL_PARAM_KEYS.customer_name)
  if (name) {
    result.customer_name = sanitizeName(name)
  }

  const phone = searchParams.get(URL_PARAM_KEYS.customer_phone)
  if (phone) {
    result.customer_phone = phone.replace(/\D/g, '')
  }

  const source = searchParams.get(URL_PARAM_KEYS.source)
  if (source === 'wa' || source === 'web') {
    result.source = source
  }

  return result
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates appointment URL params and returns detailed errors
 */
export function validateAppointmentParams(params: AppointmentURLParams): ValidationResult {
  const errors: string[] = []

  if (params.branch_id && !isValidUUID(params.branch_id)) {
    errors.push('Sucursal inválida')
  }

  if (params.services) {
    const invalidServices = params.services.filter(s => !isValidServiceId(s))
    if (invalidServices.length > 0) {
      errors.push(`Formato de servicio inválido: ${invalidServices.join(', ')}`)
    }
  }

  if (params.preferred_date) {
    if (!isValidDate(params.preferred_date)) {
      errors.push('Fecha inválida o domingo')
    } else if (!isFutureDate(params.preferred_date)) {
      errors.push('La fecha ya pasó')
    }
  }

  if (params.preferred_time && !isValidTime(params.preferred_time)) {
    errors.push('Horario no disponible')
  }

  if (params.customer_name && params.customer_name.length < 2) {
    errors.push('Nombre muy corto')
  }

  if (params.customer_phone && !isValidPhone(params.customer_phone)) {
    errors.push('Teléfono inválido')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// URL BUILDER
// ============================================================================

/**
 * Builds a full appointment URL for sharing (e.g., from WhatsApp bot)
 * Uses NEXT_PUBLIC_SITE_URL from env config
 */
export function buildAppointmentURL(data: AppointmentURLParams): string {
  const queryString = serializeAppointmentToURL(data)
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

  if (queryString) {
    return `${baseUrl}/turnos?${queryString}`
  }

  return `${baseUrl}/turnos`
}
