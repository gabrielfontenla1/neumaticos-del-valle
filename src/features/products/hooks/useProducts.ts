'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product, ProductFilters, ProductSearchResult } from '../types'
import { getProducts, getFeaturedProducts, searchProducts } from '../api'

export function useProducts(filters: ProductFilters = {}, page = 1, limit = 20) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProducts(filters, page, limit)
      setProducts(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError('Error al cargar los productos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, page, limit])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return {
    products,
    loading,
    error,
    total,
    totalPages,
    refetch: loadProducts
  }
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getFeaturedProducts()
      setProducts(result)
    } catch (err) {
      setError('Error al cargar los productos destacados')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return {
    products,
    loading,
    error,
    refetch: loadProducts
  }
}

export function useProductSearch() {
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const data = await searchProducts(query)
      setResults(data)
    } catch (err) {
      console.error('Error searching products:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    results,
    loading,
    search
  }
}