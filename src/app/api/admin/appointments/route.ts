import { NextResponse } from 'next/server'
import { supabaseAdminUntyped } from '@/lib/supabase-admin'
import { requireAdminAuth } from '@/lib/auth/admin-check'
import type { Appointment, AppointmentStatus } from '@/features/admin/types/appointment'

/**
 * GET /api/admin/appointments
 * List appointments with optional filters
 * Requires admin authentication
 *
 * Query params:
 * - dateFrom: ISO date string (e.g., "2026-02-09")
 * - status: AppointmentStatus filter
 * - storeId: Filter by store/branch
 * - includeAll: If "true", include past appointments
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response as NextResponse
    }

    // Use admin client (bypasses RLS)
    const supabase = supabaseAdminUntyped

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const status = searchParams.get('status') as AppointmentStatus | null
    const storeId = searchParams.get('storeId')
    const includeAll = searchParams.get('includeAll') === 'true'

    // Build query with store join
    let query = supabase
      .from('appointments')
      .select(`
        *,
        stores:store_id (
          id,
          name,
          city,
          province,
          address,
          phone
        )
      `)
      .order('preferred_date', { ascending: true })
      .order('preferred_time', { ascending: true })

    // Apply date filter (default: from today onwards)
    if (!includeAll) {
      const filterDate = dateFrom || new Date().toISOString().split('T')[0]
      query = query.gte('preferred_date', filterDate)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply store filter
    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        {
          success: false,
          data: [],
          error: 'Failed to fetch appointments',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: (data || []) as Appointment[],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/appointments:', error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/appointments
 * Update an appointment (status, confirmation, etc.)
 * Requires admin authentication
 */
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response as NextResponse
    }

    // Parse request body
    const body = await request.json()

    // Validate ID
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: id',
        },
        { status: 400 }
      )
    }

    // Use admin client (bypasses RLS)
    const supabase = supabaseAdminUntyped

    // Prepare update data (only include fields that are present)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.confirmed_date !== undefined) updateData.confirmed_date = body.confirmed_date
    if (body.confirmed_time !== undefined) updateData.confirmed_time = body.confirmed_time
    if (body.confirmation_notes !== undefined) updateData.confirmation_notes = body.confirmation_notes
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to

    // Update appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', body.id)
      .select(`
        *,
        stores:store_id (
          id,
          name,
          city,
          province,
          address,
          phone
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update appointment',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedAppointment as Appointment,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/admin/appointments:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
