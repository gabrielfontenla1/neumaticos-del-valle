/**
 * Generación y verificación de firmas HMAC-SHA1 para Kommo API
 * Basado en la documentación oficial de Kommo
 * @see https://developers.kommo.com/reference/send-import-messages
 */

import crypto from 'crypto'
import type { KommoApiHeaders } from './types'

/**
 * Genera el hash MD5 del contenido en formato lowercase hex
 */
export function generateContentMD5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex').toLowerCase()
}

/**
 * Genera la fecha en formato RFC2822 requerido por Kommo
 * Ejemplo: "Thu, 01 Jan 2023 12:00:00 +0000"
 */
export function generateRFC2822Date(date: Date = new Date()): string {
  return date.toUTCString().replace('GMT', '+0000')
}

/**
 * Genera la firma X-Signature para requests a la API de Kommo
 *
 * La firma se calcula como HMAC-SHA1 de:
 * METHOD\n
 * Content-MD5\n
 * Content-Type\n
 * Date\n
 * /path
 *
 * @param method - Método HTTP (POST, GET, etc.)
 * @param path - Path del endpoint (sin protocolo ni dominio)
 * @param contentMD5 - Hash MD5 del body
 * @param contentType - Content-Type header
 * @param date - Fecha en formato RFC2822
 * @param secret - Secret key del canal
 */
export function generateXSignature(
  method: string,
  path: string,
  contentMD5: string,
  contentType: string,
  date: string,
  secret: string
): string {
  // Construir el string a firmar
  const signatureString = [
    method.toUpperCase(),
    contentMD5,
    contentType,
    date,
    path
  ].join('\n')

  // Generar HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secret)
  hmac.update(signatureString)

  return hmac.digest('hex').toLowerCase()
}

/**
 * Genera todos los headers necesarios para un request a Kommo Chat API
 */
export function generateKommoHeaders(
  method: string,
  path: string,
  body: object | string,
  channelSecret: string
): KommoApiHeaders {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
  const contentType = 'application/json'
  const contentMD5 = generateContentMD5(bodyString)
  const date = generateRFC2822Date()

  const signature = generateXSignature(
    method,
    path,
    contentMD5,
    contentType,
    date,
    channelSecret
  )

  return {
    'Date': date,
    'Content-Type': contentType,
    'Content-MD5': contentMD5,
    'X-Signature': signature
  }
}

/**
 * Verifica la firma X-Signature de un webhook entrante de Kommo
 *
 * @param body - Body del request como string
 * @param signature - Valor del header X-Signature
 * @param secret - Secret key del canal
 * @returns true si la firma es válida
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha1', secret)
  hmac.update(body)
  const calculatedSignature = hmac.digest('hex').toLowerCase()

  // Comparación segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature.toLowerCase()),
    Buffer.from(calculatedSignature)
  )
}

/**
 * Genera un ID único para mensajes
 * Formato: prefix-timestamp-random
 */
export function generateMessageId(prefix: string = 'ndv'): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(4).toString('hex')
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Genera un ID único para conversaciones
 */
export function generateConversationId(prefix: string = 'conv'): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(6).toString('hex')
  return `${prefix}-${timestamp}-${random}`
}
