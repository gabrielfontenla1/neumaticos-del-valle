// Review and Voucher types
export interface Review {
  id: string
  product_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  rating: number
  title?: string
  comment: string
  verified_purchase: boolean
  is_approved: boolean
  created_at: string
  voucher_generated?: boolean
}

export interface ServiceVoucher {
  id: string
  code: string
  review_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_type: 'inspection' | 'rotation' | 'balancing' | 'alignment'
  service_value: number
  valid_from: string
  valid_until: string
  status: 'pending' | 'active' | 'redeemed' | 'expired'
  notes?: string
  created_at: string
}

export interface ReviewSubmission {
  product_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  rating: number
  title?: string
  comment: string
  purchase_code?: string
}

export interface VoucherValidation {
  code: string
  is_valid: boolean
  voucher?: ServiceVoucher
  error?: string
}