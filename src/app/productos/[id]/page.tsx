import ProductDetailImproved from '@/features/products/catalog/ProductDetailImproved'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata = {
  title: 'Producto | Neumáticos del Valle',
  description: 'Detalles del producto',
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  return <ProductDetailImproved productId={id} />
}