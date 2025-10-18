'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Check, AlertCircle } from 'lucide-react'
import { useCart } from '../hooks/useCart'

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
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleAddToCart = async () => {
    if (disabled || isAdding) return

    setIsAdding(true)
    setStatus('loading')

    try {
      const success = await addItem(productId, quantity)

      if (success) {
        setStatus('success')
        setMessage(`${productName} agregado al carrito`)

        // Reset status after 2 seconds
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 2000)
      } else {
        setStatus('error')
        setMessage('Error al agregar el producto')

        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 3000)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      setStatus('error')
      setMessage('Error al agregar el producto')

      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    } finally {
      setIsAdding(false)
    }
  }

  // Button content based on status
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

  // Button colors based on status
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

  // Variant styles
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

      {/* Toast message */}
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
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if inside a link
    e.stopPropagation()

    if (disabled || isAdding) return

    setIsAdding(true)

    try {
      await addItem(productId, 1)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setTimeout(() => setIsAdding(false), 1000)
    }
  }

  return (
    <motion.button
      onClick={handleQuickAdd}
      disabled={disabled || isAdding}
      whileTap={{ scale: 0.9 }}
      className={`
        p-2 rounded-full
        ${disabled ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}
        text-white transition-colors
        disabled:cursor-not-allowed disabled:opacity-50
      `}
      title="Agregar al carrito"
    >
      {isAdding ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
    </motion.button>
  )
}