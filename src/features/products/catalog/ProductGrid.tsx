'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product, ProductFilters } from '../types'
import { getProducts, getBrands, getCategories, getSizes } from '../api'
import ProductCard from './ProductCard'

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filtros
  const [filters, setFilters] = useState<ProductFilters>(() => {
    // Cargar filtros de sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('productFilters')
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // Opciones para filtros
  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [sizes, setSizes] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Cargar opciones de filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      const [brandsData, categoriesData, sizesData] = await Promise.all([
        getBrands(),
        getCategories(),
        getSizes()
      ])
      setBrands(brandsData)
      setCategories(categoriesData)
      setSizes(sizesData)
    }
    loadFilterOptions()
  }, [])

  // Cargar productos
  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProducts(filters, page, 20)

      // Detectar si hay un error de conexión
      if (result.data.length === 0 && result.total === 0 && result.totalPages === 0) {
        // Verificar si es un error de red o simplemente no hay productos
        const testConnection = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || '', { method: 'HEAD' }).catch(() => null)
        if (!testConnection || !testConnection.ok) {
          setError('database')
        }
      }

      setProducts(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('database')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Guardar filtros en sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('productFilters', JSON.stringify(filters))
    }
  }, [filters])

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleSizeChange = (size: any) => {
    setFilters(prev => ({
      ...prev,
      width: size ? size.width : undefined,
      profile: size ? size.profile : undefined,
      diameter: size ? size.diameter : undefined
    }))
    setPage(1)
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header con búsqueda */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Catálogo de Productos</h1>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] placeholder-gray-400"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Filtros
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-[#FFC700] text-black rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Marca</label>
                <select
                  value={filters.brand || ''}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFC700]"
                >
                  <option value="">Todas las marcas</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFC700]"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Medida</label>
                <select
                  value={filters.width ? `${filters.width}/${filters.profile}R${filters.diameter}` : ''}
                  onChange={(e) => {
                    const size = sizes.find(s => s.display === e.target.value)
                    handleSizeChange(size)
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFC700]"
                >
                  <option value="">Todas las medidas</option>
                  {sizes.map(size => (
                    <option key={size.display} value={size.display}>{size.display}</option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Precio máximo</label>
                <input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFC700] placeholder-gray-500"
                />
              </div>

              {/* Stock */}
              <div className="flex items-end">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock || false}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="mr-2 h-4 w-4 text-[#FFC700] border-gray-700 rounded focus:ring-[#FFC700]"
                  />
                  <span className="text-sm text-gray-300">Solo con stock</span>
                </label>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-[#FFC700] hover:text-[#FFD700]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Información de resultados */}
        <div className="mb-4 text-sm text-gray-400">
          Mostrando {products.length} de {total} productos
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC700]"></div>
          </div>
        ) : error === 'database' ? (
          <div className="text-center py-12 bg-gray-900 border border-gray-700 rounded-lg">
            <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">🔧 Estamos en mantenimiento</h3>
            <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
              Actualmente estamos realizando tareas de mantenimiento en nuestra base de datos.
              Por favor, intenta nuevamente en unos minutos.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Si el problema persiste, contáctanos por WhatsApp
            </p>
            <button
              onClick={() => loadProducts()}
              className="mt-6 px-6 py-2 bg-[#FFC700] text-black rounded-lg hover:bg-[#FFD700] transition-colors font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No se encontraron productos</h3>
            <p className="mt-1 text-sm text-gray-400">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === pageNum
                        ? 'bg-[#FFC700] text-black'
                        : 'text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {totalPages > 5 && (
                <span className="px-2 text-gray-500">...</span>
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}