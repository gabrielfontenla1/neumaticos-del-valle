import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAddToCart, useQuickAddToCart } from './useAddToCart'

// Mock the dependencies
const mockAddItem = vi.fn()
const mockShowNotification = vi.fn()

vi.mock('@/providers/CartProvider', () => ({
  useCartContext: () => ({
    addItem: mockAddItem,
  }),
}))

vi.mock('@/components/notifications/CartNotifications', () => ({
  useNotifications: () => ({
    showNotification: mockShowNotification,
  }),
}))

describe('useAddToCart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with idle status', () => {
    const { result } = renderHook(() => useAddToCart())

    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBe('')
    expect(result.current.isAdding).toBe(false)
  })

  it('should successfully add item to cart', async () => {
    mockAddItem.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useAddToCart())

    let success: boolean = false

    await act(async () => {
      success = await result.current.addToCart('product-1', 2, 'Test Product')
    })

    expect(success).toBe(true)
    expect(result.current.status).toBe('success')
    expect(result.current.message).toBe('Test Product agregado al carrito')
    expect(mockAddItem).toHaveBeenCalledWith('product-1', 2)
    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Producto agregado al carrito',
      message: 'Test Product x2',
      duration: 5000,
    })
  })

  it('should handle failed add to cart', async () => {
    mockAddItem.mockResolvedValueOnce(false)

    const { result } = renderHook(() => useAddToCart())

    let success: boolean = false

    await act(async () => {
      success = await result.current.addToCart('product-1')
    })

    expect(success).toBe(false)
    expect(result.current.status).toBe('error')
    expect(result.current.message).toBe('Error al agregar el producto')
    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error al agregar',
      message: 'No se pudo agregar el producto al carrito',
      duration: 4000,
    })
  })

  it('should handle API errors', async () => {
    mockAddItem.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAddToCart())

    await act(async () => {
      await result.current.addToCart('product-1')
    })

    expect(result.current.status).toBe('error')
    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error inesperado',
      message: 'Network error',
      duration: 4000,
    })
  })

  it('should prevent double-clicking while adding', async () => {
    mockAddItem.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))

    const { result } = renderHook(() => useAddToCart())

    // Start first add
    act(() => {
      result.current.addToCart('product-1')
    })

    expect(result.current.isAdding).toBe(true)

    // Try to add again while still adding
    let secondResult: boolean = false
    await act(async () => {
      secondResult = await result.current.addToCart('product-1')
    })

    expect(secondResult).toBe(false)
    expect(mockAddItem).toHaveBeenCalledTimes(1)
  })

  it('should call onSuccess callback', async () => {
    mockAddItem.mockResolvedValueOnce(true)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useAddToCart({ onSuccess }))

    await act(async () => {
      await result.current.addToCart('product-1')
    })

    expect(onSuccess).toHaveBeenCalled()
  })

  it('should call onError callback on failure', async () => {
    mockAddItem.mockResolvedValueOnce(false)
    const onError = vi.fn()

    const { result } = renderHook(() => useAddToCart({ onError }))

    await act(async () => {
      await result.current.addToCart('product-1')
    })

    expect(onError).toHaveBeenCalled()
  })

  it('should reset status to idle after success duration', async () => {
    mockAddItem.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useAddToCart({ successDuration: 1000 }))

    await act(async () => {
      await result.current.addToCart('product-1')
    })

    expect(result.current.status).toBe('success')

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBe('')
  })

  it('should reset status on manual reset', async () => {
    mockAddItem.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useAddToCart())

    await act(async () => {
      await result.current.addToCart('product-1')
    })

    expect(result.current.status).toBe('success')

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBe('')
    expect(result.current.isAdding).toBe(false)
  })

  it('should use default values for quantity and product name', async () => {
    mockAddItem.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useAddToCart())

    await act(async () => {
      await result.current.addToCart('product-1')
    })

    expect(mockAddItem).toHaveBeenCalledWith('product-1', 1)
    expect(result.current.message).toBe('producto agregado al carrito')
  })
})

describe('useQuickAddToCart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with idle status', () => {
    const { result } = renderHook(() => useQuickAddToCart())

    expect(result.current.status).toBe('idle')
  })

  it('should successfully quick add item', async () => {
    mockAddItem.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useQuickAddToCart())

    let success: boolean = false

    await act(async () => {
      success = await result.current.quickAdd('product-1')
    })

    expect(success).toBe(true)
    expect(result.current.status).toBe('success')
    expect(mockAddItem).toHaveBeenCalledWith('product-1', 1)
    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Producto agregado al carrito',
      message: 'Agregado exitosamente',
      duration: 4000,
    })
  })

  it('should handle failed quick add', async () => {
    mockAddItem.mockResolvedValueOnce(false)

    const { result } = renderHook(() => useQuickAddToCart())

    let success: boolean = false

    await act(async () => {
      success = await result.current.quickAdd('product-1')
    })

    expect(success).toBe(false)
    expect(result.current.status).toBe('idle')
    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'No se pudo agregar el producto',
      duration: 3000,
    })
  })

  it('should not allow adding while not idle', async () => {
    mockAddItem.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))

    const { result } = renderHook(() => useQuickAddToCart())

    // Start first add
    act(() => {
      result.current.quickAdd('product-1')
    })

    expect(result.current.status).toBe('loading')

    // Try to add again
    let secondResult: boolean = false
    await act(async () => {
      secondResult = await result.current.quickAdd('product-1')
    })

    expect(secondResult).toBe(false)
    expect(mockAddItem).toHaveBeenCalledTimes(1)
  })

  it('should reset to idle after success', async () => {
    mockAddItem.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useQuickAddToCart())

    await act(async () => {
      await result.current.quickAdd('product-1')
    })

    expect(result.current.status).toBe('success')

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.status).toBe('idle')
  })

  it('should handle API errors', async () => {
    mockAddItem.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useQuickAddToCart())

    await act(async () => {
      await result.current.quickAdd('product-1')
    })

    expect(result.current.status).toBe('idle')
    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error inesperado',
      message: 'Network error',
      duration: 3000,
    })
  })
})
