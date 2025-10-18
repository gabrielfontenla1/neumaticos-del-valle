'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import { formatPrice } from '@/lib/whatsapp'

export function CartButton() {
  const { itemCount, totals, openCart } = useCart()
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevCount, setPrevCount] = useState(itemCount)

  // Animate when item count changes
  useEffect(() => {
    if (itemCount > prevCount) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevCount(itemCount)
  }, [itemCount, prevCount])

  // Don't show if cart is empty
  if (itemCount === 0) {
    return null
  }

  return (
    <motion.button
      onClick={openCart}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center gap-2 p-4 transition-colors ${
        isAnimating ? 'animate-bounce' : ''
      }`}
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />

        {/* Badge with item count */}
        <AnimatePresence mode="wait">
          <motion.span
            key={itemCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {itemCount}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Show total on larger screens */}
      <div className="hidden sm:block">
        <p className="text-xs opacity-90">Total</p>
        <p className="font-semibold">{formatPrice(totals.total)}</p>
      </div>

      {/* Ripple effect on add */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white rounded-full pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// Mobile cart button (fixed at bottom for mobile)
export function MobileCartBar() {
  const { itemCount, totals, openCart } = useCart()

  if (itemCount === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg p-4 sm:hidden"
    >
      <button
        onClick={openCart}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span className="font-medium">Ver Carrito</span>
        </div>
        <span className="font-bold">{formatPrice(totals.total)}</span>
      </button>
    </motion.div>
  )
}