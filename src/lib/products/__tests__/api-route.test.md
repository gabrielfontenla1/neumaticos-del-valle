# API Route Enhancement Test Documentation

## Overview
This document outlines the enhanced API route capabilities and test scenarios.

## Enhanced Features

### 1. URL-Based Filtering
The API now accepts comprehensive URL parameters:

#### Text Search
- `?search=firestone` - Searches across name, brand, and model fields

#### Basic Filters
- `?brand=FIRESTONE` - Filter by specific brand
- `?category=AUTO` - Filter by category
- `?model=DESTINATION` - Filter by tire model

#### Tire Size Filters
- `?width=205` - Filter by tire width
- `?profile=55` - Filter by tire profile
- `?diameter=16` - Filter by tire diameter
- `?size=205/55R16` - Combined size search (sets all three size fields)

#### Sorting
- `?sort=name` - Sort by name (default)
- `?sort=price-asc` - Sort by price ascending
- `?sort=price-desc` - Sort by price descending
- `?sort=stock` - Sort by stock quantity

#### Pagination
- `?page=1` - Page number (default: 1)
- `?limit=50` - Items per page (default: 50, options: 10, 25, 50, 100)

### 2. Response Caching
- Implements LRU cache with 5-minute TTL
- Maximum 100 cached entries
- Cache keys based on filter combinations
- Cache statistics tracking (hits, misses, hit rate)

### 3. Response Metadata
The API returns comprehensive metadata:
```json
{
  "products": [...],
  "metadata": {
    "total": 1000,
    "page": 1,
    "totalPages": 20,
    "itemsPerPage": 50,
    "appliedFilters": {
      "searchTerm": "",
      "selectedBrand": "FIRESTONE",
      "selectedCategory": "all",
      ...
    },
    "availableFilters": {
      "brands": ["FIRESTONE", "GOODYEAR", ...],
      "categories": ["AUTO", "CAMIONETA", ...],
      "models": ["DESTINATION", "WRANGLER", ...],
      "widths": ["185", "195", "205", ...],
      "profiles": ["45", "50", "55", ...],
      "diameters": ["15", "16", "17", ...]
    },
    "cached": false,
    "cacheAge": undefined
  }
}
```

## Test Scenarios

### Test 1: Basic Filtering
**URL**: `/api/products?brand=FIRESTONE&limit=10`

**Expected**:
- Returns only FIRESTONE products
- Maximum 10 items
- Metadata shows applied filters
- Available filters for dependent dropdowns

### Test 2: Combined Tire Size Search
**URL**: `/api/products?size=205/55R16`

**Expected**:
- Automatically sets width=205, profile=55, diameter=16
- Returns products matching all three dimensions
- Size search term preserved in appliedFilters

### Test 3: Multi-Filter Combination
**URL**: `/api/products?brand=GOODYEAR&category=CAMIONETA&sort=price-asc&page=1&limit=25`

**Expected**:
- Returns GOODYEAR truck tires only
- Sorted by price ascending
- 25 items per page
- All filters reflected in metadata

### Test 4: Search Query
**URL**: `/api/products?search=wrangler`

**Expected**:
- Searches across name, brand, and model fields
- Returns all products containing "wrangler"
- Case-insensitive search

### Test 5: Cache Behavior
**Steps**:
1. Make request: `/api/products?brand=FIRESTONE`
2. Check response: `cached: false`
3. Make same request again
4. Check response: `cached: true`, `cacheAge: <milliseconds>`

**Expected**:
- First request populates cache
- Subsequent identical requests served from cache
- Cache age increases with each cached request

### Test 6: Pagination
**URL**: `/api/products?page=2&limit=50`

**Expected**:
- Returns items 51-100
- Metadata shows page=2, totalPages calculated correctly
- Total count remains consistent

### Test 7: Sorting Options
**Test all sort options**:
- `?sort=name` - Alphabetical
- `?sort=price-asc` - Cheapest first
- `?sort=price-desc` - Most expensive first
- `?sort=stock` - Highest stock first

### Test 8: Invalid Parameters
**URL**: `/api/products?sort=invalid&limit=999&page=-1`

**Expected**:
- Invalid sort defaults to 'name'
- Invalid limit defaults to 50
- Invalid page defaults to 1
- No errors, uses defaults gracefully

### Test 9: Empty Results
**URL**: `/api/products?brand=NONEXISTENT`

**Expected**:
- Returns empty products array
- Metadata shows total: 0, totalPages: 0
- No errors

### Test 10: Available Filters
**URL**: `/api/products`

**Expected**:
- Returns all available filter options
- Brands, categories, models, sizes are populated
- Useful for building dynamic filter UI

## Performance Benchmarks

### Without Cache
- First request: ~200-500ms (database query)
- Concurrent requests: ~300-800ms

### With Cache
- Cached requests: ~5-20ms (90%+ faster)
- Cache hit rate target: >60% for common filters

### Cache Warming
- Common filters pre-cached: FIRESTONE, GOODYEAR, popular sizes
- Reduces initial load time for popular queries

## Error Handling

### Database Errors
- Returns 500 status with error message
- Logs error details to console
- Maintains API contract (returns empty array)

### Validation Errors
- Invalid parameters fallback to defaults
- No 400 errors, graceful degradation
- Warnings logged for debugging

## Cache Management

### Cache Invalidation
When products are updated:
```javascript
apiCache.invalidate({ selectedBrand: 'FIRESTONE' })
```

### Cache Statistics
```javascript
const stats = apiCache.getStats()
// { hits: 120, misses: 30, hitRate: 0.8, size: 45, evictions: 2 }
```

### Cache Warming
```javascript
await warmCache(fetchFunction)
// Pre-loads common filter combinations
```

## API Usage Examples

### Basic Product List
```bash
curl "http://localhost:3000/api/products"
```

### Filtered by Brand and Category
```bash
curl "http://localhost:3000/api/products?brand=FIRESTONE&category=AUTO"
```

### Search with Sorting
```bash
curl "http://localhost:3000/api/products?search=wrangler&sort=price-asc"
```

### Tire Size Search
```bash
curl "http://localhost:3000/api/products?size=205/55R16"
```

### Pagination with Filters
```bash
curl "http://localhost:3000/api/products?brand=GOODYEAR&page=2&limit=25"
```

## Notes

1. All URL parameters are optional
2. Default values ensure API always returns valid response
3. Cache automatically manages memory with LRU eviction
4. Response includes all data needed for UI (products + filter options)
5. Type-safe throughout with TypeScript
6. Validation ensures data integrity
7. Performance optimized with parallel queries and caching
