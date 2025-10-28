'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react'
import { useCartContext } from '@/providers/CartProvider'
import { CartItem } from '@/features/cart/components/CartItem'
import { CartSummary } from '@/features/cart/components/CartSummary'
import { EmptyCart } from '@/features/cart/components/EmptyCart'
import { formatPrice, generateSimpleCartMessage, buildWhatsAppUrl, WHATSAPP_NUMBERS } from '@/lib/whatsapp'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function CarritoPage() {
  const { items, totals, clearAll } = useCartContext()

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/productos">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6" />
                    Mi Carrito
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {items.length > 0
                      ? `${totals.items_count} ${totals.items_count === 1 ? 'producto' : 'productos'} en tu carrito`
                      : 'Tu carrito está vacío'
                    }
                  </p>
                </div>
              </div>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Vaciar carrito
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Productos
                </h2>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CartItem item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen del pedido
                </h2>

                <CartSummary totals={totals} />

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleSendToWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium gap-2"
                    size="lg"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Enviar pedido por WhatsApp
                  </Button>

                  <Link href="/productos" className="block">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Seguir comprando
                    </Button>
                  </Link>
                </div>

                {/* Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700 text-center">
                    Al enviar tu pedido, un asesor te contactará por WhatsApp para coordinar el pago y entrega
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <EmptyCart onClose={() => {}} />
              <div className="mt-6 text-center">
                <Link href="/productos">
                  <Button className="gap-2">
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
