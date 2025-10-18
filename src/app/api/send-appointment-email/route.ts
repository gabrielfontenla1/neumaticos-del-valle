// API Route for sending appointment confirmation emails
import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, appointmentId, customerName, branchName, services, date, time } = body

    // Validate required fields
    if (!to || !appointmentId || !customerName || !branchName || !services || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Format services list
    const servicesList = services.map((service: string) => `• ${service}`).join('\n')

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Confirmación de Turno - Neumáticos del Valle`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #000000, #1a1a1a); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: #FEE004; margin: 0; font-size: 28px;">¡Turno Confirmado!</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hola <strong>${customerName}</strong>,</p>

              <p style="font-size: 16px; margin-bottom: 25px;">
                Tu turno está confirmado y te esperamos.
              </p>

              <div style="background: #f9f9f9; border-left: 4px solid #FEE004; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <p style="margin: 0 0 10px 0;"><strong>📅 Fecha y Hora:</strong></p>
                <p style="margin: 0 0 15px 0; font-size: 18px; color: #000000;">${date} a las ${time} hs</p>

                <p style="margin: 0 0 10px 0;"><strong>📍 Sucursal:</strong></p>
                <p style="margin: 0 0 15px 0;">${branchName}</p>

                <p style="margin: 0 0 10px 0;"><strong>🔧 Servicios:</strong></p>
                <div style="margin: 0;">
                  ${servicesList.split('\n').map((s: string) => `<p style="margin: 5px 0;">${s}</p>`).join('')}
                </div>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>💡 Recordatorio:</strong> Te recomendamos llegar 5-10 minutos antes de tu turno con tu vehículo y documentación relevante.
                </p>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                ID de Reserva: <strong>#${appointmentId.slice(0, 8).toUpperCase()}</strong>
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Si necesitas realizar algún cambio, por favor contactanos al WhatsApp.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Neumáticos del Valle</p>
              <p style="margin: 10px 0 0 0;">Este es un email automático, por favor no responder.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in send-appointment-email route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
