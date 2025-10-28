import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // First, get all products (no limit to update all)
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .limit(1000) // Update up to 1000 products

    if (fetchError) {
      console.error('Error fetching products:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    // Update each product with random stock between 0 and 50
    // Make sure at least 50% have stock > 0
    const updates = []
    for (let i = 0; i < products.length; i++) {
      const hasStock = i % 2 === 0 || Math.random() > 0.3 // ~70% will have stock
      const stockValue = hasStock ? Math.floor(Math.random() * 50) + 1 : 0

      updates.push({
        id: products[i].id,
        stock: stockValue
      })
    }

    // Update in batches
    const batchSize = 10
    let totalUpdated = 0

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)

      for (const update of batch) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: update.stock })
          .eq('id', update.id)

        if (updateError) {
          console.error(`Error updating product ${update.id}:`, updateError)
        } else {
          totalUpdated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${totalUpdated} products with stock values`,
      totalUpdated,
      totalProducts: products.length
    })

  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to update stock values'
  })
}