/**
 * URL Filter Serialization System
 * Handles conversion between filter state and URL parameters
 * for the products page filtering system
 */

import type {
  FilterState,
  SortOption,
  ItemsPerPageOption,
} from './filter-types'

import {
  DEFAULT_FILTER_STATE,
  URL_PARAM_KEYS,
  validateSortOption,
  validateItemsPerPage,
  validatePageNumber,
  validateTireSize,
  validateFilterValue,
} from './filter-types'

/**
 * Serializes filter state to URL search parameters
 * Omits default values to keep URLs clean
 */
export function serializeFiltersToURL(state: FilterState): URLSearchParams {
  const params = new URLSearchParams()

  // Text search
  if (state.searchTerm && state.searchTerm !== DEFAULT_FILTER_STATE.searchTerm) {
    params.set(URL_PARAM_KEYS.searchTerm, state.searchTerm)
  }

  // Basic filters (only add if not "all")
  if (state.selectedBrand && state.selectedBrand !== 'all') {
    params.set(URL_PARAM_KEYS.selectedBrand, state.selectedBrand)
  }

  if (state.selectedCategory && state.selectedCategory !== 'all') {
    params.set(URL_PARAM_KEYS.selectedCategory, state.selectedCategory)
  }

  if (state.selectedModel && state.selectedModel !== 'all') {
    params.set(URL_PARAM_KEYS.selectedModel, state.selectedModel)
  }

  // Tire size filters (only add if not "all")
  if (state.selectedWidth && state.selectedWidth !== 'all') {
    params.set(URL_PARAM_KEYS.selectedWidth, state.selectedWidth)
  }

  if (state.selectedProfile && state.selectedProfile !== 'all') {
    params.set(URL_PARAM_KEYS.selectedProfile, state.selectedProfile)
  }

  if (state.selectedDiameter && state.selectedDiameter !== 'all') {
    params.set(URL_PARAM_KEYS.selectedDiameter, state.selectedDiameter)
  }

  // Size search term (e.g., "205/55R16")
  if (state.sizeSearchTerm && state.sizeSearchTerm !== DEFAULT_FILTER_STATE.sizeSearchTerm) {
    params.set(URL_PARAM_KEYS.sizeSearchTerm, state.sizeSearchTerm)
  }

  // Sorting (only add if not default)
  if (state.sortBy && state.sortBy !== DEFAULT_FILTER_STATE.sortBy) {
    params.set(URL_PARAM_KEYS.sortBy, state.sortBy)
  }

  // Pagination (only add if not default)
  if (state.currentPage && state.currentPage !== DEFAULT_FILTER_STATE.currentPage) {
    params.set(URL_PARAM_KEYS.currentPage, state.currentPage.toString())
  }

  if (state.itemsPerPage && state.itemsPerPage !== DEFAULT_FILTER_STATE.itemsPerPage) {
    params.set(URL_PARAM_KEYS.itemsPerPage, state.itemsPerPage.toString())
  }

  return params
}

/**
 * Deserializes URL search parameters to filter state
 * Validates all parameters and uses defaults for invalid values
 */
export function deserializeFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const state: FilterState = { ...DEFAULT_FILTER_STATE }

  // Text search
  const searchTerm = searchParams.get(URL_PARAM_KEYS.searchTerm)
  if (searchTerm !== null) {
    state.searchTerm = searchTerm.trim()
  }

  // Basic filters
  state.selectedBrand = validateFilterValue(
    searchParams.get(URL_PARAM_KEYS.selectedBrand)
  )

  state.selectedCategory = validateFilterValue(
    searchParams.get(URL_PARAM_KEYS.selectedCategory)
  )

  state.selectedModel = validateFilterValue(
    searchParams.get(URL_PARAM_KEYS.selectedModel)
  )

  // Tire size filters
  state.selectedWidth = validateFilterValue(
    searchParams.get(URL_PARAM_KEYS.selectedWidth)
  )

  state.selectedProfile = validateFilterValue(
    searchParams.get(URL_PARAM_KEYS.selectedProfile)
  )

  state.selectedDiameter = validateFilterValue(
    searchParams.get(URL_PARAM_KEYS.selectedDiameter)
  )

  // Size search term with validation
  const sizeSearchTerm = searchParams.get(URL_PARAM_KEYS.sizeSearchTerm)
  if (sizeSearchTerm !== null) {
    const validation = validateTireSize(sizeSearchTerm)
    state.sizeSearchTerm = validation.value
    if (!validation.isValid && validation.error) {
      console.warn(validation.error)
    }
  }

  // Sort option with validation
  const sortBy = searchParams.get(URL_PARAM_KEYS.sortBy)
  if (sortBy !== null) {
    const validation = validateSortOption(sortBy)
    state.sortBy = validation.value
    if (!validation.isValid && validation.error) {
      console.warn(validation.error)
    }
  }

  // Page number with validation
  const pageParam = searchParams.get(URL_PARAM_KEYS.currentPage)
  if (pageParam !== null) {
    const pageNum = parseInt(pageParam, 10)
    if (!isNaN(pageNum)) {
      const validation = validatePageNumber(pageNum)
      state.currentPage = validation.value
      if (!validation.isValid && validation.error) {
        console.warn(validation.error)
      }
    }
  }

  // Items per page with validation
  const limitParam = searchParams.get(URL_PARAM_KEYS.itemsPerPage)
  if (limitParam !== null) {
    const limitNum = parseInt(limitParam, 10)
    if (!isNaN(limitNum)) {
      const validation = validateItemsPerPage(limitNum)
      state.itemsPerPage = validation.value
      if (!validation.isValid && validation.error) {
        console.warn(validation.error)
      }
    }
  }

  return state
}

/**
 * Updates a single filter parameter in the URL
 * Returns new URLSearchParams with the updated value
 */
export function updateURLParam(
  currentParams: URLSearchParams,
  key: keyof typeof URL_PARAM_KEYS,
  value: string | number
): URLSearchParams {
  const params = new URLSearchParams(currentParams)
  const paramKey = URL_PARAM_KEYS[key]

  // Convert value to string
  const stringValue = String(value)

  // Check if this is a default value and should be removed
  const defaultValue = DEFAULT_FILTER_STATE[key]
  if (
    stringValue === String(defaultValue) ||
    stringValue === 'all' ||
    stringValue === ''
  ) {
    params.delete(paramKey)
  } else {
    params.set(paramKey, stringValue)
  }

  // Always reset page to 1 when changing filters (except page and limit changes)
  if (key !== 'currentPage' && key !== 'itemsPerPage') {
    params.delete(URL_PARAM_KEYS.currentPage)
  }

  return params
}

/**
 * Clears all filters from URL
 * Returns empty URLSearchParams
 */
export function clearAllFilters(): URLSearchParams {
  return new URLSearchParams()
}

/**
 * Builds a filter query string from state
 * Useful for router.push() operations
 */
export function buildFilterURL(state: FilterState, basePath: string = '/productos'): string {
  const params = serializeFiltersToURL(state)
  const queryString = params.toString()

  if (queryString) {
    return `${basePath}?${queryString}`
  }

  return basePath
}

/**
 * Parses a tire size string (e.g., "205/55R16") and returns individual components
 * Returns null if the format is invalid
 */
export function parseTireSize(sizeString: string): {
  width: string
  profile: string
  diameter: string
} | null {
  const validation = validateTireSize(sizeString)

  if (!validation.isValid) {
    return null
  }

  // Match formats: 205/55R16, 205/55/16, 205-55-16
  const match = sizeString.match(/^(\d{3})[-/](\d{2})[-/R]?(\d{2})$/i)

  if (!match) {
    return null
  }

  return {
    width: match[1],
    profile: match[2],
    diameter: match[3],
  }
}

/**
 * Formats tire size components into a display string
 */
export function formatTireSize(
  width: string,
  profile: string,
  diameter: string
): string {
  // Only format if all three values are provided and not "all"
  if (
    width !== 'all' &&
    profile !== 'all' &&
    diameter !== 'all' &&
    width &&
    profile &&
    diameter
  ) {
    return `${width}/${profile}R${diameter}`
  }

  return ''
}

/**
 * Merges new filter values with existing state
 * Useful for partial updates
 */
export function mergeFilterState(
  currentState: FilterState,
  updates: Partial<FilterState>
): FilterState {
  return {
    ...currentState,
    ...updates,
    // Always reset page to 1 when filters change (unless page is explicitly being updated)
    currentPage: updates.currentPage !== undefined ? updates.currentPage : 1,
  }
}

/**
 * Extracts filter state from Next.js ReadonlyURLSearchParams
 * This is the main function to use in Next.js components
 */
export function getFiltersFromSearchParams(
  searchParams: ReadonlyURLSearchParams | null
): FilterState {
  if (!searchParams) {
    return { ...DEFAULT_FILTER_STATE }
  }

  // Convert ReadonlyURLSearchParams to URLSearchParams
  const params = new URLSearchParams()
  searchParams.forEach((value, key) => {
    params.set(key, value)
  })

  return deserializeFiltersFromURL(params)
}

/**
 * Type for Next.js ReadonlyURLSearchParams
 * (Next.js doesn't export this type)
 */
export interface ReadonlyURLSearchParams {
  get(name: string): string | null
  getAll(name: string): string[]
  has(name: string): boolean
  keys(): IterableIterator<string>
  values(): IterableIterator<string>
  entries(): IterableIterator<[string, string]>
  forEach(
    callbackfn: (value: string, key: string, parent: ReadonlyURLSearchParams) => void,
    thisArg?: unknown
  ): void
  [Symbol.iterator](): IterableIterator<[string, string]>
  toString(): string
}

/**
 * Generates a shareable URL for the current filter state
 */
export function generateShareableURL(state: FilterState): string {
  if (typeof window === 'undefined') {
    // Server-side: just return the path
    return buildFilterURL(state)
  }

  // Client-side: return full URL
  const url = new URL(window.location.origin + buildFilterURL(state))
  return url.toString()
}

/**
 * Checks if two filter states are equivalent
 */
export function areFiltersEqual(state1: FilterState, state2: FilterState): boolean {
  return (
    state1.searchTerm === state2.searchTerm &&
    state1.selectedBrand === state2.selectedBrand &&
    state1.selectedCategory === state2.selectedCategory &&
    state1.selectedModel === state2.selectedModel &&
    state1.selectedWidth === state2.selectedWidth &&
    state1.selectedProfile === state2.selectedProfile &&
    state1.selectedDiameter === state2.selectedDiameter &&
    state1.sizeSearchTerm === state2.sizeSearchTerm &&
    state1.sortBy === state2.sortBy &&
    state1.currentPage === state2.currentPage &&
    state1.itemsPerPage === state2.itemsPerPage
  )
}
