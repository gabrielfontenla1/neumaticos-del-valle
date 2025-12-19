import { Navbar } from '@/components/layout/Navbar'
import ProductsClient from './ProductsClient'

// Force dynamic rendering for pages using useSearchParams
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Catálogo de Neumáticos | Neumáticos del Valle',
  description: 'Encontrá el neumático perfecto para tu vehículo. Amplio catálogo de marcas y medidas.'
}

export default function ProductsPage() {
  // Instead of fetching on server and passing to client,
  // let the client component fetch the products itself
  return (
    <div>
      <Navbar />
      <ProductsClient products={[]} stats={null} />
    </div>
  )
}
