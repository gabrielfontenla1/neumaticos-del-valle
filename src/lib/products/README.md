# Products URL Filter System

Complete URL serialization system for products page filters with TypeScript type safety and validation.

## Files

- **`filter-types.ts`** - Type definitions, validation functions, and constants
- **`url-filters.ts`** - Serialization/deserialization functions for URL parameters

## Quick Start

### 1. Reading Filters from URL (Server Component)

```typescript
import { getFiltersFromSearchParams } from '@/lib/products/url-filters'

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Convert searchParams to URLSearchParams
  const params = new URLSearchParams()
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      params.set(key, value)
    }
  })

  const filters = deserializeFiltersFromURL(params)

  // filters now contains all validated filter state
  console.log(filters.selectedBrand) // "Michelin" or "all"
  console.log(filters.currentPage) // 1, 2, 3, etc.
}
```

### 2. Reading Filters from URL (Client Component)

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { getFiltersFromSearchParams } from '@/lib/products/url-filters'

export default function ProductsClient() {
  const searchParams = useSearchParams()
  const filters = getFiltersFromSearchParams(searchParams)

  // Initialize state from URL
  const [selectedBrand, setSelectedBrand] = useState(filters.selectedBrand)
  const [currentPage, setCurrentPage] = useState(filters.currentPage)
  // ... other state
}
```

### 3. Updating URL When Filters Change

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { buildFilterURL } from '@/lib/products/url-filters'
import type { FilterState } from '@/lib/products/filter-types'

export default function ProductsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleBrandChange = (brand: string) => {
    // Update local state
    setSelectedBrand(brand)

    // Build new filter state
    const newFilters: FilterState = {
      ...currentFilterState,
      selectedBrand: brand,
      currentPage: 1, // Reset to page 1 when changing filters
    }

    // Update URL
    const newURL = buildFilterURL(newFilters)
    router.push(newURL, { scroll: false })
  }
}
```

### 4. Updating Single Parameter

```typescript
import { updateURLParam } from '@/lib/products/url-filters'

const handlePageChange = (page: number) => {
  const currentParams = new URLSearchParams(window.location.search)
  const newParams = updateURLParam(currentParams, 'currentPage', page)

  router.push(`/productos?${newParams.toString()}`, { scroll: false })
}
```

### 5. Parsing Tire Size

```typescript
import { parseTireSize, formatTireSize } from '@/lib/products/url-filters'

// Parse a tire size string
const size = parseTireSize('205/55R16')
// { width: '205', profile: '55', diameter: '16' }

// Format components back to string
const formatted = formatTireSize('205', '55', '16')
// '205/55R16'
```

### 6. Clearing All Filters

```typescript
import { clearAllFilters } from '@/lib/products/url-filters'

const handleClearFilters = () => {
  // Reset all local state to defaults
  setSelectedBrand('all')
  setSelectedCategory('all')
  // ... reset all state

  // Clear URL
  const emptyParams = clearAllFilters()
  router.push(`/productos?${emptyParams.toString()}`, { scroll: false })
  // Or simply: router.push('/productos')
}
```

### 7. Generating Shareable URLs

```typescript
import { generateShareableURL } from '@/lib/products/url-filters'

const handleShare = () => {
  const shareURL = generateShareableURL(currentFilterState)
  // https://example.com/productos?brand=Michelin&width=205&profile=55&diameter=16

  navigator.clipboard.writeText(shareURL)
}
```

## URL Parameter Reference

| Filter State Key | URL Parameter | Example | Default |
|-----------------|---------------|---------|---------|
| `searchTerm` | `search` | `?search=michelin` | `''` |
| `selectedBrand` | `brand` | `?brand=Michelin` | `'all'` |
| `selectedCategory` | `category` | `?category=summer` | `'all'` |
| `selectedModel` | `model` | `?model=Pilot Sport 4` | `'all'` |
| `selectedWidth` | `width` | `?width=205` | `'all'` |
| `selectedProfile` | `profile` | `?profile=55` | `'all'` |
| `selectedDiameter` | `diameter` | `?diameter=16` | `'all'` |
| `sizeSearchTerm` | `size` | `?size=205/55R16` | `''` |
| `sortBy` | `sort` | `?sort=price-asc` | `'name'` |
| `currentPage` | `page` | `?page=2` | `1` |
| `itemsPerPage` | `limit` | `?limit=50` | `50` |

## Example URLs

```
# Simple brand filter
/productos?brand=Michelin

# Full tire size search
/productos?width=205&profile=55&diameter=16

# Combined size search notation
/productos?size=205/55R16

# Multiple filters with sorting
/productos?brand=Michelin&category=summer&sort=price-asc

# Search with pagination
/productos?search=pilot&page=2&limit=25

# Complex filter combination
/productos?brand=Michelin&width=205&profile=55&diameter=16&sort=price-desc&page=1
```

## Type Safety

All functions are fully typed with TypeScript:

```typescript
import type { FilterState, SortOption, ItemsPerPageOption } from '@/lib/products/filter-types'

// FilterState interface ensures type safety
const state: FilterState = {
  searchTerm: '',
  selectedBrand: 'all',
  // ... TypeScript will enforce all required properties
}

// Validation functions return typed results
const sortValidation = validateSortOption('price-asc')
// { isValid: true, value: 'price-asc' }
```

## Validation

All URL parameters are validated:

- **Sort options**: Only accepts `'name'`, `'price-asc'`, `'price-desc'`, `'stock'`
- **Items per page**: Only accepts `10`, `25`, `50`, `100`
- **Page number**: Must be ≥1 and an integer
- **Tire size**: Must match format `205/55R16`, `205/55/16`, or `205-55-16`
- **Filter values**: Empty or invalid values default to `'all'`

Invalid values automatically fall back to defaults with console warnings.

## Utility Functions

### Checking Active Filters

```typescript
import { hasActiveFilters, countActiveFilters } from '@/lib/products/filter-types'

const isFiltered = hasActiveFilters(currentState)
// true if any filter is active

const count = countActiveFilters(currentState)
// number of active filters (for badge display)
```

### Comparing Filter States

```typescript
import { areFiltersEqual } from '@/lib/products/url-filters'

const hasChanged = !areFiltersEqual(previousState, currentState)
```

### Merging Filter Updates

```typescript
import { mergeFilterState } from '@/lib/products/url-filters'

const newState = mergeFilterState(currentState, {
  selectedBrand: 'Michelin',
  // currentPage automatically resets to 1
})
```

## Integration Example

Complete example showing URL sync in ProductsClient:

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  getFiltersFromSearchParams,
  buildFilterURL
} from '@/lib/products/url-filters'
import type { FilterState } from '@/lib/products/filter-types'

export default function ProductsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize from URL on mount
  const initialFilters = getFiltersFromSearchParams(searchParams)

  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm)
  const [selectedBrand, setSelectedBrand] = useState(initialFilters.selectedBrand)
  const [selectedWidth, setSelectedWidth] = useState(initialFilters.selectedWidth)
  const [currentPage, setCurrentPage] = useState(initialFilters.currentPage)
  // ... other state

  // Sync URL when filters change
  useEffect(() => {
    const currentState: FilterState = {
      searchTerm,
      selectedBrand,
      selectedWidth,
      currentPage,
      // ... all filter state
    }

    const newURL = buildFilterURL(currentState)
    router.push(newURL, { scroll: false })
  }, [searchTerm, selectedBrand, selectedWidth, currentPage, router])

  return (
    // Your component JSX
  )
}
```

## Edge Cases Handled

✅ Empty/null URL parameters → defaults to `'all'` or default values
✅ Invalid sort options → defaults to `'name'`
✅ Invalid page numbers → defaults to `1`
✅ Invalid tire size formats → defaults to `''` with warning
✅ Out-of-range items per page → defaults to `50`
✅ Mixed tire size formats (/, -, R) → all parsed correctly
✅ Default values omitted from URL → keeps URLs clean
✅ Page resets to 1 when filters change → prevents empty results

## Performance Notes

- ⚡ All validation is O(1) constant time
- ⚡ No unnecessary re-renders with `scroll: false` option
- ⚡ Default values not added to URL (cleaner, shorter URLs)
- ⚡ Type-safe throughout (catch errors at compile time)
