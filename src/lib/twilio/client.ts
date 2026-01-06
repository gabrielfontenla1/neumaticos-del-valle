import Twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import type { TwilioConfig, TwilioMessageResponse } from './types'

// Cache for database config to avoid repeated queries
let cachedConfig: TwilioConfig | null = null
let cacheExpiry: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get Twilio config from database
 */
async function getConfigFromDatabase(): Promise<TwilioConfig | null> {
  // Return cached config if still valid
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient<any>(supabaseUrl, supabaseServiceKey)

    const { data, error } = await db
      .from('app_settings')
      .select('value')
      .eq('key', 'twilio_config')
      .single()

    if (error || !data?.value) {
      return null
    }

    const settings = data.value as {
      accountSid: string
      authToken: string
      whatsappNumber: string
      enabled: boolean
    }

    if (!settings.enabled) {
      console.log('[TwilioClient] Twilio is disabled in settings')
      return null
    }

    cachedConfig = {
      accountSid: settings.accountSid,
      authToken: settings.authToken,
      whatsappNumber: settings.whatsappNumber
    }
    cacheExpiry = Date.now() + CACHE_TTL

    return cachedConfig
  } catch (error) {
    console.error('[TwilioClient] Error loading config from database:', error)
    return null
  }
}

/**
 * Clear the cached config (call when settings are updated)
 */
export function clearTwilioConfigCache(): void {
  cachedConfig = null
  cacheExpiry = 0
}

export class TwilioClient {
  private client: Twilio.Twilio
  private fromNumber: string

  constructor(config?: TwilioConfig) {
    const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID!
    const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN!
    this.fromNumber = config?.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER!

    if (!accountSid || !authToken || !this.fromNumber) {
      throw new Error('Twilio credentials not configured')
    }

    this.client = Twilio(accountSid, authToken)
  }

  /**
   * Create TwilioClient with auto-loaded config from env or database
   */
  static async create(): Promise<TwilioClient> {
    // First try environment variables
    const envConfig: TwilioConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || ''
    }

    if (envConfig.accountSid && envConfig.authToken && envConfig.whatsappNumber) {
      return new TwilioClient(envConfig)
    }

    // Fallback to database config
    const dbConfig = await getConfigFromDatabase()
    if (dbConfig) {
      return new TwilioClient(dbConfig)
    }

    throw new Error('Twilio credentials not configured. Set environment variables or configure in admin panel.')
  }

  async sendMessage(to: string, body: string): Promise<TwilioMessageResponse> {
    const toFormatted = this.formatWhatsAppNumber(to)
    const fromFormatted = `whatsapp:${this.fromNumber}`

    console.log(`[TwilioClient] Sending message to ${toFormatted}`)

    try {
      const message = await this.client.messages.create({
        from: fromFormatted,
        to: toFormatted,
        body
      })

      console.log(`[TwilioClient] Message sent: ${message.sid}`)

      return {
        sid: message.sid,
        status: message.status
      }
    } catch (error: any) {
      console.error('[TwilioClient] Error sending message:', error)
      return {
        sid: '',
        status: 'failed',
        errorCode: error.code,
        errorMessage: error.message
      }
    }
  }

  async sendTemplate(
    to: string,
    contentSid: string,
    contentVariables: Record<string, string>
  ): Promise<TwilioMessageResponse> {
    const toFormatted = this.formatWhatsAppNumber(to)
    const fromFormatted = `whatsapp:${this.fromNumber}`

    try {
      const message = await this.client.messages.create({
        from: fromFormatted,
        to: toFormatted,
        contentSid,
        contentVariables: JSON.stringify(contentVariables)
      })

      return {
        sid: message.sid,
        status: message.status
      }
    } catch (error: any) {
      console.error('[TwilioClient] Error sending template:', error)
      return {
        sid: '',
        status: 'failed',
        errorCode: error.code,
        errorMessage: error.message
      }
    }
  }

  formatWhatsAppNumber(phone: string): string {
    // Handle various formats
    if (phone.startsWith('whatsapp:')) {
      return phone
    }

    // Remove non-digits except +
    let cleaned = phone.replace(/[^\d+]/g, '')

    // Ensure + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned
    }

    return `whatsapp:${cleaned}`
  }

  extractPhoneFromWhatsApp(waNumber: string): string {
    return waNumber.replace(/^whatsapp:/, '').replace(/^\+/, '')
  }
}
