'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, ShoppingBag, ArrowLeft, X } from 'lucide-react'
import { useCartContext } from '@/providers/CartProvider'
import { CartItem } from '@/features/cart/components/CartItem'
import { CartSummary } from '@/features/cart/components/CartSummary'
import { EmptyCart } from '@/features/cart/components/EmptyCart'
import { CartSkeleton } from '@/features/cart/components/CartSkeleton'
import { formatPrice, generateSimpleCartMessage, buildWhatsAppUrl, WHATSAPP_NUMBERS } from '@/lib/whatsapp'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CarritoPage() {
  const { items, totals, clearAll } = useCartContext()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleSendToWhatsApp = () => {
    if (items.length === 0) return

    // Generar mensaje simple sin datos del cliente
    const message = generateSimpleCartMessage(items, totals)
    const url = buildWhatsAppUrl(WHATSAPP_NUMBERS.default, message)

    // Abrir WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer')

    // Opcionalmente limpiar el carrito después de enviar
    // clearAll()
  }

  if (isLoading) {
    return <CartSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="py-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-base text-gray-700 font-medium">Todos los productos</span>
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
                        className={index !== items.length - 1 ? 'border-b border-gray-100' : ''}
                      >
                        <CartItem item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Shipping Info */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-900">Envío</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Aprovechá el envío gratis agregando más productos de NEUMÁTICOS DEL VALLE.
                        <Link href="/productos" className="text-blue-600 hover:underline ml-1 font-medium">
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
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-28" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Resumen de compra
                </h2>

                <CartSummary totals={totals} />

                {/* Actions */}
                <div className="mt-6">
                  <Button
                    onClick={handleSendToWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium rounded-full"
                    size="lg"
                  >
                    Continuar compra
                  </Button>
                </div>

                {/* Additional options */}
                <div className="mt-4 text-center">
                  <Link
                    href="/productos"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Agregar más productos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-12" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <EmptyCart onClose={() => {}} />
              <div className="mt-8 text-center">
                <Link href="/productos">
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                    <ShoppingBag className="h-4 w-4" />
                    Ver productos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
