/**
 * Parser de fechas en lenguaje natural para español argentino
 * Soporta expresiones como "mañana", "el lunes", "15/01", etc.
 */

import type { ParsedDate } from './types'
import { APPOINTMENT_CONFIG } from './types'

// ============================================================================
// CONSTANTES
// ============================================================================

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DAY_NAMES_DISPLAY = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

// ============================================================================
// PATRONES DE RECONOCIMIENTO
// ============================================================================

const PATTERNS = {
  // "hoy"
  today: /\b(hoy)\b/i,

  // "mañana"
  tomorrow: /\b(mañana)\b/i,

  // "pasado mañana"
  dayAfterTomorrow: /\b(pasado\s*mañana)\b/i,

  // "el lunes", "el próximo martes", "este viernes"
  weekday: /\b(el\s*)?(próximo\s*|este\s*)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i,

  // "la semana que viene"
  nextWeek: /\b(la\s*)?semana\s*que\s*viene\b/i,

  // "15/01", "15/1", "15/01/2025", "15-01"
  dateSlash: /\b(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?\b/,

  // "15 de enero", "15 enero"
  dateText: /\b(\d{1,2})\s*(?:de\s*)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i,

  // Solo número del 1-31 (asumimos día del mes actual o próximo)
  dayOnly: /^(\d{1,2})$/
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Parsea una expresión de fecha en lenguaje natural
 */
export function parseNaturalDate(input: string): ParsedDate | null {
  const normalized = input.toLowerCase().trim()
  const today = new Date()
  today.setHours(12, 0, 0, 0) // Normalizar a mediodía

  let resultDate: Date | null = null

  // 1. "hoy"
  if (PATTERNS.today.test(normalized)) {
    resultDate = new Date(today)
  }

  // 2. "mañana"
  else if (PATTERNS.tomorrow.test(normalized)) {
    resultDate = addDays(today, 1)
  }

  // 3. "pasado mañana"
  else if (PATTERNS.dayAfterTomorrow.test(normalized)) {
    resultDate = addDays(today, 2)
  }

  // 4. "la semana que viene" (próximo lunes)
  else if (PATTERNS.nextWeek.test(normalized)) {
    resultDate = getNextWeekday(today, 1) // Próximo lunes
  }

  // 5. "el lunes", "el próximo martes", etc.
  else if (PATTERNS.weekday.test(normalized)) {
    const match = normalized.match(PATTERNS.weekday)
    if (match) {
      const dayName = match[3].toLowerCase()
        .replace('á', 'a')
        .replace('é', 'e')
      const dayIndex = DAY_NAMES.indexOf(dayName)
      if (dayIndex !== -1) {
        resultDate = getNextWeekday(today, dayIndex)
      }
    }
  }

  // 6. "15/01" o "15-01-2025"
  else if (PATTERNS.dateSlash.test(normalized)) {
    const match = normalized.match(PATTERNS.dateSlash)
    if (match) {
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1 // 0-indexed
      let year = match[3] ? parseInt(match[3], 10) : today.getFullYear()

      // Si el año es de 2 dígitos, expandir
      if (year < 100) {
        year += 2000
      }

      // Si la fecha ya pasó este año, usar el próximo año
      const tentativeDate = new Date(year, month, day, 12, 0, 0)
      if (tentativeDate < today && !match[3]) {
        year++
      }

      resultDate = new Date(year, month, day, 12, 0, 0)
    }
  }

  // 7. "15 de enero"
  else if (PATTERNS.dateText.test(normalized)) {
    const match = normalized.match(PATTERNS.dateText)
    if (match) {
      const day = parseInt(match[1], 10)
      const monthName = match[2].toLowerCase()
      const monthIndex = MONTH_NAMES.indexOf(monthName)

      if (monthIndex !== -1) {
        let year = today.getFullYear()
        const tentativeDate = new Date(year, monthIndex, day, 12, 0, 0)

        // Si la fecha ya pasó, usar el próximo año
        if (tentativeDate < today) {
          year++
        }

        resultDate = new Date(year, monthIndex, day, 12, 0, 0)
      }
    }
  }

  // 8. Solo número (día del mes)
  else if (PATTERNS.dayOnly.test(normalized)) {
    const day = parseInt(normalized, 10)
    if (day >= 1 && day <= 31) {
      let year = today.getFullYear()
      let month = today.getMonth()

      // Si el día ya pasó este mes, usar el próximo mes
      if (day <= today.getDate()) {
        month++
        if (month > 11) {
          month = 0
          year++
        }
      }

      resultDate = new Date(year, month, day, 12, 0, 0)
    }
  }

  // Si no se pudo parsear, retornar null
  if (!resultDate || isNaN(resultDate.getTime())) {
    return null
  }

  // Validar que la fecha sea válida y dentro del rango permitido
  return validateAndFormatDate(resultDate, today)
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Agrega días a una fecha
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Obtiene el próximo día de la semana específico
 */
function getNextWeekday(fromDate: Date, targetDay: number): Date {
  const result = new Date(fromDate)
  const currentDay = result.getDay()

  let daysToAdd = targetDay - currentDay
  if (daysToAdd <= 0) {
    daysToAdd += 7 // Ir a la próxima semana
  }

  result.setDate(result.getDate() + daysToAdd)
  return result
}

/**
 * Valida y formatea la fecha parseada
 */
function validateAndFormatDate(date: Date, today: Date): ParsedDate | null {
  const dayOfWeek = date.getDay()
  const isPast = date < today
  const isSunday = dayOfWeek === 0
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // Calcular días hacia adelante
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Verificar que esté dentro del rango permitido
  if (diffDays > APPOINTMENT_CONFIG.maxDaysAhead) {
    return null
  }

  // Formatear string de fecha YYYY-MM-DD
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const dateString = `${year}-${month}-${day}`

  // Formatear texto para mostrar
  const displayText = `${DAY_NAMES_DISPLAY[dayOfWeek]} ${day}/${month}`

  return {
    date,
    dateString,
    displayText,
    isWeekend,
    isSunday,
    isPast
  }
}

/**
 * Extrae un posible horario del mensaje
 * Soporta: "10", "10:00", "10hs", "10 hs", "a las 10"
 */
export function parseTimeFromMessage(input: string): string | null {
  const normalized = input.toLowerCase().trim()

  // Patrones de horario
  const patterns = [
    /\b(\d{1,2}):(\d{2})\b/,           // 10:00, 9:30
    /\b(\d{1,2})\s*(?:hs?|horas?)\b/i, // 10hs, 10 hs, 10 horas
    /\ba\s*las?\s*(\d{1,2})\b/i,       // a las 10, a la 9
    /^(\d{1,2})$/                       // solo número
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match) {
      const hour = parseInt(match[1], 10)
      const minutes = match[2] ? parseInt(match[2], 10) : 0

      // Validar rango de horas (9-18)
      if (hour >= 9 && hour <= 18) {
        return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
    }
  }

  return null
}

/**
 * Verifica si el día está dentro de los días laborales
 */
export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
  // El domingo (0) nunca es laborable
  if (dayOfWeek === 0) return false
  return APPOINTMENT_CONFIG.workingDays.includes(dayOfWeek)
}
