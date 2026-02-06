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

// ============================================
// Admin Notification Emails
// ============================================

export interface AppointmentEmailData {
  customerName: string
  customerEmail: string
  customerPhone: string
  service: string
  date: string        // formato legible: "Lunes 10 de Febrero"
  time: string        // formato: "14:30"
  branch: string      // nombre de sucursal
  branchEmail?: string | null  // email de la sucursal (opcional)
}

/**
 * Send appointment notification email to admin
 * Used when a customer completes a booking
 * Non-blocking: returns success/error without throwing
 */
export async function sendAppointmentNotificationEmail(
  data: AppointmentEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL

    // Build list of recipients (admin + branch if configured)
    const recipients: string[] = []

    if (adminEmail) {
      recipients.push(adminEmail)
    }

    if (data.branchEmail) {
      recipients.push(data.branchEmail)
    }

    if (recipients.length === 0) {
      console.warn('[EMAIL] No recipients configured (ADMIN_EMAIL or branch email), skipping notification')
      return { success: false, error: 'No recipients configured' }
    }

    const client = getResendClient()

    await client.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: `Nuevo Turno - ${data.customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #000000, #1a1a1a); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: #FEE004; margin: 0; font-size: 24px;">Nuevo Turno Reservado</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Datos del Cliente</h2>

              <div style="background: #f9f9f9; padding: 20px; margin: 15px 0; border-radius: 5px;">
                <p style="margin: 0 0 10px 0;"><strong>Nombre:</strong> ${data.customerName}</p>
                <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${data.customerEmail}</p>
                <p style="margin: 0;"><strong>Telefono:</strong> ${data.customerPhone}</p>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 25px 0;" />

              <h2 style="color: #333;">Detalles del Turno</h2>

              <div style="background: #f9f9f9; border-left: 4px solid #FEE004; padding: 20px; margin: 15px 0; border-radius: 5px;">
                <p style="margin: 0 0 10px 0;"><strong>Servicio:</strong> ${data.service}</p>
                <p style="margin: 0 0 10px 0;"><strong>Fecha:</strong> ${data.date}</p>
                <p style="margin: 0 0 10px 0;"><strong>Hora:</strong> ${data.time}</p>
                <p style="margin: 0;"><strong>Sucursal:</strong> ${data.branch}</p>
              </div>
            </div>

            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Neumaticos del Valle</p>
              <p style="margin: 10px 0 0 0;">Este es un email automatico de notificacion.</p>
            </div>
          </body>
        </html>
      `,
    })

    console.log('[EMAIL] Appointment notification sent to:', recipients.join(', '))
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[EMAIL] Error sending appointment notification:', errorMessage)
    return { success: false, error: errorMessage }
  }
}
