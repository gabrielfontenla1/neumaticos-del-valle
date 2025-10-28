import { Navbar } from '@/components/Navbar'
import ProductsClientImproved from './ProductsClientImproved'

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
      <ProductsClientImproved products={[]} stats={null} />
    </div>
  )
}
