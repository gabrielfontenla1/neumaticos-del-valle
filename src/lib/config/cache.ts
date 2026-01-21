/**
 * Configuration Cache System
 * Multi-level cache with TTL and fallback mechanism
 * Pattern based on /src/lib/twilio/client.ts
 */

import { CacheEntry } from '@/lib/ai/config-types';

export class ConfigurationCache {
  private static instance: ConfigurationCache;
  private cache: Map<string, CacheEntry>;
  private lastKnownGood: Map<string, unknown>;
  private metrics: {
    hits: number;
    misses: number;
    fallbacks: number;
    errors: number;
  };

  private constructor() {
    this.cache = new Map();
    this.lastKnownGood = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      fallbacks: 0,
      errors: 0,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigurationCache {
    if (!ConfigurationCache.instance) {
      ConfigurationCache.instance = new ConfigurationCache();
    }
    return ConfigurationCache.instance;
  }

  /**
   * Get value from cache with TTL check
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry is still valid (TTL not expired)
    if (age < entry.ttl) {
      this.metrics.hits++;
      return entry.value as T;
    }

    // Cache expired
    this.metrics.misses++;
    this.cache.delete(key);
    return null;
  }

  /**
   * Set value in cache with TTL
   */
  public set<T>(key: string, value: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);

    // Update last known good value
    this.lastKnownGood.set(key, value);
  }

  /**
   * Get last known good value (fallback when DB fails)
   */
  public getLastKnownGood<T>(key: string): T | null {
    this.metrics.fallbacks++;
    const value = this.lastKnownGood.get(key);
    return value ? (value as T) : null;
  }

  /**
   * Invalidate cache entry by key
   */
  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  public invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear();
    // Don't clear lastKnownGood - keep it for emergency fallback
  }

  /**
   * Get cache statistics
   */
  public getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: hitRate.toFixed(2) + '%',
      cacheSize: this.cache.size,
      lastKnownGoodSize: this.lastKnownGood.size,
    };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      fallbacks: 0,
      errors: 0,
    };
  }

  /**
   * Increment error counter
   */
  public recordError(): void {
    this.metrics.errors++;
  }

  /**
   * Get all cache keys (for debugging)
   */
  public getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if cache has key and it's valid
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const age = now - entry.timestamp;
    return age < entry.ttl;
  }
}

// Export singleton instance
export const configCache = ConfigurationCache.getInstance();

// TTL constants (in milliseconds)
export const TTL = {
  SYSTEM_PROMPT: 30 * 1000, // 30 seconds (frequent changes during testing)
  FUNCTION_TOOLS: 2 * 60 * 1000, // 2 minutes (critical but stable)
  BOT_CONFIG: 5 * 60 * 1000, // 5 minutes (business hours, etc)
  AI_PROMPTS: 5 * 60 * 1000, // 5 minutes
  MODELS_CONFIG: 10 * 60 * 1000, // 10 minutes (rarely change)
  SERVICES_CONFIG: 5 * 60 * 1000, // 5 minutes
} as const;
