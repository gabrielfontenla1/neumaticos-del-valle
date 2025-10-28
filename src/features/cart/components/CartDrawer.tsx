'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, ShoppingBag } from 'lucide-react'
import { useCartContext } from '@/providers/CartProvider'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { EmptyCart } from './EmptyCart'
import { formatPrice, generateSimpleCartMessage, buildWhatsAppUrl, WHATSAPP_NUMBERS } from '@/lib/whatsapp'
import { motion, AnimatePresence } from 'framer-motion'

export function CartDrawer() {
  const { isOpen, closeCart, items, totals, clearAll } = useCartContext()

  const handleSendToWhatsApp = () => {
    if (items.length === 0) return

    // Generar mensaje simple sin datos del cliente
    const message = generateSimpleCartMessage(items, totals)
    const url = buildWhatsAppUrl(WHATSAPP_NUMBERS.default, message)

    // Abrir WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer')

    // Opcionalmente limpiar el carrito después de enviar
    // clearAll()

    // Cerrar el drawer
    closeCart()
  }

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5" />
            Mi Carrito
          </SheetTitle>
          <SheetDescription>
            {items.length > 0
              ? `${totals.items_count} ${totals.items_count === 1 ? 'producto' : 'productos'} en tu carrito`
              : 'Tu carrito está vacío'
            }
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {items.length > 0 ? (
            <>
              {/* Items List */}
              <ScrollArea className="flex-1 px-6">
                <div className="py-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CartItem item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Summary */}
              <div className="border-t bg-gray-50/50">
                <div className="p-6 space-y-4">
                  <CartSummary totals={totals} />

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleSendToWhatsApp}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium gap-2"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Enviar pedido por WhatsApp
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={closeCart}
                        className="flex-1"
                      >
                        Seguir comprando
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={clearAll}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Vaciar carrito
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <p className="text-xs text-gray-500 text-center">
                    Al enviar tu pedido, un asesor te contactará por WhatsApp para coordinar el pago y entrega
                  </p>
                </div>
              </div>
            </>
          ) : (
            <EmptyCart onClose={closeCart} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}