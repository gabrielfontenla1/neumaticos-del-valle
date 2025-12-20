import ProductDetail from '@/features/products/catalog/ProductDetail'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata = {
  title: 'Producto Agro/Camiones | Neumáticos del Valle',
  description: 'Detalles del producto para agro y camiones',
}

export default async function AgroCamionesProductPage({ params }: PageProps) {
  const { id } = await params
  return <ProductDetail productId={id} backUrl="/agro-camiones" backLabel="Volver a Agro y Camiones" />
}
