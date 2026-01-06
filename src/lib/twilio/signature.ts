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

  // Get the full URL
  const url = request.url

  // Clone request to read body without consuming it
  const cloned = request.clone()
  const formData = await cloned.formData()
  const params: Record<string, string> = {}

  formData.forEach((value, key) => {
    params[key] = value.toString()
  })

  const isValid = validateRequest(token, signature, url, params)

  if (!isValid) {
    console.warn('[TwilioSignature] Invalid signature')
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
