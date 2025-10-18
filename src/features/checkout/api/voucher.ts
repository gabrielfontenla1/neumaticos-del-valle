import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { CartItem, CustomerData, VoucherData } from '@/features/cart/types'

// Generate voucher code
function generateVoucherCode(): string {
  const prefix = 'NDV'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-3)
  const random = Math.random().toString(36).toUpperCase().slice(2, 5)
  return `${prefix}-${timestamp}${random}`
}

// Create voucher in database
export async function createVoucher(
  customer: CustomerData,
  items: CartItem[],
  totals: { subtotal: number; tax: number; total: number }
): Promise<VoucherData | null> {
  try {
    // Generate unique code
    const code = generateVoucherCode()

    // Calculate validity (7 days from now)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    // Prepare voucher data for each item
    const voucherPromises = items.map(async (item) => {
      const unitPrice = item.sale_price || item.price
      const totalPrice = unitPrice * item.quantity

      const productDetails = {
        name: item.name,
        brand: item.brand,
        sku: item.sku,
        width: item.width,
        aspect_ratio: item.aspect_ratio,
        rim_diameter: item.rim_diameter,
        season: item.season,
        image_url: item.image_url
      }

      const voucherData = {
        code,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        product_id: item.product_id,
        product_details: productDetails,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        discount_percentage: 0,
        discount_amount: 0,
        final_price: totalPrice,
        valid_from: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        status: 'active' as const,
        notes: customer.notes || null,
        store_id: customer.store_id || null
      }

      // Create untyped client to avoid type inference issues
      const untypedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await untypedClient
        .from('vouchers')
        .insert(voucherData)
        .select()
        .single()

      if (error) {
        console.error('Error creating voucher item:', error)
        throw error
      }

      return data
    })

    // Create all voucher items
    await Promise.all(voucherPromises)

    // Return voucher data for WhatsApp
    const voucherData: VoucherData = {
      code,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      store_id: customer.store_id || null,
      notes: customer.notes || null,
      valid_until: validUntil.toISOString()
    }

    return voucherData
  } catch (error) {
    console.error('Error creating voucher:', error)
    return null
  }
}

// Get voucher by code
export async function getVoucherByCode(code: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        stores (
          name,
          address,
          phone,
          whatsapp
        )
      `)
      .eq('code', code)

    if (error) {
      console.error('Error fetching voucher:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getVoucherByCode:', error)
    return null
  }
}

// Update voucher status
export async function updateVoucherStatus(
  code: string,
  status: 'active' | 'redeemed' | 'expired' | 'cancelled',
  notes?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'redeemed') {
      updateData.redeemed_at = new Date().toISOString()
      if (notes) updateData.redemption_notes = notes
    }

    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await untypedClient
      .from('vouchers')
      .update(updateData)
      .eq('code', code)

    if (error) {
      console.error('Error updating voucher status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateVoucherStatus:', error)
    return false
  }
}

// Check voucher validity
export async function isVoucherValid(code: string): Promise<boolean> {
  try {
    const vouchers = await getVoucherByCode(code)
    if (!vouchers || vouchers.length === 0) return false

    const voucher = vouchers[0]
    const now = new Date()
    const validUntil = new Date(voucher.valid_until)

    return voucher.status === 'active' && now <= validUntil
  } catch (error) {
    console.error('Error checking voucher validity:', error)
    return false
  }
}