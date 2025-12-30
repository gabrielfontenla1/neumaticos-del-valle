/**
 * Módulo de integración Kommo CRM
 * Exporta todos los componentes de la integración
 */

// Tipos
export * from './types'

// Cliente API
export { KommoClient, getKommoClient, createKommoClient, KommoApiClientError, validateConfig } from './client'

// Firmas y seguridad
export {
  generateKommoHeaders,
  generateXSignature,
  verifyWebhookSignature,
  generateMessageId,
  generateConversationId,
  generateContentMD5,
  generateRFC2822Date
} from './signature'

// Repositorio de datos
export {
  findConversationByChatId,
  findConversationByPhone,
  createConversation,
  getOrCreateConversation,
  updateConversationStatus,
  listActiveConversations,
  listEscalatedConversations,
  addMessage,
  getConversationMessages,
  getMessageHistoryForLLM,
  getConversationStats
} from './repository'

// Procesador de mensajes
export {
  processIncomingMessage,
  processMessageAsync
} from './message-processor'

// Sistema de escalación
export {
  shouldEscalate,
  getEscalationReason,
  analyzeConversationHistory,
  calculatePriority
} from './escalation'
