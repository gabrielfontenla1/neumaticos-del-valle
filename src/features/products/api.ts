import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Product, ProductFilters, ImportRow } from './types'

// Obtener productos con filtros y paginación
export async function getProducts(
  filters: ProductFilters = {},
  page = 1,
  limit = 20
) {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    if (filters.brand) {
      query = query.eq('brand', filters.brand)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.width) {
      query = query.eq('width', filters.width)
    }
    if (filters.profile) {
      query = query.eq('profile', filters.profile)
    }
    if (filters.diameter) {
      query = query.eq('diameter', filters.diameter)
    }
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }
    if (filters.inStock) {
      // Try with 'stock' field (it might be 'stock' instead of 'stock_quantity' in the DB)
      query = query.gt('stock', 0)
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query
      .range(from, to)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    // Ensure stock field exists (handle both 'stock' and 'stock_quantity' fields)
    const mappedData = data?.map((product: any) => ({
      ...product,
      stock: product.stock || product.stock_quantity || 0
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
    console.error('Error details:', JSON.stringify(error, null, 2))
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

    if (error) throw error

    // Ensure stock field exists (handle both 'stock' and 'stock_quantity' fields)
    if (data) {
      const mappedProduct = {
        ...data,
        stock: data.stock || data.stock_quantity || 0
      }
      return mappedProduct as Product
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Obtener marcas únicas
export async function getBrands() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .order('brand')

    if (error) throw error

    const brandsData = data as any[]
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
      .order('category')

    if (error) throw error

    const categoriesData = data as any[]
    const uniqueCategories = [...new Set(categoriesData?.map(p => p.category) || [])]
    return uniqueCategories.filter(Boolean)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Obtener medidas únicas
export async function getSizes() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('width, profile, diameter')
      .not('width', 'is', null)
      .order('width')
      .order('profile')
      .order('diameter')

    if (error) throw error

    const sizesData = data as any[]
    const uniqueSizes = sizesData?.reduce((acc: any[], product) => {
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
    }, []) || []

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
      .ilike('name', `%${query}%`)
      .limit(limit)

    if (error) throw error
    return data as any[]
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
      .gt('stock', 0)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) throw error

    // Ensure stock field exists (handle both 'stock' and 'stock_quantity' fields)
    const mappedData = data?.map((product: any) => ({
      ...product,
      stock: product.stock || product.stock_quantity || 0
    })) || []

    return mappedData as Product[]
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}