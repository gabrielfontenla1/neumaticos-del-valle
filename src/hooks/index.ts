/**
 * Custom React Hooks
 *
 * Centralized export for all custom hooks used in the application.
 */

// Product filter hooks - URL synchronization
export { useURLFilters, isFilterKey, getFilterFromURL } from './useURLFilters'

// Product filter hooks - Persistence
export {
  useFilterPersistence,
  formatPresetName,
  getMostUsedPresets,
  getRecentPresets,
} from './useFilterPersistence'

// Re-export types (interfaces need to be imported from their respective files)
export type {
  UseURLFiltersOptions,
  UseURLFiltersReturn,
} from './useURLFilters'

export type {
  UseFilterPersistenceOptions,
  UseFilterPersistenceReturn,
  FilterPreset,
  RecentFilter,
} from './useFilterPersistence'
