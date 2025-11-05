# Product Filter Hooks

Custom React hooks for managing product filter state with URL synchronization and persistence.

## Overview

This directory contains two complementary hooks that work together to provide a complete filter management solution:

1. **`useURLFilters`** - URL synchronization and state management
2. **`useFilterPersistence`** - Local/session storage and cross-tab sync

## useURLFilters

Main hook for managing filter state synchronized with URL parameters.

### Features

- Reads initial filter state from URL on mount
- Updates URL when filters change (with 300ms debouncing)
- Handles browser back/forward navigation
- Gracefully handles invalid/malicious parameters
- SSR-safe (no window access during server-side rendering)
- Full TypeScript support

### Basic Usage

```tsx
import { useURLFilters } from '@/hooks/useURLFilters'

function ProductsPage() {
  const {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    isLoading,
    hasActiveFilters,
    activeFilterCount,
  } = useURLFilters()

  if (isLoading) {
    return <div>Loading filters...</div>
  }

  return (
    <div>
      {/* Search input */}
      <input
        type="text"
        value={filters.searchTerm}
        onChange={(e) => updateFilter('searchTerm', e.target.value)}
        placeholder="Search products..."
      />

      {/* Brand filter */}
      <select
        value={filters.selectedBrand}
        onChange={(e) => updateFilter('selectedBrand', e.target.value)}
      >
        <option value="all">All Brands</option>
        <option value="michelin">Michelin</option>
        <option value="bridgestone">Bridgestone</option>
      </select>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button onClick={clearFilters}>
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  )
}
```

### Advanced Usage

```tsx
import { useURLFilters } from '@/hooks/useURLFilters'

function ProductsPage() {
  const {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
  } = useURLFilters({
    // Custom debounce delay (default: 300ms)
    debounceMs: 500,

    // Custom base path (default: '/productos')
    basePath: '/products',

    // Replace history instead of pushing (default: false)
    replaceHistory: true,

    // Callback when filters change
    onFiltersChange: (newFilters) => {
      console.log('Filters changed:', newFilters)
      // Track analytics, etc.
    },

    // Callback on errors
    onError: (error) => {
      console.error('Filter error:', error)
      // Report to error tracking service
    },
  })

  // Update multiple filters at once
  const handleQuickFilter = () => {
    updateFilters({
      selectedBrand: 'michelin',
      selectedCategory: 'passenger',
      sortBy: 'price-asc',
    })
  }

  return (
    <div>
      <button onClick={handleQuickFilter}>
        Show Michelin Passenger Tires (Cheapest First)
      </button>
    </div>
  )
}
```

### API Reference

#### Return Value

```typescript
interface UseURLFiltersReturn {
  // Current filter state synchronized with URL
  filters: FilterState

  // Update a single filter value
  updateFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void

  // Update multiple filters at once
  updateFilters: (updates: Partial<FilterState>) => void

  // Clear all filters and reset to default state
  clearFilters: () => void

  // Loading state while parsing URL parameters
  isLoading: boolean

  // Whether the current filters are different from default state
  hasActiveFilters: boolean

  // Number of active filters (non-default values)
  activeFilterCount: number
}
```

#### Options

```typescript
interface UseURLFiltersOptions {
  // Debounce delay in milliseconds for URL updates (default: 300)
  debounceMs?: number

  // Base path for URL updates (default: '/productos')
  basePath?: string

  // Whether to replace history instead of pushing (default: false)
  replaceHistory?: boolean

  // Callback fired when filters change
  onFiltersChange?: (filters: FilterState) => void

  // Callback fired when URL parsing fails
  onError?: (error: Error) => void
}
```

## useFilterPersistence

Hook for persisting filter state across sessions and browser tabs.

### Features

- Local storage for filter presets
- Session storage for crash recovery
- Cross-tab synchronization using storage events
- Recently used filters history
- Fallback storage for long URLs
- SSR-safe with error handling

### Basic Usage

```tsx
import { useURLFilters } from '@/hooks/useURLFilters'
import { useFilterPersistence } from '@/hooks/useFilterPersistence'

function ProductsPage() {
  const { filters, updateFilters } = useURLFilters()

  const {
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    presets,
    recentFilters,
    saveToSession,
  } = useFilterPersistence()

  // Auto-save to session on filter change
  useEffect(() => {
    saveToSession(filters)
  }, [filters, saveToSession])

  // Save current filters as preset
  const handleSavePreset = () => {
    const name = prompt('Enter preset name:')
    if (name) {
      saveFilterPreset(name, filters)
    }
  }

  // Load a preset
  const handleLoadPreset = (presetId: string) => {
    const presetFilters = loadFilterPreset(presetId)
    if (presetFilters) {
      updateFilters(presetFilters)
    }
  }

  return (
    <div>
      {/* Save current filters */}
      <button onClick={handleSavePreset}>
        Save Current Filters
      </button>

      {/* Load presets */}
      <div>
        <h3>Saved Presets</h3>
        {presets.map((preset) => (
          <div key={preset.id}>
            <button onClick={() => handleLoadPreset(preset.id)}>
              {preset.name}
            </button>
            <button onClick={() => deleteFilterPreset(preset.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Recent filters */}
      <div>
        <h3>Recent Searches</h3>
        {recentFilters.map((recent, index) => (
          <button
            key={index}
            onClick={() => updateFilters(recent.filters)}
          >
            {/* Display filter summary */}
            {JSON.stringify(recent.filters)}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Advanced Usage

```tsx
import { useFilterPersistence } from '@/hooks/useFilterPersistence'

function ProductsPage() {
  const {
    presets,
    recentFilters,
    saveFilterPreset,
    loadFilterPreset,
    updateFilterPreset,
    shouldUseFallback,
    saveFallback,
    loadFallback,
  } = useFilterPersistence({
    // Enable cross-tab sync (default: true)
    enableSync: true,

    // Auto-save to session (default: true)
    autoSaveSession: true,

    // Max recent filters (default: 10)
    maxRecentFilters: 20,

    // Callback when synced from another tab
    onSync: (filters) => {
      console.log('Synced from another tab:', filters)
      updateFilters(filters)
    },

    // Callback when session recovered
    onSessionRecover: (filters) => {
      console.log('Session recovered:', filters)
      updateFilters(filters)
    },

    // Error handler
    onError: (error) => {
      console.error('Persistence error:', error)
    },
  })

  // Check if URL is too long
  const handleShare = () => {
    const url = generateShareableURL(filters)

    if (shouldUseFallback(url)) {
      // URL too long, save to localStorage and share short link
      saveFallback(filters)
      const shortUrl = `/productos?ref=${Date.now()}`
      navigator.clipboard.writeText(shortUrl)
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <div>
      <button onClick={handleShare}>
        Share Filters
      </button>
    </div>
  )
}
```

### API Reference

#### Return Value

```typescript
interface UseFilterPersistenceReturn {
  // Save a filter preset with a name
  saveFilterPreset: (name: string, filters: FilterState) => string

  // Load a filter preset by ID
  loadFilterPreset: (id: string) => FilterState | null

  // Delete a filter preset by ID
  deleteFilterPreset: (id: string) => void

  // Update an existing preset
  updateFilterPreset: (id: string, name: string, filters: FilterState) => void

  // Get all saved presets
  presets: FilterPreset[]

  // Get recently used filters
  recentFilters: RecentFilter[]

  // Save current filters to session storage
  saveToSession: (filters: FilterState) => void

  // Load filters from session storage
  loadFromSession: () => FilterState | null

  // Clear session storage
  clearSession: () => void

  // Check if URL is too long
  shouldUseFallback: (url: string) => boolean

  // Save filters to localStorage as fallback
  saveFallback: (filters: FilterState) => void

  // Load filters from localStorage fallback
  loadFallback: () => FilterState | null

  // Clear all persisted data
  clearAll: () => void
}
```

#### Options

```typescript
interface UseFilterPersistenceOptions {
  // Whether to enable cross-tab synchronization (default: true)
  enableSync?: boolean

  // Whether to auto-save to session storage (default: true)
  autoSaveSession?: boolean

  // Maximum number of recent filters to keep (default: 10)
  maxRecentFilters?: number

  // Callback fired when filters are synchronized from another tab
  onSync?: (filters: FilterState) => void

  // Callback fired when session is recovered
  onSessionRecover?: (filters: FilterState) => void

  // Callback fired on storage errors
  onError?: (error: Error) => void
}
```

#### Types

```typescript
interface FilterPreset {
  id: string
  name: string
  filters: FilterState
  createdAt: number
  updatedAt: number
  usageCount: number
}

interface RecentFilter {
  filters: FilterState
  timestamp: number
}
```

## Combined Usage Example

Here's a complete example showing both hooks working together:

```tsx
'use client'

import { useEffect } from 'react'
import { useURLFilters } from '@/hooks/useURLFilters'
import { useFilterPersistence } from '@/hooks/useFilterPersistence'

export function ProductFilters() {
  const {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    isLoading,
    hasActiveFilters,
    activeFilterCount,
  } = useURLFilters({
    onFiltersChange: (newFilters) => {
      console.log('Filters changed:', newFilters)
    },
  })

  const {
    saveFilterPreset,
    loadFilterPreset,
    presets,
    recentFilters,
    saveToSession,
  } = useFilterPersistence({
    onSync: (syncedFilters) => {
      // Update filters when synced from another tab
      updateFilters(syncedFilters)
    },
    onSessionRecover: (recoveredFilters) => {
      // Optionally restore filters from crashed session
      if (window.confirm('Restore previous filter session?')) {
        updateFilters(recoveredFilters)
      }
    },
  })

  // Auto-save to session storage
  useEffect(() => {
    if (!isLoading) {
      saveToSession(filters)
    }
  }, [filters, isLoading, saveToSession])

  if (isLoading) {
    return <div>Loading filters...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          placeholder="Search..."
          className="border p-2 rounded"
        />

        <select
          value={filters.selectedBrand}
          onChange={(e) => updateFilter('selectedBrand', e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Brands</option>
          {/* More options */}
        </select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear All ({activeFilterCount})
        </button>
      )}

      {/* Save preset */}
      <button
        onClick={() => {
          const name = prompt('Preset name:')
          if (name) saveFilterPreset(name, filters)
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Save Current Filters
      </button>

      {/* Load presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">Saved Presets</h3>
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                const presetFilters = loadFilterPreset(preset.id)
                if (presetFilters) updateFilters(presetFilters)
              }}
              className="bg-gray-200 px-3 py-1 rounded mr-2"
            >
              {preset.name} ({preset.usageCount} uses)
            </button>
          ))}
        </div>
      )}

      {/* Recent filters */}
      {recentFilters.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">Recent Searches</h3>
          {recentFilters.slice(0, 5).map((recent, index) => (
            <button
              key={index}
              onClick={() => updateFilters(recent.filters)}
              className="bg-gray-100 px-3 py-1 rounded mr-2 text-sm"
            >
              {/* Display a summary of the filters */}
              {new Date(recent.timestamp).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Best Practices

### 1. Always Auto-Save to Session

```tsx
useEffect(() => {
  if (!isLoading) {
    saveToSession(filters)
  }
}, [filters, isLoading, saveToSession])
```

### 2. Handle Cross-Tab Sync

```tsx
const persistence = useFilterPersistence({
  onSync: (syncedFilters) => {
    updateFilters(syncedFilters)
  },
})
```

### 3. Debounce for Search Inputs

```tsx
// The hook already debounces URL updates by 300ms
// No need to add extra debouncing in most cases
<input
  value={filters.searchTerm}
  onChange={(e) => updateFilter('searchTerm', e.target.value)}
/>
```

### 4. Use Replace History for Searches

```tsx
// Prevent cluttering browser history with every search keystroke
const { filters, updateFilter } = useURLFilters({
  replaceHistory: true, // Use replace instead of push
})
```

### 5. Error Handling

```tsx
const { filters } = useURLFilters({
  onError: (error) => {
    // Log to error tracking service
    console.error('Filter error:', error)

    // Show user-friendly error
    toast.error('Failed to update filters')
  },
})
```

## TypeScript Support

Both hooks are fully typed with TypeScript. Import types from the filter system:

```typescript
import type { FilterState, SortOption, ItemsPerPageOption } from '@/lib/products/filter-types'
import type { FilterPreset, RecentFilter } from '@/hooks/useFilterPersistence'
```

## Testing

Both hooks are designed to be testable. Mock the Next.js router hooks in your tests:

```typescript
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/productos',
}))
```

## Browser Compatibility

- Modern browsers with localStorage and sessionStorage support
- Graceful degradation when storage is unavailable
- SSR-safe with proper browser environment checks

## Performance

- Debounced URL updates (300ms default) prevent history pollution
- Efficient state updates using React best practices
- Minimal re-renders through proper dependency management
- Storage operations wrapped in try-catch for safety

## Migration Guide

If you're migrating from a different filter system:

1. Replace your existing filter state management with `useURLFilters`
2. Add `useFilterPersistence` for enhanced features
3. Update components to use the new API
4. Test URL parameters and storage integration
5. Add error handling and analytics tracking

## Related Files

- `/src/lib/products/filter-types.ts` - Type definitions and validation
- `/src/lib/products/url-filters.ts` - Serialization utilities
