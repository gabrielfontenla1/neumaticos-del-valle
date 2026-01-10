/**
 * Stock Service for WhatsApp Bot
 * Handles stock queries per branch and availability classification
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

export type StockAvailability = 'available' | 'last_units' | 'single_unit' | 'unavailable'

export interface ProductWithStock {
  product_id: number
  brand: string
  model: string
  size_display: string
  price: number
  total_stock: number
  branch_stock: number
  branch_code: string | null
}

export interface BranchStock {
  branch_id: string
  branch_code: string
  branch_name: string
  total_quantity: number
}

export interface TireSize {
  width: number
  profile: number
  diameter: number
}

/**
 * Classify stock availability based on quantity
 * - 0: unavailable
 * - 1: single_unit (clarify to user)
 * - 2-3: last_units
 * - 4+: available
 */
export function classifyAvailability(quantity: number): StockAvailability {
  if (quantity === 0) return 'unavailable'
  if (quantity === 1) return 'single_unit'
  if (quantity <= 3) return 'last_units'
  return 'available'
}

/**
 * Get stock for a single product at a specific branch
 */
export async function getProductStockByBranch(
  productId: number,
  branchCode: string
): Promise<number> {
  const { data, error } = await db.rpc('get_branch_stock', {
    p_product_id: productId,
    p_branch_code: branchCode
  })

  if (error) {
    console.error('[StockService] Error getting branch stock:', error)
    return 0
  }

  return data || 0
}

/**
 * Get stock for a product across all branches
 */
export async function getProductStockAllBranches(
  productId: number
): Promise<BranchStock[]> {
  const { data, error } = await db
    .from('branch_stock')
    .select(`
      branch_id,
      quantity,
      branches!inner (
        code,
        name,
        is_active
      )
    `)
    .eq('product_id', productId)
    .gt('quantity', 0)

  if (error) {
    console.error('[StockService] Error getting all branch stock:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    branch_id: row.branch_id,
    branch_code: row.branches.code,
    branch_name: row.branches.name,
    total_quantity: row.quantity
  }))
}

/**
 * Search products with stock by tire size and branch
 */
export async function searchProductsWithStock(
  size: TireSize,
  branchCode?: string
): Promise<ProductWithStock[]> {
  // Build query for products matching size
  let query = db
    .from('products')
    .select(`
      id,
      brand,
      model,
      size_display,
      price,
      branch_stock (
        quantity,
        branches!inner (
          code,
          name
        )
      )
    `)
    .eq('width', size.width)
    .eq('aspect_ratio', size.profile)
    .eq('rim_diameter', size.diameter)

  const { data, error } = await query

  if (error) {
    console.error('[StockService] Error searching products:', error)
    return []
  }

  // Process results to get stock per branch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: ProductWithStock[] = (data || []).map((product: any) => {
    // Find stock for the requested branch if specified
    let branchStock = 0
    let productBranchCode: string | null = null

    if (branchCode && product.branch_stock) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const branchData = product.branch_stock.find((bs: any) =>
        bs.branches?.code === branchCode
      )
      if (branchData) {
        branchStock = branchData.quantity || 0
        productBranchCode = branchCode
      }
    }

    // Calculate total stock across all branches
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalStock = (product.branch_stock || []).reduce((sum: number, bs: any) =>
      sum + (bs.quantity || 0), 0
    )

    return {
      product_id: product.id,
      brand: product.brand,
      model: product.model,
      size_display: product.size_display,
      price: product.price,
      total_stock: totalStock,
      branch_stock: branchStock,
      branch_code: productBranchCode
    }
  })

  // Sort by branch stock (if branch specified) then by price
  return results.sort((a, b) => {
    if (branchCode) {
      if (a.branch_stock !== b.branch_stock) {
        return b.branch_stock - a.branch_stock
      }
    }
    return a.price - b.price
  })
}

/**
 * Find branches that have stock for given product IDs
 * minQuantity defaults to 2 (tires sold in pairs)
 */
export async function findBranchesWithStock(
  productIds: number[],
  minQuantity: number = 2
): Promise<BranchStock[]> {
  if (productIds.length === 0) return []

  const { data, error } = await db.rpc('find_branches_with_stock', {
    p_product_ids: productIds,
    p_min_quantity: minQuantity
  })

  if (error) {
    console.error('[StockService] Error finding branches with stock:', error)
    return []
  }

  return (data || []).map((row: { branch_id: string; branch_code: string; branch_name: string; total_quantity: number }) => ({
    branch_id: row.branch_id,
    branch_code: row.branch_code,
    branch_name: row.branch_name,
    total_quantity: row.total_quantity
  }))
}

/**
 * Group products by availability
 */
export function groupProductsByAvailability(products: ProductWithStock[]): {
  available: ProductWithStock[]
  lastUnits: ProductWithStock[]
  singleUnit: ProductWithStock[]
  unavailable: ProductWithStock[]
} {
  const available: ProductWithStock[] = []
  const lastUnits: ProductWithStock[] = []
  const singleUnit: ProductWithStock[] = []
  const unavailable: ProductWithStock[] = []

  for (const product of products) {
    const availability = classifyAvailability(product.branch_stock)
    switch (availability) {
      case 'available':
        available.push(product)
        break
      case 'last_units':
        lastUnits.push(product)
        break
      case 'single_unit':
        singleUnit.push(product)
        break
      case 'unavailable':
        unavailable.push(product)
        break
    }
  }

  return { available, lastUnits, singleUnit, unavailable }
}
