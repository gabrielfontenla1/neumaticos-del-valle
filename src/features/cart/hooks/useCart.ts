'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface UseCartReturn {
  items: CartItem[]
  totals: CartTotals
  isLoading: boolean
  itemCount: number
  addItem: (productId: string, quantity?: number) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearAll: () => Promise<boolean>
  refreshCart: () => Promise<void>
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
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
      if (!sessionId) return

      const cartSession = await getOrCreateCartSession(sessionId)
      if (cartSession) {
        setSession(cartSession)
        setItems(cartSession.items)

        // Calculate totals
        const cartTotals = await calculateCartTotals(sessionId)
        setTotals(cartTotals)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
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
      if (!sessionId) return false

      const success = await addToCart(sessionId, productId, quantity)
      if (success) {
        await loadCart()
        setIsOpen(true) // Open cart when item is added
      }
      return success
    } catch (error) {
      console.error('Error adding item:', error)
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
      }
      return success
    } catch (error) {
      console.error('Error updating quantity:', error)
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
      }
      return success
    } catch (error) {
      console.error('Error removing item:', error)
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
      }
      return success
    } catch (error) {
      console.error('Error clearing cart:', error)
      return false
    }
  }, [getSessionId, loadCart])

  // Cart UI state
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

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
    isOpen,
    openCart,
    closeCart,
    toggleCart
  }
}