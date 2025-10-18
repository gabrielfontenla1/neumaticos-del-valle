// Resend Email Configuration
import { Resend } from 'resend'

let resendInstance: Resend | null = null

/**
 * Get Resend client instance with lazy initialization
 * Validates API key at runtime, not build time
 */
export function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined in environment variables')
    }

    resendInstance = new Resend(apiKey)
  }

  return resendInstance
}

// Export for backward compatibility
export const resend = {
  get emails() {
    return getResendClient().emails
  }
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
