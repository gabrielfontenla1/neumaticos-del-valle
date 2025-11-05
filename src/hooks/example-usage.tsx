/**
 * Example Component: Product Filter Controls
 *
 * This is a complete example showing how to use both useURLFilters
 * and useFilterPersistence hooks together.
 *
 * Features demonstrated:
 * - URL-synchronized filter state
 * - Auto-save to session storage
 * - Filter presets (save/load/delete)
 * - Recent filters history
 * - Cross-tab synchronization
 * - Clear all filters
 */

'use client'

import { useEffect, useState } from 'react'
import { useURLFilters } from './useURLFilters'
import { useFilterPersistence } from './useFilterPersistence'

export function ProductFilterControls() {
  // URL-synchronized filter state
  const {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    isLoading,
    hasActiveFilters,
    activeFilterCount,
  } = useURLFilters({
    // Optional: Custom debounce for better UX
    debounceMs: 300,

    // Optional: Replace history for search to avoid clutter
    replaceHistory: true,

    // Optional: Track filter changes
    onFiltersChange: (newFilters) => {
      console.log('Filters changed:', newFilters)
    },

    // Optional: Handle errors
    onError: (error) => {
      console.error('Filter error:', error)
    },
  })

  // Persistence layer for presets and recent filters
  const {
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    presets,
    recentFilters,
    saveToSession,
  } = useFilterPersistence({
    // Optional: Enable cross-tab sync
    enableSync: true,

    // Optional: Handle sync from other tabs
    onSync: (syncedFilters) => {
      console.log('Synced from another tab:', syncedFilters)
      updateFilters(syncedFilters)
    },

    // Optional: Restore session after crash
    onSessionRecover: (recoveredFilters) => {
      console.log('Session recovered:', recoveredFilters)
      // Optionally ask user if they want to restore
      if (window.confirm('Restore previous filter session?')) {
        updateFilters(recoveredFilters)
      }
    },
  })

  // State for preset name input
  const [presetName, setPresetName] = useState('')

  // Auto-save to session storage on filter change
  useEffect(() => {
    if (!isLoading) {
      saveToSession(filters)
    }
  }, [filters, isLoading, saveToSession])

  // Handle save preset
  const handleSavePreset = () => {
    if (presetName.trim()) {
      saveFilterPreset(presetName, filters)
      setPresetName('')
      alert(`Preset "${presetName}" saved!`)
    }
  }

  // Handle load preset
  const handleLoadPreset = (presetId: string) => {
    const presetFilters = loadFilterPreset(presetId)
    if (presetFilters) {
      updateFilters(presetFilters)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading filters...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Filter Controls */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Product Filters</h2>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            placeholder="Search products..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Brand Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <select
            value={filters.selectedBrand}
            onChange={(e) => updateFilter('selectedBrand', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="all">All Brands</option>
            <option value="michelin">Michelin</option>
            <option value="bridgestone">Bridgestone</option>
            <option value="goodyear">Goodyear</option>
            <option value="pirelli">Pirelli</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={filters.selectedCategory}
            onChange={(e) => updateFilter('selectedCategory', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="passenger">Passenger</option>
            <option value="suv">SUV</option>
            <option value="truck">Truck</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="name">Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock">In Stock</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear All Filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Save Preset */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Save Current Filters</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Save
          </button>
        </div>
      </div>

      {/* Saved Presets */}
      {presets.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Saved Presets</h3>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <div className="flex-1">
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-gray-600">
                    Used {preset.usageCount} times •{' '}
                    {new Date(preset.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoadPreset(preset.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete preset "${preset.name}"?`
                        )
                      ) {
                        deleteFilterPreset(preset.id)
                      }
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Filters */}
      {recentFilters.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Recent Searches</h3>
          <div className="space-y-2">
            {recentFilters.slice(0, 5).map((recent, index) => (
              <button
                key={index}
                onClick={() => updateFilters(recent.filters)}
                className="w-full text-left bg-gray-50 p-3 rounded hover:bg-gray-100"
              >
                <p className="text-sm text-gray-600">
                  {new Date(recent.timestamp).toLocaleString()}
                </p>
                <p className="text-sm">
                  {/* Display a summary of the filters */}
                  {recent.filters.searchTerm && (
                    <span className="mr-2">
                      Search: "{recent.filters.searchTerm}"
                    </span>
                  )}
                  {recent.filters.selectedBrand !== 'all' && (
                    <span className="mr-2">
                      Brand: {recent.filters.selectedBrand}
                    </span>
                  )}
                  {recent.filters.selectedCategory !== 'all' && (
                    <span className="mr-2">
                      Category: {recent.filters.selectedCategory}
                    </span>
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="border-t pt-4 text-xs text-gray-500">
        <details>
          <summary className="cursor-pointer font-medium">
            Current Filter State (Debug)
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(filters, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

/**
 * Server Component Example
 *
 * Shows how to read filters on the server side
 */
export async function ServerSideFiltersExample({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Import utilities for server-side
  const { getFiltersFromSearchParams } = await import('@/lib/products/url-filters')

  // Convert searchParams to URLSearchParams
  const urlSearchParams = new URLSearchParams()
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      urlSearchParams.set(key, Array.isArray(value) ? value[0] : value)
    }
  })

  // Get filters from URL
  const filters = getFiltersFromSearchParams(urlSearchParams as any)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Server-Side Filters</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  )
}
