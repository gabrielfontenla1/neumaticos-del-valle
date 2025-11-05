# Quick Reference - Product Filter Hooks

## Installation

```typescript
import { useURLFilters, useFilterPersistence } from '@/hooks'
```

## Basic Usage

### URL Filters (Minimal Setup)

```typescript
function ProductsPage() {
  const { filters, updateFilter, clearFilters } = useURLFilters()

  return (
    <div>
      <input
        value={filters.searchTerm}
        onChange={(e) => updateFilter('searchTerm', e.target.value)}
      />
      {filters.searchTerm && (
        <button onClick={clearFilters}>Clear</button>
      )}
    </div>
  )
}
```

### With Persistence (Full Setup)

```typescript
'use client'

import { useEffect } from 'react'
import { useURLFilters, useFilterPersistence } from '@/hooks'

function ProductsPage() {
  const { filters, updateFilter, updateFilters } = useURLFilters()
  const { saveToSession, presets, loadFilterPreset } = useFilterPersistence()

  // Auto-save to session
  useEffect(() => {
    saveToSession(filters)
  }, [filters, saveToSession])

  return (
    <div>
      {/* Your filter UI */}
    </div>
  )
}
```

## Common Patterns

### Search Input with Debouncing

```typescript
// Already debounced by 300ms
<input
  value={filters.searchTerm}
  onChange={(e) => updateFilter('searchTerm', e.target.value)}
/>
```

### Dropdown Filter

```typescript
<select
  value={filters.selectedBrand}
  onChange={(e) => updateFilter('selectedBrand', e.target.value)}
>
  <option value="all">All Brands</option>
  <option value="michelin">Michelin</option>
</select>
```

### Multiple Filters at Once

```typescript
const handleQuickFilter = () => {
  updateFilters({
    selectedBrand: 'michelin',
    selectedCategory: 'passenger',
    sortBy: 'price-asc',
  })
}
```

### Save Current Filters as Preset

```typescript
const handleSavePreset = () => {
  const name = prompt('Preset name:')
  if (name) {
    const id = saveFilterPreset(name, filters)
    console.log('Saved preset:', id)
  }
}
```

### Load a Preset

```typescript
const handleLoadPreset = (presetId: string) => {
  const presetFilters = loadFilterPreset(presetId)
  if (presetFilters) {
    updateFilters(presetFilters)
  }
}
```

### Clear All Filters

```typescript
<button onClick={clearFilters}>
  Clear All Filters
</button>
```

### Show Active Filter Count

```typescript
const { hasActiveFilters, activeFilterCount } = useURLFilters()

{hasActiveFilters && (
  <span>Active: {activeFilterCount}</span>
)}
```

### Cross-Tab Sync

```typescript
const { updateFilters } = useURLFilters()

const persistence = useFilterPersistence({
  onSync: (syncedFilters) => {
    updateFilters(syncedFilters)
  },
})
```

### Session Recovery

```typescript
const persistence = useFilterPersistence({
  onSessionRecover: (recoveredFilters) => {
    if (confirm('Restore previous session?')) {
      updateFilters(recoveredFilters)
    }
  },
})
```

## Configuration Options

### useURLFilters

```typescript
const options = {
  debounceMs: 300,           // Debounce delay (ms)
  basePath: '/productos',    // Base URL path
  replaceHistory: false,     // Replace vs push
  onFiltersChange: (filters) => {},  // Change callback
  onError: (error) => {},    // Error handler
}

const { filters } = useURLFilters(options)
```

### useFilterPersistence

```typescript
const options = {
  enableSync: true,          // Cross-tab sync
  autoSaveSession: true,     // Auto-save session
  maxRecentFilters: 10,      // Recent filters limit
  onSync: (filters) => {},   // Sync callback
  onSessionRecover: (filters) => {},  // Recovery callback
  onError: (error) => {},    // Error handler
}

const persistence = useFilterPersistence(options)
```

## TypeScript Types

```typescript
import type {
  FilterState,
  UseURLFiltersOptions,
  UseURLFiltersReturn,
  UseFilterPersistenceOptions,
  UseFilterPersistenceReturn,
  FilterPreset,
  RecentFilter,
} from '@/hooks'
```

## Return Values

### useURLFilters

```typescript
const {
  filters,            // FilterState
  updateFilter,       // <K>(key: K, value: FilterState[K]) => void
  updateFilters,      // (updates: Partial<FilterState>) => void
  clearFilters,       // () => void
  isLoading,          // boolean
  hasActiveFilters,   // boolean
  activeFilterCount,  // number
} = useURLFilters()
```

### useFilterPersistence

```typescript
const {
  saveFilterPreset,    // (name: string, filters: FilterState) => string
  loadFilterPreset,    // (id: string) => FilterState | null
  deleteFilterPreset,  // (id: string) => void
  updateFilterPreset,  // (id: string, name: string, filters: FilterState) => void
  presets,             // FilterPreset[]
  recentFilters,       // RecentFilter[]
  saveToSession,       // (filters: FilterState) => void
  loadFromSession,     // () => FilterState | null
  clearSession,        // () => void
  shouldUseFallback,   // (url: string) => boolean
  saveFallback,        // (filters: FilterState) => void
  loadFallback,        // () => FilterState | null
  clearAll,            // () => void
} = useFilterPersistence()
```

## Helper Functions

```typescript
import {
  isFilterKey,           // Type guard
  getFilterFromURL,      // Get single filter from URL
  formatPresetName,      // Format preset display name
  getMostUsedPresets,    // Get top used presets
  getRecentPresets,      // Get recently updated presets
} from '@/hooks'
```

## Filter State Structure

```typescript
interface FilterState {
  searchTerm: string
  selectedBrand: string
  selectedCategory: string
  selectedModel: string
  selectedWidth: string
  selectedProfile: string
  selectedDiameter: string
  sizeSearchTerm: string
  sortBy: string
  currentPage: number
  itemsPerPage: number
}
```

## URL Parameters

```
/productos?search=michelin&brand=michelin&category=passenger&sort=price-asc&page=2
```

Maps to:
```typescript
{
  searchTerm: 'michelin',
  selectedBrand: 'michelin',
  selectedCategory: 'passenger',
  sortBy: 'price-asc',
  currentPage: 2,
  // ... defaults for others
}
```

## Storage Keys

- `products_filter_session` - Current session filters
- `products_filter_presets` - Saved filter presets
- `products_filter_recent` - Recent filter history
- `products_filter_sync` - Cross-tab sync data

## Best Practices

1. **Always auto-save to session**:
   ```typescript
   useEffect(() => {
     saveToSession(filters)
   }, [filters, saveToSession])
   ```

2. **Handle cross-tab sync**:
   ```typescript
   useFilterPersistence({
     onSync: (filters) => updateFilters(filters)
   })
   ```

3. **Use replaceHistory for search**:
   ```typescript
   useURLFilters({ replaceHistory: true })
   ```

4. **Add error handling**:
   ```typescript
   useURLFilters({
     onError: (error) => console.error(error)
   })
   ```

5. **Clear on unmount if needed**:
   ```typescript
   useEffect(() => {
     return () => clearSession()
   }, [])
   ```

## Troubleshooting

### Filters not syncing with URL
- Check Next.js App Router setup
- Verify `basePath` matches route

### Storage errors
- Check localStorage availability
- Verify quota not exceeded
- Check for private browsing mode

### Debounce too slow/fast
- Adjust `debounceMs` option
- Consider `replaceHistory: true`

### Type errors
- Import types from `@/hooks`
- Check FilterState compatibility

## Performance Tips

1. Use `replaceHistory: true` for search inputs
2. Adjust `debounceMs` based on use case
3. Limit `maxRecentFilters` if needed
4. Clear old presets periodically
5. Use `clearSession()` when appropriate

## Examples

See:
- [README.md](./README.md) - Full documentation
- [example-usage.tsx](./example-usage.tsx) - Complete example
