import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { detectBrandFromName } from '@/features/products/utils/importHelpers'

/**
 * Migration endpoint to fix product brands
 * Detects brands like FORMULA from product names that were incorrectly imported as PIRELLI
 *
 * GET - Preview what would be updated (dry run)
 * POST - Execute the migration
 */

interface ProductToUpdate {
  id: string
  name: string
  brand: string | null
}

interface UpdatePreview {
  id: string
  name: string
  currentBrand: string | null
  detectedBrand: string
  willUpdate: boolean
}

export async function GET() {
  try {
    // Fetch products with PIRELLI brand or null brand
    // Note: Using 'any' cast because database.ts types are outdated and don't include 'brand' field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: products, error } = await (supabaseAdmin as any)
      .from('products')
      .select('id, name, brand')
      .or('brand.eq.PIRELLI,brand.is.null')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Preview what would be updated
    const updates: UpdatePreview[] = (products || []).map((p: ProductToUpdate) => {
      const detectedBrand = detectBrandFromName(p.name, p.brand || 'PIRELLI')
      const willUpdate = detectedBrand !== (p.brand || 'PIRELLI')
      return {
        id: p.id,
        name: p.name,
        currentBrand: p.brand,
        detectedBrand,
        willUpdate
      }
    })

    const willUpdate = updates.filter((u: UpdatePreview) => u.willUpdate)
    const noUpdate = updates.filter((u: UpdatePreview) => !u.willUpdate)

    // Group by detected brand for summary
    const brandSummary: Record<string, number> = {}
    willUpdate.forEach(u => {
      brandSummary[u.detectedBrand] = (brandSummary[u.detectedBrand] || 0) + 1
    })

    return NextResponse.json({
      message: 'Dry run - no changes made',
      totalProducts: products?.length || 0,
      willUpdate: willUpdate.length,
      noUpdate: noUpdate.length,
      brandSummary,
      preview: willUpdate.slice(0, 50),
      noUpdateSamples: noUpdate.slice(0, 5)
    })
  } catch (error) {
    console.error('Migration preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview migration' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Fetch all products with PIRELLI brand or null brand
    // Note: Using 'any' cast because database.ts types are outdated and don't include 'brand' field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: products, error: fetchError } = await (supabaseAdmin as any)
      .from('products')
      .select('id, name, brand')
      .or('brand.eq.PIRELLI,brand.is.null')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        message: 'No products to check',
        updated: 0
      })
    }

    let updated = 0
    let skipped = 0
    let failed = 0
    const errors: { id: string; name: string; error: string }[] = []
    const updatedBrands: Record<string, number> = {}

    // Process each product
    for (const product of products as ProductToUpdate[]) {
      const detectedBrand = detectBrandFromName(product.name, product.brand || 'PIRELLI')

      // Only update if brand is different
      if (detectedBrand !== (product.brand || 'PIRELLI')) {
        // Note: Using 'any' cast because database.ts types are outdated and don't include 'brand' field
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabaseAdmin as any)
          .from('products')
          .update({ brand: detectedBrand })
          .eq('id', product.id)

        if (updateError) {
          failed++
          errors.push({
            id: product.id,
            name: product.name,
            error: updateError.message
          })
        } else {
          updated++
          updatedBrands[detectedBrand] = (updatedBrands[detectedBrand] || 0) + 1
        }
      } else {
        skipped++
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      total: products.length,
      updated,
      skipped,
      failed,
      updatedBrands,
      errors: errors.slice(0, 10) // Only return first 10 errors
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to execute migration' },
      { status: 500 }
    )
  }
}
