import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'
import type { Branch } from '@/types/branch'

/**
 * GET /api/admin/branches
 * List all branches (stores)
 * Requires admin authentication
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response as NextResponse
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch all branches ordered by is_main and name
    const { data: branches, error } = await supabase
      .from('stores')
      .select('*')
      .order('is_main', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching branches:', error)
      return NextResponse.json(
        {
          success: false,
          branches: [],
          error: 'Failed to fetch branches',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        branches: (branches || []) as Branch[],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/branches:', error)
    return NextResponse.json(
      {
        success: false,
        branches: [],
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/branches
 * Create a new branch
 * Requires admin authentication
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response as NextResponse
    }

    // Parse request body
    const body = await request.json()

    // Basic validation
    if (!body.name || !body.address || !body.city || !body.province || !body.phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, address, city, province, phone',
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Prepare branch data
    const branchData = {
      name: body.name,
      address: body.address,
      city: body.city,
      province: body.province,
      phone: body.phone,
      whatsapp: body.whatsapp || null,
      email: body.email || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      opening_hours: body.opening_hours || {
        weekdays: '08:00 - 12:30 y 16:00 - 20:00',
        saturday: '08:30 - 12:30',
        sunday: 'Cerrado',
      },
      background_image_url: body.background_image_url || null,
      is_main: body.is_main || false,
      active: body.active !== undefined ? body.active : true,
    }

    // If setting as main branch, unset other main branches first
    if (branchData.is_main) {
      await supabase
        .from('stores')
        .update({ is_main: false })
        .eq('is_main', true)
    }

    // Insert branch
    const { data: createdBranch, error: insertError } = await supabase
      .from('stores')
      .insert(branchData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating branch:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create branch',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        branch: createdBranch as Branch,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/branches:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/branches
 * Update an existing branch
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

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Prepare update data (only include fields that are present)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.province !== undefined) updateData.province = body.province
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp
    if (body.email !== undefined) updateData.email = body.email
    if (body.latitude !== undefined) updateData.latitude = body.latitude
    if (body.longitude !== undefined) updateData.longitude = body.longitude
    if (body.opening_hours !== undefined) updateData.opening_hours = body.opening_hours
    if (body.background_image_url !== undefined) updateData.background_image_url = body.background_image_url
    if (body.is_main !== undefined) updateData.is_main = body.is_main
    if (body.active !== undefined) updateData.active = body.active

    // If setting as main branch, unset other main branches first
    if (updateData.is_main) {
      await supabase
        .from('stores')
        .update({ is_main: false })
        .eq('is_main', true)
        .neq('id', body.id)
    }

    // Update branch
    const { data: updatedBranch, error: updateError } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating branch:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update branch',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        branch: updatedBranch as Branch,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/admin/branches:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/branches
 * Delete a branch
 * Requires admin authentication
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response as NextResponse
    }

    // Get branch ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: id',
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get branch data to delete associated image
    const { data: branch } = await supabase
      .from('stores')
      .select('background_image_url')
      .eq('id', id)
      .single()

    // Delete branch
    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting branch:', deleteError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete branch',
        },
        { status: 500 }
      )
    }

    // Delete associated image from storage if exists
    if (branch?.background_image_url) {
      try {
        const imagePath = branch.background_image_url.split('/branches/')[1]
        if (imagePath) {
          await supabase.storage
            .from('branches')
            .remove([imagePath])
        }
      } catch (imgError) {
        console.error('Error deleting branch image:', imgError)
        // Don't fail the request if image deletion fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Branch deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/admin/branches:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
