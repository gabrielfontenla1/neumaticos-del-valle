import ProductsClient from './ProductsClient'

// Force dynamic rendering for pages using useSearchParams
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Catálogo de Neumáticos | Neumáticos del Valle',
  description: 'Encontrá el neumático perfecto para tu vehículo. Amplio catálogo de marcas y medidas.'
}

export default function ProductsPage() {
  return <ProductsClient products={[]} stats={null} />
}
