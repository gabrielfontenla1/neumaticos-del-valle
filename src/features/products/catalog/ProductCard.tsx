'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '../types'
import { AddToCartButton } from '@/features/cart/components/AddToCartButton'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price)
  }

  const discount = product.price_list && product.price_list > product.price
    ? Math.round(((product.price_list - product.price) / product.price_list) * 100)
    : 0

  // Calculate installments (6 cuotas)
  const installmentPrice = product.price / 6

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-[#FFC700] hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <Link href={`/productos/${product.id}`}>
        <div className="relative aspect-square p-6 bg-gray-50">
          {product.is_featured && (
            <span className="absolute top-3 left-3 z-10 px-3 py-1 text-xs font-bold tracking-wide text-white bg-red-500 rounded-md shadow-sm">
              DESTACADO
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-3 right-3 z-10 px-3 py-1.5 text-sm font-bold text-gray-900 bg-[#FFC700] rounded-md shadow-sm">
              {discount}% OFF
            </span>
          )}
          <Image
            src={product.images?.[0] || '/placeholder-tire.png'}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/productos/${product.id}`} className="block space-y-2">
          {/* Product Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-[#FFC700] transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Rating placeholder - can be replaced with actual rating data */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500">(300)</span>
          </div>

          {/* Brand & Size */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{product.brand}</span>
            {product.size_display && (
              <>
                <span className="text-gray-400">•</span>
                <span>{product.size_display}</span>
              </>
            )}
          </div>
        </Link>

        {/* Pricing Section */}
        <div className="mt-4 space-y-1">
          {product.price_list && product.price_list > product.price && (
            <div className="flex items-center gap-2">
              <p className="text-base text-gray-400 line-through">{formatPrice(product.price_list)}</p>
              <span className="text-sm font-semibold text-green-600">{discount}% OFF</span>
            </div>
          )}
          <p className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>
          <p className="text-sm text-gray-600">
            6 cuotas de <span className="font-semibold">{formatPrice(installmentPrice)}</span>
          </p>
        </div>

        {/* Stock & Shipping Info */}
        <div className="mt-4 space-y-2">
          {product.stock > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-600">Stock disponible</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-md">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-medium text-green-700">Llega gratis hoy</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-medium text-red-600">Sin stock</span>
            </div>
          )}
        </div>

        <AddToCartButton
          productId={product.id.toString()}
          productName={product.name}
          disabled={product.stock === 0}
          className="mt-4 w-full"
          variant="full"
        />
      </div>
    </div>
  )
}