/**
 * Cart Feature Module
 *
 * This module provides complete cart management functionality using localStorage
 * as the primary storage mechanism with optional Supabase fallback.
 *
 * Usage:
 * - React Hook: import { useCart } from '@/features/cart'
 * - Types: import { CartItem, CartSession, CartTotals } from '@/features/cart'
 * - API: import { addToCart, removeFromCart } from '@/features/cart'
 *
 * @module cart
 */

// Types
export type {
  CartItem,
  CartSession,
  CartTotals,
  CustomerData,
  VoucherData
} from './types'

// API Functions (localStorage - primary)
export {
  generateSessionId,
  getOrCreateCartSession,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  calculateCartTotals
} from './api-local'

// Hooks
export { useCart } from './hooks/useCart'
export type { UseCartReturn } from './hooks/useCart'

/**
 * Cart Module Summary
 *
 * Architecture:
 * - Storage: localStorage (primary) + Supabase (fallback)
 * - Session: 7-day expiration
 * - Tax: Not included in localStorage version (0%)
 * - Shipping: Free
 *
 * Features:
 * - Add/remove items
 * - Update quantities
 * - Calculate totals
 * - Persist across sessions
 * - Stock validation
 * - Product mapping
 * - Error handling
 *
 * Files:
 * - types.ts: Type definitions
 * - api.ts: Supabase implementation
 * - api-local.ts: localStorage implementation (active)
 * - hooks/useCart.ts: React hook
 * - index.ts: Module exports (this file)
 */
