// ===========================================
// Phone Number Utilities (Client-side version)
// ===========================================

/**
 * Convert phone number to WhatsApp JID format
 */
export function phoneToJid(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  let normalized = cleaned

  // Handle Argentina mobile numbers
  if (cleaned.startsWith('54')) {
    if (cleaned.length === 12 && !cleaned.startsWith('549')) {
      normalized = '549' + cleaned.slice(2)
    } else {
      normalized = cleaned
    }
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    normalized = '54' + cleaned
  } else if (cleaned.length === 10) {
    normalized = '549' + cleaned
  } else if (cleaned.length === 8) {
    normalized = '5411' + cleaned
  }

  return `${normalized}@s.whatsapp.net`
}

/**
 * Convert WhatsApp JID to international phone format
 */
export function jidToPhone(jid: string): string {
  const number = jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
  return `+${number}`
}

/**
 * Extract just the number from JID
 */
export function jidToNumber(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
}

/**
 * Format phone for display
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('549') && cleaned.length === 13) {
    return `+54 9 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)}-${cleaned.slice(9)}`
  }

  if (cleaned.startsWith('54') && cleaned.length === 12) {
    return `+54 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
  }

  return `+${cleaned}`
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 8 && cleaned.length <= 15
}
