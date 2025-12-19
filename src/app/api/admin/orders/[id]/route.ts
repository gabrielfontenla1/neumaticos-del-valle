import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UpdateOrderRequest, UpdateOrderResponse, Order } from '@/features/orders/types'
import { OrderStatus, PaymentStatus } from '@/features/orders/types'

/**
 * Validate order status transitions
 * Not all status transitions are allowed
 */
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: { [key: string]: string[] } = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  }

  return validTransitions[currentStatus]?.includes(newStatus) ?? false
}

/**
 * GET /api/admin/orders/[id]
 * Get a specific order by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; order?: unknown; history?: unknown[]; error?: string }>> {
  try {
    const { id } = await params

    // Validate UUID format
    if (!id || id.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order ID format',
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch order
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
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

    // Fetch order history
    const { data: history, error: historyError } = await supabase
      .from('order_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error('Error fetching order history:', historyError)
    }

    return NextResponse.json(
      {
        success: true,
        order,
        history: history || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/orders/[id]:', error)
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
 * PUT /api/admin/orders/[id]
 * Update an order (status, payment status, notes)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateOrderResponse>> {
  try {
    const { id } = await params
    const body: UpdateOrderRequest = await request.json()

    // Validate UUID format
    if (!id || id.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order ID format',
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    // Validate status transition if status is being updated
    if (body.status && body.status !== currentOrder.status) {
      if (!isValidStatusTransition(currentOrder.status, body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status transition from ${currentOrder.status} to ${body.status}`,
          },
          { status: 400 }
        )
      }
    }

    // Validate payment status if provided
    if (body.payment_status) {
      const validPaymentStatuses = Object.values(PaymentStatus)
      if (!validPaymentStatuses.includes(body.payment_status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid payment status: ${body.payment_status}`,
          },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: {
      updated_at: string
      status?: string
      payment_status?: string
      notes?: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (body.status) {
      updateData.status = body.status
    }

    if (body.payment_status) {
      updateData.payment_status = body.payment_status
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order',
        },
        { status: 500 }
      )
    }

    // Log status change in history if status was updated
    if (body.status && body.status !== currentOrder.status) {
      const historyData = {
        order_id: id,
        action: 'STATUS_CHANGED',
        description: `Order status changed from ${currentOrder.status} to ${body.status}`,
        previous_status: currentOrder.status,
        new_status: body.status,
        user_id: null, // Should be the admin user ID from auth
      }

      const { error: historyError } = await supabase
        .from('order_history')
        .insert(historyData)

      if (historyError) {
        console.error('Error logging status change:', historyError)
        // Don't fail the request if history logging fails
      }
    }

    // Log payment status change if updated
    if (body.payment_status && body.payment_status !== currentOrder.payment_status) {
      const historyData = {
        order_id: id,
        action: 'PAYMENT_STATUS_CHANGED',
        description: `Payment status changed from ${currentOrder.payment_status} to ${body.payment_status}`,
        user_id: null, // Should be the admin user ID from auth
      }

      const { error: historyError } = await supabase
        .from('order_history')
        .insert(historyData)

      if (historyError) {
        console.error('Error logging payment status change:', historyError)
        // Don't fail the request if history logging fails
      }
    }

    // Log notes change if notes were added
    if (body.notes && body.notes !== currentOrder.notes) {
      const historyData = {
        order_id: id,
        action: 'NOTES_UPDATED',
        description: `Notes updated: ${body.notes}`,
        user_id: null, // Should be the admin user ID from auth
      }

      const { error: historyError } = await supabase
        .from('order_history')
        .insert(historyData)

      if (historyError) {
        console.error('Error logging notes change:', historyError)
        // Don't fail the request if history logging fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder as Order,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/admin/orders/[id]:', error)
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
 * DELETE /api/admin/orders/[id]
 * Cancel an order (soft delete - mark as cancelled)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateOrderResponse>> {
  try {
    const { id } = await params

    // Validate UUID format
    if (!id || id.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order ID format',
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    if (currentOrder.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'Order is already cancelled',
        },
        { status: 400 }
      )
    }

    if (currentOrder.status === 'delivered') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot cancel a delivered order',
        },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error cancelling order:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to cancel order',
        },
        { status: 500 }
      )
    }

    // Log cancellation in history
    const historyData = {
      order_id: id,
      action: 'ORDER_CANCELLED',
      description: `Order cancelled (was ${currentOrder.status})`,
      previous_status: currentOrder.status,
      new_status: 'cancelled',
      user_id: null, // Should be the admin user ID from auth
    }

    const { error: historyError } = await supabase
      .from('order_history')
      .insert(historyData)

    if (historyError) {
      console.error('Error logging order cancellation:', historyError)
      // Don't fail the request if history logging fails
    }

    // If order had a voucher, revert its status
    if (currentOrder.voucher_code) {
      const { error: voucherError } = await supabase
        .from('vouchers')
        .update({
          status: 'active',
          redeemed_at: null,
        })
        .eq('code', currentOrder.voucher_code)

      if (voucherError) {
        console.error('Error reverting voucher status:', voucherError)
        // Don't fail the request if voucher update fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder as Order,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/admin/orders/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
