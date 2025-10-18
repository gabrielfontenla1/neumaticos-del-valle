"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, X, Package, RotateCcw, Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
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

// Medidas populares para filtros rápidos
const POPULAR_SIZES = [
  { label: "185/60 R15", width: "185", profile: "60", diameter: "15" },
  { label: "185/65 R15", width: "185", profile: "65", diameter: "15" },
  { label: "195/55 R16", width: "195", profile: "55", diameter: "16" },
  { label: "205/55 R16", width: "205", profile: "55", diameter: "16" },
  { label: "215/55 R17", width: "215", profile: "55", diameter: "17" },
  { label: "225/45 R18", width: "225", profile: "45", diameter: "18" },
]

export default function ProductsClientImproved({ products, stats }: ProductsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedModel, setSelectedModel] = useState("all")
  const [selectedWidth, setSelectedWidth] = useState("all")
  const [selectedProfile, setSelectedProfile] = useState("all")
  const [selectedDiameter, setSelectedDiameter] = useState("all")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sizeSearchTerm, setSizeSearchTerm] = useState("")
  const [showSizeSuggestions, setShowSizeSuggestions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  // Parse búsqueda inteligente de medidas (205/55R16 o 205/55/16)
  const parseSizeSearch = useCallback((value: string) => {
    const cleanValue = value.replace(/\s/g, "").toUpperCase()

    // Formato: 205/55R16 o 205/55/16
    const match = cleanValue.match(/^(\d{2,3})[\/\-](\d{2})[R\/\-]?(\d{2})$/)

    if (match) {
      return {
        width: match[1],
        profile: match[2],
        diameter: match[3]
      }
    }
    return null
  }, [])

  // Aplicar búsqueda inteligente de medidas
  useEffect(() => {
    if (sizeSearchTerm) {
      const parsed = parseSizeSearch(sizeSearchTerm)
      if (parsed) {
        setSelectedWidth(parsed.width)
        setSelectedProfile(parsed.profile)
        setSelectedDiameter(parsed.diameter)
      }
    }
  }, [sizeSearchTerm, parseSizeSearch])

  // Extraer valores únicos con contador dinámico
  const extractUniqueValues = useMemo(() => {
    // Filtrar productos según selecciones actuales
    let baseProducts = [...products]

    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase()
      baseProducts = baseProducts.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.model?.toLowerCase().includes(search)) ||
        (p.size_display?.toLowerCase().includes(search))
      )
    }

    if (selectedBrand !== "all") {
      baseProducts = baseProducts.filter(p => p.brand === selectedBrand)
    }

    if (selectedCategory !== "all") {
      baseProducts = baseProducts.filter(p => p.category === selectedCategory)
    }

    if (inStockOnly) {
      baseProducts = baseProducts.filter(p => p.stock > 0)
    }

    // Filtros dependientes para brands (no aplicar el filtro de brand)
    let brandsProducts = [...products]
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase()
      brandsProducts = brandsProducts.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.model?.toLowerCase().includes(search)) ||
        (p.size_display?.toLowerCase().includes(search))
      )
    }
    if (selectedCategory !== "all") {
      brandsProducts = brandsProducts.filter(p => p.category === selectedCategory)
    }
    if (selectedWidth !== "all") {
      brandsProducts = brandsProducts.filter(p => String(p.width) === selectedWidth)
    }
    if (selectedProfile !== "all") {
      brandsProducts = brandsProducts.filter(p => String(p.profile) === selectedProfile)
    }
    if (selectedDiameter !== "all") {
      brandsProducts = brandsProducts.filter(p => String(p.diameter) === selectedDiameter)
    }
    if (inStockOnly) {
      brandsProducts = brandsProducts.filter(p => p.stock > 0)
    }

    // Filtros dependientes para categories (no aplicar el filtro de category)
    let categoriesProducts = [...products]
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase()
      categoriesProducts = categoriesProducts.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.model?.toLowerCase().includes(search)) ||
        (p.size_display?.toLowerCase().includes(search))
      )
    }
    if (selectedBrand !== "all") {
      categoriesProducts = categoriesProducts.filter(p => p.brand === selectedBrand)
    }
    if (selectedWidth !== "all") {
      categoriesProducts = categoriesProducts.filter(p => String(p.width) === selectedWidth)
    }
    if (selectedProfile !== "all") {
      categoriesProducts = categoriesProducts.filter(p => String(p.profile) === selectedProfile)
    }
    if (selectedDiameter !== "all") {
      categoriesProducts = categoriesProducts.filter(p => String(p.diameter) === selectedDiameter)
    }
    if (inStockOnly) {
      categoriesProducts = categoriesProducts.filter(p => p.stock > 0)
    }

    // Calcular valores únicos con contadores
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))]
      .map(brand => ({
        value: brand,
        count: brandsProducts.filter(p => p.brand === brand).length
      }))
      .sort((a, b) => a.value.localeCompare(b.value))

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
      .map(cat => ({
        value: cat,
        count: categoriesProducts.filter(p => p.category === cat).length
      }))
      .sort((a, b) => a.value.localeCompare(b.value))

    // Filtros dependientes para models (no aplicar el filtro de model)
    let modelsProducts = [...products]
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase()
      modelsProducts = modelsProducts.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.model?.toLowerCase().includes(search)) ||
        (p.size_display?.toLowerCase().includes(search))
      )
    }
    if (selectedBrand !== "all") {
      modelsProducts = modelsProducts.filter(p => p.brand === selectedBrand)
    }
    if (selectedCategory !== "all") {
      modelsProducts = modelsProducts.filter(p => p.category === selectedCategory)
    }
    if (selectedWidth !== "all") {
      modelsProducts = modelsProducts.filter(p => String(p.width) === selectedWidth)
    }
    if (selectedProfile !== "all") {
      modelsProducts = modelsProducts.filter(p => String(p.profile) === selectedProfile)
    }
    if (selectedDiameter !== "all") {
      modelsProducts = modelsProducts.filter(p => String(p.diameter) === selectedDiameter)
    }
    if (inStockOnly) {
      modelsProducts = modelsProducts.filter(p => p.stock > 0)
    }

    const models = [...new Set(products.map(p => p.model).filter((m): m is string => Boolean(m)))]
      .map(model => ({
        value: model,
        count: modelsProducts.filter(p => p.model === model).length
      }))
      .sort((a, b) => a.value.localeCompare(b.value))

    // Filtros dependientes para medidas
    let widthProducts = baseProducts
    if (selectedProfile !== "all") {
      widthProducts = widthProducts.filter(p => String(p.profile) === selectedProfile)
    }
    if (selectedDiameter !== "all") {
      widthProducts = widthProducts.filter(p => String(p.diameter) === selectedDiameter)
    }

    let profileProducts = baseProducts
    if (selectedWidth !== "all") {
      profileProducts = profileProducts.filter(p => String(p.width) === selectedWidth)
    }
    if (selectedDiameter !== "all") {
      profileProducts = profileProducts.filter(p => String(p.diameter) === selectedDiameter)
    }

    let diameterProducts = baseProducts
    if (selectedWidth !== "all") {
      diameterProducts = diameterProducts.filter(p => String(p.width) === selectedWidth)
    }
    if (selectedProfile !== "all") {
      diameterProducts = diameterProducts.filter(p => String(p.profile) === selectedProfile)
    }

    const widths = [...new Set(products.map(p => p.width).filter(Boolean))]
      .map(w => ({
        value: String(w),
        count: widthProducts.filter(p => String(p.width) === String(w)).length
      }))
      .sort((a, b) => Number(a.value) - Number(b.value))

    const profiles = [...new Set(products.map(p => p.profile).filter(Boolean))]
      .map(p => ({
        value: String(p),
        count: profileProducts.filter(pr => String(pr.profile) === String(p)).length
      }))
      .sort((a, b) => Number(a.value) - Number(b.value))

    const diameters = [...new Set(products.map(p => p.diameter).filter(Boolean))]
      .map(d => ({
        value: String(d),
        count: diameterProducts.filter(p => String(p.diameter) === String(d)).length
      }))
      .sort((a, b) => Number(a.value) - Number(b.value))

    // Generar sugerencias de medidas completas
    const completeSizes = new Map<string, number>()
    baseProducts.forEach(p => {
      if (p.width && p.profile && p.diameter) {
        const size = `${p.width}/${p.profile}R${p.diameter}`
        completeSizes.set(size, (completeSizes.get(size) || 0) + 1)
      }
    })

    const sizeSuggestions = Array.from(completeSizes.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      brands,
      categories,
      models,
      widths,
      profiles,
      diameters,
      sizeSuggestions
    }
  }, [products, debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter, inStockOnly])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

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

    // Model filter
    if (selectedModel && selectedModel !== "all") {
      filtered = filtered.filter(p => p.model === selectedModel)
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
  }, [products, debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter, inStockOnly, sortBy])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter, inStockOnly, sortBy])

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startResult = filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endResult = Math.min(currentPage * itemsPerPage, filteredProducts.length)

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setSelectedBrand("all")
    setSelectedCategory("all")
    setSelectedModel("all")
    setSelectedWidth("all")
    setSelectedProfile("all")
    setSelectedDiameter("all")
    setInStockOnly(false)
    setSortBy("name")
    setSizeSearchTerm("")
    setCurrentPage(1)
  }, [])

  // Scroll to top when page changes
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    scrollToTop()
  }, [scrollToTop])

  // Apply quick size filter
  const applyQuickSize = useCallback((width: string, profile: string, diameter: string) => {
    setSelectedWidth(width)
    setSelectedProfile(profile)
    setSelectedDiameter(diameter)
    setSizeSearchTerm(`${width}/${profile}R${diameter}`)
  }, [])

  // Check if any filters are active
  const hasActiveFilters = searchTerm || (selectedBrand !== "all") || (selectedCategory !== "all") || (selectedModel !== "all") || (selectedWidth !== "all") || (selectedProfile !== "all") || (selectedDiameter !== "all") || inStockOnly

  // Active filters count
  const activeFiltersCount = [
    selectedBrand !== "all",
    selectedCategory !== "all",
    selectedModel !== "all",
    selectedWidth !== "all",
    selectedProfile !== "all",
    selectedDiameter !== "all",
    inStockOnly
  ].filter(Boolean).length

  // Filters component (reutilizable para desktop y mobile)
  const FiltersContent = () => (
    <>
      {/* Búsqueda inteligente de medidas */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <label className="text-sm font-semibold text-gray-900 mb-3 block">
          Buscar por medida
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Ej: 205/55R16"
            value={sizeSearchTerm}
            onChange={(e) => {
              setSizeSearchTerm(e.target.value)
              setShowSizeSuggestions(true)
            }}
            onFocus={() => setShowSizeSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSizeSuggestions(false), 200)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
          {sizeSearchTerm && (
            <button
              onClick={() => {
                setSizeSearchTerm("")
                setSelectedWidth("all")
                setSelectedProfile("all")
                setSelectedDiameter("all")
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sugerencias */}
        {showSizeSuggestions && extractUniqueValues.sizeSuggestions.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {extractUniqueValues.sizeSuggestions.map(({ size, count }) => (
              <button
                key={size}
                onClick={() => {
                  setSizeSearchTerm(size)
                  setShowSizeSuggestions(false)
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
              >
                <span className="text-sm text-gray-900">{size}</span>
                <span className="text-xs text-gray-500">{count} disponibles</span>
              </button>
            ))}
          </div>
        )}

        {/* Medidas rápidas */}
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-2">Medidas populares:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SIZES.map((size) => {
              const isActive = selectedWidth === size.width &&
                              selectedProfile === size.profile &&
                              selectedDiameter === size.diameter
              return (
                <button
                  key={size.label}
                  onClick={() => applyQuickSize(size.width, size.profile, size.diameter)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {size.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-900 mb-3 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Marca, modelo..."
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
            {extractUniqueValues.brands.filter(({ count }) => count > 0).map(({ value, count }) => (
              <SelectItem key={value} value={value}>
                <div className="flex justify-between items-center w-full">
                  <span>{value}</span>
                  <span className="text-xs text-gray-500 ml-2">({count})</span>
                </div>
              </SelectItem>
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
            {extractUniqueValues.categories.filter(({ count }) => count > 0).map(({ value, count }) => (
              <SelectItem key={value} value={value}>
                <div className="flex justify-between items-center w-full">
                  <span className="capitalize">{value}</span>
                  <span className="text-xs text-gray-500 ml-2">({count})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Filter */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-900 mb-3 block">Modelo</label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todos los modelos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los modelos</SelectItem>
            {extractUniqueValues.models.filter(({ count }) => count > 0).map(({ value, count }) => (
              <SelectItem key={value} value={value}>
                <div className="flex justify-between items-center w-full">
                  <span>{value}</span>
                  <span className="text-xs text-gray-500 ml-2">({count})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size Filters */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <label className="text-sm font-semibold text-gray-900 mb-3 block">Medida manual</label>

        {/* Width */}
        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1 block">Ancho</label>
          <Select value={selectedWidth} onValueChange={setSelectedWidth}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {extractUniqueValues.widths.filter(({ count }) => count > 0).map(({ value, count }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex justify-between items-center w-full">
                    <span>{value}</span>
                    <span className="text-xs text-gray-500 ml-2">({count})</span>
                  </div>
                </SelectItem>
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
              {extractUniqueValues.profiles.filter(({ count }) => count > 0).map(({ value, count }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex justify-between items-center w-full">
                    <span>{value}</span>
                    <span className="text-xs text-gray-500 ml-2">({count})</span>
                  </div>
                </SelectItem>
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
              {extractUniqueValues.diameters.filter(({ count }) => count > 0).map(({ value, count }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex justify-between items-center w-full">
                    <span>{value}"</span>
                    <span className="text-xs text-gray-500 ml-2">({count})</span>
                  </div>
                </SelectItem>
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
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
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

          {/* Comprehensive Filters Section - All Filters at Top */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Limpiar todos
                </button>
              )}
            </div>

            {/* Search and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo..."
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
              <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm font-medium text-gray-700">Solo disponibles</span>
              </label>
            </div>

            {/* Brand, Category, Model */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Marca</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {extractUniqueValues.brands.filter(({ count }) => count > 0).map(({ value, count }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex justify-between items-center w-full">
                          <span>{value}</span>
                          <span className="text-xs text-gray-500 ml-2">({count})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {extractUniqueValues.categories.filter(({ count }) => count > 0).map(({ value, count }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex justify-between items-center w-full">
                          <span className="capitalize">{value}</span>
                          <span className="text-xs text-gray-500 ml-2">({count})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Modelo</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {extractUniqueValues.models.filter(({ count }) => count > 0).map(({ value, count }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex justify-between items-center w-full">
                          <span>{value}</span>
                          <span className="text-xs text-gray-500 ml-2">({count})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Width, Profile, Diameter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Ancho</label>
                <Select value={selectedWidth} onValueChange={setSelectedWidth}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {extractUniqueValues.widths.filter(({ count }) => count > 0).map(({ value, count }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex justify-between items-center w-full">
                          <span>{value}</span>
                          <span className="text-xs text-gray-500 ml-2">({count})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Perfil</label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {extractUniqueValues.profiles.filter(({ count }) => count > 0).map(({ value, count }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex justify-between items-center w-full">
                          <span>{value}</span>
                          <span className="text-xs text-gray-500 ml-2">({count})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Rodado</label>
                <Select value={selectedDiameter} onValueChange={setSelectedDiameter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {extractUniqueValues.diameters.filter(({ count }) => count > 0).map(({ value, count }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex justify-between items-center w-full">
                          <span>{value}"</span>
                          <span className="text-xs text-gray-500 ml-2">({count})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filters badges */}
            {hasActiveFilters && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">Filtros activos:</span>
                  {selectedBrand !== "all" && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                      Marca: {selectedBrand}
                    </Badge>
                  )}
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                      Categoría: {selectedCategory}
                    </Badge>
                  )}
                  {selectedModel !== "all" && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                      Modelo: {selectedModel}
                    </Badge>
                  )}
                  {selectedWidth !== "all" && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                      Ancho: {selectedWidth}
                    </Badge>
                  )}
                  {selectedProfile !== "all" && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                      Perfil: {selectedProfile}
                    </Badge>
                  )}
                  {selectedDiameter !== "all" && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                      Rodado: {selectedDiameter}"
                    </Badge>
                  )}
                  {inStockOnly && (
                    <Badge variant="secondary" className="bg-green-100 text-green-900">
                      Solo disponibles
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8">

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <SlidersHorizontal className="h-5 w-5" />
                    <span className="font-medium">Filtros</span>
                    {activeFiltersCount > 0 && (
                      <Badge variant="default" className="ml-2 bg-black">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center justify-between">
                      <span>Filtros</span>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Limpiar
                        </button>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <FiltersContent />
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                    >
                      Ver {filteredProducts.length} productos
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Header */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Mostrando <span className="font-medium text-black">{startResult}-{endResult}</span> de <span className="font-medium text-black">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'producto' : 'productos'}
                </div>

                <div className="flex items-center gap-3">
                  {/* Items per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Por página:</span>
                    <Select value={String(itemsPerPage)} onValueChange={(val) => {
                      setItemsPerPage(Number(val))
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
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
              </div>
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
              <>
                <div className="space-y-6">
                  {paginatedProducts.map((product, index) => {
                  const discountPercentage = Math.floor(20 + (index % 4) * 10)
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
                            <div>
                              {/* Brand and Model */}
                              <div className="mb-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                  {product.brand}
                                </span>
                                {product.model && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    {product.model}
                                  </span>
                                )}
                              </div>

                              {/* Size - Prominent Display */}
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {product.width}/{product.profile}R{product.diameter}
                              </h3>

                              {/* Category Badge */}
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {product.category === 'auto' && 'Auto'}
                                  {product.category === 'camioneta' && 'Camioneta/SUV'}
                                  {product.category === 'camion' && 'Camión'}
                                </Badge>
                                {product.stock > 0 && (
                                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                    En Stock
                                  </Badge>
                                )}
                              </div>

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

                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base text-gray-500 line-through">
                                  ${previousPrice.toLocaleString('es-AR')}
                                </span>
                                <span className="text-sm font-semibold text-green-600">
                                  {discountPercentage}% OFF
                                </span>
                              </div>

                              <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-normal text-gray-900">
                                  ${Number(product.price).toLocaleString('es-AR')}
                                </span>
                              </div>

                              <div className="text-base text-gray-700 mb-4">
                                6 cuotas de ${Math.floor(product.price / 6).toLocaleString('es-AR')}
                              </div>

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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Info */}
                      <div className="text-sm text-gray-600">
                        Página <span className="font-medium text-black">{currentPage}</span> de <span className="font-medium text-black">{totalPages}</span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        {/* Previous */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </button>

                        {/* Page numbers */}
                        <div className="hidden sm:flex items-center gap-1">
                          {/* First page */}
                          {currentPage > 3 && (
                            <>
                              <button
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                1
                              </button>
                              {currentPage > 4 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                            </>
                          )}

                          {/* Page range */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return page === currentPage ||
                                     page === currentPage - 1 ||
                                     page === currentPage + 1 ||
                                     (currentPage <= 2 && page <= 3) ||
                                     (currentPage >= totalPages - 1 && page >= totalPages - 2)
                            })
                            .map(page => (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                  page === currentPage
                                    ? 'bg-black text-white border-black'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}

                          {/* Last page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>

                        {/* Next */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center gap-1"
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Mobile page indicator */}
                      <div className="sm:hidden text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
