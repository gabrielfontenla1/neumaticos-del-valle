import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderStatus,
} from '@/features/orders/types'
import { OrderStatus as OrderStatusEnum, OrderSource, PaymentStatus } from '@/features/orders/types'

/**
 * Generate sequential order number
 * Format: ORD-2025-00001
 */
async function generateOrderNumber(supabase: any): Promise<string> {
  try {
    const today = new Date()
    const year = today.getFullYear()
    const dateStr = `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Get the count of orders created today
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('created_at', `gte.${dateStr}T00:00:00`)
      .lt('created_at', `lt.${dateStr}T23:59:59`)

    if (error) {
      console.error('Error counting orders for today:', error)
      return `ORD-${year}-00001`
    }

    const nextNumber = (count || 0) + 1
    return `ORD-${year}-${String(nextNumber).padStart(5, '0')}`
  } catch (error) {
    console.error('Error generating order number:', error)
    // Fallback: generate with timestamp
    return `ORD-${Date.now()}`
  }
}

/**
 * POST /api/orders
 * Create a new order from cart/voucher data
 */
export async function POST(request: Request): Promise<NextResponse<CreateOrderResponse>> {
  try {
    const body: CreateOrderRequest = await request.json()

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

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Generate order number
    const order_number = await generateOrderNumber(supabase)

    // Calculate totals
    const subtotal = body.subtotal || body.items.reduce((sum, item) => sum + item.total_price, 0)
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
      status: 'pending' as const,
      payment_status: 'pending' as const,
      payment_method: body.payment_method,
      source: body.source || OrderSource.WEBSITE,
      notes: body.notes || null,
      store_id: body.store_id || null,
    }

    // Insert order into database
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
          error: 'Failed to create order in database',
        },
        { status: 500 }
      )
    }

    // Log order creation in history
    const historyData = {
      order_id: createdOrder.id,
      action: 'ORDER_CREATED',
      description: `Order created from ${body.source || OrderSource.WEBSITE}`,
      user_id: null,
    }

    const { error: historyError } = await supabase
      .from('order_history')
      .insert(historyData)

    if (historyError) {
      console.error('Error logging order creation history:', historyError)
      // Don't fail the request if history logging fails
    }

    // If voucher code is provided, update voucher status
    if (body.voucher_code) {
      try {
        const { error: voucherError } = await supabase
          .from('vouchers')
          .update({
            status: 'redeemed',
            redeemed_at: new Date().toISOString(),
          })
          .eq('code', body.voucher_code)

        if (voucherError) {
          console.error('Error updating voucher status:', voucherError)
          // Don't fail the request if voucher update fails
        }
      } catch (error) {
        console.error('Error processing voucher:', error)
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: createdOrder as Order,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/orders:', error)
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
 * GET /api/orders
 * Get orders for public use (minimal info)
 * Requires order_number and customer_email for security
 */
export async function GET(request: Request): Promise<NextResponse<any>> {
  try {
    const { searchParams } = new URL(request.url)
    const order_number = searchParams.get('order_number')
    const customer_email = searchParams.get('email')

    if (!order_number || !customer_email) {
      return NextResponse.json(
        {
          success: false,
          error: 'order_number and email parameters are required',
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch order with validation
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', order_number)
      .eq('customer_email', customer_email)
      .single()

    if (error || !order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
