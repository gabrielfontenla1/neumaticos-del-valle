/**
 * useURLFilters Hook
 *
 * React hook for managing product filter state synchronized with URL parameters.
 * Provides a seamless way to read initial state from URL, update URL when filters change,
 * and handle browser navigation (back/forward buttons).
 *
 * Features:
 * - Reads initial filter state from URL on mount
 * - Updates URL when filters change (with 300ms debouncing)
 * - Handles browser back/forward navigation
 * - Gracefully handles invalid/malicious parameters
 * - SSR-safe (no window access during server-side rendering)
 *
 * @example
 * ```tsx
 * function ProductsPage() {
 *   const {
 *     filters,
 *     updateFilter,
 *     updateFilters,
 *     clearFilters,
 *     isLoading,
 *   } = useURLFilters()
 *
 *   return (
 *     <div>
 *       <input
 *         value={filters.searchTerm}
 *         onChange={(e) => updateFilter('searchTerm', e.target.value)}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { FilterState } from '@/lib/products/filter-types'
import { DEFAULT_FILTER_STATE } from '@/lib/products/filter-types'
import {
  deserializeFiltersFromURL,
  serializeFiltersToURL,
  buildFilterURL,
  mergeFilterState,
  areFiltersEqual,
} from '@/lib/products/url-filters'

/**
 * Configuration options for useURLFilters hook
 */
export interface UseURLFiltersOptions {
  /**
   * Debounce delay in milliseconds for URL updates
   * @default 300
   */
  debounceMs?: number

  /**
   * Base path for URL updates
   * @default '/productos'
   */
  basePath?: string

  /**
   * Whether to replace history instead of pushing new entries
   * Useful for search-as-you-type to avoid cluttering browser history
   * @default false
   */
  replaceHistory?: boolean

  /**
   * Callback fired when filters change
   */
  onFiltersChange?: (filters: FilterState) => void

  /**
   * Callback fired when URL parsing fails
   */
  onError?: (error: Error) => void
}

/**
 * Return type for useURLFilters hook
 */
export interface UseURLFiltersReturn {
  /**
   * Current filter state synchronized with URL
   */
  filters: FilterState

  /**
   * Update a single filter value
   * @param key - Filter key to update
   * @param value - New value for the filter
   */
  updateFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void

  /**
   * Update multiple filters at once
   * @param updates - Partial filter state with updates
   */
  updateFilters: (updates: Partial<FilterState>) => void

  /**
   * Clear all filters and reset to default state
   */
  clearFilters: () => void

  /**
   * Loading state while parsing URL parameters
   */
  isLoading: boolean

  /**
   * Whether the current filters are different from default state
   */
  hasActiveFilters: boolean

  /**
   * Number of active filters (non-default values)
   */
  activeFilterCount: number
}

/**
 * Custom hook for managing product filters synchronized with URL parameters
 *
 * This hook provides a complete solution for URL-based filter state management:
 * - Parses URL parameters on mount and navigation
 * - Debounces URL updates to prevent history pollution
 * - Handles browser back/forward navigation
 * - Validates all parameters for security
 * - Works seamlessly with Next.js 14 App Router
 *
 * @param options - Configuration options
 * @returns Filter state and update functions
 */
export function useURLFilters(
  options: UseURLFiltersOptions = {}
): UseURLFiltersReturn {
  const {
    debounceMs = 300,
    basePath = '/productos',
    replaceHistory = false,
    onFiltersChange,
    onError,
  } = options

  // Next.js hooks
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE)
  const [isLoading, setIsLoading] = useState(true)

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousFiltersRef = useRef<FilterState>(DEFAULT_FILTER_STATE)
  const isInitialMountRef = useRef(true)
  const isNavigatingRef = useRef(false)

  /**
   * Parse URL parameters and update filter state
   * This runs on mount and when URL changes (browser navigation)
   */
  useEffect(() => {
    try {
      setIsLoading(true)

      // Convert ReadonlyURLSearchParams to URLSearchParams
      const params = new URLSearchParams()
      if (searchParams) {
        searchParams.forEach((value, key) => {
          params.set(key, value)
        })
      }

      // Deserialize filters from URL with validation
      const parsedFilters = deserializeFiltersFromURL(params)

      // Update state only if filters actually changed
      if (!areFiltersEqual(parsedFilters, previousFiltersRef.current)) {
        setFilters(parsedFilters)
        previousFiltersRef.current = parsedFilters

        // Fire callback if not initial mount
        if (!isInitialMountRef.current && onFiltersChange) {
          onFiltersChange(parsedFilters)
        }
      }
    } catch (error) {
      console.error('Failed to parse URL filters:', error)

      // Reset to default state on error
      setFilters(DEFAULT_FILTER_STATE)
      previousFiltersRef.current = DEFAULT_FILTER_STATE

      // Fire error callback
      if (onError && error instanceof Error) {
        onError(error)
      }
    } finally {
      setIsLoading(false)
      isInitialMountRef.current = false
    }
  }, [searchParams, onFiltersChange, onError])

  /**
   * Update URL with current filter state
   * Debounced to prevent too many history entries
   */
  const updateURL = useCallback(
    (newFilters: FilterState) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        try {
          // Build new URL with filters
          const url = buildFilterURL(newFilters, basePath)

          // Update URL using Next.js router
          if (replaceHistory) {
            router.replace(url, { scroll: false })
          } else {
            router.push(url, { scroll: false })
          }

          // Mark that we're navigating programmatically
          isNavigatingRef.current = true
          setTimeout(() => {
            isNavigatingRef.current = false
          }, 100)
        } catch (error) {
          console.error('Failed to update URL:', error)
          if (onError && error instanceof Error) {
            onError(error)
          }
        }
      }, debounceMs)
    },
    [router, basePath, replaceHistory, debounceMs, onError]
  )

  /**
   * Update a single filter value
   */
  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prevFilters) => {
        const newFilters = mergeFilterState(prevFilters, { [key]: value })

        // Update URL
        updateURL(newFilters)

        // Update ref
        previousFiltersRef.current = newFilters

        // Fire callback
        if (onFiltersChange) {
          onFiltersChange(newFilters)
        }

        return newFilters
      })
    },
    [updateURL, onFiltersChange]
  )

  /**
   * Update multiple filters at once
   */
  const updateFilters = useCallback(
    (updates: Partial<FilterState>) => {
      setFilters((prevFilters) => {
        const newFilters = mergeFilterState(prevFilters, updates)

        // Update URL
        updateURL(newFilters)

        // Update ref
        previousFiltersRef.current = newFilters

        // Fire callback
        if (onFiltersChange) {
          onFiltersChange(newFilters)
        }

        return newFilters
      })
    },
    [updateURL, onFiltersChange]
  )

  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    const newFilters = { ...DEFAULT_FILTER_STATE }

    setFilters(newFilters)

    // Update URL (will clear all parameters)
    updateURL(newFilters)

    // Update ref
    previousFiltersRef.current = newFilters

    // Fire callback
    if (onFiltersChange) {
      onFiltersChange(newFilters)
    }
  }, [updateURL, onFiltersChange])

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  /**
   * Check if current filters are different from defaults
   */
  const hasActiveFilters = !areFiltersEqual(filters, DEFAULT_FILTER_STATE)

  /**
   * Count number of active filters
   */
  const activeFilterCount = Object.keys(filters).reduce((count, key) => {
    const filterKey = key as keyof FilterState
    const value = filters[filterKey]
    const defaultValue = DEFAULT_FILTER_STATE[filterKey]

    if (value !== defaultValue && value !== 'all' && value !== '') {
      return count + 1
    }

    return count
  }, 0)

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    isLoading,
    hasActiveFilters,
    activeFilterCount,
  }
}

/**
 * Type guard to check if a value is a valid filter key
 */
export function isFilterKey(key: unknown): key is keyof FilterState {
  return typeof key === 'string' && key in DEFAULT_FILTER_STATE
}

/**
 * Helper to get a single filter value from URL
 * Useful for server components
 */
export function getFilterFromURL(
  searchParams: URLSearchParams | null,
  key: keyof FilterState
): FilterState[typeof key] {
  if (!searchParams) {
    return DEFAULT_FILTER_STATE[key]
  }

  const filters = deserializeFiltersFromURL(searchParams)
  return filters[key]
}
