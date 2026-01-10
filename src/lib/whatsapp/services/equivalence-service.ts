/**
 * Equivalence Service for WhatsApp Bot
 * Integrates with tire-equivalence feature and adds branch stock
 */

import { createClient } from '@supabase/supabase-js'
import {
  calculateTireDiameter,
  calculateToleranceRange,
  isWithinTolerance,
  getEquivalenceLevel,
  formatTireSize
} from '@/features/tire-equivalence/api'
import type { TireSize as FeatureTireSize } from '@/features/tire-equivalence/types'
import { classifyAvailability, type StockAvailability, type TireSize } from './stock-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

export interface EquivalentWithStock {
  product_id: number
  brand: string
  model: string | null
  size_display: string
  width: number
  profile: number
  diameter: number
  price: number
  // Equivalence info
  equivalence_level: 'perfecta' | 'excelente' | 'muy_buena' | 'buena'
  diameter_diff: number
  diameter_diff_percent: number
  // Stock info
  total_stock: number
  branch_stock: number
  availability: StockAvailability
}

/**
 * Find equivalent tires with stock at a specific branch
 */
export async function findEquivalentsWithStock(
  size: TireSize,
  branchCode?: string,
  tolerancePercent: number = 3
): Promise<EquivalentWithStock[]> {
  const featureSize: FeatureTireSize = {
    width: size.width,
    profile: size.profile,
    diameter: size.diameter
  }

  // Calculate reference diameter
  const referenceDiameter = calculateTireDiameter(featureSize)
  const toleranceRange = calculateToleranceRange(referenceDiameter, tolerancePercent)

  // Query products with branch stock
  const { data: products, error } = await db
    .from('products')
    .select(`
      id,
      brand,
      model,
      size_display,
      width,
      aspect_ratio,
      rim_diameter,
      price,
      branch_stock (
        quantity,
        branches!inner (
          code,
          name
        )
      )
    `)
    .not('width', 'is', null)
    .not('aspect_ratio', 'is', null)
    .not('rim_diameter', 'is', null)

  if (error) {
    console.error('[EquivalenceService] Error fetching products:', error)
    return []
  }

  const equivalents: EquivalentWithStock[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const product of (products || [])) {
    // Skip exact same size
    if (
      product.width === size.width &&
      product.aspect_ratio === size.profile &&
      product.rim_diameter === size.diameter
    ) {
      continue
    }

    // Only same rim diameter for safety
    if (product.rim_diameter !== size.diameter) {
      continue
    }

    const productSize: FeatureTireSize = {
      width: product.width,
      profile: product.aspect_ratio,
      diameter: product.rim_diameter
    }

    const productDiameter = calculateTireDiameter(productSize)

    // Check if within tolerance
    if (!isWithinTolerance(productDiameter, toleranceRange)) {
      continue
    }

    // Calculate stock
    let branchStock = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalStock = (product.branch_stock || []).reduce((sum: number, bs: any) =>
      sum + (bs.quantity || 0), 0
    )

    if (branchCode && product.branch_stock) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const branchData = product.branch_stock.find((bs: any) =>
        bs.branches?.code === branchCode
      )
      branchStock = branchData?.quantity || 0
    }

    // Only include if has stock (at least 1 to show single unit warning)
    const stockToCheck = branchCode ? branchStock : totalStock
    if (stockToCheck < 1) {
      continue
    }

    const difference = productDiameter - referenceDiameter
    const differencePercent = (difference / referenceDiameter) * 100

    // Map equivalence level
    const levelRaw = getEquivalenceLevel(differencePercent)
    const level = levelRaw === 'muy buena' ? 'muy_buena' : levelRaw as 'perfecta' | 'excelente' | 'muy_buena' | 'buena'

    equivalents.push({
      product_id: product.id,
      brand: product.brand,
      model: product.model,
      size_display: product.size_display || formatTireSize(productSize),
      width: product.width,
      profile: product.aspect_ratio,
      diameter: product.rim_diameter,
      price: product.price,
      equivalence_level: level,
      diameter_diff: Math.round(difference * 100) / 100,
      diameter_diff_percent: Math.round(differencePercent * 100) / 100,
      total_stock: totalStock,
      branch_stock: branchStock,
      availability: classifyAvailability(branchCode ? branchStock : totalStock)
    })
  }

  // Sort by: best equivalence level, then by stock, then by price
  const levelOrder = { 'perfecta': 0, 'excelente': 1, 'muy_buena': 2, 'buena': 3 }
  equivalents.sort((a, b) => {
    // First by equivalence level
    const levelDiff = levelOrder[a.equivalence_level] - levelOrder[b.equivalence_level]
    if (levelDiff !== 0) return levelDiff

    // Then by stock (higher first)
    const stockA = branchCode ? a.branch_stock : a.total_stock
    const stockB = branchCode ? b.branch_stock : b.total_stock
    if (stockA !== stockB) return stockB - stockA

    // Then by price
    return a.price - b.price
  })

  return equivalents
}

/**
 * Format equivalence level for display (Spanish)
 */
export function formatEquivalenceLevel(level: string): string {
  const labels: Record<string, string> = {
    'perfecta': 'Equivalencia perfecta',
    'excelente': 'Equivalencia excelente',
    'muy_buena': 'Muy buena equivalencia',
    'buena': 'Buena equivalencia'
  }
  return labels[level] || level
}

/**
 * Get equivalence emoji for WhatsApp
 */
export function getEquivalenceEmoji(level: string): string {
  const emojis: Record<string, string> = {
    'perfecta': '✅',
    'excelente': '👍',
    'muy_buena': '👌',
    'buena': '🔄'
  }
  return emojis[level] || ''
}

// Re-export for convenience
export { formatTireSize }
