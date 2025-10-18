// Supabase type helpers
import type { Database } from './database'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Product = Tables<'products'>
export type ProductInsert = Inserts<'products'>
export type ProductUpdate = Updates<'products'>

export type Store = Tables<'stores'>
export type StoreInsert = Inserts<'stores'>
export type StoreUpdate = Updates<'stores'>

export type Appointment = Tables<'appointments'>
export type AppointmentInsert = Inserts<'appointments'>
export type AppointmentUpdate = Updates<'appointments'>

export type Voucher = Tables<'vouchers'>
export type VoucherInsert = Inserts<'vouchers'>
export type VoucherUpdate = Updates<'vouchers'>

export type CartSession = Tables<'cart_sessions'>
export type CartSessionInsert = Inserts<'cart_sessions'>
export type CartSessionUpdate = Updates<'cart_sessions'>

export type CartItem = Tables<'cart_items'>
export type CartItemInsert = Inserts<'cart_items'>
export type CartItemUpdate = Updates<'cart_items'>

export type Quote = Tables<'quotes'>
export type QuoteInsert = Inserts<'quotes'>
export type QuoteUpdate = Updates<'quotes'>

export type Review = Tables<'reviews'>
export type ReviewInsert = Inserts<'reviews'>
export type ReviewUpdate = Updates<'reviews'>
