import { NextResponse } from 'next/server'
import { getProducts } from '@/features/products/api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const inStock = searchParams.get('inStock') === 'true'

    // Fetch products
    const filters = inStock ? { inStock: true } : {}
    const { data: products = [], error } = await getProducts(filters, page, limit)

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Filter products with stock if needed
    const filteredProducts = inStock
      ? products.filter(p => p.stock > 0)
      : products

    return NextResponse.json({
      products: filteredProducts,
      total: filteredProducts.length
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}