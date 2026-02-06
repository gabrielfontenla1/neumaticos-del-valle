// API Route for creating appointments with admin notification
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAppointmentNotificationEmail } from '@/lib/resend'

// Helper to format date in Spanish
function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customer_name,
      customer_email,
      customer_phone,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      service_type,
      selectedServices,
      branch_id,
      preferred_date,
      preferred_time,
      notes,
      voucher_code,
      user_id
    } = body

    // Validate required fields
    if (!customer_name || !branch_id || !preferred_date || !preferred_time) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes: customer_name, branch_id, preferred_date, preferred_time' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get branch name and email
    const { data: branch } = await supabase
      .from('stores')
      .select('name, email')
      .eq('id', branch_id)
      .single()

    const branchName = branch?.name || 'No especificada'
    const branchEmail = branch?.email || null

    // Validate voucher if provided
    let voucherId = null
    if (voucher_code) {
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('id, status')
        .eq('code', voucher_code)
        .single()

      if (voucherError || !voucher) {
        return NextResponse.json(
          { error: 'Código de voucher inválido' },
          { status: 400 }
        )
      }

      if (voucher.status !== 'active') {
        return NextResponse.json(
          { error: 'El voucher no está activo' },
          { status: 400 }
        )
      }

      voucherId = voucher.id
    }

    // Join multiple service IDs with comma
    const serviceTypeValue = selectedServices && selectedServices.length > 0
      ? selectedServices.join(', ')
      : (service_type || 'general')

    // Create appointment in database
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        service_type: serviceTypeValue,
        store_id: branch_id,
        branch: branchName,
        preferred_date,
        preferred_time,
        appointment_date: preferred_date,
        appointment_time: preferred_time,
        notes,
        status: 'pending',
        user_id: user_id || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('[APPOINTMENTS] Error creating appointment:', insertError)
      return NextResponse.json(
        { error: 'Error al crear el turno', details: insertError.message },
        { status: 500 }
      )
    }

    // If voucher was used, mark it as redeemed
    if (voucherId && appointment) {
      await supabase
        .from('vouchers')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redemption_notes: `Usado en turno #${appointment.id}`
        })
        .eq('id', voucherId)
    }

    // Send notification to admin and branch (non-blocking)
    try {
      const emailResult = await sendAppointmentNotificationEmail({
        customerName: customer_name,
        customerEmail: customer_email || 'No proporcionado',
        customerPhone: customer_phone || 'No proporcionado',
        service: serviceTypeValue,
        date: formatDateSpanish(preferred_date),
        time: preferred_time,
        branch: branchName,
        branchEmail: branchEmail
      })

      if (!emailResult.success) {
        console.error('[APPOINTMENTS] Email notification failed:', emailResult.error)
        // Don't fail the request - appointment was created successfully
      }
    } catch (emailError) {
      console.error('[APPOINTMENTS] Email notification error:', emailError)
      // Don't fail the request - appointment was created successfully
    }

    return NextResponse.json({
      success: true,
      data: appointment
    })

  } catch (error) {
    console.error('[APPOINTMENTS] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list appointments (optional, for future use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branch_id = searchParams.get('branch_id')
    const date = searchParams.get('date')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from('appointments')
      .select('*')
      .neq('status', 'cancelled')
      .order('preferred_date', { ascending: true })
      .order('preferred_time', { ascending: true })

    if (branch_id) {
      query = query.eq('store_id', branch_id)
    }

    if (date) {
      query = query.eq('preferred_date', date)
    }

    const { data, error } = await query

    if (error) {
      console.error('[APPOINTMENTS] Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Error al obtener turnos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('[APPOINTMENTS] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
