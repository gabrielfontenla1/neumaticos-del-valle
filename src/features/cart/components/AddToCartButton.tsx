'use client'

import { motion } from 'framer-motion'
import { ShoppingCart, Check, AlertCircle } from 'lucide-react'
import { useAddToCart, useQuickAddToCart, AddToCartStatus } from '../hooks/useAddToCart'

interface AddToCartButtonProps {
  productId: string
  productName?: string
  disabled?: boolean
  quantity?: number
  className?: string
  variant?: 'default' | 'compact' | 'full'
}

export function AddToCartButton({
  productId,
  productName = 'producto',
  disabled = false,
  quantity = 1,
  className = '',
  variant = 'default'
}: AddToCartButtonProps) {
  const { status, message, isAdding, addToCart } = useAddToCart()

  const handleAddToCart = () => {
    if (disabled) return
    addToCart(productId, quantity, productName)
  }

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Agregando...</span>
          </>
        )
      case 'success':
        return (
          <>
            <Check className="h-5 w-5" />
            <span>¡Agregado!</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="h-5 w-5" />
            <span>Error</span>
          </>
        )
      default:
        return (
          <>
            <ShoppingCart className="h-5 w-5" />
            <span>{variant === 'compact' ? 'Agregar' : 'Agregar al Carrito'}</span>
          </>
        )
    }
  }

  const getButtonColors = () => {
    if (disabled) return 'bg-gray-300 cursor-not-allowed'

    switch (status) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700'
      case 'error':
        return 'bg-red-600 hover:bg-red-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'px-3 py-1.5 text-sm'
      case 'full':
        return 'px-6 py-3 text-lg w-full'
      default:
        return 'px-4 py-2'
    }
  }

  return (
    <div className="relative">
      <motion.button
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        className={`
          ${getButtonColors()}
          ${getVariantStyles()}
          text-white font-medium rounded-lg
          flex items-center justify-center gap-2
          transition-colors duration-200
          disabled:opacity-50
          ${className}
        `}
      >
        {getButtonContent()}
      </motion.button>

      {message && status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
            px-3 py-1.5 rounded-lg text-sm whitespace-nowrap z-10
            ${status === 'success' ? 'bg-green-600 text-white' : ''}
            ${status === 'error' ? 'bg-red-600 text-white' : ''}
          `}
        >
          {message}
        </motion.div>
      )}
    </div>
  )
}

// Quick Add Button (for product grids)
export function QuickAddButton({
  productId,
  disabled = false
}: {
  productId: string
  disabled?: boolean
}) {
  const { status, quickAdd } = useQuickAddToCart()

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    quickAdd(productId)
  }

  const getButtonColor = () => {
    if (disabled) return 'bg-gray-300'
    if (status === 'success') return 'bg-green-600'
    return 'bg-blue-600 hover:bg-blue-700'
  }

  return (
    <motion.button
      onClick={handleQuickAdd}
      disabled={disabled || status !== 'idle'}
      animate={{
        scale: status === 'success' ? [1, 1.15, 1] : 1,
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
      whileTap={status === 'idle' ? { scale: 0.9 } : {}}
      whileHover={status === 'idle' && !disabled ? { scale: 1.1 } : {}}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center
        ${getButtonColor()}
        text-white transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        shadow-md hover:shadow-lg
      `}
      title="Agregar al carrito"
    >
      {status === 'loading' ? (
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
      ) : status === 'success' ? (
        <motion.svg
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      ) : (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </motion.button>
  )
}
