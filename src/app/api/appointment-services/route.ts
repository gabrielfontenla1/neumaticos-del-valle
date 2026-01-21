import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: services, error } = await supabase
      .from('appointment_services')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, name, description, duration, price, requires_vehicle, icon } = body

    if (!id || !name || !description || duration === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('appointment_services')
      .insert({
        id,
        name,
        description,
        duration,
        price,
        requires_vehicle: requires_vehicle || false,
        icon: icon || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      service: data
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { services } = body

    if (!services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Update each service
    const updatePromises = services.map((service: any) =>
      supabase
        .from('appointment_services')
        .update({
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          requires_vehicle: service.requires_vehicle || false,
          icon: service.icon || null
        })
        .eq('id', service.id)
    )

    const results = await Promise.all(updatePromises)

    // Check for errors
    const hasErrors = results.some((result: any) => result.error)
    if (hasErrors) {
      console.error('Error updating services:', results.filter((r: any) => r.error))
      return NextResponse.json(
        { error: 'Failed to update some services' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Services updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('appointment_services')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
