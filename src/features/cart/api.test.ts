import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateSessionId,
  getOrCreateCartSession,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  calculateCartTotals,
} from './api'

// Mock the products API
vi.mock('@/features/products/api', () => ({
  getProductById: vi.fn(),
}))

import { getProductById } from '@/features/products/api'

const mockGetProductById = vi.mocked(getProductById)

describe('Cart API', () => {
  beforeEach(() => {
    // Clear localStorage and mocks before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('generateSessionId', () => {
    it('should generate a unique session ID', () => {
      const id1 = generateSessionId()
      const id2 = generateSessionId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('should start with cart_ prefix', () => {
      const id = generateSessionId()
      expect(id.startsWith('cart_')).toBe(true)
    })
  })

  describe('getOrCreateCartSession', () => {
    it('should return an empty cart session for new session', async () => {
      const sessionId = 'test-session-1'
      const session = await getOrCreateCartSession(sessionId)

      expect(session).toBeTruthy()
      expect(session?.session_id).toBe(sessionId)
      expect(session?.items).toEqual([])
    })

    it('should return existing cart items for existing session', async () => {
      const sessionId = 'test-session-2'
      const mockItems = [
        {
          id: 'item-1',
          product_id: 'prod-1',
          name: 'Test Tire',
          brand: 'TestBrand',
          sku: 'SKU-1',
          price: 50000,
          sale_price: 50000,
          quantity: 2,
          image_url: null,
          width: 205,
          aspect_ratio: 55,
          rim_diameter: 16,
          season: 'summer',
          stock_quantity: 10,
        },
      ]

      // Pre-populate localStorage
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(mockItems))

      const session = await getOrCreateCartSession(sessionId)

      expect(session?.items).toHaveLength(1)
      expect(session?.items[0].product_id).toBe('prod-1')
    })
  })

  describe('addToCart', () => {
    it('should add a new item to empty cart', async () => {
      const sessionId = 'test-add-1'
      const productId = 'prod-new-1'

      mockGetProductById.mockResolvedValueOnce({
        id: productId,
        name: 'New Test Tire',
        brand: 'TestBrand',
        price: 45000,
        stock: 5,
        category: 'car',
      })

      const result = await addToCart(sessionId, productId, 1)

      expect(result).toBe(true)

      const cartData = localStorage.getItem(`cart_${sessionId}`)
      expect(cartData).toBeTruthy()

      const items = JSON.parse(cartData!)
      expect(items).toHaveLength(1)
      expect(items[0].product_id).toBe(productId)
      expect(items[0].quantity).toBe(1)
    })

    it('should update quantity for existing item', async () => {
      const sessionId = 'test-add-2'
      const productId = 'prod-existing'

      // Pre-populate cart
      const existingItems = [
        {
          id: 'item-existing',
          product_id: productId,
          name: 'Existing Tire',
          brand: 'TestBrand',
          sku: 'SKU-1',
          price: 50000,
          sale_price: 50000,
          quantity: 2,
          image_url: null,
          width: 205,
          aspect_ratio: 55,
          rim_diameter: 16,
          season: 'summer',
          stock_quantity: 10,
        },
      ]
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(existingItems))

      mockGetProductById.mockResolvedValueOnce({
        id: productId,
        name: 'Existing Tire',
        brand: 'TestBrand',
        price: 50000,
        stock: 10,
        category: 'car',
      })

      const result = await addToCart(sessionId, productId, 3)

      expect(result).toBe(true)

      const cartData = localStorage.getItem(`cart_${sessionId}`)
      const items = JSON.parse(cartData!)
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(5) // 2 + 3
    })

    it('should fail when product not found', async () => {
      const sessionId = 'test-add-3'
      const productId = 'nonexistent'

      mockGetProductById.mockResolvedValueOnce(null)

      const result = await addToCart(sessionId, productId, 1)

      expect(result).toBe(false)
    })

    it('should fail when stock is insufficient', async () => {
      const sessionId = 'test-add-4'
      const productId = 'low-stock'

      mockGetProductById.mockResolvedValueOnce({
        id: productId,
        name: 'Low Stock Tire',
        brand: 'TestBrand',
        price: 30000,
        stock: 2,
        category: 'car',
      })

      const result = await addToCart(sessionId, productId, 5)

      expect(result).toBe(false)
    })

    it('should fail with invalid sessionId', async () => {
      const result = await addToCart('', 'prod-1', 1)
      expect(result).toBe(false)
    })

    it('should fail with invalid productId', async () => {
      const result = await addToCart('valid-session', '', 1)
      expect(result).toBe(false)
    })

    it('should fail with quantity <= 0', async () => {
      const result = await addToCart('valid-session', 'prod-1', 0)
      expect(result).toBe(false)
    })
  })

  describe('updateCartItemQuantity', () => {
    it('should update quantity of existing item', async () => {
      const sessionId = 'test-update-1'
      const existingItems = [
        {
          id: 'item-1',
          product_id: 'prod-1',
          name: 'Test Tire',
          brand: 'TestBrand',
          sku: 'SKU-1',
          price: 50000,
          sale_price: 50000,
          quantity: 2,
          image_url: null,
          width: 205,
          aspect_ratio: 55,
          rim_diameter: 16,
          season: 'summer',
          stock_quantity: 10,
        },
      ]
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(existingItems))

      mockGetProductById.mockResolvedValueOnce({
        id: 'prod-1',
        name: 'Test Tire',
        brand: 'TestBrand',
        price: 50000,
        stock: 10,
        category: 'car',
      })

      const result = await updateCartItemQuantity(sessionId, 'item-1', 5)

      expect(result).toBe(true)

      const cartData = localStorage.getItem(`cart_${sessionId}`)
      const items = JSON.parse(cartData!)
      expect(items[0].quantity).toBe(5)
    })

    it('should remove item when quantity is 0', async () => {
      const sessionId = 'test-update-2'
      const existingItems = [
        {
          id: 'item-1',
          product_id: 'prod-1',
          name: 'Test Tire',
          brand: 'TestBrand',
          sku: 'SKU-1',
          price: 50000,
          sale_price: 50000,
          quantity: 2,
          image_url: null,
          width: 205,
          aspect_ratio: 55,
          rim_diameter: 16,
          season: 'summer',
          stock_quantity: 10,
        },
      ]
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(existingItems))

      const result = await updateCartItemQuantity(sessionId, 'item-1', 0)

      expect(result).toBe(true)

      const cartData = localStorage.getItem(`cart_${sessionId}`)
      const items = JSON.parse(cartData!)
      expect(items).toHaveLength(0)
    })

    it('should return false for non-existent item', async () => {
      const sessionId = 'test-update-3'
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify([]))

      const result = await updateCartItemQuantity(sessionId, 'nonexistent', 5)

      expect(result).toBe(false)
    })
  })

  describe('removeFromCart', () => {
    it('should remove an item from cart', async () => {
      const sessionId = 'test-remove-1'
      const existingItems = [
        {
          id: 'item-1',
          product_id: 'prod-1',
          name: 'Tire 1',
          brand: 'TestBrand',
          sku: 'SKU-1',
          price: 50000,
          sale_price: 50000,
          quantity: 1,
          image_url: null,
          width: 205,
          aspect_ratio: 55,
          rim_diameter: 16,
          season: 'summer',
          stock_quantity: 10,
        },
        {
          id: 'item-2',
          product_id: 'prod-2',
          name: 'Tire 2',
          brand: 'TestBrand',
          sku: 'SKU-2',
          price: 60000,
          sale_price: 60000,
          quantity: 1,
          image_url: null,
          width: 215,
          aspect_ratio: 60,
          rim_diameter: 17,
          season: 'summer',
          stock_quantity: 5,
        },
      ]
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(existingItems))

      const result = await removeFromCart(sessionId, 'item-1')

      expect(result).toBe(true)

      const cartData = localStorage.getItem(`cart_${sessionId}`)
      const items = JSON.parse(cartData!)
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe('item-2')
    })

    it('should return false for non-existent item', async () => {
      const sessionId = 'test-remove-2'
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify([]))

      const result = await removeFromCart(sessionId, 'nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const sessionId = 'test-clear-1'
      const existingItems = [
        { id: 'item-1', product_id: 'prod-1', name: 'Tire 1', quantity: 1, price: 50000, sale_price: 50000 },
        { id: 'item-2', product_id: 'prod-2', name: 'Tire 2', quantity: 2, price: 60000, sale_price: 60000 },
      ]
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(existingItems))

      const result = await clearCart(sessionId)

      expect(result).toBe(true)

      const cartData = localStorage.getItem(`cart_${sessionId}`)
      const items = JSON.parse(cartData!)
      expect(items).toHaveLength(0)
    })
  })

  describe('calculateCartTotals', () => {
    it('should calculate correct totals for items', async () => {
      const sessionId = 'test-totals-1'
      const existingItems = [
        { id: 'item-1', product_id: 'prod-1', name: 'Tire 1', quantity: 2, price: 50000, sale_price: 50000 },
        { id: 'item-2', product_id: 'prod-2', name: 'Tire 2', quantity: 1, price: 60000, sale_price: 60000 },
      ]
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(existingItems))

      const totals = await calculateCartTotals(sessionId)

      expect(totals.subtotal).toBe(160000) // (50000 * 2) + (60000 * 1)
      expect(totals.tax).toBe(0)
      expect(totals.shipping).toBe(0)
      expect(totals.total).toBe(160000)
      expect(totals.items_count).toBe(3) // 2 + 1
    })

    it('should use sale_price when available', async () => {
      const sessionId = 'test-totals-2'
      const existingItems = [
        { id: 'item-1', product_id: 'prod-1', name: 'Tire 1', quantity: 1, price: 50000, sale_price: 40000 },
      ]
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(existingItems))

      const totals = await calculateCartTotals(sessionId)

      expect(totals.subtotal).toBe(40000) // Uses sale_price
      expect(totals.total).toBe(40000)
    })

    it('should return zeros for empty cart', async () => {
      const sessionId = 'test-totals-3'
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify([]))

      const totals = await calculateCartTotals(sessionId)

      expect(totals.subtotal).toBe(0)
      expect(totals.tax).toBe(0)
      expect(totals.shipping).toBe(0)
      expect(totals.total).toBe(0)
      expect(totals.items_count).toBe(0)
    })
  })
})
