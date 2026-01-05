import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseTireSize } from '@/features/products/utils/importHelpers'

/**
 * Migration endpoint to fix product dimensions (profile and diameter)
 * This extracts values from the product name field
 *
 * GET - Preview what would be updated (dry run)
 * POST - Execute the migration
 */

interface ProductToUpdate {
  id: string
  name: string
  width: number | null
  profile: number | null
  diameter: number | null
}

export async function GET() {
  try {
    // Fetch products with missing dimensions
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, width, profile, diameter')
      .or('profile.is.null,diameter.is.null')
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Preview what would be updated
    const updates = (products || []).map((p: ProductToUpdate) => {
      const parsed = parseTireSize(p.name)
      return {
        id: p.id,
        name: p.name,
        current: {
          width: p.width,
          profile: p.profile,
          diameter: p.diameter
        },
        parsed,
        willUpdate: parsed.profile !== null || parsed.diameter !== null
      }
    })

    const willUpdate = updates.filter(u => u.willUpdate)
    const noUpdate = updates.filter(u => !u.willUpdate)

    return NextResponse.json({
      message: 'Dry run - no changes made',
      totalProducts: products?.length || 0,
      willUpdate: willUpdate.length,
      noUpdate: noUpdate.length,
      preview: willUpdate.slice(0, 20),
      noUpdateSamples: noUpdate.slice(0, 10)
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
    // Fetch ALL products with missing dimensions
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, width, profile, diameter')
      .or('profile.is.null,diameter.is.null')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        message: 'No products need updating',
        updated: 0
      })
    }

    let updated = 0
    let skipped = 0
    let failed = 0
    const errors: { id: string; name: string; error: string }[] = []

    // Process each product
    for (const product of products as ProductToUpdate[]) {
      const parsed = parseTireSize(product.name)

      // Only update if we parsed at least some dimensions
      if (parsed.width !== null || parsed.profile !== null || parsed.diameter !== null) {
        const updateData: Record<string, number | null> = {}

        // Only update fields that are currently null and we have a value for
        if (product.width === null && parsed.width !== null) {
          updateData.width = parsed.width
        }
        if (product.profile === null && parsed.profile !== null) {
          updateData.profile = parsed.profile
        }
        if (product.diameter === null && parsed.diameter !== null) {
          updateData.diameter = parsed.diameter
        }

        // If there's nothing to update, skip
        if (Object.keys(updateData).length === 0) {
          skipped++
          continue
        }

        // Update the product
        // Note: Using 'any' cast because database.ts types are outdated
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabaseAdmin as any)
          .from('products')
          .update(updateData)
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
