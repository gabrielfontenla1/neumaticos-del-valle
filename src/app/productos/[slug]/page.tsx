import { Metadata } from 'next'
import ProductDetail from '@/features/products/catalog/ProductDetail'
import { getProductBySlug } from '@/features/products/api'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: 'Producto no encontrado | Neumáticos del Valle' }
  }

  const title = `${product.brand} ${product.name} | Neumáticos del Valle`
  const description = `${product.brand} ${product.name} - Precio: $${Number(product.price).toLocaleString('es-AR')}. Compra online con envío a todo el país.`

  return {
    title,
    description,
    openGraph: {
      title: `${product.brand} ${product.name}`,
      description: `${product.brand} - $${Number(product.price).toLocaleString('es-AR')}`,
      images: product.image_url ? [product.image_url] : [],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  return <ProductDetail productSlug={slug} />
}
