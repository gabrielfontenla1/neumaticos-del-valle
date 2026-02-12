'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { CartItem, CartTotals, CartSession } from '../types'
import {
  generateSessionId,
  getOrCreateCartSession,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  calculateCartTotals
} from '../api'

export interface UseCartReturn {
  items: CartItem[]
  totals: CartTotals
  isLoading: boolean
  itemCount: number
  addItem: (productId: string, quantity?: number) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearAll: () => Promise<boolean>
  refreshCart: () => Promise<void>
  // UI state
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CART_SESSION_KEY = 'ndv_cart_session'

export function useCart(): UseCartReturn {
  const [session, setSession] = useState<CartSession | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [totals, setTotals] = useState<CartTotals>({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    items_count: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // UI state handlers
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  // Get or create session ID
  const getSessionId = useCallback((): string => {
    if (typeof window === 'undefined') return ''

    let sessionId = localStorage.getItem(CART_SESSION_KEY)
    if (!sessionId) {
      sessionId = generateSessionId()
      localStorage.setItem(CART_SESSION_KEY, sessionId)
    }
    return sessionId
  }, [])

  // Load cart from Supabase
  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true)
      const sessionId = getSessionId()

      if (!sessionId) {
        console.warn('⚠️ [useCart] No sessionId en loadCart')
        return
      }

      const cartSession = await getOrCreateCartSession(sessionId)

      if (cartSession) {
        setSession(cartSession)
        setItems(cartSession.items)

        // Calculate totals
        const cartTotals = await calculateCartTotals(sessionId)
        setTotals(cartTotals)
      }
    } catch (error) {
      console.error('❌ [useCart] Error en loadCart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [getSessionId])

  // Initialize cart on mount
  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Add item to cart
  const addItem = useCallback(async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      const sessionId = getSessionId()

      if (!sessionId) {
        console.error('❌ [useCart] No hay sessionId disponible')
        return false
      }

      const success = await addToCart(sessionId, productId, quantity)

      if (success) {
        await loadCart()
        toast.success('Producto agregado al carrito')
      } else {
        console.warn('⚠️ [useCart] addToCart retornó false')
        toast.error('No se pudo agregar el producto. Verifica el stock disponible.')
      }

      return success
    } catch (error) {
      console.error('❌ [useCart] Error en addItem:', error)
      return false
    }
  }, [getSessionId, loadCart])

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) return false

      const success = await updateCartItemQuantity(sessionId, itemId, quantity)
      if (success) {
        await loadCart()
        toast.success('Cantidad actualizada')
      } else {
        toast.error('No se pudo actualizar la cantidad')
      }
      return success
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Error al actualizar la cantidad')
      return false
    }
  }, [getSessionId, loadCart])

  // Remove item
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) return false

      const success = await removeFromCart(sessionId, itemId)
      if (success) {
        await loadCart()
        toast.success('Producto eliminado del carrito')
      } else {
        toast.error('No se pudo eliminar el producto')
      }
      return success
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Error al eliminar el producto')
      return false
    }
  }, [getSessionId, loadCart])

  // Clear all items
  const clearAll = useCallback(async (): Promise<boolean> => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) return false

      const success = await clearCart(sessionId)
      if (success) {
        await loadCart()
        toast.success('Carrito vaciado correctamente')
      } else {
        toast.error('No se pudo vaciar el carrito')
      }
      return success
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Error al vaciar el carrito')
      return false
    }
  }, [getSessionId, loadCart])

  return {
    items,
    totals,
    isLoading,
    itemCount: totals.items_count,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
    refreshCart: loadCart,
    // UI state
    isOpen,
    openCart,
    closeCart
  }
}