/**
 * Appointment Types
 *
 * Types aligned with the database appointments table structure
 */

// Appointment status values from database
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'

// Branch/Store information
export interface Branch {
  id: string
  name: string
  city: string
  province: string
  address: string
  phone: string | null
}

// Main appointment interface (aligned with DB schema)
export interface Appointment {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  service_type: string
  preferred_date: string          // Customer's preferred date
  preferred_time: string          // Customer's preferred time
  alternative_date: string | null // Alternative date suggestion
  alternative_time: string | null // Alternative time suggestion
  notes: string | null
  status: AppointmentStatus
  store_id: string | null
  assigned_to: string | null      // User ID of assigned admin/staff
  confirmed_date: string | null   // Admin-confirmed date (may differ from preferred)
  confirmed_time: string | null   // Admin-confirmed time
  confirmation_notes: string | null
  created_at: string
  updated_at: string

  // Joined relations
  stores?: Branch | null
}

// Appointment with branch details for display
export interface AppointmentWithBranch extends Appointment {
  stores: Branch
}

// Stats for dashboard cards
export interface AppointmentStats {
  total: number
  today: number
  confirmed: number
  pending: number
  completed: number
  cancelled: number
}

// Filters for appointment list
export interface AppointmentFilters {
  status?: AppointmentStatus
  date_from?: string
  date_to?: string
  store_id?: string
  search?: string
  page?: number
  limit?: number
}

// Status labels for UI display
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  'no-show': 'No asistió',
}

// Date filter options
export type DateFilter = 'all' | 'today' | 'tomorrow' | 'week'

// Create appointment request (from user-facing form)
export interface CreateAppointmentRequest {
  customer_name: string
  customer_email: string
  customer_phone: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  service_type: string
  preferred_date: string
  preferred_time: string
  alternative_date?: string
  alternative_time?: string
  notes?: string
  store_id?: string
}

// Confirm appointment request (admin action)
export interface ConfirmAppointmentRequest {
  confirmed_date: string
  confirmed_time: string
  confirmation_notes?: string
  status: 'confirmed'
}

// Update appointment status request
export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus
  confirmation_notes?: string
}

// Complete appointment request
export interface CompleteAppointmentRequest {
  status: 'completed'
  confirmation_notes?: string
}

// Cancel appointment request
export interface CancelAppointmentRequest {
  status: 'cancelled'
  confirmation_notes?: string
}
