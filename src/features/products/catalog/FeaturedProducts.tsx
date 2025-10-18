'use client'

import { useFeaturedProducts } from '../hooks/useProducts'
import ProductCard from './ProductCard'
import Link from 'next/link'

export default function FeaturedProducts() {
  const { products, loading } = useFeaturedProducts()

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Productos Destacados</h2>
            <p className="text-gray-600 mt-2">Los mejores neumáticos seleccionados para ti</p>
          </div>
          <Link
            href="/productos"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            Ver todos
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}