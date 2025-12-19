/**
 * Common Zod validation schemas
 * Shared across multiple API routes
 */
import { z } from 'zod'

// Email validation
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'Email es requerido')

// Phone validation (Argentina format)
export const phoneSchema = z
  .string()
  .min(8, 'Teléfono debe tener al menos 8 dígitos')
  .regex(/^[\d\s\-+()]+$/, 'Formato de teléfono inválido')

// Name validation
export const nameSchema = z
  .string()
  .min(2, 'Nombre debe tener al menos 2 caracteres')
  .max(100, 'Nombre muy largo')

// UUID validation
export const uuidSchema = z.string().uuid('ID inválido')

// Positive number validation
export const positiveNumberSchema = z.number().positive('Debe ser un número positivo')

// Non-negative number validation
export const nonNegativeNumberSchema = z.number().min(0, 'No puede ser negativo')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(500).default(50),
})

// Date string validation (ISO format)
export const dateStringSchema = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))

// Customer data schema
export const customerDataSchema = z.object({
  customer_name: nameSchema,
  customer_email: emailSchema,
  customer_phone: phoneSchema,
})

// API response wrapper
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  })

// Parse and validate helper
export function parseAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Format error messages using Zod's issues array
  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ')

  return { success: false, error: errorMessages || 'Validation failed' }
}

// Async parse helper for API routes
export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    return parseAndValidate(schema, body)
  } catch {
    return { success: false, error: 'Invalid JSON body' }
  }
}
