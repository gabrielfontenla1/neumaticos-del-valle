'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus } from 'lucide-react'
import { useCartContext } from '@/providers/CartProvider'
import { CartItem as CartItemType } from '../types'
import { motion } from 'framer-motion'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartContext()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > item.stock_quantity) return
    if (isUpdating) return

    setIsUpdating(true)
    await updateQuantity(item.id, newQuantity)
    setIsUpdating(false)
  }

  const handleRemove = async () => {
    if (isUpdating) return

    setIsUpdating(true)
    await removeItem(item.id)
    setIsUpdating(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Generate tire size display
  const getTireSize = () => {
    if (item.width && item.aspect_ratio && item.rim_diameter) {
      return `${item.width}/${item.aspect_ratio}R${item.rim_diameter}`
    }
    return item.sku
  }

  const price = item.sale_price || item.price
  const subtotal = price * item.quantity

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 p-4 transition-all hover:shadow-sm">
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
          <Image
            src={item.image_url || '/placeholder-tire.png'}
            alt={item.name}
            fill
            className="object-contain p-1"
            sizes="80px"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Brand */}
          <div className="pr-8">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {item.brand} {item.name}
            </h4>
            <p className="text-sm text-gray-500 mt-0.5">
              {getTireSize()}
              {item.season && ` • ${item.season}`}
            </p>
          </div>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(price)}
            </span>
            {item.sale_price && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(item.price)}
              </span>
            )}
            <span className="text-xs text-gray-500">
              / unidad
            </span>
          </div>

          {/* Quantity controls and subtotal */}
          <div className="mt-3 flex items-center justify-between">
            {/* Quantity controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>

              <div className="w-12 text-center">
                <span className="text-sm font-medium">{item.quantity}</span>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || item.quantity >= item.stock_quantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatPrice(subtotal)}
              </p>
            </div>
          </div>

          {/* Stock warning */}
          {item.stock_quantity <= 5 && (
            <p className="mt-2 text-xs text-orange-600">
              ⚠️ Solo {item.stock_quantity} disponibles
            </p>
          )}
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
          onClick={handleRemove}
          disabled={isUpdating}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading overlay */}
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center"
        >
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
        </motion.div>
      )}
    </div>
  )
}