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
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
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
    <div className="relative">
      <div className="flex gap-3 sm:gap-4 p-4 sm:p-6 hover:bg-gray-50 transition-colors">
        {/* Checkbox */}
        <div className="pt-4">
          <input
            type="checkbox"
            checked={true}
            onChange={() => {}}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {/* Image */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-white rounded overflow-hidden border border-gray-200">
          <Image
            src={item.image_url || '/tire.webp'}
            alt={item.name}
            fill
            className="object-contain p-1"
            sizes="80px"
          />
        </div>

        {/* Mobile Layout */}
        <div className="flex-1 min-w-0 sm:hidden">
          {/* Brand */}
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {item.brand}
          </div>

          {/* Title */}
          <h4 className="text-base font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 mt-1">
            {getTireSize()}
            {item.season && ` - ${item.season}`}
          </h4>

          {/* Model/Name */}
          <p className="text-sm text-gray-600 mt-1">
            {item.name}
          </p>

          {/* Stock info */}
          {item.stock_quantity > 5 ? (
            <p className="text-xs text-gray-500 mt-1 font-medium">
              +{item.stock_quantity} disponibles
            </p>
          ) : item.stock_quantity <= 5 && item.stock_quantity > 0 ? (
            <p className="text-xs text-orange-600 mt-1 font-medium">
              Últimos {item.stock_quantity} disponibles
            </p>
          ) : null}

          {/* Price Mobile */}
          <div className="mt-2">
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(price)}
            </div>
            {item.sale_price && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(item.price)}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  -{Math.round(((item.price - item.sale_price) / item.price) * 100)}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Quantity controls mobile */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-r-none border-gray-300"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>

              <input
                type="text"
                value={item.quantity}
                readOnly
                className="w-10 h-7 text-center border-y border-gray-300 text-sm"
              />

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-l-none border-gray-300"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || item.quantity >= item.stock_quantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Eliminar link mobile */}
            <button
              onClick={handleRemove}
              disabled={isUpdating}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:flex-1 sm:gap-8">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Brand */}
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              {item.brand}
            </div>

            {/* Title */}
            <h4 className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 mt-1">
              {getTireSize()}
              {item.season && ` - ${item.season}`}
            </h4>

            {/* Model/Name */}
            <p className="text-sm text-gray-600 mt-1">
              {item.name}
            </p>

            {/* Stock info */}
            {item.stock_quantity > 5 ? (
              <p className="text-xs text-gray-500 mt-2 font-medium">
                +{item.stock_quantity} disponibles
              </p>
            ) : item.stock_quantity <= 5 && item.stock_quantity > 0 ? (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                Últimos {item.stock_quantity} disponibles
              </p>
            ) : null}

            {/* Eliminar link */}
            <button
              onClick={handleRemove}
              disabled={isUpdating}
              className="text-blue-600 hover:text-blue-700 text-sm mt-2"
            >
              Eliminar
            </button>
          </div>

          {/* Quantity and Price */}
          <div className="flex items-start gap-8">
            {/* Quantity controls */}
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-r-none border-gray-300"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>

              <input
                type="text"
                value={item.quantity}
                readOnly
                className="w-12 h-8 text-center border-y border-gray-300 text-sm"
              />

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-l-none border-gray-300"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || item.quantity >= item.stock_quantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Price */}
            <div className="text-right min-w-[120px]">
              {item.sale_price && (
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    -{Math.round(((item.price - item.sale_price) / item.price) * 100)}% OFF
                  </span>
                </div>
              )}
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(price)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/80 flex items-center justify-center"
        >
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
        </motion.div>
      )}
    </div>
  )
}