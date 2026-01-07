/**
 * Sistema de escalación para conversaciones de Kommo
 * Detecta cuándo una conversación debe ser atendida por un humano
 */

import type { MessageIntent } from './types'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  // Número máximo de mensajes del usuario sin respuesta satisfactoria antes de escalar
  // Aumentado a 15 para dar más oportunidad al bot de resolver consultas
  maxUnresolvedMessages: 15,

  // Palabras clave que disparan escalación inmediata
  immediateEscalationKeywords: [
    'hablar con persona',
    'hablar con humano',
    'hablar con vendedor',
    'hablar con encargado',
    'quiero hablar con alguien',
    'necesito un humano',
    'sos un bot',
    'sos un robot',
    'no me sirve',
    'no me ayudás',
    'esto no funciona',
    'bot de mierda',
    'inútil'
  ],

  // Palabras clave que indican queja/reclamo
  complaintKeywords: [
    'queja',
    'reclamo',
    'denuncia',
    'devolver',
    'reembolso',
    'estafa',
    'engaño',
    'mentira',
    'problema con mi pedido',
    'no llegó',
    'llegó mal',
    'producto defectuoso',
    'garantía',
    'defensa del consumidor'
  ],

  // Palabras que indican sentimiento muy negativo
  negativeKeywords: [
    'enojado',
    'furioso',
    'indignado',
    'harto',
    'cansado',
    'molesto',
    'decepcionado',
    'terrible',
    'pésimo',
    'horrible',
    'inaceptable',
    'vergüenza',
    'inadmisible'
  ],

  // Intenciones que siempre escalan
  escalatingIntents: ['escalation', 'complaint'] as MessageIntent[]
}

// ============================================================================
// TIPOS
// ============================================================================

export interface EscalationResult {
  shouldEscalate: boolean
  reason?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  suggestedAction?: string
}

// ============================================================================
// FUNCIONES DE DETECCIÓN
// ============================================================================

/**
 * Determina si una conversación debe ser escalada a un humano
 */
export function shouldEscalate(
  message: string,
  intent: MessageIntent,
  messageCount: number
): EscalationResult {
  const normalizedMessage = message.toLowerCase().trim()

  // 1. Verificar escalación inmediata por palabras clave
  const immediateEscalation = checkImmediateEscalation(normalizedMessage)
  if (immediateEscalation.shouldEscalate) {
    return immediateEscalation
  }

  // 2. Verificar intenciones que escalan
  if (CONFIG.escalatingIntents.includes(intent)) {
    return {
      shouldEscalate: true,
      reason: intent === 'complaint' ? 'Cliente con queja/reclamo' : 'Solicitud de atención humana',
      priority: intent === 'complaint' ? 'high' : 'medium',
      suggestedAction: 'Transferir a vendedor disponible'
    }
  }

  // 3. Verificar quejas/reclamos
  const complaintCheck = checkComplaint(normalizedMessage)
  if (complaintCheck.shouldEscalate) {
    return complaintCheck
  }

  // 4. Verificar sentimiento muy negativo
  const negativeCheck = checkNegativeSentiment(normalizedMessage)
  if (negativeCheck.shouldEscalate) {
    return negativeCheck
  }

  // 5. Verificar conversación larga sin resolver
  if (messageCount >= CONFIG.maxUnresolvedMessages) {
    return {
      shouldEscalate: true,
      reason: `Conversación con ${messageCount} mensajes sin resolver`,
      priority: 'medium',
      suggestedAction: 'Revisar historial y contactar cliente'
    }
  }

  // No escalar
  return {
    shouldEscalate: false
  }
}

/**
 * Verifica escalación inmediata por palabras clave
 */
function checkImmediateEscalation(message: string): EscalationResult {
  for (const keyword of CONFIG.immediateEscalationKeywords) {
    if (message.includes(keyword)) {
      return {
        shouldEscalate: true,
        reason: 'Solicitud directa de atención humana',
        priority: 'high',
        suggestedAction: 'Transferir inmediatamente a vendedor'
      }
    }
  }

  return { shouldEscalate: false }
}

/**
 * Verifica si hay una queja o reclamo
 */
function checkComplaint(message: string): EscalationResult {
  let matchCount = 0
  const matches: string[] = []

  for (const keyword of CONFIG.complaintKeywords) {
    if (message.includes(keyword)) {
      matchCount++
      matches.push(keyword)
    }
  }

  if (matchCount > 0) {
    return {
      shouldEscalate: true,
      reason: `Queja/reclamo detectado: ${matches.join(', ')}`,
      priority: matchCount >= 2 ? 'critical' : 'high',
      suggestedAction: 'Derivar a responsable de atención al cliente'
    }
  }

  return { shouldEscalate: false }
}

/**
 * Verifica sentimiento muy negativo
 */
function checkNegativeSentiment(message: string): EscalationResult {
  let negativeCount = 0
  const matches: string[] = []

  for (const keyword of CONFIG.negativeKeywords) {
    if (message.includes(keyword)) {
      negativeCount++
      matches.push(keyword)
    }
  }

  // Escalar si hay múltiples indicadores negativos
  if (negativeCount >= 2) {
    return {
      shouldEscalate: true,
      reason: `Cliente muy insatisfecho: ${matches.join(', ')}`,
      priority: 'high',
      suggestedAction: 'Contactar para resolver situación'
    }
  }

  return { shouldEscalate: false }
}

/**
 * Obtiene el motivo de escalación como string simple
 */
export function getEscalationReason(result: EscalationResult): string {
  if (!result.shouldEscalate) {
    return ''
  }

  return result.reason || 'Motivo no especificado'
}

// ============================================================================
// ANÁLISIS DE CONVERSACIÓN
// ============================================================================

/**
 * Analiza el historial de conversación para determinar escalación
 */
export function analyzeConversationHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): EscalationResult {
  let frustrationIndicators = 0
  let repeatQuestions = 0
  const userMessages = messages.filter(m => m.role === 'user')

  // Detectar repetición de preguntas
  const questions = new Set<string>()
  for (const msg of userMessages) {
    const normalized = msg.content.toLowerCase().slice(0, 50)
    if (questions.has(normalized)) {
      repeatQuestions++
    }
    questions.add(normalized)
  }

  // Detectar frustración creciente
  for (let i = 0; i < userMessages.length; i++) {
    const msg = userMessages[i].content.toLowerCase()

    // Mensajes cortos y bruscos
    if (msg.length < 10 && /^(no|si|ok|ya|dale|bueno)$/i.test(msg.trim())) {
      frustrationIndicators++
    }

    // Signos de puntuación múltiples (frustración)
    if (/[!?]{2,}/.test(msg)) {
      frustrationIndicators++
    }

    // Mayúsculas (gritando)
    const upperRatio = (msg.match(/[A-Z]/g) || []).length / msg.length
    if (upperRatio > 0.5 && msg.length > 10) {
      frustrationIndicators += 2
    }
  }

  // Evaluar si debe escalar
  if (repeatQuestions >= 2) {
    return {
      shouldEscalate: true,
      reason: 'Cliente repitiendo la misma pregunta',
      priority: 'medium',
      suggestedAction: 'Bot no está resolviendo la consulta'
    }
  }

  if (frustrationIndicators >= 3) {
    return {
      shouldEscalate: true,
      reason: 'Signos de frustración en la conversación',
      priority: 'medium',
      suggestedAction: 'Cliente posiblemente frustrado con el bot'
    }
  }

  return { shouldEscalate: false }
}

// ============================================================================
// PRIORIZACIÓN
// ============================================================================

/**
 * Calcula la prioridad de atención de una escalación
 */
export function calculatePriority(
  reasons: string[],
  messageCount: number,
  waitTimeMinutes: number
): 'low' | 'medium' | 'high' | 'critical' {
  let score = 0

  // Razones críticas
  const criticalReasons = ['queja', 'reclamo', 'defensa del consumidor', 'estafa']
  const highReasons = ['enojado', 'furioso', 'hablar con persona', 'urgente']

  for (const reason of reasons) {
    const lowerReason = reason.toLowerCase()
    if (criticalReasons.some(cr => lowerReason.includes(cr))) {
      score += 4
    } else if (highReasons.some(hr => lowerReason.includes(hr))) {
      score += 2
    }
  }

  // Factores adicionales
  if (messageCount > 10) score += 1
  if (waitTimeMinutes > 30) score += 2
  if (waitTimeMinutes > 60) score += 2

  // Mapear score a prioridad
  if (score >= 6) return 'critical'
  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}
