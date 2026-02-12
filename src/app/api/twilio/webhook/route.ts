/**
 * Twilio WhatsApp Webhook
 * Handles incoming messages from Twilio and delegates to shared processor.
 * Twilio-specific: signature validation, form parsing, TwiML response.
 */

import { NextRequest, NextResponse } from 'next/server'
import { TwilioClient, validateTwilioSignature, parseTwilioWebhook } from '@/lib/twilio'
import { processIncomingMessage } from '@/lib/whatsapp/processor'

const ENABLE_SIGNATURE_VERIFICATION = process.env.NODE_ENV === 'production'

interface TwilioWebhookPayload {
  MessageSid: string
  From: string
  To: string
  Body: string
  ProfileName?: string
  WaId?: string
}

// ============================================================================
// TWILIO RESPONSE HELPER
// ============================================================================

async function sendTwilioResponse(to: string, body: string): Promise<void> {
  try {
    const twilioClient = await TwilioClient.create()
    const result = await twilioClient.sendMessage(to, body)

    if (result.status === 'failed') {
      console.error('[Twilio] Send failed:', result.errorMessage)
    }
  } catch (error) {
    console.error('[Twilio] Error sending:', error)
  }
}

function createTwiMLResponse(): NextResponse {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  )
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Validate Twilio signature in production
    if (ENABLE_SIGNATURE_VERIFICATION) {
      const isValid = await validateTwilioSignature(request.clone())
      if (!isValid) {
        console.error('[Twilio Webhook] Invalid signature')
        return createTwiMLResponse()
      }
    }

    // Parse webhook payload
    const formData = await request.formData()
    const payload = parseTwilioWebhook(formData) as unknown as TwilioWebhookPayload

    const { From, Body, ProfileName } = payload

    if (!From || !Body) {
      return createTwiMLResponse()
    }

    const phoneNumber = From.replace(/^whatsapp:/, '')

    // Process message asynchronously using shared processor
    processIncomingMessage(
      {
        phoneNumber,
        profileName: ProfileName || 'Cliente',
        messageText: Body,
      },
      {
        source: 'twilio',
        sendResponse: sendTwilioResponse,
      }
    )

    return createTwiMLResponse()

  } catch (error) {
    console.error('[Twilio Webhook] Error:', error)
    return createTwiMLResponse()
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Twilio WhatsApp Bot (Shared Processor)',
    timestamp: new Date().toISOString()
  })
}
