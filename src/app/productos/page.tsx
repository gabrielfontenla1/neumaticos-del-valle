import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { getProducts } from '@/features/products/api'
import ProductsPageClient from './ProductsPageClient'
import ProductsClientImproved from './ProductsClientImproved'

export const metadata = {
  title: 'Catálogo de Neumáticos | Neumáticos del Valle',
  description: 'Encontrá el neumático perfecto para tu vehículo. Amplio catálogo de marcas y medidas.'
}

export default async function ProductsPage() {
  // Fetch all products
  const { data: products = [], error } = await getProducts({}, 1, 1000)

  if (error) {
    console.error('Error fetching products:', error)
  }

  // Calculate stats
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    brands: new Set(products.map(p => p.brand)).size,
    categories: new Set(products.map(p => p.category)).size
  }

  return (
    <div>
      <Navbar />
      <ProductsPageClient>
        <Suspense fallback={<div>Cargando...</div>}>
          <ProductsClientImproved products={products} stats={stats} />
        </Suspense>
      </ProductsPageClient>
    </div>
  )
}
