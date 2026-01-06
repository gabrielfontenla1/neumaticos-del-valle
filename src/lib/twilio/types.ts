export interface TwilioConfig {
  accountSid: string
  authToken: string
  whatsappNumber: string
}

export interface TwilioWebhookPayload {
  MessageSid: string
  AccountSid: string
  From: string           // whatsapp:+5492622555555
  To: string             // whatsapp:+14155238886
  Body: string
  NumMedia: string
  ProfileName?: string
  WaId?: string          // WhatsApp ID (phone without +)
  MediaUrl0?: string
  MediaContentType0?: string
}

export interface TwilioMessageResponse {
  sid: string
  status: string
  errorCode?: number
  errorMessage?: string
}
