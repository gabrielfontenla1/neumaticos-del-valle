/**
 * Validation Schemas Library
 *
 * Centralized Zod validation schemas for all API routes.
 *
 * Usage:
 * ```ts
 * import { createOrderRequestSchema, parseRequestBody } from '@/lib/validations'
 *
 * export async function POST(request: Request) {
 *   const result = await parseRequestBody(request, createOrderRequestSchema)
 *   if (!result.success) {
 *     return NextResponse.json({ error: result.error }, { status: 400 })
 *   }
 *   const data = result.data
 *   // data is fully typed!
 * }
 * ```
 */

// Re-export everything from domain-specific files
export * from './common'
export * from './orders'
export * from './products'
export * from './appointments'
export * from './chat'

// Re-export zod for convenience
export { z } from 'zod'
