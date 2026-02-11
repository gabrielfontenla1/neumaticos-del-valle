// ===========================================
// Phone Number Formatting Utilities
// ===========================================

/**
 * Convert phone number to WhatsApp JID format
 *
 * IMPORTANT: When the number already has a country code (11+ digits),
 * we do NOT modify it. The stored phone came from an incoming Baileys JID,
 * so it's already in the exact format WhatsApp expects.
 */
export function phoneToJid(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // If number already has country code, use as-is
  if (cleaned.length >= 11) {
    return `${cleaned}@s.whatsapp.net`
  }

  // Handle short local numbers (fallback for manual input)
  if (cleaned.length === 10) {
    return `54${cleaned}@s.whatsapp.net`
  }
  if (cleaned.length === 8) {
    return `5411${cleaned}@s.whatsapp.net`
  }

  return `${cleaned}@s.whatsapp.net`
}

/**
 * Convert WhatsApp JID to international phone format
 */
export function jidToPhone(jid: string): string {
  const number = jid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '')
  return `+${number}`
}

/**
 * Extract just the number from JID
 */
export function jidToNumber(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '')
}

/**
 * Check if a JID is a LID (Linked Identity Device) format
 */
export function isLidJid(jid: string): boolean {
  return jid.endsWith('@lid')
}

/**
 * Check if JID is a group
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us')
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
 * Resolve the real phone number from a Baileys message key.
 * When remoteJid is a LID, senderPn contains the real phone JID.
 */
export function resolvePhoneFromKey(key: { remoteJid?: string; senderPn?: string }): {
  phone: string
  originalJid: string
} {
  const originalJid = key.remoteJid || ''

  // If senderPn exists, it's the real phone — use it
  if (key.senderPn) {
    const phone = jidToNumber(key.senderPn)
    return { phone, originalJid }
  }

  // If remoteJid is LID, we can't resolve the phone
  if (isLidJid(originalJid)) {
    return { phone: '', originalJid }
  }

  // Normal phone JID
  return { phone: jidToNumber(originalJid), originalJid }
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 8 && cleaned.length <= 15
}
