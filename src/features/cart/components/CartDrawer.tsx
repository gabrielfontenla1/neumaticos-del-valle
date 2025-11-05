'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, ShoppingBag, Loader } from 'lucide-react'
import { useCartContext } from '@/providers/CartProvider'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { EmptyCart } from './EmptyCart'
import { formatPrice, generateSimpleCartMessage, buildWhatsAppUrl, WHATSAPP_NUMBERS } from '@/lib/whatsapp'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function CartDrawer() {
  const { isOpen, closeCart, items, totals, clearAll, isLoading } = useCartContext()
  const [isSending, setIsSending] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleSendToWhatsApp = async () => {
    if (items.length === 0) return

    setIsSending(true)
    try {
      // Generar mensaje simple sin datos del cliente
      const message = generateSimpleCartMessage(items, totals)
      const url = buildWhatsAppUrl(WHATSAPP_NUMBERS.default, message)

      // Abrir WhatsApp
      window.open(url, '_blank', 'noopener,noreferrer')

      // Simular pequeño delay antes de cerrar
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setIsSending(false)
      // Cerrar el drawer
      closeCart()
    }
  }

  const handleClearCart = async () => {
    setIsClearing(true)
    try {
      await clearAll()
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
        {/* Header with animated counter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 pb-4 border-b"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                {items.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {totals.items_count}
                  </motion.div>
                )}
              </div>
              Mi Carrito
            </SheetTitle>
            <SheetDescription>
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <Loader className="h-3 w-3 animate-spin" />
                  Cargando...
                </span>
              ) : items.length > 0 ? (
                `${totals.items_count} ${totals.items_count === 1 ? 'producto' : 'productos'} en tu carrito`
              ) : (
                'Tu carrito está vacío'
              )}
            </SheetDescription>
          </SheetHeader>
        </motion.div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isLoading ? (
            // Loading state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="relative w-12 h-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 border-3 border-transparent border-t-blue-600 rounded-full"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">Cargando carrito...</p>
              </div>
            </div>
          ) : items.length > 0 ? (
            <>
              {/* Items List */}
              <ScrollArea className="flex-1 px-6">
                <div className="py-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.05
                        }}
                      >
                        <CartItem item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t bg-gradient-to-t from-gray-50 to-gray-25/50"
              >
                <div className="p-6 space-y-4">
                  <CartSummary totals={totals} />

                  {/* Actions */}
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Button
                        onClick={handleSendToWhatsApp}
                        disabled={isSending || items.length === 0}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-12 text-base font-medium gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        size="lg"
                      >
                        {isSending ? (
                          <>
                            <Loader className="h-5 w-5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-5 w-5" />
                            Enviar pedido por WhatsApp
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={closeCart}
                        className="flex-1 transition-all hover:shadow-sm"
                        disabled={isSending}
                      >
                        Seguir comprando
                      </Button>
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={handleClearCart}
                          disabled={isClearing || items.length === 0}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isClearing ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin mr-2" />
                              Limpiando...
                            </>
                          ) : (
                            'Vaciar carrito'
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Info */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-gray-500 text-center"
                  >
                    Al enviar tu pedido, un asesor te contactará por WhatsApp para coordinar el pago y entrega
                  </motion.p>
                </div>
              </motion.div>
            </>
          ) : (
            <EmptyCart onClose={closeCart} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}