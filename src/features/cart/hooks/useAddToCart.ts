'use client'

import { useState, useCallback, useRef } from 'react'
import { useCartContext } from '@/providers/CartProvider'
import { useNotifications } from '@/components/notifications/CartNotifications'

export type AddToCartStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseAddToCartOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  successDuration?: number
  errorDuration?: number
}

interface AddToCartResult {
  status: AddToCartStatus
  message: string
  isAdding: boolean
  addToCart: (productId: string, quantity?: number, productName?: string) => Promise<boolean>
  reset: () => void
}

export function useAddToCart(options: UseAddToCartOptions = {}): AddToCartResult {
  const {
    onSuccess,
    onError,
    successDuration = 2000,
    errorDuration = 3000
  } = options

  const { addItem } = useCartContext()
  const { showNotification } = useNotifications()

  const [status, setStatus] = useState<AddToCartStatus>('idle')
  const [message, setMessage] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimeoutRef()
    setStatus('idle')
    setMessage('')
    setIsAdding(false)
  }, [clearTimeoutRef])

  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1,
    productName: string = 'producto'
  ): Promise<boolean> => {
    if (isAdding) return false

    clearTimeoutRef()
    setIsAdding(true)
    setStatus('loading')

    try {
      const success = await addItem(productId, quantity)

      if (success) {
        setStatus('success')
        setMessage(`${productName} agregado al carrito`)

        showNotification({
          type: 'success',
          title: 'Producto agregado al carrito',
          message: `${productName} x${quantity}`,
          duration: 5000
        })

        onSuccess?.()

        timeoutRef.current = setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, successDuration)

        return true
      } else {
        const error = new Error('No se pudo agregar el producto')
        setStatus('error')
        setMessage('Error al agregar el producto')

        showNotification({
          type: 'error',
          title: 'Error al agregar',
          message: 'No se pudo agregar el producto al carrito',
          duration: 4000
        })

        onError?.(error)

        timeoutRef.current = setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, errorDuration)

        return false
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      setStatus('error')
      setMessage('Error al agregar el producto')

      showNotification({
        type: 'error',
        title: 'Error inesperado',
        message: error.message,
        duration: 4000
      })

      onError?.(error)

      timeoutRef.current = setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, errorDuration)

      return false
    } finally {
      setIsAdding(false)
    }
  }, [addItem, showNotification, isAdding, clearTimeoutRef, onSuccess, onError, successDuration, errorDuration])

  return {
    status,
    message,
    isAdding,
    addToCart,
    reset
  }
}

// Simplified hook for quick add buttons
export function useQuickAddToCart() {
  const { addItem } = useCartContext()
  const { showNotification } = useNotifications()

  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const quickAdd = useCallback(async (productId: string): Promise<boolean> => {
    if (status !== 'idle') return false

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setStatus('loading')

    try {
      const success = await addItem(productId, 1)

      if (success) {
        setStatus('success')
        showNotification({
          type: 'success',
          title: 'Producto agregado al carrito',
          message: 'Agregado exitosamente',
          duration: 4000
        })
        timeoutRef.current = setTimeout(() => setStatus('idle'), 1000)
        return true
      } else {
        setStatus('idle')
        showNotification({
          type: 'error',
          title: 'No se pudo agregar el producto',
          duration: 3000
        })
        return false
      }
    } catch (err) {
      setStatus('idle')
      showNotification({
        type: 'error',
        title: 'Error inesperado',
        message: err instanceof Error ? err.message : 'Algo salió mal',
        duration: 3000
      })
      return false
    }
  }, [addItem, showNotification, status])

  return { status, quickAdd }
}
