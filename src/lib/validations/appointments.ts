/**
 * Appointment validation schemas
 * For /api/send-appointment-email route
 */
import { z } from 'zod'
import { emailSchema, nameSchema } from './common'

// Service types
export const serviceTypeSchema = z.enum([
  'Cambio de neumáticos',
  'Alineación',
  'Balanceo',
  'Rotación',
  'Reparación',
  'Inspección',
  'Cambio de aceite',
  'Otro',
])

// Time slot schema (HH:MM format)
export const timeSlotSchema = z.string().regex(
  /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  'Formato de hora inválido (HH:MM)'
)

// Date format schema (DD/MM/YYYY or YYYY-MM-DD)
export const appointmentDateSchema = z.string().refine(
  (date) => {
    // Accept DD/MM/YYYY
    const ddmmyyyy = /^\d{2}\/\d{2}\/\d{4}$/
    // Accept YYYY-MM-DD
    const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/
    return ddmmyyyy.test(date) || yyyymmdd.test(date)
  },
  'Formato de fecha inválido'
)

// Send appointment email request schema
export const sendAppointmentEmailSchema = z.object({
  // Required fields
  to: emailSchema,
  appointmentId: z.string().min(1, 'ID de cita es requerido'),
  customerName: nameSchema,
  branchName: z.string().min(1, 'Nombre de sucursal es requerido'),
  services: z.array(z.string()).min(1, 'Debe seleccionar al menos un servicio'),
  date: appointmentDateSchema,
  time: timeSlotSchema,

  // Optional fields
  vehicleInfo: z.string().optional(),
  notes: z.string().max(500).optional(),
})

// Appointment booking schema (if creating appointments)
export const createAppointmentSchema = z.object({
  // Customer info
  customer_name: nameSchema,
  customer_email: emailSchema,
  customer_phone: z.string().min(8, 'Teléfono inválido'),

  // Appointment details
  branch_id: z.string().min(1, 'Sucursal es requerida'),
  date: appointmentDateSchema,
  time: timeSlotSchema,
  services: z.array(z.string()).min(1, 'Seleccione al menos un servicio'),

  // Vehicle info (optional)
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_year: z.number().int().min(1950).max(2030).optional(),
  license_plate: z.string().optional(),

  // Notes
  notes: z.string().max(500).optional(),
})

// Type exports
export type SendAppointmentEmail = z.infer<typeof sendAppointmentEmailSchema>
export type CreateAppointment = z.infer<typeof createAppointmentSchema>
