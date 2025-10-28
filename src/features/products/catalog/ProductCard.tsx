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

  // Function to remove dimension pattern from model/name when dimensions are shown separately
  const getCleanModel = () => {
    // If we have valid dimensions, remove them from the model/name
    if (product.width && product.profile && product.diameter &&
        product.width > 0 && product.profile > 0 && product.diameter > 0) {
      const dimensionPattern = `${product.width}/${product.profile}R${product.diameter}`
      const dimensionPatternLower = `${product.width}/${product.profile}r${product.diameter}`

      // Get the text to display (model, name, or description)
      let displayText = product.model || product.name || product.description || ''

      // Remove the dimension pattern from the beginning
      if (displayText.startsWith(dimensionPattern)) {
        displayText = displayText.substring(dimensionPattern.length).trim()
      } else if (displayText.toLowerCase().startsWith(dimensionPatternLower.toLowerCase())) {
        displayText = displayText.substring(dimensionPatternLower.length).trim()
      }

      // If after removing dimensions we have empty or very short text, use name/description
      if (!displayText || displayText.length < 3) {
        displayText = product.description || product.name || ''
        // Try removing pattern again from fallback
        if (displayText.startsWith(dimensionPattern)) {
          displayText = displayText.substring(dimensionPattern.length).trim()
        }
      }

      return displayText
    }

    // If no valid dimensions, return the full model/name
    return product.model || product.description || product.name
  }

  // Access price_list from features if not directly on product
  const priceList = product.price_list || (product.features as any)?.price_list || 0

  const discount = priceList && priceList > product.price
    ? Math.round(((priceList - product.price) / priceList) * 100)
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
          {/* Brand - First */}
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            {product.brand}
          </div>

          {/* Tire Size Nomenclature - Second */}
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#FFC700] transition-colors">
            {product.width && product.profile && product.diameter &&
             product.width > 0 && product.profile > 0 && product.diameter > 0
              ? `${product.width}/${product.profile}R${product.diameter}`
              : product.model || product.name // Use model or full name as fallback
            }
          </h3>

          {/* Model/Description - Third */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {getCleanModel()}
          </p>

          {/* Category Badge */}
          <div className="inline-flex items-center">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
              {product.category === 'camioneta' ? 'Camioneta/SUV' : product.category}
            </span>
          </div>
        </Link>

        {/* Pricing Section */}
        <div className="mt-4 space-y-1">
          {priceList && priceList > product.price && (
            <div className="flex items-center gap-2">
              <p className="text-base text-gray-400 line-through">{formatPrice(priceList)}</p>
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