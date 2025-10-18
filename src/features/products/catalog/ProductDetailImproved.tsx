'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, ShieldCheck, Star, Minus, Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Product } from '../types'
import { getProductById } from '../api'
import { useCart } from '@/features/cart/hooks/useCart'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { findEquivalentTires } from '@/features/tire-equivalence/api'
import { EquivalentTire } from '@/features/tire-equivalence/types'

interface ProductDetailProps {
  productId: string
}

export default function ProductDetailImproved({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [equivalentTires, setEquivalentTires] = useState<EquivalentTire[]>([])
  const [loadingEquivalents, setLoadingEquivalents] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { addItem } = useCart()

  const itemsPerView = 3
  const maxIndex = Math.max(0, equivalentTires.length - itemsPerView)

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true)
      const data = await getProductById(productId)
      setProduct(data)
      setLoading(false)
    }
    loadProduct()
  }, [productId])

  useEffect(() => {
    const loadEquivalents = async () => {
      if (!product || !product.width || !product.profile || !product.diameter) return

      setLoadingEquivalents(true)
      try {
        const result = await findEquivalentTires({
          width: product.width,
          profile: product.profile,
          diameter: product.diameter
        })
        // Filtrar el producto actual de los resultados
        const filtered = result.equivalentTires.filter(tire => tire.id !== productId)
        setEquivalentTires(filtered)
      } catch (error) {
        console.error('Error loading equivalent tires:', error)
      } finally {
        setLoadingEquivalents(false)
      }
    }

    loadEquivalents()
  }, [product, productId])

  const handleAddToCart = () => {
    if (!product) return
    addItem(product.id, quantity)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
            <p className="text-gray-600 mb-6">El producto que buscas no existe o fue eliminado.</p>
            <Button asChild>
              <Link href="/productos" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al catálogo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate discount (simulated like in products list)
  const discountPercentage = 25
  const previousPrice = Math.floor(product.price * (1 + discountPercentage / 100))
  const imageUrl = product.image_url || '/placeholder-tire.png'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/productos" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al catálogo
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="relative aspect-square bg-white">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Features Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <Truck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Envío gratis</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <ShieldCheck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Garantía oficial</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Calidad premium</p>
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Brand and Stock Status */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</p>
                {product.stock > 0 ? (
                  <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100">
                    Stock disponible
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Sin stock
                  </Badge>
                )}
              </div>

              {/* Product Name */}
              <h1 className="text-2xl font-normal text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-6">
                <span className="text-sm text-gray-900">4.7</span>
                <div className="flex items-center text-blue-500">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i} className="text-sm">{i < 4 ? "★" : "☆"}</span>
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-1">({Math.floor(product.stock * 10 + 100)} valoraciones)</span>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base text-gray-500 line-through">
                    ${previousPrice.toLocaleString('es-AR')}
                  </span>
                  <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100">
                    {discountPercentage}% OFF
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-normal text-gray-900">
                    ${Number(product.price).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="text-base text-gray-700">
                  6 cuotas de ${Math.floor(product.price / 6).toLocaleString('es-AR')}
                </div>
                {product.stock > 15 && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100">
                      Llega gratis hoy
                    </Badge>
                  </div>
                )}
              </div>

              {/* Size Information */}
              {(product.width && product.profile && product.diameter) && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Medida del neumático</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-900 mb-3">
                      {product.width}/{product.profile} R{product.diameter}
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Ancho</p>
                        <p className="font-medium text-gray-900">{product.width} mm</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Perfil</p>
                        <p className="font-medium text-gray-900">{product.profile}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Rodado</p>
                        <p className="font-medium text-gray-900">{product.diameter}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              {product.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Cantidad: {quantity}
                  </label>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="rounded-none rounded-l-lg"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-6 py-2 text-base font-medium text-gray-900 border-x border-gray-300">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="rounded-none rounded-r-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({product.stock} disponibles)
                    </span>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    className="w-full"
                    size="lg"
                  >
                    Agregar al carrito
                  </Button>
                </div>
              )}
            </div>

            {/* Description Card */}
            {product.description && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Features Card */}
            {product.features && Object.keys(product.features).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Características técnicas</h3>
                <dl className="space-y-3">
                  {Object.entries(product.features).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <dt className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="text-sm font-medium text-gray-900">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Category Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Categoría:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{product.category}</span>
              </div>
              {product.model && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Modelo:</span>
                  <span className="text-sm font-medium text-gray-900">{product.model}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Equivalent Tires Carousel - Full Width */}
        {equivalentTires.length > 0 && (
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-6">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Neumáticos compatibles</h3>
              <Badge variant="secondary" className="ml-auto">
                {equivalentTires.length} disponibles
              </Badge>
            </div>

            <div className="relative px-12">
              {/* Navigation Buttons */}
              {equivalentTires.length > itemsPerView && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-white"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-white"
                    onClick={handleNext}
                    disabled={currentIndex >= maxIndex}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Carousel Container */}
              <div className="overflow-hidden">
                <motion.div
                  className="flex gap-6"
                  animate={{
                    x: `-${currentIndex * (100 / itemsPerView)}%`,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {equivalentTires.map((tire, index) => (
                    <motion.div
                      key={tire.id}
                      className="flex-shrink-0"
                      style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 24 / itemsPerView}px)` }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/productos/${tire.id}`}
                        className="block group h-full"
                      >
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:border-blue-600 hover:shadow-lg transition-all h-full flex flex-col">
                          <div className="aspect-square bg-white rounded-md mb-4 flex items-center justify-center overflow-hidden">
                            {tire.image_url ? (
                              <img
                                src={tire.image_url}
                                alt={tire.name}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <Package className="h-20 w-20 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <p className="text-base font-medium text-gray-900 line-clamp-2 mb-2">
                              {tire.name}
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                              {tire.width}/{tire.profile} R{tire.diameter}
                            </p>
                            <p className="text-xl font-bold text-gray-900 mb-3">
                              ${Number(tire.price).toLocaleString('es-AR')}
                            </p>
                            {Math.abs(tire.differencePercent) < 1 && (
                              <Badge variant="secondary" className="text-xs bg-green-50 text-green-600 w-fit">
                                Equivalencia exacta
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Dots Indicator */}
              {equivalentTires.length > itemsPerView && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-8 bg-blue-600'
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <Link
                href="/equivalencias"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                Ver calculadora de equivalencias
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {loadingEquivalents && (
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Neumáticos compatibles</h3>
            </div>
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
