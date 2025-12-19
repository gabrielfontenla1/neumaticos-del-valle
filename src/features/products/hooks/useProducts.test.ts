import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProducts, useFeaturedProducts, useProductSearch } from './useProducts'
import * as api from '../api'

// Mock the API module
vi.mock('../api', () => ({
  getProducts: vi.fn(),
  getFeaturedProducts: vi.fn(),
  searchProducts: vi.fn(),
}))

const mockProducts = [
  {
    id: '1',
    name: 'Pirelli P7 205/55R16',
    brand: 'Pirelli',
    model: 'P7',
    price: 85000,
    width: 205,
    profile: 55,
    diameter: 16,
    stock: 10,
    category: 'car',
  },
  {
    id: '2',
    name: 'Michelin Pilot Sport 225/45R17',
    brand: 'Michelin',
    model: 'Pilot Sport',
    price: 120000,
    width: 225,
    profile: 45,
    diameter: 17,
    stock: 5,
    category: 'car',
  },
]

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch products on mount', async () => {
    // Use mockResolvedValue (not Once) for persistent mock
    vi.mocked(api.getProducts).mockResolvedValue({
      data: mockProducts,
      total: 2,
      totalPages: 1,
      page: 1,
      error: null,
    })

    const { result } = renderHook(() => useProducts())

    // Initial state should be loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.products).toHaveLength(2)
    expect(result.current.total).toBe(2)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(api.getProducts).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Error al cargar los productos')
    expect(result.current.products).toHaveLength(0)
  })

  it('should pass filters to the API', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      data: [mockProducts[0]],
      total: 1,
      totalPages: 1,
      page: 1,
      error: null,
    })

    const filters = { brand: 'Pirelli', category: 'car' }
    renderHook(() => useProducts(filters, 1, 20))

    await waitFor(() => {
      expect(api.getProducts).toHaveBeenCalledWith(filters, 1, 20)
    })
  })

  it('should refetch when filters change', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      data: mockProducts,
      total: 2,
      totalPages: 1,
      page: 1,
      error: null,
    })

    const { result, rerender } = renderHook(
      ({ filters }) => useProducts(filters),
      { initialProps: { filters: {} } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear mocks to track subsequent calls
    vi.mocked(api.getProducts).mockClear()

    rerender({ filters: { brand: 'Pirelli' } })

    await waitFor(() => {
      expect(api.getProducts).toHaveBeenCalledWith({ brand: 'Pirelli' }, 1, 20)
    })
  })

  it('should provide refetch function', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      data: mockProducts,
      total: 2,
      totalPages: 1,
      page: 1,
      error: null,
    })

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Get initial call count
    const initialCalls = vi.mocked(api.getProducts).mock.calls.length

    // Call refetch
    await act(async () => {
      await result.current.refetch()
    })

    // Should have at least one more call
    expect(vi.mocked(api.getProducts).mock.calls.length).toBeGreaterThan(initialCalls)
  })
})

describe('useFeaturedProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch featured products on mount', async () => {
    vi.mocked(api.getFeaturedProducts).mockResolvedValue(mockProducts)

    const { result } = renderHook(() => useFeaturedProducts())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.products).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(api.getFeaturedProducts).mockRejectedValue(new Error('Error'))

    const { result } = renderHook(() => useFeaturedProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Error al cargar los productos destacados')
    expect(result.current.products).toHaveLength(0)
  })
})

describe('useProductSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not search with empty query', async () => {
    const { result } = renderHook(() => useProductSearch())

    await act(async () => {
      await result.current.search('')
    })

    expect(api.searchProducts).not.toHaveBeenCalled()
    expect(result.current.results).toHaveLength(0)
  })

  it('should not search with query less than 2 characters', async () => {
    const { result } = renderHook(() => useProductSearch())

    await act(async () => {
      await result.current.search('a')
    })

    expect(api.searchProducts).not.toHaveBeenCalled()
  })

  it('should search products with valid query', async () => {
    const searchResults = [
      { id: '1', name: 'Pirelli P7', brand: 'Pirelli', price: 85000 },
    ]
    vi.mocked(api.searchProducts).mockResolvedValue(searchResults)

    const { result } = renderHook(() => useProductSearch())

    await act(async () => {
      await result.current.search('Pirelli')
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(api.searchProducts).toHaveBeenCalledWith('Pirelli')
    expect(result.current.results).toEqual(searchResults)
  })

  it('should clear results on API error', async () => {
    vi.mocked(api.searchProducts).mockRejectedValue(new Error('Error'))

    const { result } = renderHook(() => useProductSearch())

    await act(async () => {
      await result.current.search('test')
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.results).toHaveLength(0)
  })
})
