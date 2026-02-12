import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import {
  Product,
  ProductFilters,
  ImportRow,
  DBProductRaw,
  DBBrandRow,
  DBCategoryRow,
  DBModelRow,
  DBSizeRow,
  SizeOption,
  ProductSearchResult
} from './types'

/**
 * Applies sorting to the query based on sort option
 * Uses generic type inference to maintain query builder compatibility
 */
function applySorting<Q extends { order: (column: string, options?: { ascending?: boolean }) => Q }>(
  query: Q,
  sortBy: string = 'name'
): Q {
  switch (sortBy) {
    case 'name':
      return query.order('name', { ascending: true })
    case 'price-asc':
      return query.order('price', { ascending: true })
    case 'price-desc':
      return query.order('price', { ascending: false })
    case 'stock':
      return query.order('stock', { ascending: false })
    default:
      return query.order('name', { ascending: true })
  }
}

/**
 * Obtener productos con filtros, paginación y ordenamiento
 */
export async function getProducts(
  filters: ProductFilters = {},
  page = 1,
  limit = 20,
  sortBy = 'name'
) {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Excluir motos del catálogo público
    query = query.neq('category', 'moto')

    // Aplicar filtros
    if (filters.search) {
      // Search in name, brand, and model fields
      query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
    }
    if (filters.brand) {
      query = query.eq('brand', filters.brand)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.model) {
      query = query.eq('model', filters.model)
    }
    if (filters.width) {
      query = query.eq('width', filters.width)
    }
    if (filters.profile) {
      query = query.eq('aspect_ratio', filters.profile)
    }
    if (filters.diameter) {
      query = query.eq('rim_diameter', filters.diameter)
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }
    if (filters.inStock) {
      query = query.gt('stock', 0)
    }

    // Apply sorting
    query = applySorting(query, sortBy)

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // Ensure stock field exists (handle both 'stock' and 'stock_quantity' fields)
    const mappedData = (data as DBProductRaw[] | null)?.map((product) => ({
      ...product,
      stock: product.stock ?? product.stock_quantity ?? 0
    })) || []

    return {
      data: mappedData as Product[],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
      error
    }
  }
}

// Obtener producto por ID
export async function getProductById(id: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ [getProductById] Error de BD:', error)
      throw error
    }

    // Ensure stock field exists (handle both 'stock' and 'stock_quantity' fields)
    if (data) {
      const productData = data as DBProductRaw
      const mappedProduct: Product = {
        ...productData,
        stock: productData.stock ?? productData.stock_quantity ?? 0
      }
      return mappedProduct
    }

    console.warn('🔍 [getProductById] No data returned pero tampoco error')
    return null
  } catch (error) {
    console.error('❌ [getProductById] Error fetching product:', error)
    return null
  }
}

// Obtener producto por slug (con fallback a UUID para backward compat)
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // Try by slug first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (data) {
      const productData = data as DBProductRaw
      return {
        ...productData,
        stock: productData.stock ?? productData.stock_quantity ?? 0
      }
    }

    // Fallback: if the param looks like a UUID, search by id
    if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/)) {
      return getProductById(slug)
    }

    return null
  } catch {
    // single() throws when 0 rows matched — try UUID fallback
    if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/)) {
      return getProductById(slug)
    }
    return null
  }
}

// Obtener marcas únicas
export async function getBrands() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .neq('category', 'moto')
      .order('brand')

    if (error) throw error

    const brandsData = data as DBBrandRow[] | null
    const uniqueBrands = [...new Set(brandsData?.map(p => p.brand) || [])]
    return uniqueBrands.filter(Boolean)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return []
  }
}

// Obtener categorías únicas
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .neq('category', 'moto')
      .order('category')

    if (error) throw error

    const categoriesData = data as DBCategoryRow[] | null
    const uniqueCategories = [...new Set(categoriesData?.map(p => p.category) || [])]
    return uniqueCategories.filter(Boolean)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Obtener modelos únicos
export async function getModels() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('model')
      .neq('category', 'moto')
      .order('model')

    if (error) throw error

    const modelsData = data as DBModelRow[] | null
    const uniqueModels = [...new Set(modelsData?.map(p => p.model) || [])]
    return uniqueModels.filter(Boolean)
  } catch (error) {
    console.error('Error fetching models:', error)
    return []
  }
}

// Obtener medidas únicas
export async function getSizes() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('width, aspect_ratio, rim_diameter')
      .neq('category', 'moto')
      .not('width', 'is', null)
      .order('width')
      .order('aspect_ratio')
      .order('rim_diameter')

    if (error) throw error

    // Map DB fields (aspect_ratio, rim_diameter) to interface fields (profile, diameter)
    const rawData = data as Array<{ width: number | null; aspect_ratio: number | null; rim_diameter: number | null }> | null
    const sizesData: DBSizeRow[] = rawData?.map(row => ({
      width: row.width,
      profile: row.aspect_ratio,
      diameter: row.rim_diameter
    })) || []

    const uniqueSizes = sizesData.reduce((acc: SizeOption[], product) => {
      if (product.width && product.profile && product.diameter) {
        const size = `${product.width}/${product.profile}R${product.diameter}`
        if (!acc.some(s => s.display === size)) {
          acc.push({
            display: size,
            width: product.width,
            profile: product.profile,
            diameter: product.diameter
          })
        }
      }
      return acc
    }, [])

    return uniqueSizes
  } catch (error) {
    console.error('Error fetching sizes:', error)
    return []
  }
}

import {
  normalizeExcelRow,
  convertToProduct,
  parseTireSize,
  determineCategory,
  cleanDescription,
  processStockBySucursal
} from './utils/importHelpers'

// Importar productos desde Excel/CSV
export async function importProducts(rows: ImportRow[], deleteExisting = false) {
  try {
    // Llamar al nuevo endpoint API que usa service role key
    const response = await fetch('/api/admin/import-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(deleteExisting ? { 'X-Delete-Existing': 'true' } : {})
      },
      body: JSON.stringify({ products: rows })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error al importar productos')
    }

    return result
  } catch (error) {
    console.error('Error importing products:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Buscar productos (para autocomplete)
export async function searchProducts(query: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, brand, size, price')
      .neq('category', 'moto')
      .ilike('name', `%${query}%`)
      .limit(limit)

    if (error) throw error
    return (data as ProductSearchResult[] | null) || []
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

// Productos destacados
export async function getFeaturedProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .neq('category', 'moto')
      .gt('stock', 0)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) throw error

    // Ensure stock field exists (handle both 'stock' and 'stock_quantity' fields)
    const mappedData = (data as DBProductRaw[] | null)?.map((product) => ({
      ...product,
      stock: product.stock ?? product.stock_quantity ?? 0
    })) || []

    return mappedData as Product[]
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}