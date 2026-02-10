'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, ShieldCheck, Star, Minus, Plus, Info, ChevronLeft, ChevronRight, MessageCircle, ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Product } from '../types'
import { getProductById } from '../api'
import { useCartContext } from '@/providers/CartProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { findEquivalentTires } from '@/features/tire-equivalence/api'
import { EquivalentTire } from '@/features/tire-equivalence/types'
import { toast } from 'sonner'
import InstallmentTable from './InstallmentTable'
import { buildWhatsAppUrl, WHATSAPP_NUMBERS, generateSingleProductMessage } from '@/lib/whatsapp'
import { resolvePriceList, resolveDiscountPercentage } from '../utils/priceUtils'
import { CheckoutModal } from '@/features/cart/components/CheckoutModal'
import type { Branch } from '@/types/branch'

interface ProductDetailProps {
  productId: string
  backUrl?: string
  backLabel?: string
}

// Type for product features with known properties
interface ProductFeatures {
  price_list?: number
  proveedor?: string
  codigo_proveedor?: string
  stock_by_branch?: Record<string, number>
  stock_por_sucursal?: Record<string, number>  // Legacy field
  [key: string]: unknown
}

export default function ProductDetail({ productId, backUrl = '/productos', backLabel = 'Volver al catálogo' }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [equivalentTires, setEquivalentTires] = useState<EquivalentTire[]>([])
  const [loadingEquivalents, setLoadingEquivalents] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
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

  const handleCheckoutConfirm = async (qty: number, branch: Branch) => {
    if (!product) return

    let orderNumber: string | null = null
    const unitPrice = product.price
    const totalPrice = unitPrice * qty
    const productSku = product.id.slice(0, 8).toUpperCase()

    // 1. Create order in database
    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Cliente WhatsApp (pendiente)',
          customer_email: 'pendiente@whatsapp.temp',
          customer_phone: '0000000000',
          items: [{
            product_id: product.id,
            product_name: `${product.brand} ${product.name}`,
            sku: productSku,
            quantity: qty,
            unit_price: unitPrice,
            total_price: totalPrice,
            image_url: product.image_url,
            brand: product.brand,
          }],
          subtotal: totalPrice,
          tax: 0,
          shipping: 0,
          payment_method: 'pending',
          source: 'whatsapp',
          store_id: branch.id,
          notes: `Compra directa - Sucursal: ${branch.name}`,
        }),
      })

      const orderData = await orderResponse.json()
      if (orderData.success && orderData.order) {
        orderNumber = orderData.order.order_number
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }

    // 2. Generate WhatsApp message
    const message = generateSingleProductMessage({
      sku: productSku,
      brand: product.brand || '',
      name: product.name,
      price: product.price,
      width: product.width,
      aspect_ratio: product.profile,
      rim_diameter: product.diameter
    }, qty, branch.name, orderNumber)

    // 3. Open WhatsApp
    const url = buildWhatsAppUrl(branch.whatsapp || WHATSAPP_NUMBERS.default, message)
    window.open(url, '_blank', 'noopener,noreferrer')
    setShowCheckoutModal(false)
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
              <Link href={backUrl} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-3 w-3" />
                {backLabel}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const features = product.features as ProductFeatures | undefined
  const priceList = resolvePriceList(product)
  const discountPercentage = resolveDiscountPercentage(product)

  const previousPrice = priceList || product.price
  // Use product's actual image or fallback to no-image
  const imageUrl = product.image_url || "/no-image.png"

  return (
    <div className="min-h-screen bg-white lg:bg-[#EDEDED]">
      <Navbar />

      {/* Mobile spacing for navbar - White background on mobile, gray on desktop */}
      <div className="pt-4 lg:pt-0 bg-white lg:bg-[#EDEDED]"></div>

      <div className="lg:max-w-[1440px] lg:mx-auto lg:px-4 sm:px-6 lg:px-8 lg:py-6">
        {/* Desktop Breadcrumb */}
        <div className="hidden lg:block mb-4">
          <Button variant="ghost" size="sm" asChild className="h-auto py-1 px-2">
            <Link href={backUrl} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-3 w-3" />
              <span className="text-xs">{backLabel}</span>
            </Link>
          </Button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
          {/* Mobile: Image First (order-1) / Desktop: Left Column */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="order-1 lg:space-y-4"
          >
            {/* Mobile Back Button and Title */}
            <div className="lg:hidden px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-auto p-0 hover:bg-transparent -ml-2 mb-3"
              >
                <Link href={backUrl} className="inline-flex items-center gap-1 text-gray-700">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Volver</span>
                </Link>
              </Button>

              {/* Condición y ventas */}
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <span>Nuevo</span>
                <span>|</span>
                <span>+{(() => {
                  // Generar números redondos (500, 1000, 1500, 2000, 2500, 3000, etc.)
                  const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const options = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
                  return options[hash % options.length];
                })()} vendidos</span>
              </div>

              {/* Título del producto */}
              <h1 className="text-xl font-normal text-gray-900 leading-tight capitalize">
                {product.brand.toLowerCase()} {getCleanProductName(product).toLowerCase()} {product.width}/{product.profile}R{product.diameter}
              </h1>
            </div>

            {/* Image - Full width on mobile, no padding */}
            <div className="bg-[#FFFFFF] lg:rounded-lg lg:border lg:border-gray-200 lg:p-6 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
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

            {/* Features Cards - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-3 text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                <Truck className="h-5 w-5 text-green-600 mx-auto mb-1.5" />
                <p className="text-[10px] text-gray-600">Envío gratis</p>
              </div>
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-3 text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                <ShieldCheck className="h-5 w-5 text-blue-600 mx-auto mb-1.5" />
                <p className="text-[10px] text-gray-600">Garantía oficial</p>
              </div>
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-3 text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-gray-600">Calidad premium</p>
              </div>
            </div>
          </motion.div>

          {/* Mobile: Info Second (order-2) / Desktop: Right Column */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="order-2 space-y-4"
          >
            {/* Main Info Card - Full width on mobile without padding */}
            <div className="bg-[#FFFFFF] lg:rounded-lg lg:border lg:border-gray-200 lg:p-5 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
              {/* Mobile padding wrapper - only for content that needs padding */}
              <div className="px-4 py-5 lg:p-0">
              {/* Brand and Stock Status - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:flex items-center justify-between mb-2">
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

              {/* Product Name - Hidden on mobile, shown on desktop */}
              <h1 className="hidden lg:block text-base lg:text-lg font-normal lg:font-semibold text-gray-900 mb-3 leading-tight">
                {product.brand} {getCleanProductName(product)} {product.width}/{product.profile}R{product.diameter}
              </h1>

              {/* Rating - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:flex items-center gap-1 mb-4">
                <span className="text-xs text-gray-900">4.7</span>
                <div className="flex items-center text-blue-500">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i} className="text-xs">{i < 4 ? "★" : "☆"}</span>
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 ml-1">({Math.floor(product.stock * 10 + 100)} valoraciones)</span>
              </div>

              {/* Price - Larger on mobile like ML */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                {discountPercentage > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm lg:text-xs text-gray-500 line-through">
                      ${previousPrice.toLocaleString('es-AR')}
                    </span>
                    <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100 text-xs lg:text-[10px] h-6 lg:h-5 px-2">
                      {discountPercentage}% OFF
                    </Badge>
                  </div>
                )}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl lg:text-2xl font-normal text-gray-900">
                    ${Number(product.price).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="text-sm lg:text-xs text-gray-700 mb-2">
                  3 cuotas sin interés de ${Math.floor(product.price / 3).toLocaleString('es-AR')}
                </div>
                {features?.codigo_proveedor && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-700 border border-gray-300 bg-gray-50 rounded px-2 py-1 inline-block font-mono">
                      ID: {features.codigo_proveedor}
                    </p>
                  </div>
                )}
                <div className="mt-2">
                  <p className="text-sm lg:text-xs text-green-600 font-medium">
                    Colocación sin cargo en cualquiera de nuestras sucursales
                  </p>
                </div>
              </div>
              </div>
              {/* End of padded content wrapper */}

              {/* Stock disponible - Full width */}
              {product.stock > 0 && (
                <div className="mb-2 px-4 lg:px-0">
                  <p className="text-base font-semibold text-gray-900">Stock disponible</p>
                </div>
              )}

              {/* Selector de cantidad - Full width, sin border-radius en mobile */}
              {product.stock > 0 && (
                <div className="mb-4 bg-gray-50 lg:rounded-lg p-4 lg:hidden">
                  <Select value={String(quantity)} onValueChange={(value) => setQuantity(Number(value))}>
                    <SelectTrigger className="w-full h-auto bg-transparent border-none shadow-none hover:bg-gray-100 transition-colors p-0">
                      <div className="flex items-center justify-between w-full py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-gray-900">Cantidad: </span>
                          <span className="text-base font-semibold text-gray-900">
                            <SelectValue />
                          </span>
                          <span className="text-base text-gray-500">({product.stock > 10 ? '+10' : product.stock} disponibles)</span>
                        </div>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          {num} {num === 1 ? 'unidad' : 'unidades'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Botones Mobile - Vertical layout */}
              {product.stock > 0 && (
                <div className="px-4 mb-4 lg:hidden">
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => setShowCheckoutModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base font-semibold"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Comprar por WhatsApp
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 h-11 text-base font-medium border-0"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Agregar al carrito
                    </Button>
                  </div>
                </div>
              )}

              {/* Desktop Quantity Selector - Hidden on mobile */}
              {product.stock > 0 && (
                <div className="hidden lg:block">
                  <label className="block text-sm lg:text-[11px] font-medium text-gray-900 mb-2">
                    Cantidad: <span className="text-gray-500">({product.stock > 10 ? '+10' : product.stock} disponibles)</span>
                  </label>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="rounded-none rounded-l-lg h-9 w-9 lg:h-8 lg:w-8 p-0"
                      >
                        <Minus className="h-4 w-4 lg:h-3 lg:w-3" />
                      </Button>
                      <span className="px-5 lg:px-4 py-2 lg:py-1 text-base lg:text-sm font-medium text-gray-900 border-x border-gray-300">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="rounded-none rounded-r-lg h-9 w-9 lg:h-8 lg:w-8 p-0"
                      >
                        <Plus className="h-4 w-4 lg:h-3 lg:w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Botones principales - Similar a ML */}
                  <div className="flex flex-col gap-3 mb-4">
                    <Button
                      onClick={() => setShowCheckoutModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-11 lg:h-10 text-base lg:text-sm font-semibold"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Comprar por WhatsApp
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 h-11 lg:h-10 text-base lg:text-sm font-medium border-0"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Agregar al carrito
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stock por sucursal */}
            <div className="bg-[#FFFFFF] lg:rounded-lg lg:border lg:border-gray-200 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
              <div className="px-4 py-4 lg:p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Disponibilidad por sucursal</h3>
                <div className="space-y-2">
                  {(() => {
                    const sucursales = [
                      { key: 'santiago', name: 'Santiago del Estero - Capital' },
                      { key: 'catamarca', name: 'Catamarca - Capital ( Alem )' },
                      { key: 'la_banda', name: 'Santiago del Estero - La Banda' },
                      { key: 'salta', name: 'Salta' },
                      { key: 'tucuman', name: 'Tucumán' },
                      { key: 'virgen', name: 'Catamarca - Capital ( Belgrano )' }
                    ]

                    // Use stock_by_branch (new) with fallback to stock_por_sucursal (legacy)
                    const stockPorSucursal = features?.stock_by_branch || features?.stock_por_sucursal || {}

                    const getStockDisplay = (stock: number) => {
                      if (stock === 1) return 'Última unidad'
                      if (stock < 10) return `${stock} unidades`
                      return '+10 unidades'
                    }

                    return sucursales.map(({ key, name }) => {
                      const stock = stockPorSucursal[key]
                      const hasStock = stock && stock > 0

                      return (
                        <div key={key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{name}</span>
                          {hasStock ? (
                            <span className={`text-sm font-semibold ${stock === 1 ? 'text-orange-600' : 'text-green-600'}`}>
                              {getStockDisplay(stock)}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gray-500">Sin stock</span>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Si tu sucursal no tiene stock, igual podés comprar y te lo enviamos desde otra sucursal sin cargo adicional.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Medida del neumático - Después de los botones */}
            {(product.width && product.profile && product.diameter &&
              product.width > 0 && product.profile > 0 && product.diameter > 0) && (
              <div className="bg-[#FFFFFF] lg:rounded-lg lg:border lg:border-gray-200 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
                <div className="px-4 py-4 lg:p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Medida del neumático</h3>
                  <div className="bg-gray-50 lg:rounded-lg p-4">
                    <p className="text-2xl font-semibold text-gray-900 mb-3">
                      {product.width}/{product.profile} R{product.diameter}
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-base">
                      <div>
                        <p className="text-gray-500 mb-1">Ancho</p>
                        <p className="font-semibold text-gray-900">{product.width} mm</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Perfil</p>
                        <p className="font-semibold text-gray-900">{product.profile}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Rodado</p>
                        <p className="font-semibold text-gray-900">{product.diameter}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description Card */}
            {product.description && (
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Descripción</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
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
                <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Características técnicas</h3>
                  <dl className="space-y-2">
                    {filteredFeatures.map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <dt className="text-sm text-gray-600">
                          {fieldTranslations[key] || key.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })()}

            {/* Category Card */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Información adicional</h3>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Categoría:</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{product.category}</span>
              </div>
              {product.model && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Modelo:</span>
                  <span className="text-sm font-semibold text-gray-900">{product.model}</span>
                </div>
              )}
              {features?.codigo_proveedor && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">ID del Producto:</span>
                  <span className="text-sm font-semibold text-gray-900 font-mono">{features.codigo_proveedor}</span>
                </div>
              )}
            </div>
          </motion.div>
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
                              src={tire.image_url || "/no-image.png"}
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
                            {/* Stock Badge */}
                            {typeof tire.stock === 'number' && (
                              <div className="mb-2">
                                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded transition-colors duration-200 whitespace-nowrap ${
                                  tire.stock === 1
                                    ? 'bg-orange-50 text-orange-700'
                                    : tire.stock > 0
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {tire.stock === 0 ? 'Sin stock' :
                                   tire.stock === 1 ? 'Stock: Última unidad' :
                                   tire.stock < 10 ? `Stock: ${tire.stock} unidades` :
                                   'Stock: +10 unidades'}
                                </span>
                              </div>
                            )}
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
          <div className="mt-4 lg:mt-8 bg-[#FFFFFF] px-4 py-5 lg:rounded-lg lg:border lg:border-gray-200 lg:p-6 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Neumáticos compatibles</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                  <div className="aspect-square w-full mb-3 bg-gray-100 animate-pulse rounded-md" />
                  <div className="h-4 w-full mb-1 bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-3/4 mb-2 bg-gray-100 animate-pulse rounded" />
                  <div className="h-3 w-24 mb-2 bg-gray-100 animate-pulse rounded" />
                  <div className="h-6 w-32 mb-2 bg-gray-100 animate-pulse rounded" />
                  <div className="h-5 w-28 bg-gray-100 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckoutModal}
        onOpenChange={setShowCheckoutModal}
        initialQuantity={quantity}
        showQuantityStep={true}
        onConfirm={handleCheckoutConfirm}
      />
    </div>
  )
}
