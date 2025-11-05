/**
 * Example usage and tests for URL filter utilities
 * This file demonstrates how to use the URL filter system
 */

import {
  serializeFiltersToURL,
  deserializeFiltersFromURL,
  buildFilterURL,
  parseTireSize,
  formatTireSize,
  updateURLParam,
  clearAllFilters,
  generateShareableURL,
  areFiltersEqual,
  mergeFilterState,
} from '../url-filters'

import {
  DEFAULT_FILTER_STATE,
  hasActiveFilters,
  countActiveFilters,
  validateSortOption,
  validateItemsPerPage,
  validatePageNumber,
  validateTireSize,
} from '../filter-types'

import type { FilterState } from '../filter-types'

// ============================================================================
// Example 1: Serialize filters to URL
// ============================================================================

console.log('\n=== Example 1: Serialize Filters to URL ===\n')

const exampleState: FilterState = {
  searchTerm: '',
  selectedBrand: 'Michelin',
  selectedCategory: 'summer',
  selectedModel: 'all',
  selectedWidth: '205',
  selectedProfile: '55',
  selectedDiameter: '16',
  sizeSearchTerm: '',
  sortBy: 'price-asc',
  currentPage: 1,
  itemsPerPage: 50,
}

const urlParams = serializeFiltersToURL(exampleState)
console.log('URL Parameters:', urlParams.toString())
// Output: brand=Michelin&category=summer&width=205&profile=55&diameter=16&sort=price-asc

// ============================================================================
// Example 2: Deserialize URL to filters
// ============================================================================

console.log('\n=== Example 2: Deserialize URL to Filters ===\n')

const exampleURL = new URLSearchParams('brand=Michelin&category=summer&width=205&profile=55&diameter=16&sort=price-asc&page=2')
const deserializedState = deserializeFiltersFromURL(exampleURL)
console.log('Deserialized State:', JSON.stringify(deserializedState, null, 2))

// ============================================================================
// Example 3: Build complete URL
// ============================================================================

console.log('\n=== Example 3: Build Complete URL ===\n')

const fullURL = buildFilterURL(exampleState)
console.log('Full URL:', fullURL)
// Output: /productos?brand=Michelin&category=summer&width=205&profile=55&diameter=16&sort=price-asc

// ============================================================================
// Example 4: Parse tire size
// ============================================================================

console.log('\n=== Example 4: Parse Tire Size ===\n')

const sizeFormats = ['205/55R16', '205/55/16', '205-55-16']
sizeFormats.forEach(format => {
  const parsed = parseTireSize(format)
  console.log(`${format} ->`, parsed)
})

// ============================================================================
// Example 5: Format tire size
// ============================================================================

console.log('\n=== Example 5: Format Tire Size ===\n')

const formatted = formatTireSize('205', '55', '16')
console.log('Formatted size:', formatted)
// Output: 205/55R16

// ============================================================================
// Example 6: Update single parameter
// ============================================================================

console.log('\n=== Example 6: Update Single Parameter ===\n')

const currentParams = new URLSearchParams('brand=Michelin&page=2')
const updatedParams = updateURLParam(currentParams, 'selectedCategory', 'winter')
console.log('Original:', currentParams.toString())
console.log('Updated:', updatedParams.toString())
// Note: page resets to 1 when changing filters

// ============================================================================
// Example 7: Clear all filters
// ============================================================================

console.log('\n=== Example 7: Clear All Filters ===\n')

const clearedParams = clearAllFilters()
console.log('Cleared params:', clearedParams.toString())
// Output: (empty string)

// ============================================================================
// Example 8: Check active filters
// ============================================================================

console.log('\n=== Example 8: Check Active Filters ===\n')

const defaultState = { ...DEFAULT_FILTER_STATE }
const filteredState = { ...DEFAULT_FILTER_STATE, selectedBrand: 'Michelin' }

console.log('Default state has active filters:', hasActiveFilters(defaultState))
// Output: false

console.log('Filtered state has active filters:', hasActiveFilters(filteredState))
// Output: true

console.log('Active filter count:', countActiveFilters(filteredState))
// Output: 1

// ============================================================================
// Example 9: Validation
// ============================================================================

console.log('\n=== Example 9: Validation ===\n')

// Valid sort option
const validSort = validateSortOption('price-asc')
console.log('Valid sort:', validSort)
// { isValid: true, value: 'price-asc' }

// Invalid sort option
const invalidSort = validateSortOption('invalid')
console.log('Invalid sort:', invalidSort)
// { isValid: false, value: 'name', error: '...' }

// Valid items per page
const validLimit = validateItemsPerPage(50)
console.log('Valid limit:', validLimit)
// { isValid: true, value: 50 }

// Invalid items per page
const invalidLimit = validateItemsPerPage(75)
console.log('Invalid limit:', invalidLimit)
// { isValid: false, value: 50, error: '...' }

// Valid page number
const validPage = validatePageNumber(5)
console.log('Valid page:', validPage)
// { isValid: true, value: 5 }

// Invalid page number
const invalidPage = validatePageNumber(-1)
console.log('Invalid page:', invalidPage)
// { isValid: false, value: 1, error: '...' }

// Valid tire size
const validSize = validateTireSize('205/55R16')
console.log('Valid size:', validSize)
// { isValid: true, value: '205/55R16' }

// Invalid tire size
const invalidSize = validateTireSize('invalid')
console.log('Invalid size:', invalidSize)
// { isValid: false, value: '', error: '...' }

// ============================================================================
// Example 10: Compare filter states
// ============================================================================

console.log('\n=== Example 10: Compare Filter States ===\n')

const state1: FilterState = { ...DEFAULT_FILTER_STATE }
const state2: FilterState = { ...DEFAULT_FILTER_STATE }
const state3: FilterState = { ...DEFAULT_FILTER_STATE, selectedBrand: 'Michelin' }

console.log('state1 equals state2:', areFiltersEqual(state1, state2))
// Output: true

console.log('state1 equals state3:', areFiltersEqual(state1, state3))
// Output: false

// ============================================================================
// Example 11: Merge filter state
// ============================================================================

console.log('\n=== Example 11: Merge Filter State ===\n')

const currentState: FilterState = {
  ...DEFAULT_FILTER_STATE,
  selectedBrand: 'Michelin',
  currentPage: 3,
}

const mergedState = mergeFilterState(currentState, {
  selectedCategory: 'winter',
  // Note: currentPage automatically resets to 1
})

console.log('Current page before merge:', currentState.currentPage)
console.log('Current page after merge:', mergedState.currentPage)
console.log('Category after merge:', mergedState.selectedCategory)
console.log('Brand preserved:', mergedState.selectedBrand)

// ============================================================================
// Example 12: Real-world usage scenario
// ============================================================================

console.log('\n=== Example 12: Real-World Usage Scenario ===\n')

// Simulating a user journey:

// 1. User lands on /productos
let state = { ...DEFAULT_FILTER_STATE }
console.log('Initial URL:', buildFilterURL(state))

// 2. User selects Michelin brand
state = mergeFilterState(state, { selectedBrand: 'Michelin' })
console.log('After brand selection:', buildFilterURL(state))

// 3. User searches for tire size 205/55R16
const sizeComponents = parseTireSize('205/55R16')
if (sizeComponents) {
  state = mergeFilterState(state, {
    selectedWidth: sizeComponents.width,
    selectedProfile: sizeComponents.profile,
    selectedDiameter: sizeComponents.diameter,
  })
}
console.log('After size search:', buildFilterURL(state))

// 4. User sorts by price ascending
state = mergeFilterState(state, { sortBy: 'price-asc' })
console.log('After sorting:', buildFilterURL(state))

// 5. User goes to page 2
state = mergeFilterState(state, { currentPage: 2 })
console.log('After pagination:', buildFilterURL(state))

// 6. User wants to share this URL
const shareableURL = generateShareableURL(state)
console.log('Shareable URL:', shareableURL)

// 7. Another user receives the shared URL and loads the page
const sharedParams = new URLSearchParams(shareableURL.split('?')[1] || '')
const loadedState = deserializeFiltersFromURL(sharedParams)
console.log('Loaded state matches:', areFiltersEqual(state, loadedState))

// 8. User clears all filters
state = { ...DEFAULT_FILTER_STATE }
console.log('After clearing:', buildFilterURL(state))

console.log('\n=== All Examples Complete ===\n')

// Export for potential use in tests
export {
  exampleState,
  deserializedState,
  sizeFormats,
}
