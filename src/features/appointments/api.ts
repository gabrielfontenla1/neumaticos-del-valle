// Appointment System API calls

import { supabase, handleSupabaseError } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Appointment, AppointmentFormData, Branch } from './types'

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
    const branches: Branch[] = ((data as any[]) || []).map((store: any) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      city: store.city,
      province: store.province, // Include province
      phone: store.phone,
      whatsapp: store.whatsapp,
      email: store.email,
      latitude: store.latitude,
      longitude: store.longitude,
      opening_hours: (store.opening_hours as any) || {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { closed: true }
      },
      is_main: store.is_main,
      active: store.active,
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

    const storeData = data as any

    const branch: Branch = {
      id: storeData.id,
      name: storeData.name,
      address: storeData.address,
      city: storeData.city,
      province: storeData.province, // Include province
      phone: storeData.phone,
      whatsapp: storeData.whatsapp,
      email: storeData.email,
      latitude: storeData.latitude,
      longitude: storeData.longitude,
      opening_hours: (storeData.opening_hours as any) || {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '13:00' },
        sunday: { closed: true }
      },
      is_main: storeData.is_main,
      active: storeData.active,
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

// Create new appointment
export async function createAppointment(formData: AppointmentFormData) {
  try {
    // Get branch name for legacy column
    let branchName = ''
    if (formData.branch_id) {
      const { data: branch } = await supabase
        .from('stores')
        .select('name')
        .eq('id', formData.branch_id)
        .single()

      branchName = (branch as any)?.name || ''
    }

    // Validate voucher if provided
    let voucherId = null
    if (formData.voucher_code) {
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('id, status')
        .eq('code', formData.voucher_code)
        .single()

      const voucherData = voucher as any

      if (voucherError || !voucherData) {
        return { error: 'Código de voucher inválido' }
      }

      if (voucherData.status !== 'active') {
        return { error: 'El voucher no está activo' }
      }

      voucherId = voucherData.id
    }

    // Join multiple service IDs with comma, or use first service as fallback
    const serviceType = formData.selectedServices && formData.selectedServices.length > 0
      ? formData.selectedServices.join(', ')
      : (formData.service_type || 'general')

    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Create appointment - map fields to match database schema
    const { data, error } = await untypedClient
      .from('appointments')
      .insert({
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year,
        service_type: serviceType, // Store comma-separated service IDs
        store_id: formData.branch_id,
        branch: branchName, // Branch name for legacy column
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
        appointment_date: formData.preferred_date, // Duplicate for legacy column
        appointment_time: formData.preferred_time, // Duplicate for legacy column
        notes: formData.notes,
        status: 'pending',
        user_id: (formData as any).user_id || null
      })
      .select()
      .single()

    if (error) throw error

    // If voucher was used, link it to the appointment
    if (voucherId && data) {
      await untypedClient
        .from('vouchers')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redemption_notes: `Usado en turno #${data.id}`
        })
        .eq('id', voucherId)
    }

    return { data }
  } catch (error) {
    return handleSupabaseError(error)
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

    const voucherData = data as any

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