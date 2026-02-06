// Appointment System API calls

import { supabase, handleSupabaseError } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Appointment, AppointmentFormData, Branch, BusinessHours, Service } from './types'

// Local type for opening hours structure
interface DayHours {
  open?: string
  close?: string
  closed?: boolean
}

interface OpeningHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

// Database row types (for Supabase queries before mapping to domain types)
interface DBAppointmentService {
  id: string
  name: string
  description: string
  duration: number
  price: string | number
}

interface DBStore {
  id: string
  name: string
  address: string
  city: string
  province?: string
  phone?: string
  whatsapp?: string
  email?: string
  latitude?: number
  longitude?: number
  opening_hours?: OpeningHours
  is_main: boolean
  active: boolean
}

interface DBVoucher {
  id: string
  code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: 'active' | 'redeemed' | 'expired'
  valid_until: string
}

interface AppointmentFormDataWithUserId extends AppointmentFormData {
  user_id?: string | null
}

// Service operations
export async function getAppointmentServices() {
  try {
    const { data, error } = await supabase
      .from('appointment_services')
      .select('*')
      .order('name')

    if (error) throw error

    // Map database records to Service type
    const dbServices = (data || []) as DBAppointmentService[]
    const services: Service[] = dbServices.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
      voucherEligible: service.id === 'tire-repair' // Only tire repair is voucher eligible
    }))

    return { data: services }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Branch operations
export async function getBranches() {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('active', true)
      .order('is_main', { ascending: false })
      .order('name')

    if (error) throw error

    // Map stores to branches format
    const dbStores = (data || []) as DBStore[]
    const defaultOpeningHours: OpeningHours = {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { closed: true }
    }
    const branches: Branch[] = dbStores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      city: store.city,
      province: store.province,
      phone: store.phone || '',
      whatsapp: store.whatsapp,
      email: store.email,
      latitude: store.latitude,
      longitude: store.longitude,
      opening_hours: (store.opening_hours || defaultOpeningHours) as BusinessHours,
      is_main: store.is_main ?? false,
      active: store.active ?? true,
      services: ['alignment', 'balancing', 'rotation', 'nitrogen', 'front-end', 'tire-repair']
    }))

    return { data: branches }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function getBranch(branchId: string) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', branchId)
      .single()

    if (error) throw error

    const storeData = data as DBStore
    const defaultOpeningHours: OpeningHours = {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { closed: true }
    }

    const branch: Branch = {
      id: storeData.id,
      name: storeData.name,
      address: storeData.address,
      city: storeData.city,
      province: storeData.province,
      phone: storeData.phone || '',
      whatsapp: storeData.whatsapp,
      email: storeData.email,
      latitude: storeData.latitude,
      longitude: storeData.longitude,
      opening_hours: (storeData.opening_hours || defaultOpeningHours) as BusinessHours,
      is_main: storeData.is_main ?? false,
      active: storeData.active ?? true,
      services: ['alignment', 'balancing', 'rotation', 'nitrogen', 'front-end', 'tire-repair']
    }

    return { data: branch }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Get appointments for a specific date and branch
export async function getAppointmentsByDate(branchId: string, date: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', branchId)
      .eq('preferred_date', date)
      .neq('status', 'cancelled')

    if (error) throw error
    return { data: data || [] }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Check time slot availability
export async function checkAvailability(branchId: string, date: string, time: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('store_id', branchId)
      .eq('preferred_date', date)
      .eq('preferred_time', time)
      .neq('status', 'cancelled')

    if (error) throw error

    // Max 2 appointments per time slot
    const isAvailable = (data?.length || 0) < 2

    return { available: isAvailable }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Create new appointment via API endpoint
// This centralizes logic and enables admin email notification
export async function createAppointment(formData: AppointmentFormData) {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year,
        service_type: formData.service_type,
        selectedServices: formData.selectedServices,
        branch_id: formData.branch_id,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
        notes: formData.notes,
        voucher_code: formData.voucher_code,
        user_id: (formData as AppointmentFormDataWithUserId).user_id,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { error: result.error || 'Error al crear el turno' }
    }

    return { data: result.data }
  } catch (error) {
    console.error('[APPOINTMENTS] Error creating appointment:', error)
    return { error: 'Error de conexión al crear el turno' }
  }
}

// Get appointment by ID
export async function getAppointment(appointmentId: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        stores (
          name,
          address,
          phone,
          whatsapp
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Cancel appointment
export async function cancelAppointment(appointmentId: string) {
  try {
    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await untypedClient
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Validate voucher for appointment
export async function validateVoucher(voucherCode: string) {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', voucherCode)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: 'Código de voucher no encontrado' }
      }
      throw error
    }

    const voucherData = data as DBVoucher | null

    if (!voucherData) {
      return { error: 'Código de voucher no válido' }
    }

    if (voucherData.status !== 'active') {
      return { error: `El voucher está ${voucherData.status === 'redeemed' ? 'canjeado' : 'expirado'}` }
    }

    const now = new Date()
    const validUntil = new Date(voucherData.valid_until)
    if (now > validUntil) {
      return { error: 'El voucher ha expirado' }
    }

    return { data: voucherData }
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Get customer appointments
export async function getCustomerAppointments(email: string, phone: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        stores (
          name,
          address
        )
      `)
      .or(`customer_email.eq.${email},customer_phone.eq.${phone}`)
      .order('preferred_date', { ascending: false })
      .limit(10)

    if (error) throw error
    return { data: data || [] }
  } catch (error) {
    return handleSupabaseError(error)
  }
}