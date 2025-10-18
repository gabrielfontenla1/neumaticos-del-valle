// Appointment System Types

export interface Branch {
  id: string
  name: string
  address: string
  city: string
  province?: string  // Added province field
  phone: string
  whatsapp?: string
  email?: string
  latitude?: number
  longitude?: number
  opening_hours: BusinessHours
  services: string[]
  is_main: boolean
  active: boolean
}

export interface BusinessHours {
  [key: string]: {
    open: string
    close: string
    closed?: boolean
  }
}

export interface Service {
  id: string
  name: string
  description: string
  duration: number // minutes
  price: number
  voucherEligible?: boolean
}

export interface TimeSlot {
  date: string
  time: string
  available: boolean
}

export interface Appointment {
  id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  service_type: string
  branch_id: string
  preferred_date: string
  preferred_time: string
  voucher_id?: string
  notes?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export interface AppointmentFormData {
  // Customer info
  customer_name: string
  customer_email?: string
  customer_phone?: string

  // Vehicle info
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number

  // Location and appointment details
  selected_province?: string  // Province selected first
  branch_id: string
  service_type?: string  // Single service (legacy)
  selectedServices?: string[]  // Multiple services (multi-select)
  preferred_date: string
  preferred_time: string
  notes?: string

  // Voucher
  voucher_code?: string
}

// Predefined services
export const SERVICES: Service[] = [
  {
    id: 'inspection',
    name: 'Revisión',
    description: 'Inspección completa de neumáticos, frenos y sistema de suspensión',
    duration: 30,
    price: 0,
    voucherEligible: false
  },
  {
    id: 'tire-change',
    name: 'Cambio de Neumáticos',
    description: 'Desmontaje e instalación de neumáticos nuevos con balanceo incluido',
    duration: 60,
    price: 40000,
    voucherEligible: false
  },
  {
    id: 'alignment',
    name: 'Alineado',
    description: 'Alineación computarizada de alta precisión para optimizar el desgaste de neumáticos',
    duration: 45,
    price: 35000,
    voucherEligible: false
  },
  {
    id: 'balancing',
    name: 'Balanceo',
    description: 'Balanceo dinámico computarizado para eliminar vibraciones',
    duration: 30,
    price: 25000,
    voucherEligible: false
  },
  {
    id: 'rotation',
    name: 'Rotación',
    description: 'Rotación de neumáticos para desgaste uniforme y mayor durabilidad',
    duration: 30,
    price: 20000,
    voucherEligible: false
  },
  {
    id: 'nitrogen',
    name: 'Inflado con Nitrógeno',
    description: 'Inflado con nitrógeno puro para mejor rendimiento y menor pérdida de presión',
    duration: 20,
    price: 15000,
    voucherEligible: false
  },
  {
    id: 'front-end',
    name: 'Tren Delantero',
    description: 'Revisión y ajuste completo del sistema de suspensión y dirección',
    duration: 60,
    price: 45000,
    voucherEligible: false
  },
  {
    id: 'tire-repair',
    name: 'Reparación de Llantas',
    description: 'Reparación profesional de pinchazos y daños menores en neumáticos',
    duration: 40,
    price: 18000,
    voucherEligible: true
  }
]

// Time slots for appointments (9 AM to 6 PM)
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
]