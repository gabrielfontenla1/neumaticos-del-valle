/**
 * Matcher fuzzy de servicios para el bot de turnos
 * Soporta sinónimos y variaciones en español argentino
 */

import { createClient } from '@supabase/supabase-js'
import type { AppointmentService, ServiceMatch } from './types'

// Cliente Supabase sin tipos estrictos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// CACHE DE SERVICIOS
// ============================================================================

let servicesCache: AppointmentService[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Obtiene los servicios disponibles (con cache)
 */
export async function getAvailableServices(): Promise<AppointmentService[]> {
  const now = Date.now()

  if (servicesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return servicesCache
  }

  const { data, error } = await db
    .from('appointment_services')
    .select('id, name, description, duration, price')
    .order('name')

  if (error) {
    console.error('[ServiceMatcher] Error fetching services:', error)
    return servicesCache || []
  }

  servicesCache = (data || []).map((s: { id: string; name: string; description: string; duration: number; price: number }) => ({
    id: s.id,
    name: s.name,
    description: s.description || '',
    duration: s.duration,
    price: s.price,
    isActive: true
  }))
  cacheTimestamp = now

  return servicesCache
}

// ============================================================================
// SINÓNIMOS Y ALIASES
// ============================================================================

// Mapeo de términos comunes a nombres de servicios
const SERVICE_ALIASES: Record<string, string[]> = {
  'cambio de aceite': [
    'aceite', 'cambio aceite', 'cambiar aceite', 'service basico',
    'service básico', 'cambio de aceite'
  ],
  'rotación de neumáticos': [
    'rotacion', 'rotación', 'rotar', 'rotar cubiertas', 'rotar gomas',
    'rotacion de neumaticos', 'rotación de neumáticos'
  ],
  'alineación y balanceo': [
    'alineacion', 'alineación', 'balanceo', 'alinear', 'balancear',
    'alinear y balancear', 'alineacion y balanceo', 'tren delantero'
  ],
  'instalación de neumáticos': [
    'instalacion', 'instalación', 'instalar', 'montar', 'montaje',
    'montar cubiertas', 'montar gomas', 'poner cubiertas', 'poner gomas',
    'instalacion de neumaticos', 'instalación de neumáticos', 'cambiar cubiertas'
  ],
  'revisión general': [
    'revision', 'revisión', 'revisar', 'chequeo', 'control',
    'revision general', 'revisión general'
  ],
  'cambio de pastillas de freno': [
    'pastillas', 'frenos', 'cambio frenos', 'cambiar frenos',
    'pastillas de freno', 'cambio de pastillas'
  ],
  'service completo': [
    'service completo', 'servicio completo', 'full service',
    'mantenimiento completo', 'service full'
  ],
  'diagnóstico por computadora': [
    'diagnostico', 'diagnóstico', 'escaner', 'scanner', 'computadora',
    'diagnostico computadora', 'diagnóstico por computadora'
  ]
}

// ============================================================================
// FUNCIONES DE MATCHING
// ============================================================================

/**
 * Busca el servicio que mejor coincide con el input del usuario
 */
export async function matchService(input: string): Promise<ServiceMatch | null> {
  const services = await getAvailableServices()
  const normalized = normalizeText(input)

  let bestMatch: ServiceMatch | null = null

  for (const service of services) {
    const confidence = calculateServiceConfidence(normalized, service)

    if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
      bestMatch = {
        service,
        confidence,
        matchedOn: normalized
      }
    }
  }

  return bestMatch
}

/**
 * Calcula la confianza del match entre input y servicio
 */
function calculateServiceConfidence(input: string, service: AppointmentService): number {
  const serviceName = normalizeText(service.name)

  // 1. Match exacto del nombre
  if (input === serviceName) {
    return 1.0
  }

  // 2. El nombre del servicio contiene el input
  if (serviceName.includes(input)) {
    return 0.9
  }

  // 3. El input contiene el nombre del servicio
  if (input.includes(serviceName)) {
    return 0.85
  }

  // 4. Match por alias
  for (const [canonical, aliases] of Object.entries(SERVICE_ALIASES)) {
    if (normalizeText(canonical) === serviceName) {
      for (const alias of aliases) {
        const normalizedAlias = normalizeText(alias)
        if (input === normalizedAlias) {
          return 0.95
        }
        if (input.includes(normalizedAlias) || normalizedAlias.includes(input)) {
          return 0.8
        }
      }
    }
  }

  // 5. Match por palabras clave
  const inputWords = input.split(/\s+/)
  const serviceWords = serviceName.split(/\s+/)

  let matchedWords = 0
  for (const inputWord of inputWords) {
    if (inputWord.length < 3) continue
    for (const serviceWord of serviceWords) {
      if (serviceWord.includes(inputWord) || inputWord.includes(serviceWord)) {
        matchedWords++
        break
      }
    }
  }

  if (matchedWords > 0) {
    return Math.min(0.7, matchedWords * 0.3)
  }

  // 6. Match por similitud de Levenshtein (para typos)
  const similarity = calculateSimilarity(input, serviceName)
  if (similarity > 0.6) {
    return similarity * 0.7
  }

  return 0
}

/**
 * Normaliza texto removiendo acentos y caracteres especiales
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '')     // Solo alfanuméricos
    .replace(/\s+/g, ' ')            // Normalizar espacios
    .trim()
}

/**
 * Calcula similitud entre dos strings (Levenshtein simplificado)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1

  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a

  if (longer.length === 0) return 1

  // Calcular distancia de Levenshtein
  const matrix: number[][] = []

  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      if (shorter[i - 1] === longer[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  const distance = matrix[shorter.length][longer.length]
  return (longer.length - distance) / longer.length
}

/**
 * Busca servicios que coincidan parcialmente (para sugerencias)
 */
export async function findSimilarServices(input: string, limit: number = 3): Promise<AppointmentService[]> {
  const services = await getAvailableServices()
  const normalized = normalizeText(input)

  const scored = services.map(service => ({
    service,
    score: calculateServiceConfidence(normalized, service)
  }))

  return scored
    .filter(s => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.service)
}
