import { NextRequest, NextResponse } from 'next/server'

// Endpoint de prueba para simular un webhook de Kommo
export async function GET(request: NextRequest) {
  const testPayload = {
    event: "message_received",
    timestamp: new Date().toISOString(),
    message: {
      text: "Hola, necesito 4 neumáticos 225/45R17",
      id: "test_msg_123",
      channel: "whatsapp"
    },
    contact: {
      id: "test_contact_456",
      name: "Cliente de Prueba",
      phone: "+5491123456789"
    },
    conversation: {
      id: "test_conv_789"
    }
  }

  try {
    // Hacer una llamada a nuestro propio webhook
    const response = await fetch('http://localhost:6001/api/kommo/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })

    const result = await response.json()

    return NextResponse.json({
      status: 'Test ejecutado',
      webhook_url: 'http://localhost:6001/api/kommo/webhook',
      test_payload_sent: testPayload,
      webhook_response: result
    })
  } catch (error) {
    return NextResponse.json({
      status: 'Error en test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}