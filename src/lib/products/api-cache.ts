/**
 * API Cache Layer for Product Filtering
 * Implements intelligent caching with LRU strategy and TTL
 */

import type { FilterState } from './filter-types'
import type { Product } from '@/features/products/types'

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
  filterKey: string
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number
  misses: number
  size: number
  evictions: number
  hitRate: number
}

/**
 * API response metadata
 */
export interface APIResponseMetadata {
  total: number
  page: number
  totalPages: number
  itemsPerPage: number
  appliedFilters: FilterState
  availableFilters?: {
    brands: string[]
    categories: string[]
    models: string[]
    widths: string[]
    profiles: string[]
    diameters: string[]
  }
  cached: boolean
  cacheAge?: number
}

/**
 * Complete API response structure
 */
export interface APIResponse {
  products: Product[]
  metadata: APIResponseMetadata
}

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Cache TTL in milliseconds (5 minutes)
  TTL: 5 * 60 * 1000,

  // Maximum cache entries (LRU eviction)
  MAX_SIZE: 100,

  // Minimum hits before considering for warming
  WARM_THRESHOLD: 5,

  // Enable/disable caching
  ENABLED: true,
} as const

/**
 * API Cache Manager
 * Implements LRU caching with TTL and cache warming
 */
class APICache {
  private cache = new Map<string, CacheEntry<APIResponse>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    evictions: 0,
    hitRate: 0,
  }

  /**
   * Generates a cache key from filter state
   * Normalizes filter values to ensure consistent keys
   */
  generateKey(filters: Partial<FilterState>): string {
    const normalized = {
      search: filters.searchTerm || '',
      brand: filters.selectedBrand || 'all',
      category: filters.selectedCategory || 'all',
      model: filters.selectedModel || 'all',
      width: filters.selectedWidth || 'all',
      profile: filters.selectedProfile || 'all',
      diameter: filters.selectedDiameter || 'all',
      sizeSearch: filters.sizeSearchTerm || '',
      sort: filters.sortBy || 'name',
      page: filters.currentPage || 1,
      limit: filters.itemsPerPage || 50,
    }

    return JSON.stringify(normalized)
  }

  /**
   * Retrieves data from cache
   * Returns null if not found or expired
   */
  get(key: string): APIResponse | null {
    if (!CACHE_CONFIG.ENABLED) return null

    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp
    if (age > CACHE_CONFIG.TTL) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size = this.cache.size
      this.updateHitRate()
      return null
    }

    // Update hit count and stats
    entry.hits++
    this.stats.hits++
    this.updateHitRate()

    // Add cache metadata to response
    return {
      ...entry.data,
      metadata: {
        ...entry.data.metadata,
        cached: true,
        cacheAge: age,
      },
    }
  }

  /**
   * Stores data in cache with LRU eviction
   */
  set(key: string, data: APIResponse, filters: Partial<FilterState>): void {
    if (!CACHE_CONFIG.ENABLED) return

    // Evict least recently used entries if cache is full
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      this.evictLRU()
    }

    const entry: CacheEntry<APIResponse> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      filterKey: this.generateKey(filters),
    }

    this.cache.set(key, entry)
    this.stats.size = this.cache.size
  }

  /**
   * Evicts the least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let lruHits = Infinity
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize eviction by hits first, then by age
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp < oldestTime)) {
        lruKey = key
        lruHits = entry.hits
        oldestTime = entry.timestamp
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
      this.stats.evictions++
    }
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
  }

  /**
   * Invalidates cache entries matching a pattern
   * Useful for invalidating after data updates
   */
  invalidate(pattern?: Partial<FilterState>): void {
    if (!pattern) {
      this.clear()
      return
    }

    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      const shouldInvalidate = this.matchesPattern(entry.filterKey, pattern)
      if (shouldInvalidate) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
    this.stats.size = this.cache.size
  }

  /**
   * Checks if a cache key matches an invalidation pattern
   */
  private matchesPattern(key: string, pattern: Partial<FilterState>): boolean {
    try {
      const parsedKey = JSON.parse(key)

      for (const [field, value] of Object.entries(pattern)) {
        if (parsedKey[field] !== undefined && parsedKey[field] !== value) {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Gets popular filter combinations for cache warming
   */
  getPopularFilters(limit: number = 10): string[] {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .filter(item => item.hits >= CACHE_CONFIG.WARM_THRESHOLD)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit)
      .map(item => item.key)

    return entries
  }

  /**
   * Updates hit rate statistic
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Gets current cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Resets cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      size: this.cache.size,
      evictions: 0,
      hitRate: 0,
    }
  }
}

// Singleton cache instance
export const apiCache = new APICache()

