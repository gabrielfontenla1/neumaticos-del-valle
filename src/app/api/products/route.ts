import { NextResponse } from 'next/server'
import { getProducts, getBrands, getCategories, getModels, getSizes } from '@/features/products/api'
import { apiCache, type APIResponse } from '@/lib/products/api-cache'
import type { FilterState } from '@/lib/products/filter-types'
import {
  validateSortOption,
  validateItemsPerPage,
  validatePageNumber,
  validateFilterValue,
  validateTireSize,
} from '@/lib/products/filter-types'
import { parseTireSize } from '@/lib/products/url-filters'

/**
 * Parses and validates URL parameters into filter state
 */
function parseFiltersFromURL(searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {}

  // Text search
  const search = searchParams.get('search')
  if (search) {
    filters.searchTerm = search.trim()
  }

  // Basic filters
  const brand = searchParams.get('brand')
  if (brand) {
    filters.selectedBrand = validateFilterValue(brand)
  }

  const category = searchParams.get('category')
  if (category) {
    filters.selectedCategory = validateFilterValue(category)
  }

  const model = searchParams.get('model')
  if (model) {
    filters.selectedModel = validateFilterValue(model)
  }

  // Tire size filters
  const width = searchParams.get('width')
  if (width) {
    filters.selectedWidth = validateFilterValue(width)
  }

  const profile = searchParams.get('profile')
  if (profile) {
    filters.selectedProfile = validateFilterValue(profile)
  }

  const diameter = searchParams.get('diameter')
  if (diameter) {
    filters.selectedDiameter = validateFilterValue(diameter)
  }

  // Size search (e.g., "205/55R16")
  const sizeSearch = searchParams.get('size')
  if (sizeSearch) {
    const validation = validateTireSize(sizeSearch)
    if (validation.isValid) {
      filters.sizeSearchTerm = validation.value

      // Parse tire size and set individual filters
      const parsed = parseTireSize(validation.value)
      if (parsed) {
        filters.selectedWidth = parsed.width
        filters.selectedProfile = parsed.profile
        filters.selectedDiameter = parsed.diameter
      }
    }
  }

  // Sorting
  const sort = searchParams.get('sort')
  if (sort) {
    const validation = validateSortOption(sort)
    filters.sortBy = validation.value
  }

  // Pagination
  const page = searchParams.get('page')
  if (page) {
    const pageNum = parseInt(page, 10)
    if (!isNaN(pageNum)) {
      const validation = validatePageNumber(pageNum)
      filters.currentPage = validation.value
    }
  }

  const limit = searchParams.get('limit')
  if (limit) {
    const limitNum = parseInt(limit, 10)
    if (!isNaN(limitNum)) {
      const validation = validateItemsPerPage(limitNum)
      filters.itemsPerPage = validation.value
    }
  }

  return filters
}

/**
 * Fetches available filter options based on current filters
 * Used for dependent dropdowns
 */
async function getAvailableFilters() {
  try {
    const [brands, categories, models, sizes] = await Promise.all([
      getBrands(),
      getCategories(),
      getModels(),
      getSizes(),
    ])

    const widths = [...new Set(sizes.map(s => s.width))].filter(Boolean).sort()
    const profiles = [...new Set(sizes.map(s => s.profile))].filter(Boolean).sort()
    const diameters = [...new Set(sizes.map(s => s.diameter))].filter(Boolean).sort()

    return {
      brands,
      categories,
      models,
      widths: widths.map(String),
      profiles: profiles.map(String),
      diameters: diameters.map(String),
    }
  } catch (error) {
    console.error('Error fetching available filters:', error)
    return {
      brands: [],
      categories: [],
      models: [],
      widths: [],
      profiles: [],
      diameters: [],
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate filters
    const filters = parseFiltersFromURL(searchParams)

    // Set defaults
    const page = filters.currentPage || 1
    const limit = filters.itemsPerPage || 50
    const sortBy = filters.sortBy || 'name'

    // Generate cache key
    const cacheKey = apiCache.generateKey(filters)

    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build database filters from URL filters
    const dbFilters: any = {}

    if (filters.searchTerm) {
      dbFilters.search = filters.searchTerm
    }

    if (filters.selectedBrand && filters.selectedBrand !== 'all') {
      dbFilters.brand = filters.selectedBrand
    }

    if (filters.selectedCategory && filters.selectedCategory !== 'all') {
      dbFilters.category = filters.selectedCategory
    }

    if (filters.selectedModel && filters.selectedModel !== 'all') {
      dbFilters.model = filters.selectedModel
    }

    if (filters.selectedWidth && filters.selectedWidth !== 'all') {
      dbFilters.width = parseInt(filters.selectedWidth, 10)
    }

    if (filters.selectedProfile && filters.selectedProfile !== 'all') {
      dbFilters.profile = parseInt(filters.selectedProfile, 10)
    }

    if (filters.selectedDiameter && filters.selectedDiameter !== 'all') {
      dbFilters.diameter = parseInt(filters.selectedDiameter, 10)
    }

    // Fetch products with filters
    const { data: products = [], total = 0, totalPages = 0, error } = await getProducts(
      dbFilters,
      page,
      limit,
      sortBy
    )

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Fetch available filter options (in parallel for performance)
    const availableFilters = await getAvailableFilters()

    // Build response
    const response: APIResponse = {
      products,
      metadata: {
        total,
        page,
        totalPages,
        itemsPerPage: limit,
        appliedFilters: filters as FilterState,
        availableFilters,
        cached: false,
      },
    }

    // Cache the response
    apiCache.set(cacheKey, response, filters)

    return NextResponse.json(response)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}