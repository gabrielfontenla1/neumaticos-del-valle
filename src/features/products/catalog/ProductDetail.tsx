'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Product } from '../types'
import { getProductById } from '../api'
import { useCart } from '@/features/cart/hooks/useCart'

interface ProductDetailProps {
  productId: string
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true)
      const data = await getProductById(productId)
      setProduct(data)
      setLoading(false)
    }
    loadProduct()
  }, [productId])

  const handleAddToCart = () => {
    if (!product) return

    addItem(product.id, quantity)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Producto no encontrado</h2>
      </div>
    )
  }

  const imageUrl = product.image_url || '/placeholder-tire.png'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagen del producto */}
        <div>
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-8"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Información del producto */}
        <div>
          <div className="mb-6">
            <p className="text-sm text-gray-500 uppercase mb-1">{product.brand}</p>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.model && (
              <p className="text-lg text-gray-600 mt-1">Modelo: {product.model}</p>
            )}
          </div>

          {/* Medidas */}
          {(product.width && product.profile && product.diameter) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Medida</h3>
              <p className="text-2xl font-bold text-blue-600">{product.width}/{product.profile} R{product.diameter}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Ancho:</span>
                  <span className="ml-2 font-medium">{product.width}mm</span>
                </div>
                <div>
                  <span className="text-gray-500">Perfil:</span>
                  <span className="ml-2 font-medium">{product.profile}</span>
                </div>
                <div>
                  <span className="text-gray-500">Aro:</span>
                  <span className="ml-2 font-medium">{product.diameter}"</span>
                </div>
              </div>
            </div>
          )}

          {/* Precio */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-gray-900">${Number(product.price).toLocaleString('es-AR')}</p>
          </div>

          {/* Stock */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-600 font-medium">En stock ({product.stock} disponibles)</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-red-600 font-medium">Sin stock</span>
              </div>
            )}
          </div>

          {/* Cantidad y botón de compra */}
          {product.stock > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center border-x border-gray-300 py-2"
                  />
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          )}

          {/* Descripción */}
          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {/* Características */}
          {product.features && Object.keys(product.features).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Características</h3>
              <dl className="grid grid-cols-2 gap-2">
                {Object.entries(product.features).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</dt>
                    <dd className="text-sm font-medium text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Categoría */}
          <div className="pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">Categoría: </span>
            <span className="text-sm font-medium text-gray-900 capitalize">{product.category}</span>
          </div>
        </div>
      </div>
    </div>
  )
}