import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Review, ServiceVoucher, ReviewSubmission } from './types'

// Generate unique voucher code
export function generateServiceVoucherCode(): string {
  const prefix = 'NDV'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.random().toString(36).toUpperCase().slice(2, 6)
  return `${prefix}-${timestamp}${random}`
}

// Submit a review
export async function submitReview(review: ReviewSubmission): Promise<Review | null> {
  try {
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await untypedClient
      .from('reviews')
      .insert({
        product_id: review.product_id,
        customer_name: review.customer_name,
        customer_email: review.customer_email || null,
        rating: review.rating,
        title: review.title || null,
        comment: review.comment,
        verified_purchase: !!review.purchase_code,
        is_approved: true // Auto-approve for now, can add moderation later
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting review:', error)
      return null
    }

    // Store review ID in sessionStorage for voucher generation
    if (data && review.rating >= 4) {
      sessionStorage.setItem('eligible_review_id', data.id)
      sessionStorage.setItem('review_customer_data', JSON.stringify({
        name: review.customer_name,
        email: review.customer_email,
        phone: review.customer_phone
      }))
    }

    return data
  } catch (error) {
    console.error('Error in submitReview:', error)
    return null
  }
}

// Generate service voucher for good review
export async function generateServiceVoucher(
  reviewId: string,
  customerData: {
    name: string
    email: string
    phone: string
  }
): Promise<ServiceVoucher | null> {
  try {
    const code = generateServiceVoucherCode()
    const validFrom = new Date()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30) // Valid for 30 days

    // Create service voucher - using vouchers table with adapted data
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await untypedClient
      .from('vouchers')
      .insert({
        code,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        product_details: {
          service_type: 'inspection',
          service_description: 'Inspección gratuita de neumáticos',
          review_id: reviewId
        },
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        discount_percentage: 100,
        discount_amount: 0,
        final_price: 0,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        status: 'active',
        notes: 'Voucher por reseña positiva - Servicio gratuito de inspección'
      })
      .select()
      .single()

    if (error) {
      console.error('Error generating service voucher:', error)
      return null
    }

    // Transform to ServiceVoucher type
    const serviceVoucher: ServiceVoucher = {
      id: data.id,
      code: data.code,
      review_id: reviewId,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      service_type: 'inspection',
      service_value: 0,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      status: data.status as 'active',
      notes: data.notes,
      created_at: data.created_at
    }

    // Clear sessionStorage
    sessionStorage.removeItem('eligible_review_id')
    sessionStorage.removeItem('review_customer_data')

    return serviceVoucher
  } catch (error) {
    console.error('Error in generateServiceVoucher:', error)
    return null
  }
}

// Get reviews for a product
export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getProductReviews:', error)
    return []
  }
}

// Get customer vouchers by phone
export async function getCustomerVouchers(phone: string): Promise<ServiceVoucher[]> {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('customer_phone', phone)
      .ilike('notes', '%reseña%')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customer vouchers:', error)
      return []
    }

    // Transform to ServiceVoucher type
    const vouchersData = data as any[]
    const serviceVouchers: ServiceVoucher[] = (vouchersData || []).map(voucher => ({
      id: voucher.id,
      code: voucher.code,
      review_id: voucher.product_details?.review_id || '',
      customer_name: voucher.customer_name,
      customer_email: voucher.customer_email,
      customer_phone: voucher.customer_phone,
      service_type: voucher.product_details?.service_type || 'inspection',
      service_value: 0,
      valid_from: voucher.valid_from,
      valid_until: voucher.valid_until,
      status: voucher.status,
      notes: voucher.notes,
      created_at: voucher.created_at
    }))

    return serviceVouchers
  } catch (error) {
    console.error('Error in getCustomerVouchers:', error)
    return []
  }
}

// Validate voucher code
export async function validateVoucherCode(code: string): Promise<{
  is_valid: boolean
  voucher?: ServiceVoucher
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !data) {
      return {
        is_valid: false,
        error: 'Código de voucher no encontrado'
      }
    }

    const voucherData = data as any
    const now = new Date()
    const validUntil = new Date(voucherData.valid_until)

    if (voucherData.status === 'redeemed') {
      return {
        is_valid: false,
        error: 'Este voucher ya fue utilizado'
      }
    }

    if (voucherData.status === 'expired' || now > validUntil) {
      return {
        is_valid: false,
        error: 'Este voucher ha expirado'
      }
    }

    if (voucherData.status !== 'active') {
      return {
        is_valid: false,
        error: 'Este voucher no está activo'
      }
    }

    // Transform to ServiceVoucher
    const serviceVoucher: ServiceVoucher = {
      id: voucherData.id,
      code: voucherData.code,
      review_id: voucherData.product_details?.review_id || '',
      customer_name: voucherData.customer_name,
      customer_email: voucherData.customer_email,
      customer_phone: voucherData.customer_phone,
      service_type: voucherData.product_details?.service_type || 'inspection',
      service_value: 0,
      valid_from: voucherData.valid_from,
      valid_until: voucherData.valid_until,
      status: voucherData.status,
      notes: voucherData.notes,
      created_at: voucherData.created_at
    }

    return {
      is_valid: true,
      voucher: serviceVoucher
    }
  } catch (error) {
    console.error('Error in validateVoucherCode:', error)
    return {
      is_valid: false,
      error: 'Error al validar el voucher'
    }
  }
}

// Redeem voucher
export async function redeemVoucher(code: string, notes?: string): Promise<boolean> {
  try {
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await untypedClient
      .from('vouchers')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redemption_notes: notes || 'Servicio realizado',
        updated_at: new Date().toISOString()
      })
      .eq('code', code)

    if (error) {
      console.error('Error redeeming voucher:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in redeemVoucher:', error)
    return false
  }
}