import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Map form data to database fields
    const updateData: Record<string, unknown> = {}

    // General Info
    if (body.name !== undefined) updateData.name = body.name
    if (body.brand_name !== undefined) updateData.brand_name = body.brand_name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = body.price
    if (body.sale_price !== undefined) updateData.sale_price = body.sale_price
    if (body.stock !== undefined) {
      updateData.stock = body.stock
      updateData.stock_quantity = body.stock
    }
    if (body.min_stock_alert !== undefined) updateData.min_stock_alert = body.min_stock_alert

    // Specifications
    if (body.width !== undefined) updateData.width = body.width
    if (body.aspect_ratio !== undefined) updateData.aspect_ratio = body.aspect_ratio
    if (body.rim_diameter !== undefined) updateData.rim_diameter = body.rim_diameter
    if (body.construction !== undefined) updateData.construction = body.construction
    if (body.load_index !== undefined) updateData.load_index = body.load_index
    if (body.speed_rating !== undefined) updateData.speed_rating = body.speed_rating
    if (body.season !== undefined) updateData.season = body.season

    // Characteristics
    if (body.extra_load !== undefined) updateData.extra_load = body.extra_load
    if (body.run_flat !== undefined) updateData.run_flat = body.run_flat
    if (body.seal_inside !== undefined) updateData.seal_inside = body.seal_inside
    if (body.tube_type !== undefined) updateData.tube_type = body.tube_type
    if (body.homologation !== undefined) updateData.homologation = body.homologation

    // Status & Marketing
    if (body.status !== undefined) updateData.status = body.status
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.best_seller !== undefined) updateData.best_seller = body.best_seller
    if (body.new_arrival !== undefined) updateData.new_arrival = body.new_arrival

    // Always update timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Error al actualizar el producto' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in product update API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
