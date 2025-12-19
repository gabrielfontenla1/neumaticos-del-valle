/**
 * Order validation schemas
 * For /api/orders and /api/admin/orders routes
 */
import { z } from 'zod'
import { emailSchema, phoneSchema, nameSchema, paginationSchema } from './common'

// Order status enum
export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'ready',
  'completed',
  'cancelled',
])

// Payment status enum
export const paymentStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded',
])

// Order source enum
export const orderSourceSchema = z.enum([
  'website',
  'whatsapp',
  'phone',
  'store',
  'admin',
])

// Payment method enum
export const paymentMethodSchema = z.enum([
  'cash',
  'card',
  'transfer',
  'mercadopago',
])

// Order item schema (aligned with OrderItem from @/features/orders/types)
export const orderItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID es requerido'),
  product_name: z.string().min(1, 'Nombre del producto es requerido'),
  sku: z.string(),
  quantity: z.number().int().positive('Cantidad debe ser mayor a 0'),
  unit_price: z.number().positive('Precio unitario debe ser mayor a 0'),
  total_price: z.number().positive('Precio total debe ser mayor a 0'),
  image_url: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
})

// Create order request schema (POST /api/orders)
export const createOrderRequestSchema = z.object({
  // Customer info (required)
  customer_name: nameSchema,
  customer_email: emailSchema,
  customer_phone: phoneSchema,

  // Items (required)
  items: z.array(orderItemSchema).min(1, 'El pedido debe tener al menos un producto'),

  // Payment (required)
  payment_method: paymentMethodSchema,

  // Totals (optional - calculated if not provided)
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  shipping: z.number().optional(),

  // Optional fields
  voucher_code: z.string().optional(),
  source: orderSourceSchema.optional(),
  notes: z.string().max(500, 'Notas muy largas').optional(),
  store_id: z.string().optional(),
})

// Get order query schema (GET /api/orders)
export const getOrderQuerySchema = z.object({
  order_number: z.string().min(1, 'Número de orden es requerido'),
  email: emailSchema,
})

// Admin create order schema (includes status fields)
export const adminCreateOrderSchema = createOrderRequestSchema.extend({
  status: orderStatusSchema.optional(),
  payment_status: paymentStatusSchema.optional(),
})

// Admin list orders filter schema
export const adminListOrdersFilterSchema = paginationSchema.extend({
  status: orderStatusSchema.optional(),
  payment_status: paymentStatusSchema.optional(),
  source: orderSourceSchema.optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
})

// Update order status schema
export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  notes: z.string().optional(),
})

// Update payment status schema
export const updatePaymentStatusSchema = z.object({
  payment_status: paymentStatusSchema,
  notes: z.string().optional(),
})

// Type exports
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type GetOrderQuery = z.infer<typeof getOrderQuerySchema>
export type AdminCreateOrder = z.infer<typeof adminCreateOrderSchema>
export type AdminListOrdersFilter = z.infer<typeof adminListOrdersFilterSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type OrderSource = z.infer<typeof orderSourceSchema>
