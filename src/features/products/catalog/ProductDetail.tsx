'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, ShieldCheck, Star, Minus, Plus, Info, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Product } from '../types'
import { getProductById } from '../api'
import { useCartContext } from '@/providers/CartProvider'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { findEquivalentTires } from '@/features/tire-equivalence/api'
import { EquivalentTire } from '@/features/tire-equivalence/types'
import { toast } from 'sonner'
import InstallmentTable from './InstallmentTable'

interface ProductDetailProps {
  productId: string
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [equivalentTires, setEquivalentTires] = useState<EquivalentTire[]>([])
  const [loadingEquivalents, setLoadingEquivalents] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { addItem, items, totals, isLoading: cartLoading } = useCartContext()

  // Function to get clean product name without dimension duplication
  const getCleanProductName = (item: Product | EquivalentTire) => {
    if (item.width && item.profile && item.diameter &&
        item.width > 0 && item.profile > 0 && item.diameter > 0) {
      const dimensionPattern = `${item.width}/${item.profile}R${item.diameter}`
      const name = item.name || ''

      // Remove the dimension pattern from the beginning of the name
      if (name.startsWith(dimensionPattern)) {
        return name.substring(dimensionPattern.length).trim()
      }

      // Also try with lowercase 'r'
      const dimensionPatternLower = `${item.width}/${item.profile}r${item.diameter}`
      if (name.toLowerCase().startsWith(dimensionPatternLower.toLowerCase())) {
        return name.substring(dimensionPatternLower.length).trim()
      }
    }

    return item.name
  }

  const itemsPerView = 3
  const maxIndex = Math.max(0, equivalentTires.length - itemsPerView)

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  useEffect(() => {
    // Force scroll to top immediately on mount
    if (typeof window !== 'undefined') {
      // Disable smooth scrolling temporarily for immediate effect
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0

      // Re-enable smooth scrolling after a brief delay
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = 'smooth'
      }, 100)
    }

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
        }, 3, false) // 3% tolerancia, NO permitir diferentes rodados
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

  const handleAddToCart = async () => {
    console.log('🔵 [ProductDetail] handleAddToCart INICIO')
    console.log('🔵 [ProductDetail] Producto:', product)
    console.log('🔵 [ProductDetail] Product ID:', product?.id)
    console.log('🔵 [ProductDetail] Quantity:', quantity)

    if (!product) {
      console.error('❌ [ProductDetail] No hay producto disponible')
      toast.error('No se pudo agregar el producto')
      return
    }

    console.log('🔵 [ProductDetail] Llamando a addItem con:', {
      productId: product.id,
      quantity: quantity
    })

    try {
      const result = await addItem(product.id, quantity)
      console.log('✅ [ProductDetail] Resultado de addItem:', result)

      if (result) {
        toast.success(`${quantity} ${quantity === 1 ? 'producto agregado' : 'productos agregados'} al carrito`)
      } else {
        toast.error('No se pudo agregar el producto al carrito')
      }
    } catch (error) {
      console.error('❌ [ProductDetail] Error en addItem:', error)
      toast.error('Error al agregar el producto')
    }

    console.log('🔵 [ProductDetail] handleAddToCart FIN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEDED]">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#EDEDED]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center bg-[#FFFFFF] rounded-lg border border-gray-200 p-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Producto no encontrado</h2>
            <p className="text-sm text-gray-600 mb-6">El producto que buscas no existe o fue eliminado.</p>
            <Button asChild size="sm">
              <Link href="/productos" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-3 w-3" />
                Volver al catálogo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Get price_list from features if available
  const priceList = product.price_list || (product.features as any)?.price_list || 0

  // Calculate actual discount percentage
  const discountPercentage = priceList && priceList > product.price
    ? Math.round(((priceList - product.price) / priceList) * 100)
    : 0

  const previousPrice = priceList || product.price
  // Use product's actual image or fallback to no-image
  const imageUrl = product.image_url || "/no-image.png"

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild className="h-auto py-1 px-2">
            <Link href="/productos" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-3 w-3" />
              <span className="text-xs">Volver al catálogo</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
              <div className="relative aspect-square bg-[#FFFFFF]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Package className="h-20 w-20 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Features Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-3 text-center shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
                <Truck className="h-5 w-5 text-green-600 mx-auto mb-1.5" />
                <p className="text-[10px] text-gray-600">Envío gratis</p>
              </div>
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-3 text-center shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
                <ShieldCheck className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
                <p className="text-[10px] text-gray-600">Garantía oficial</p>
              </div>
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-3 text-center shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
                <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-gray-600">Calidad premium</p>
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-4">
            {/* Main Info Card */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
              {/* Brand and Stock Status */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">{product.brand}</p>
                {product.stock > 0 ? (
                  <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100 text-[10px] h-5 px-2">
                    Stock disponible
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] h-5 px-2">
                    Sin stock
                  </Badge>
                )}
              </div>

              {/* Product Name */}
              <h1 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
                {getCleanProductName(product)}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xs text-gray-900">4.7</span>
                <div className="flex items-center text-blue-500">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i} className="text-xs">{i < 4 ? "★" : "☆"}</span>
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 ml-1">({Math.floor(product.stock * 10 + 100)} valoraciones)</span>
              </div>

              {/* Price */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                {discountPercentage > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 line-through">
                      ${previousPrice.toLocaleString('es-AR')}
                    </span>
                    <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100 text-[10px] h-5 px-2">
                      {discountPercentage}% OFF
                    </Badge>
                  </div>
                )}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    ${Number(product.price).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="text-xs text-gray-700">
                  6 cuotas de ${Math.floor(product.price / 6).toLocaleString('es-AR')}
                </div>
                {product.stock > 15 && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100 text-[10px] h-5 px-2">
                      Llega gratis hoy
                    </Badge>
                  </div>
                )}
              </div>

              {/* Size Information */}
              {(product.width && product.profile && product.diameter &&
                product.width > 0 && product.profile > 0 && product.diameter > 0) && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">Medida del neumático</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-gray-900 mb-2">
                      {product.width}/{product.profile} R{product.diameter}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <p className="text-gray-500 mb-0.5">Ancho</p>
                        <p className="font-medium text-gray-900">{product.width} mm</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Perfil</p>
                        <p className="font-medium text-gray-900">{product.profile}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Rodado</p>
                        <p className="font-medium text-gray-900">{product.diameter}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              {product.stock > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-900 mb-2">
                    Cantidad: {quantity}
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="rounded-none rounded-l-lg h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-4 py-1 text-sm font-medium text-gray-900 border-x border-gray-300">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="rounded-none rounded-r-lg h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      ({product.stock} disponibles)
                    </span>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    size="sm"
                  >
                    Agregar al carrito
                  </Button>

                  {/* WhatsApp Purchase Button */}
                  <Button
                    onClick={() => {
                      const productName = getCleanProductName(product)
                      const size = `${product.width}/${product.profile}R${product.diameter}`
                      const message = encodeURIComponent(
                        `Hola! Me interesa comprar el siguiente neumático:\n\n` +
                        `📍 Producto: ${productName}\n` +
                        `📏 Medida: ${size}\n` +
                        `🏷️ Marca: ${product.brand}\n` +
                        `💵 Precio: $${product.price.toLocaleString('es-AR')}\n` +
                        `📦 Cantidad: ${quantity} unidad${quantity > 1 ? 'es' : ''}\n\n` +
                        `¿Está disponible?`
                      )
                      const whatsappUrl = `https://wa.me/5493855946462?text=${message}`
                      window.open(whatsappUrl, '_blank')
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 mt-2"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Comprar por WhatsApp
                  </Button>
                </div>
              )}
            </div>

            {/* Description Card */}
            {product.description && (
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Descripción</h3>
                <p className="text-[11px] text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Features Card */}
            {product.features && Object.keys(product.features).length > 0 && (() => {
              // Fields to exclude from display
              const excludedFields = ['price_list', 'updated_from', 'created_from', 'codigo_propio', 'proveedor', 'supplier'];

              // Spanish translations for field names
              const fieldTranslations: { [key: string]: string } = {
                'width': 'Ancho',
                'profile': 'Perfil',
                'diameter': 'Diámetro',
                'load_index': 'Índice de carga',
                'speed_rating': 'Índice de velocidad',
                'season': 'Temporada',
                'runflat': 'Run Flat',
                'manufacturer': 'Fabricante',
                'model': 'Modelo',
                'year': 'Año',
                'dot': 'DOT',
                'origin': 'Origen',
              };

              // Filter and prepare features
              const filteredFeatures = Object.entries(product.features)
                .filter(([key]) => !excludedFields.includes(key))
                .filter(([, value]) => value !== null && value !== undefined && value !== '')
                .filter(([key]) => !key.includes('stock') && !key.includes('sucursal'));

              if (filteredFeatures.length === 0) return null;

              return (
                <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">Características técnicas</h3>
                  <dl className="space-y-2">
                    {filteredFeatures.map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                        <dt className="text-[11px] text-gray-600">
                          {fieldTranslations[key] || key.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </dt>
                        <dd className="text-[11px] font-medium text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })()}

            {/* Category Card */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600">Categoría:</span>
                <span className="text-[11px] font-medium text-gray-900 capitalize">{product.category}</span>
              </div>
              {product.model && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-600">Modelo:</span>
                  <span className="text-[11px] font-medium text-gray-900">{product.model}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Installment Table - Full Width */}
        {priceList > 0 && (
          <div className="mt-8">
            <InstallmentTable
              priceList={priceList}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          </div>
        )}

        {/* Equivalent Tires Carousel - Full Width */}
        {equivalentTires.length > 0 && (
          <div className="mt-8 bg-[#FFFFFF] rounded-lg border border-gray-200 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Neumáticos compatibles</h3>
              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-2">
                {equivalentTires.length} disponibles
              </Badge>
            </div>

            <div className="relative px-8">
              {/* Navigation Buttons */}
              {equivalentTires.length > itemsPerView && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-[#FFFFFF] hover:bg-gray-50 h-10 w-10 p-0 border-2"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-[#FFFFFF] hover:bg-gray-50 h-10 w-10 p-0 border-2"
                    onClick={handleNext}
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
                        <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out h-full flex flex-col shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                          <div className="aspect-square bg-[#FFFFFF] rounded-md mb-3 flex items-center justify-center overflow-hidden">
                            {/* Display actual product image or fallback */}
                            <img
                              src={(tire as any).image_url || "/no-image.png"}
                              alt={tire.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 flex flex-col">
                            <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                              {getCleanProductName(tire)}
                            </p>
                            {tire.width && tire.profile && tire.diameter &&
                             tire.width > 0 && tire.profile > 0 && tire.diameter > 0 && (
                              <p className="text-[11px] text-gray-500 mb-2">
                                {tire.width}/{tire.profile} R{tire.diameter}
                              </p>
                            )}
                            <p className="text-lg font-bold text-gray-900 mb-2">
                              ${Number(tire.price).toLocaleString('es-AR')}
                            </p>
                            {tire.equivalenceLevel && (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] w-fit h-5 px-2 ${
                                  tire.equivalenceLevel === 'perfecta'
                                    ? 'bg-green-50 text-green-600'
                                    : tire.equivalenceLevel === 'excelente'
                                    ? 'bg-blue-50 text-blue-600'
                                    : tire.equivalenceLevel === 'muy buena'
                                    ? 'bg-cyan-50 text-cyan-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                Equivalencia {tire.equivalenceLevel}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <Link
                href="/equivalencias"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                Ver calculadora de equivalencias
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {loadingEquivalents && (
          <div className="mt-8 bg-[#FFFFFF] rounded-lg border border-gray-200 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Neumáticos compatibles</h3>
            </div>
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
