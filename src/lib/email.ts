// Email Utilities
import { resend, FROM_EMAIL } from './resend'

export interface AppointmentEmailData {
  to: string
  appointmentId: string
  customerName: string
  branchName: string
  services: string[]
  date: string
  time: string
}

export interface ContactEmailData {
  to: string
  name: string
  email: string
  phone?: string
  message: string
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  try {
    const servicesList = data.services.map(s => `• ${s}`).join('\n')

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.to],
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
              <p style="font-size: 18px; margin-bottom: 20px;">Hola <strong>${data.customerName}</strong>,</p>

              <p style="font-size: 16px; margin-bottom: 25px;">
                Tu turno está confirmado y te esperamos.
              </p>

              <div style="background: #f9f9f9; border-left: 4px solid #FEE004; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <p style="margin: 0 0 10px 0;"><strong>📅 Fecha y Hora:</strong></p>
                <p style="margin: 0 0 15px 0; font-size: 18px; color: #000000;">${data.date} a las ${data.time} hs</p>

                <p style="margin: 0 0 10px 0;"><strong>📍 Sucursal:</strong></p>
                <p style="margin: 0 0 15px 0;">${data.branchName}</p>

                <p style="margin: 0 0 10px 0;"><strong>🔧 Servicios:</strong></p>
                <div style="margin: 0;">
                  ${servicesList.split('\n').map(s => `<p style="margin: 5px 0;">${s}</p>`).join('')}
                </div>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>💡 Recordatorio:</strong> Te recomendamos llegar 5-10 minutos antes de tu turno con tu vehículo y documentación relevante.
                </p>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                ID de Reserva: <strong>#${data.appointmentId.slice(0, 8).toUpperCase()}</strong>
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

    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending appointment confirmation:', error)
    return { success: false, error }
  }
}

/**
 * Send contact form email to admin
 */
export async function sendContactFormEmail(data: ContactEmailData) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.to],
      replyTo: data.email,
      subject: `Nuevo Mensaje de Contacto - ${data.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #000000, #1a1a1a); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: #FEE004; margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Has recibido un nuevo mensaje de contacto:</p>

              <div style="background: #f9f9f9; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <p style="margin: 0 0 10px 0;"><strong>Nombre:</strong> ${data.name}</p>
                <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${data.email}</p>
                ${data.phone ? `<p style="margin: 0 0 10px 0;"><strong>Teléfono:</strong> ${data.phone}</p>` : ''}
              </div>

              <div style="background: #ffffff; border-left: 4px solid #FEE004; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Mensaje:</strong></p>
                <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Puedes responder directamente a este email para contactar al cliente.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Neumáticos del Valle</p>
            </div>
          </body>
        </html>
      `,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending contact form email:', error)
    return { success: false, error }
  }
}

/**
 * Send custom email
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo && { replyTo }),
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
