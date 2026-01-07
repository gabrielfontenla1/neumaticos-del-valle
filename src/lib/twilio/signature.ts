import { validateRequest } from 'twilio'

export async function validateTwilioSignature(
  request: Request,
  authToken?: string
): Promise<boolean> {
  const token = authToken || process.env.TWILIO_AUTH_TOKEN

  if (!token) {
    console.warn('[TwilioSignature] No auth token configured')
    return false
  }

  const signature = request.headers.get('X-Twilio-Signature')
  if (!signature) {
    console.warn('[TwilioSignature] No signature header')
    return false
  }

  // Use the public URL for signature validation (Twilio signs with the public URL)
  // In production behind a proxy, request.url might be internal (localhost)
  const publicBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL
  const webhookPath = '/api/twilio/webhook'

  let url: string
  if (publicBaseUrl) {
    // Use the configured public URL
    url = publicBaseUrl.replace(/\/$/, '') + webhookPath
  } else {
    // Fallback to request URL (works in development)
    url = request.url
  }

  // Clone request to read body without consuming it
  const cloned = request.clone()
  const formData = await cloned.formData()
  const params: Record<string, string> = {}

  formData.forEach((value, key) => {
    params[key] = value.toString()
  })

  const isValid = validateRequest(token, signature, url, params)

  if (!isValid) {
    console.warn('[TwilioSignature] Invalid signature for URL:', url)
  }

  return isValid
}

export function parseTwilioWebhook(formData: FormData): Record<string, string> {
  const payload: Record<string, string> = {}

  formData.forEach((value, key) => {
    payload[key] = value.toString()
  })

  return payload
}
