/**
 * Product validation schemas
 * For /api/products routes
 */
import { z } from 'zod'

// Sort options
export const productSortSchema = z.enum([
  'name',
  'price',
  'price_desc',
  'brand',
  'created_at',
]).default('name')

// Tire size components
export const tireSizeSchema = z.object({
  width: z.number().int().min(100).max(400).optional(),
  profile: z.number().int().min(20).max(100).optional(),
  diameter: z.number().int().min(10).max(30).optional(),
})

// Product filters schema
export const productFiltersSchema = z.object({
  // Search
  search: z.string().optional(),

  // Basic filters
  brand: z.string().optional(),
  category: z.string().optional(),
  model: z.string().optional(),

  // Tire size filters
  width: z.string().optional(),
  profile: z.string().optional(),
  diameter: z.string().optional(),

  // Size search string (e.g., "205/55R16")
  size: z.string().optional(),

  // Sorting
  sort: productSortSchema.optional(),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// Product schema (for API responses)
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  category: z.string().nullable(),
  sku: z.string().nullable(),
  price: z.number(),
  sale_price: z.number().nullable(),
  width: z.number().nullable(),
  profile: z.number().nullable(),
  diameter: z.number().nullable(),
  season: z.string().nullable(),
  stock_quantity: z.number(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Create product schema (admin)
export const createProductSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(200),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive('Precio debe ser mayor a 0'),
  sale_price: z.number().positive().optional(),
  width: z.number().int().positive().optional(),
  profile: z.number().int().positive().optional(),
  diameter: z.number().int().positive().optional(),
  season: z.string().optional(),
  stock_quantity: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  image_url: z.string().url().optional(),
})

// Update product schema
export const updateProductSchema = createProductSchema.partial()

// Type exports
export type ProductFilters = z.infer<typeof productFiltersSchema>
export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
