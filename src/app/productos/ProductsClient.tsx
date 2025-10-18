"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, X, Package, RotateCcw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Product } from "@/features/products/types"

interface ProductsClientProps {
  products: Product[]
  stats?: {
    total: number
    inStock: number
    brands: number
    categories: number
  }
}

export default function ProductsClient({ products, stats }: ProductsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedWidth, setSelectedWidth] = useState("all")
  const [selectedProfile, setSelectedProfile] = useState("all")
  const [selectedDiameter, setSelectedDiameter] = useState("all")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [isLoading, setIsLoading] = useState(false)

  // Extract unique values
  const { uniqueBrands, uniqueCategories, uniqueWidths, uniqueProfiles, uniqueDiameters } = useMemo(() => {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort()
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort()
    const widths = [...new Set(products.map(p => p.width).filter(Boolean))].sort((a, b) => (a as number) - (b as number))
    const profiles = [...new Set(products.map(p => p.profile).filter(Boolean))].sort((a, b) => (a as number) - (b as number))
    const diameters = [...new Set(products.map(p => p.diameter).filter(Boolean))].sort((a, b) => (a as number) - (b as number))

    return {
      uniqueBrands: brands,
      uniqueCategories: categories,
      uniqueWidths: widths.map(String),
      uniqueProfiles: profiles.map(String),
      uniqueDiameters: diameters.map(String)
    }
  }, [products])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products] // Work with all products

    // Search filter
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.model?.toLowerCase().includes(search)) ||
        (p.size_display?.toLowerCase().includes(search))
      )
    }

    // Brand filter
    if (selectedBrand && selectedBrand !== "all") {
      filtered = filtered.filter(p => p.brand === selectedBrand)
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Size filters
    if (selectedWidth && selectedWidth !== "all") {
      filtered = filtered.filter(p => String(p.width) === selectedWidth)
    }
    if (selectedProfile && selectedProfile !== "all") {
      filtered = filtered.filter(p => String(p.profile) === selectedProfile)
    }
    if (selectedDiameter && selectedDiameter !== "all") {
      filtered = filtered.filter(p => String(p.diameter) === selectedDiameter)
    }

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter(p => p.stock > 0)
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "stock":
        filtered.sort((a, b) => b.stock - a.stock)
        break
      case "name":
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return filtered
  }, [products, debouncedSearchTerm, selectedBrand, selectedCategory, selectedWidth, selectedProfile, selectedDiameter, inStockOnly, sortBy])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setSelectedBrand("all")
    setSelectedCategory("all")
    setSelectedWidth("all")
    setSelectedProfile("all")
    setSelectedDiameter("all")
    setInStockOnly(false)
    setSortBy("name")
  }, [])

  // Check if any filters are active
  const hasActiveFilters = searchTerm || (selectedBrand !== "all") || (selectedCategory !== "all") || (selectedWidth !== "all") || (selectedProfile !== "all") || (selectedDiameter !== "all") || inStockOnly

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Neumáticos</h1>
              <p className="text-gray-600">Encontrá el neumático perfecto para tu vehículo</p>
            </div>
            {stats && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="h-4 w-4" />
                <span>{stats.inStock} disponibles</span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">En Stock</div>
                <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Marcas</div>
                <div className="text-2xl font-bold text-gray-900">{stats.brands}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Categorías</div>
                <div className="text-2xl font-bold text-gray-900">{stats.categories}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Limpiar
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-900 mb-3 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Marca, modelo, medida..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-900 mb-3 block">Marca</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-900 mb-3 block">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size Filters */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <label className="text-sm font-semibold text-gray-900 mb-3 block">Medida</label>

                {/* Width */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 mb-1 block">Ancho</label>
                  <Select value={selectedWidth} onValueChange={setSelectedWidth}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueWidths.map(w => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Profile */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 mb-1 block">Perfil</label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueProfiles.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Diameter */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Rodado</label>
                  <Select value={selectedDiameter} onValueChange={setSelectedDiameter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueDiameters.map(d => (
                        <SelectItem key={d} value={d}>{d}"</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stock Filter */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">Solo disponibles</span>
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-black">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="price-asc">Menor precio</SelectItem>
                  <SelectItem value="price-desc">Mayor precio</SelectItem>
                  <SelectItem value="stock">Mayor stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products List */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                <p className="text-gray-600 mb-6">No hay neumáticos que coincidan con tus criterios de búsqueda.</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredProducts.map((product, index) => {
                  // Calcular precio anterior simulado (20-50% más)
                  const discountPercentage = Math.floor(20 + (index % 4) * 10) // 20%, 30%, 40%, 50%
                  const previousPrice = Math.floor(product.price * (1 + discountPercentage / 100))

                  return (
                    <Link
                      key={product.id}
                      href={`/productos/${product.id}`}
                      className="block group"
                    >
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200">
                        <div className="flex flex-col sm:flex-row gap-6 p-6">
                          {/* Image */}
                          <div className="w-full sm:w-56 h-56 bg-white relative flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <Package className="h-16 w-16 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            {/* Top Section */}
                            <div>
                              {/* Title */}
                              <h3 className="text-xl font-normal text-gray-900 mb-2 line-clamp-2 leading-tight">
                                {product.name}
                              </h3>

                              {/* Rating */}
                              <div className="flex items-center gap-1 mb-3">
                                <span className="text-sm text-gray-900">4.7</span>
                                <div className="flex items-center text-blue-500">
                                  {"★★★★★".split("").map((star, i) => (
                                    <span key={i} className="text-sm">{i < 4 ? "★" : "☆"}</span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500 ml-1">({Math.floor(product.stock * 10 + 100)})</span>
                              </div>
                            </div>

                            {/* Price Section */}
                            <div className="mt-4">
                              {/* Previous Price & Discount */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base text-gray-500 line-through">
                                  ${previousPrice.toLocaleString('es-AR')}
                                </span>
                                <span className="text-sm font-semibold text-green-600">
                                  {discountPercentage}% OFF
                                </span>
                              </div>

                              {/* Current Price */}
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-normal text-gray-900">
                                  ${Number(product.price).toLocaleString('es-AR')}
                                </span>
                              </div>

                              {/* Installments */}
                              <div className="text-base text-gray-700 mb-4">
                                6 cuotas de ${Math.floor(product.price / 6).toLocaleString('es-AR')}
                              </div>

                              {/* Shipping Badge */}
                              {product.stock > 15 && (
                                <div className="inline-block">
                                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                    Llega gratis hoy
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
