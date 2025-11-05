/**
 * Type definitions for product filter system
 * Defines interfaces for filter state, URL parameters, and validation
 */

/**
 * Main filter state interface
 * Represents the complete state of all product filters
 */
export interface FilterState {
  // Text search
  searchTerm: string

  // Basic filters
  selectedBrand: string
  selectedCategory: string
  selectedModel: string

  // Tire size filters
  selectedWidth: string
  selectedProfile: string
  selectedDiameter: string

  // Size search (e.g., "205/55R16")
  sizeSearchTerm: string

  // Sorting and pagination
  sortBy: string
  currentPage: number
  itemsPerPage: number
}

/**
 * URL parameter names
 * Maps filter state keys to URL parameter names
 */
export const URL_PARAM_KEYS = {
  searchTerm: 'search',
  selectedBrand: 'brand',
  selectedCategory: 'category',
  selectedModel: 'model',
  selectedWidth: 'width',
  selectedProfile: 'profile',
  selectedDiameter: 'diameter',
  sizeSearchTerm: 'size',
  sortBy: 'sort',
  currentPage: 'page',
  itemsPerPage: 'limit',
} as const

/**
 * Default filter values
 * Used when URL parameters are missing or invalid
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  searchTerm: '',
  selectedBrand: 'all',
  selectedCategory: 'all',
  selectedModel: 'all',
  selectedWidth: 'all',
  selectedProfile: 'all',
  selectedDiameter: 'all',
  sizeSearchTerm: '',
  sortBy: 'name',
  currentPage: 1,
  itemsPerPage: 50,
}

/**
 * Valid sort options
 */
export const VALID_SORT_OPTIONS = [
  'name',
  'price-asc',
  'price-desc',
  'stock',
] as const

export type SortOption = typeof VALID_SORT_OPTIONS[number]

/**
 * Valid items per page options
 */
export const VALID_ITEMS_PER_PAGE = [10, 25, 50, 100, 500, 1000, 2000] as const

export type ItemsPerPageOption = typeof VALID_ITEMS_PER_PAGE[number]

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  isValid: boolean
  value: T
  error?: string
}

/**
 * Tire size format validation regex
 * Matches formats: 205/55R16, 205/55/16, 205-55-16
 */
export const TIRE_SIZE_REGEX = /^(\d{3})[\/\-](\d{2})[R\/\-]?(\d{2})$/i

/**
 * Validates a sort option
 */
export function validateSortOption(value: string): ValidationResult<SortOption> {
  if (VALID_SORT_OPTIONS.includes(value as SortOption)) {
    return {
      isValid: true,
      value: value as SortOption,
    }
  }

  return {
    isValid: false,
    value: DEFAULT_FILTER_STATE.sortBy as SortOption,
    error: `Invalid sort option: ${value}. Using default.`,
  }
}

/**
 * Validates items per page
 */
export function validateItemsPerPage(value: number): ValidationResult<ItemsPerPageOption> {
  if (VALID_ITEMS_PER_PAGE.includes(value as ItemsPerPageOption)) {
    return {
      isValid: true,
      value: value as ItemsPerPageOption,
    }
  }

  return {
    isValid: false,
    value: DEFAULT_FILTER_STATE.itemsPerPage as ItemsPerPageOption,
    error: `Invalid items per page: ${value}. Using default.`,
  }
}

/**
 * Validates a page number
 */
export function validatePageNumber(value: number): ValidationResult<number> {
  if (value >= 1 && Number.isInteger(value)) {
    return {
      isValid: true,
      value,
    }
  }

  return {
    isValid: false,
    value: DEFAULT_FILTER_STATE.currentPage,
    error: `Invalid page number: ${value}. Using default.`,
  }
}

/**
 * Validates a tire size string
 */
export function validateTireSize(value: string): ValidationResult<string> {
  if (!value) {
    return {
      isValid: true,
      value: '',
    }
  }

  const match = value.match(TIRE_SIZE_REGEX)

  if (match) {
    return {
      isValid: true,
      value: value.trim(),
    }
  }

  return {
    isValid: false,
    value: '',
    error: `Invalid tire size format: ${value}. Expected format: 205/55R16`,
  }
}

/**
 * Validates a filter value (brand, category, model, size components)
 * Returns 'all' for empty or invalid values
 */
export function validateFilterValue(value: string | null | undefined): string {
  if (!value || value.trim() === '' || value === 'all') {
    return 'all'
  }

  return value.trim()
}

/**
 * Checks if a filter state has any active filters
 */
export function hasActiveFilters(state: FilterState): boolean {
  return (
    state.searchTerm !== DEFAULT_FILTER_STATE.searchTerm ||
    state.selectedBrand !== DEFAULT_FILTER_STATE.selectedBrand ||
    state.selectedCategory !== DEFAULT_FILTER_STATE.selectedCategory ||
    state.selectedModel !== DEFAULT_FILTER_STATE.selectedModel ||
    state.selectedWidth !== DEFAULT_FILTER_STATE.selectedWidth ||
    state.selectedProfile !== DEFAULT_FILTER_STATE.selectedProfile ||
    state.selectedDiameter !== DEFAULT_FILTER_STATE.selectedDiameter ||
    state.sizeSearchTerm !== DEFAULT_FILTER_STATE.sizeSearchTerm
  )
}

/**
 * Counts the number of active filters
 */
export function countActiveFilters(state: FilterState): number {
  let count = 0

  if (state.searchTerm !== DEFAULT_FILTER_STATE.searchTerm) count++
  if (state.selectedBrand !== DEFAULT_FILTER_STATE.selectedBrand) count++
  if (state.selectedCategory !== DEFAULT_FILTER_STATE.selectedCategory) count++
  if (state.selectedModel !== DEFAULT_FILTER_STATE.selectedModel) count++
  if (state.selectedWidth !== DEFAULT_FILTER_STATE.selectedWidth) count++
  if (state.selectedProfile !== DEFAULT_FILTER_STATE.selectedProfile) count++
  if (state.selectedDiameter !== DEFAULT_FILTER_STATE.selectedDiameter) count++
  if (state.sizeSearchTerm !== DEFAULT_FILTER_STATE.sizeSearchTerm) count++

  return count
}
