/**
 * useFilterPersistence Hook
 *
 * React hook for persisting filter state across sessions and browser tabs.
 * Provides a complementary persistence layer to URL-based state management.
 *
 * Features:
 * - Local storage fallback when URL is too long
 * - Session recovery (restore filters after browser crash)
 * - Cross-tab synchronization (sync filters across browser tabs)
 * - Recently used filters history
 * - Saved filter presets
 *
 * @example
 * ```tsx
 * function ProductsPage() {
 *   const {
 *     saveFilterPreset,
 *     loadFilterPreset,
 *     deleteFilterPreset,
 *     presets,
 *     recentFilters,
 *     saveToSession,
 *     loadFromSession,
 *   } = useFilterPersistence()
 *
 *   const { filters } = useURLFilters()
 *
 *   // Auto-save to session on filter change
 *   useEffect(() => {
 *     saveToSession(filters)
 *   }, [filters])
 * }
 * ```
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { FilterState } from '@/lib/products/filter-types'
import { DEFAULT_FILTER_STATE } from '@/lib/products/filter-types'
import { areFiltersEqual } from '@/lib/products/url-filters'

/**
 * Storage keys for different persistence mechanisms
 */
const STORAGE_KEYS = {
  SESSION: 'products_filter_session',
  PRESETS: 'products_filter_presets',
  RECENT: 'products_filter_recent',
  SYNC: 'products_filter_sync',
} as const

/**
 * Maximum number of recent filters to keep
 */
const MAX_RECENT_FILTERS = 10

/**
 * Maximum URL length before using localStorage fallback
 */
const MAX_URL_LENGTH = 2000

/**
 * Filter preset with metadata
 */
export interface FilterPreset {
  id: string
  name: string
  filters: FilterState
  createdAt: number
  updatedAt: number
  usageCount: number
}

/**
 * Recent filter entry with timestamp
 */
export interface RecentFilter {
  filters: FilterState
  timestamp: number
}

/**
 * Configuration options for useFilterPersistence hook
 */
export interface UseFilterPersistenceOptions {
  /**
   * Whether to enable cross-tab synchronization
   * @default true
   */
  enableSync?: boolean

  /**
   * Whether to auto-save to session storage
   * @default true
   */
  autoSaveSession?: boolean

  /**
   * Maximum number of recent filters to keep
   * @default 10
   */
  maxRecentFilters?: number

  /**
   * Callback fired when filters are synchronized from another tab
   */
  onSync?: (filters: FilterState) => void

  /**
   * Callback fired when session is recovered
   */
  onSessionRecover?: (filters: FilterState) => void

  /**
   * Callback fired on storage errors
   */
  onError?: (error: Error) => void
}

/**
 * Return type for useFilterPersistence hook
 */
export interface UseFilterPersistenceReturn {
  /**
   * Save a filter preset with a name
   */
  saveFilterPreset: (name: string, filters: FilterState) => string

  /**
   * Load a filter preset by ID
   */
  loadFilterPreset: (id: string) => FilterState | null

  /**
   * Delete a filter preset by ID
   */
  deleteFilterPreset: (id: string) => void

  /**
   * Update an existing preset
   */
  updateFilterPreset: (id: string, name: string, filters: FilterState) => void

  /**
   * Get all saved presets
   */
  presets: FilterPreset[]

  /**
   * Get recently used filters
   */
  recentFilters: RecentFilter[]

  /**
   * Save current filters to session storage
   */
  saveToSession: (filters: FilterState) => void

  /**
   * Load filters from session storage
   */
  loadFromSession: () => FilterState | null

  /**
   * Clear session storage
   */
  clearSession: () => void

  /**
   * Check if URL is too long and localStorage should be used
   */
  shouldUseFallback: (url: string) => boolean

  /**
   * Save filters to localStorage as fallback
   */
  saveFallback: (filters: FilterState) => void

  /**
   * Load filters from localStorage fallback
   */
  loadFallback: () => FilterState | null

  /**
   * Clear all persisted data
   */
  clearAll: () => void
}

/**
 * Custom hook for persisting filter state across sessions and tabs
 *
 * This hook provides comprehensive persistence mechanisms:
 * - Session storage for crash recovery
 * - Local storage for filter presets
 * - Cross-tab synchronization using storage events
 * - Recent filters history
 * - Fallback storage for long URLs
 *
 * @param options - Configuration options
 * @returns Persistence functions and state
 */
export function useFilterPersistence(
  options: UseFilterPersistenceOptions = {}
): UseFilterPersistenceReturn {
  const {
    enableSync = true,
    autoSaveSession = true,
    maxRecentFilters = MAX_RECENT_FILTERS,
    onSync,
    onSessionRecover,
    onError,
  } = options

  // State
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [recentFilters, setRecentFilters] = useState<RecentFilter[]>([])

  // Refs
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  /**
   * Check if we're in browser environment
   */
  const isBrowser = typeof window !== 'undefined'

  /**
   * Safe localStorage wrapper with error handling
   */
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      if (!isBrowser) return null
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.error('localStorage.getItem failed:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
        return null
      }
    },
    setItem: (key: string, value: string): void => {
      if (!isBrowser) return
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.error('localStorage.setItem failed:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
    removeItem: (key: string): void => {
      if (!isBrowser) return
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('localStorage.removeItem failed:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
  }

  /**
   * Safe sessionStorage wrapper with error handling
   */
  const safeSessionStorage = {
    getItem: (key: string): string | null => {
      if (!isBrowser) return null
      try {
        return sessionStorage.getItem(key)
      } catch (error) {
        console.error('sessionStorage.getItem failed:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
        return null
      }
    },
    setItem: (key: string, value: string): void => {
      if (!isBrowser) return
      try {
        sessionStorage.setItem(key, value)
      } catch (error) {
        console.error('sessionStorage.setItem failed:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
    removeItem: (key: string): void => {
      if (!isBrowser) return
      try {
        sessionStorage.removeItem(key)
      } catch (error) {
        console.error('sessionStorage.removeItem failed:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
  }

  /**
   * Load presets from localStorage
   */
  const loadPresets = useCallback((): FilterPreset[] => {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEYS.PRESETS)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Failed to load presets:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
      return []
    }
  }, [onError])

  /**
   * Save presets to localStorage
   */
  const savePresets = useCallback(
    (presetsToSave: FilterPreset[]) => {
      try {
        safeLocalStorage.setItem(
          STORAGE_KEYS.PRESETS,
          JSON.stringify(presetsToSave)
        )
      } catch (error) {
        console.error('Failed to save presets:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
    [onError]
  )

  /**
   * Load recent filters from localStorage
   */
  const loadRecentFilters = useCallback((): RecentFilter[] => {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEYS.RECENT)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Failed to load recent filters:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
      return []
    }
  }, [onError])

  /**
   * Save recent filters to localStorage
   */
  const saveRecentFilters = useCallback(
    (recent: RecentFilter[]) => {
      try {
        safeLocalStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recent))
      } catch (error) {
        console.error('Failed to save recent filters:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
    [onError]
  )

  /**
   * Initialize from storage on mount
   */
  useEffect(() => {
    if (!isBrowser || isInitializedRef.current) return

    setPresets(loadPresets())
    setRecentFilters(loadRecentFilters())
    isInitializedRef.current = true

    // Try to recover session
    const sessionData = loadFromSession()
    if (sessionData && onSessionRecover) {
      onSessionRecover(sessionData)
    }
  }, [isBrowser, loadPresets, loadRecentFilters, onSessionRecover])

  /**
   * Save a filter preset
   */
  const saveFilterPreset = useCallback(
    (name: string, filters: FilterState): string => {
      const id = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const preset: FilterPreset = {
        id,
        name,
        filters,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
      }

      const newPresets = [...presets, preset]
      setPresets(newPresets)
      savePresets(newPresets)

      return id
    },
    [presets, savePresets]
  )

  /**
   * Load a filter preset
   */
  const loadFilterPreset = useCallback(
    (id: string): FilterState | null => {
      const preset = presets.find((p) => p.id === id)
      if (!preset) return null

      // Increment usage count
      const updatedPresets = presets.map((p) =>
        p.id === id
          ? { ...p, usageCount: p.usageCount + 1, updatedAt: Date.now() }
          : p
      )
      setPresets(updatedPresets)
      savePresets(updatedPresets)

      return preset.filters
    },
    [presets, savePresets]
  )

  /**
   * Delete a filter preset
   */
  const deleteFilterPreset = useCallback(
    (id: string) => {
      const newPresets = presets.filter((p) => p.id !== id)
      setPresets(newPresets)
      savePresets(newPresets)
    },
    [presets, savePresets]
  )

  /**
   * Update an existing preset
   */
  const updateFilterPreset = useCallback(
    (id: string, name: string, filters: FilterState) => {
      const updatedPresets = presets.map((p) =>
        p.id === id ? { ...p, name, filters, updatedAt: Date.now() } : p
      )
      setPresets(updatedPresets)
      savePresets(updatedPresets)
    },
    [presets, savePresets]
  )

  /**
   * Add to recent filters
   */
  const addToRecentFilters = useCallback(
    (filters: FilterState) => {
      // Don't add default state to recent
      if (areFiltersEqual(filters, DEFAULT_FILTER_STATE)) return

      // Check if this filter combo already exists in recent
      const existingIndex = recentFilters.findIndex((rf) =>
        areFiltersEqual(rf.filters, filters)
      )

      let newRecent: RecentFilter[]

      if (existingIndex !== -1) {
        // Move existing to top and update timestamp
        newRecent = [
          { filters, timestamp: Date.now() },
          ...recentFilters.filter((_, i) => i !== existingIndex),
        ]
      } else {
        // Add new to top
        newRecent = [
          { filters, timestamp: Date.now() },
          ...recentFilters,
        ].slice(0, maxRecentFilters)
      }

      setRecentFilters(newRecent)
      saveRecentFilters(newRecent)
    },
    [recentFilters, maxRecentFilters, saveRecentFilters]
  )

  /**
   * Save to session storage
   */
  const saveToSession = useCallback(
    (filters: FilterState) => {
      try {
        safeSessionStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify({ filters, timestamp: Date.now() })
        )

        // Also add to recent filters
        addToRecentFilters(filters)
      } catch (error) {
        console.error('Failed to save to session:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
    [addToRecentFilters, onError]
  )

  /**
   * Load from session storage
   * Sanitizes stored filters to ensure no null values override defaults
   */
  const loadFromSession = useCallback((): FilterState | null => {
    try {
      const stored = safeSessionStorage.getItem(STORAGE_KEYS.SESSION)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      if (!parsed.filters) return null

      // Sanitize filters - filter out null/undefined values before merging with defaults
      const sanitizedFilters = Object.fromEntries(
        Object.entries(parsed.filters).filter(([_, v]) => v !== null && v !== undefined)
      )

      return {
        ...DEFAULT_FILTER_STATE,
        ...sanitizedFilters
      }
    } catch (error) {
      console.error('Failed to load from session:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
      return null
    }
  }, [onError])

  /**
   * Clear session storage
   */
  const clearSession = useCallback(() => {
    safeSessionStorage.removeItem(STORAGE_KEYS.SESSION)
  }, [])

  /**
   * Check if URL is too long
   */
  const shouldUseFallback = useCallback((url: string): boolean => {
    return url.length > MAX_URL_LENGTH
  }, [])

  /**
   * Save to localStorage as fallback
   */
  const saveFallback = useCallback(
    (filters: FilterState) => {
      try {
        safeLocalStorage.setItem(
          STORAGE_KEYS.SYNC,
          JSON.stringify({ filters, timestamp: Date.now() })
        )
      } catch (error) {
        console.error('Failed to save fallback:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    },
    [onError]
  )

  /**
   * Load from localStorage fallback
   * Sanitizes stored filters to ensure no null values override defaults
   */
  const loadFallback = useCallback((): FilterState | null => {
    try {
      const stored = safeLocalStorage.getItem(STORAGE_KEYS.SYNC)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      if (!parsed.filters) return null

      // Sanitize filters - filter out null/undefined values before merging with defaults
      // This prevents corrupted localStorage data from causing crashes
      const sanitizedFilters = Object.fromEntries(
        Object.entries(parsed.filters).filter(([_, v]) => v !== null && v !== undefined)
      )

      return {
        ...DEFAULT_FILTER_STATE,
        ...sanitizedFilters
      }
    } catch (error) {
      console.error('Failed to load fallback:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
      return null
    }
  }, [onError])

  /**
   * Clear all persisted data
   */
  const clearAll = useCallback(() => {
    safeLocalStorage.removeItem(STORAGE_KEYS.PRESETS)
    safeLocalStorage.removeItem(STORAGE_KEYS.RECENT)
    safeLocalStorage.removeItem(STORAGE_KEYS.SYNC)
    safeSessionStorage.removeItem(STORAGE_KEYS.SESSION)

    setPresets([])
    setRecentFilters([])
  }, [])

  /**
   * Handle cross-tab synchronization
   */
  useEffect(() => {
    if (!isBrowser || !enableSync) return

    const handleStorageChange = (event: StorageEvent) => {
      // Only respond to our sync key
      if (event.key !== STORAGE_KEYS.SYNC) return

      // Debounce to prevent rapid updates
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      syncTimeoutRef.current = setTimeout(() => {
        try {
          if (!event.newValue) return

          const parsed = JSON.parse(event.newValue)
          if (!parsed.filters) return

          // Sanitize synced filters - filter out null/undefined values
          const sanitizedFilters = Object.fromEntries(
            Object.entries(parsed.filters).filter(([_, v]) => v !== null && v !== undefined)
          )

          const syncedFilters = {
            ...DEFAULT_FILTER_STATE,
            ...sanitizedFilters
          }

          if (onSync) {
            onSync(syncedFilters)
          }
        } catch (error) {
          console.error('Failed to sync from storage event:', error)
          if (onError && error instanceof Error) {
            onError(error)
          }
        }
      }, 100)
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [isBrowser, enableSync, onSync, onError])

  return {
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    updateFilterPreset,
    presets,
    recentFilters,
    saveToSession,
    loadFromSession,
    clearSession,
    shouldUseFallback,
    saveFallback,
    loadFallback,
    clearAll,
  }
}

/**
 * Helper to format preset name with metadata
 */
export function formatPresetName(preset: FilterPreset): string {
  const date = new Date(preset.createdAt).toLocaleDateString()
  return `${preset.name} (${date})`
}

/**
 * Helper to get most used presets
 */
export function getMostUsedPresets(
  presets: FilterPreset[],
  limit: number = 5
): FilterPreset[] {
  return [...presets]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}

/**
 * Helper to get recently updated presets
 */
export function getRecentPresets(
  presets: FilterPreset[],
  limit: number = 5
): FilterPreset[] {
  return [...presets]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
}
