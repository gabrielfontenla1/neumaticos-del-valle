import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ListOrdersResponse, Order, OrderFilters } from '@/features/orders/types'

/**
 * Build WHERE clause for Supabase query based on filters
 */
function buildWhereFilters(filters: OrderFilters): string[] {
  const whereConditions: string[] = []

  if (filters.status) {
    whereConditions.push(`status.eq.${filters.status}`)
  }

  if (filters.payment_status) {
    whereConditions.push(`payment_status.eq.${filters.payment_status}`)
  }

  if (filters.source) {
    whereConditions.push(`source.eq.${filters.source}`)
  }

  if (filters.date_from) {
    whereConditions.push(`created_at.gte.${filters.date_from}T00:00:00`)
  }

  if (filters.date_to) {
    whereConditions.push(`created_at.lte.${filters.date_to}T23:59:59`)
  }

  if (filters.search) {
    // Search in customer name, email, or phone
    const searchTerm = `%${filters.search}%`
    whereConditions.push(
      `or=(customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},customer_phone.ilike.${searchTerm})`
    )
  }

  return whereConditions
}

/**
 * GET /api/admin/orders
 * List all orders with filtering and pagination
 * Requires admin authentication
 */
export async function GET(request: Request): Promise<NextResponse<ListOrdersResponse>> {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const filters: OrderFilters = {
      status: (searchParams.get('status') as any) || undefined,
      payment_status: (searchParams.get('payment_status') as any) || undefined,
      source: (searchParams.get('source') as any) || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '50', 10), 500), // Max 500 per page
    }

    // Validate pagination
    if (filters.page < 1) filters.page = 1
    if (filters.limit < 1) filters.limit = 50

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Build query
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    if (filters.source) {
      query = query.eq('source', filters.source)
    }

    if (filters.date_from) {
      query = query.gte('created_at', `${filters.date_from}T00:00:00`)
    }

    if (filters.date_to) {
      query = query.lte('created_at', `${filters.date_to}T23:59:59`)
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(
        `customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},customer_phone.ilike.${searchTerm}`
      )
    }

    // Apply sorting and pagination
    const offset = (filters.page! - 1) * filters.limit!
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + filters.limit! - 1)

    // Execute query
    const { data: orders, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        {
          success: false,
          orders: [],
          total: 0,
          page: filters.page || 1,
          limit: filters.limit || 50,
          totalPages: 0,
          error: 'Failed to fetch orders',
        },
        { status: 500 }
      )
    }

    const total = count || 0
    const totalPages = Math.ceil(total / (filters.limit || 50))

    return NextResponse.json(
      {
        success: true,
        orders: (orders || []) as Order[],
        total,
        page: filters.page || 1,
        limit: filters.limit || 50,
        totalPages,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/orders:', error)
    return NextResponse.json(
      {
        success: false,
        orders: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/orders
 * Create an order manually from admin panel
 */
export async function POST(request: Request): Promise<NextResponse<any>> {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.customer_email || !body.customer_phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required customer information',
        },
        { status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order must contain at least one item',
        },
        { status: 400 }
      )
    }

    if (!body.payment_method) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment method is required',
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Generate order number
    const today = new Date()
    const year = today.getFullYear()
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    const nextNumber = (count || 0) + 1
    const order_number = `ORD-${year}-${String(nextNumber).padStart(5, '0')}`

    // Calculate totals
    const subtotal = body.subtotal || body.items.reduce((sum: number, item: any) => sum + item.total_price, 0)
    const tax = body.tax || 0
    const shipping = body.shipping || 0
    const total_amount = subtotal + tax + shipping

    // Prepare order data
    const orderData = {
      order_number,
      voucher_code: body.voucher_code || null,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      items: body.items,
      subtotal,
      tax,
      shipping,
      total_amount,
      status: body.status || 'pending',
      payment_status: body.payment_status || 'pending',
      payment_method: body.payment_method,
      source: body.source || 'admin',
      notes: body.notes || null,
      store_id: body.store_id || null,
    }

    // Insert order
    const { data: createdOrder, error: insertError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating order:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order',
        },
        { status: 500 }
      )
    }

    // Log creation in history
    await supabase.from('order_history').insert({
      order_id: createdOrder.id,
      action: 'ORDER_CREATED',
      description: 'Order created from admin panel',
      user_id: null,
    })

    return NextResponse.json(
      {
        success: true,
        order: createdOrder,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
