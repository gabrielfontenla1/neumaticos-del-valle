'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useCartContext } from '@/providers/CartProvider'
import { CartItem } from '@/features/cart/components/CartItem'
import { CartSummary } from '@/features/cart/components/CartSummary'
import { EmptyCart } from '@/features/cart/components/EmptyCart'
import { CartSkeleton } from '@/features/cart/components/CartSkeleton'
import { CheckoutModal } from '@/features/cart/components/CheckoutModal'
import { generateAIOptimizedMessage, buildWhatsAppUrl, WHATSAPP_NUMBERS } from '@/lib/whatsapp'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import type { Branch } from '@/types/branch'

export default function CarritoPage() {
  const { items, totals, clearAll } = useCartContext()
  const [isLoading, setIsLoading] = useState(true)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleOpenCheckout = () => {
    if (items.length === 0) return
    setShowCheckoutModal(true)
  }

  const handleCheckoutConfirm = async (_qty: number, branch: Branch) => {
    let orderNumber: string | null = null

    try {
      // 1. Create order in database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Cliente WhatsApp (pendiente)',
          customer_email: 'pendiente@whatsapp.temp',
          customer_phone: '0000000000',
          items: items.map(item => ({
            product_id: item.id,
            product_name: `${item.brand} ${item.name}`,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.sale_price || item.price,
            total_price: (item.sale_price || item.price) * item.quantity,
            image_url: item.image_url,
            brand: item.brand,
          })),
          subtotal: totals.subtotal,
          tax: totals.tax,
          shipping: totals.shipping,
          payment_method: 'pending',
          source: 'whatsapp',
          store_id: branch.id,
          notes: `Pedido desde web - Sucursal: ${branch.name}`,
        }),
      })

      const orderData = await orderResponse.json()

      if (orderData.success && orderData.order) {
        orderNumber = orderData.order.order_number
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }

    // 2. Generate message with order number
    const message = generateAIOptimizedMessage(items, totals, branch.name, orderNumber)
    const url = buildWhatsAppUrl(branch.whatsapp || WHATSAPP_NUMBERS.default, message)

    // 3. Open WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer')

    // 4. Clear cart if order was created
    if (orderNumber) {
      await clearAll()
    }

    setShowCheckoutModal(false)
  }

  const handleClearCart = () => {
    if (showClearConfirmation) {
      clearAll()
      setShowClearConfirmation(false)
    } else {
      setShowClearConfirmation(true)
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => {
        setShowClearConfirmation(false)
      }, 3000)
    }
  }

  if (isLoading) {
    return <CartSkeleton />
  }

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[#FFFFFF] border-b border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="py-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items List */}
            <div className="lg:col-span-2">
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#FEE004] border-gray-300 rounded focus:ring-[#FEE004]"
                    />
                    <span className="ml-3 text-base text-gray-800 font-semibold">Todos los productos</span>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <div className="px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                      Productos de NEUMÁTICOS DEL VALLE
                    </h2>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={index !== items.length - 1 ? 'border-b border-gray-200' : ''}
                      >
                        <CartItem item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Shipping Info */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-900">Envío</p>
                      <p className="text-sm text-gray-700 mt-1">
                        Aprovechá el envío gratis agregando más productos de NEUMÁTICOS DEL VALLE.
                        <Link href="/productos" className="text-green-600 hover:text-green-700 hover:underline ml-1 font-semibold">
                          Ver productos
                        </Link>
                      </p>
                    </div>
                    <span className="text-green-600 font-bold text-base">Gratis</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-6 sticky top-28">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Resumen de compra
                </h2>

                <CartSummary totals={totals} />

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleOpenCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.15)] transition-all"
                    size="lg"
                  >
                    Continuar compra
                  </Button>

                  <Button
                    onClick={handleClearCart}
                    variant={showClearConfirmation ? "destructive" : "outline"}
                    className={`w-full h-12 text-base font-semibold rounded-lg transition-all shadow-[0_2px_4px_rgba(0,0,0,0.06)] ${
                      showClearConfirmation
                        ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:shadow-[0_4px_6px_rgba(220,38,38,0.3)]'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                    size="lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {showClearConfirmation ? '¿Confirmar vaciar carrito?' : 'Vaciar carrito'}
                  </Button>
                </div>

                {/* Additional options */}
                <div className="mt-4 text-center">
                  <Link
                    href="/productos"
                    className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
                  >
                    Agregar más productos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-12">
              <EmptyCart onClose={() => {}} />
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal - Branch selection only for cart */}
      <CheckoutModal
        open={showCheckoutModal}
        onOpenChange={setShowCheckoutModal}
        showQuantityStep={false}
        onConfirm={handleCheckoutConfirm}
      />
    </div>
  )
}
