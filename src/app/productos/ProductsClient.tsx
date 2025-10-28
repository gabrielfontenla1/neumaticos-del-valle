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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Product } from "@/features/products/types"
import { QuickAddButton } from "@/features/cart/components/AddToCartButton"
import ProductsSkeleton from "./ProductsSkeleton"
import { useEquivalentTires } from "@/features/tire-equivalence/hooks/useEquivalentTires"
import { EquivalencesSection } from "@/features/tire-equivalence/components/EquivalencesSection"

interface ProductsClientProps {
  products: Product[]
  stats?: {
    total: number
    inStock: number
    brands: number
    categories: number
  } | null
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

export default function ProductsClientImproved({ products: initialProducts, stats: initialStats }: ProductsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for fetched products
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [stats, setStats] = useState(initialStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debug logging
  console.log('ProductsClientImproved state:', {
    productsCount: products.length,
    firstProduct: products[0],
    stats,
    isLoading,
    error
  })

  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedModel, setSelectedModel] = useState("all")
  const [selectedWidth, setSelectedWidth] = useState("all")
  const [selectedProfile, setSelectedProfile] = useState("all")
  const [selectedDiameter, setSelectedDiameter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sizeSearchTerm, setSizeSearchTerm] = useState("")
  const [showSizeSuggestions, setShowSizeSuggestions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  // Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log('Fetching products from API...')
        // Fetch solo productos con stock disponible
        const response = await fetch('/api/products?inStock=true&limit=1000')
        const data = await response.json()

        if (response.ok) {
          console.log('API response:', {
            productsCount: data.products?.length || 0,
            total: data.total,
            firstProduct: data.products?.[0]
          })

          setProducts(data.products || [])

          // Calculate stats
          if (data.products && data.products.length > 0) {
            const uniqueBrands = new Set(data.products.map((p: Product) => p.brand).filter(Boolean))
            const uniqueCategories = new Set(data.products.map((p: Product) => p.category).filter(Boolean))

            setStats({
              total: data.products.length,
              inStock: data.products.filter((p: Product) => p.stock > 0).length,
              brands: uniqueBrands.size,
              categories: uniqueCategories.size
            })
          }
        } else {
          throw new Error(data.error || 'Failed to fetch products')
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to load products')
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, []) // Run once on mount

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
  }, [products, debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter])

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
    console.log('Starting filter with products:', filtered.length)

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

    console.log('After filtering:', {
      filteredCount: filtered.length,
      filters: {
        searchTerm: debouncedSearchTerm,
        brand: selectedBrand,
        category: selectedCategory,
        model: selectedModel,
        width: selectedWidth,
        profile: selectedProfile,
        diameter: selectedDiameter
      }
    })

    return filtered
  }, [products, debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter, sortBy])

  // Detect when all 3 size filters are selected to show equivalences
  const shouldShowEquivalences =
    selectedWidth !== "all" &&
    selectedProfile !== "all" &&
    selectedDiameter !== "all"

  // Fetch equivalent tires when all filters are selected
  const {
    equivalents,
    loading: loadingEquivalents
  } = useEquivalentTires({
    width: selectedWidth !== "all" ? Number(selectedWidth) : null,
    profile: selectedProfile !== "all" ? Number(selectedProfile) : null,
    diameter: selectedDiameter !== "all" ? Number(selectedDiameter) : null,
    enabled: shouldShowEquivalences,
    tolerancePercent: 3,
    allowDifferentRim: false
  })

  // Determine if there are exact matches with stock
  const hasExactMatch = filteredProducts.length > 0

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter, sortBy])

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
  const hasActiveFilters = searchTerm || (selectedBrand !== "all") || (selectedCategory !== "all") || (selectedModel !== "all") || (selectedWidth !== "all") || (selectedProfile !== "all") || (selectedDiameter !== "all")

  // Active filters count
  const activeFiltersCount = [
    selectedBrand !== "all",
    selectedCategory !== "all",
    selectedModel !== "all",
    selectedWidth !== "all",
    selectedProfile !== "all",
    selectedDiameter !== "all"
  ].filter(Boolean).length

  // Filters component (reutilizable para desktop y mobile)
  const FiltersContent = () => (
    <>
      {/* Búsqueda inteligente de medidas */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <label className="text-[11px] font-medium text-gray-700 mb-2 block">
          Buscar por medida
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Ej: 205/55R16"
            value={sizeSearchTerm}
            onChange={(e) => {
              setSizeSearchTerm(e.target.value)
              setShowSizeSuggestions(true)
            }}
            onFocus={() => setShowSizeSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSizeSuggestions(false), 200)}
            className="w-full h-8 text-[11px]"
          />
          {sizeSearchTerm && (
            <Button
              onClick={() => {
                setSizeSearchTerm("")
                setSelectedWidth("all")
                setSelectedProfile("all")
                setSelectedDiameter("all")
              }}
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Sugerencias */}
        {showSizeSuggestions && extractUniqueValues.sizeSuggestions.length > 0 && (
          <div className="mt-2 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {extractUniqueValues.sizeSuggestions.map(({ size, count }) => (
              <Button
                key={size}
                onClick={() => {
                  setSizeSearchTerm(size)
                  setShowSizeSuggestions(false)
                }}
                variant="ghost"
                className="w-full justify-between h-auto px-3 py-1.5 text-[11px] font-normal rounded-none hover:bg-gray-50"
              >
                <span className="text-gray-900 text-[11px]">{size}</span>
                <span className="text-[10px] text-gray-500">{count} disponibles</span>
              </Button>
            ))}
          </div>
        )}

        {/* Medidas rápidas */}
        <div className="mt-2">
          <p className="text-[10px] text-gray-600 mb-1.5">Medidas populares:</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SIZES.map((size) => {
              const isActive = selectedWidth === size.width &&
                              selectedProfile === size.profile &&
                              selectedDiameter === size.diameter
              return (
                <Button
                  key={size.label}
                  onClick={() => applyQuickSize(size.width, size.profile, size.diameter)}
                  variant={isActive ? "default" : "secondary"}
                  size="sm"
                  className={`h-auto px-2.5 py-0.5 text-[10px] rounded-full ${
                    isActive
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {size.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="text-[11px] font-medium text-gray-700 mb-2 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Marca, modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 h-8 text-[11px]"
          />
          {searchTerm && (
            <Button
              onClick={() => setSearchTerm("")}
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="mb-4">
        <label className="text-[11px] font-medium text-gray-700 mb-2 block">Marca</label>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-full text-[11px] h-8">
            <SelectValue placeholder="Todas las marcas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las marcas</SelectItem>
            {extractUniqueValues.brands.filter(({ count }) => count > 0).map(({ value, count }) => (
              <SelectItem key={value} value={value}>
                <div className="flex justify-between items-center w-full text-[11px]">
                  <span>{value}</span>
                  <span className="text-[10px] text-gray-500 ml-2">({count})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <label className="text-[11px] font-medium text-gray-700 mb-2 block">Categoría</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full text-[11px] h-8">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {extractUniqueValues.categories.filter(({ count }) => count > 0).map(({ value, count }) => (
              <SelectItem key={value} value={value}>
                <div className="flex justify-between items-center w-full text-[11px]">
                  <span className="capitalize">{value}</span>
                  <span className="text-[10px] text-gray-500 ml-2">({count})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Filter */}
      <div className="mb-4">
        <label className="text-[11px] font-medium text-gray-700 mb-2 block">Modelo</label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full text-[11px] h-8">
            <SelectValue placeholder="Todos los modelos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los modelos</SelectItem>
            {extractUniqueValues.models.filter(({ count }) => count > 0).map(({ value, count }) => (
              <SelectItem key={value} value={value}>
                <div className="flex justify-between items-center w-full text-[11px]">
                  <span>{value}</span>
                  <span className="text-[10px] text-gray-500 ml-2">({count})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size Filters */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <label className="text-[11px] font-medium text-gray-700 mb-2 block">Medida manual</label>

        {/* Width */}
        <div className="mb-2.5">
          <label className="text-[10px] font-normal text-gray-600 mb-1 block">Ancho (mm)</label>
          <Select value={selectedWidth} onValueChange={setSelectedWidth}>
            <SelectTrigger className="w-full text-[11px] h-8">
              <SelectValue placeholder="Ej: 185, 195, 205..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los anchos</SelectItem>
              {extractUniqueValues.widths.filter(({ count }) => count > 0).map(({ value, count }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex justify-between items-center w-full text-[11px]">
                    <span>{value} mm</span>
                    <span className="text-[10px] text-gray-500 ml-2">({count})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profile */}
        <div className="mb-2.5">
          <label className="text-[10px] font-normal text-gray-600 mb-1 block">Perfil (%)</label>
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-full text-[11px] h-8">
              <SelectValue placeholder="Ej: 55, 60, 65..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los perfiles</SelectItem>
              {extractUniqueValues.profiles.filter(({ count }) => count > 0).map(({ value, count }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex justify-between items-center w-full text-[11px]">
                    <span>{value}%</span>
                    <span className="text-[10px] text-gray-500 ml-2">({count})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Diameter */}
        <div>
          <label className="text-[10px] font-normal text-gray-600 mb-1 block">Rodado (pulgadas)</label>
          <Select value={selectedDiameter} onValueChange={setSelectedDiameter}>
            <SelectTrigger className="w-full text-[11px] h-8">
              <SelectValue placeholder="Ej: R15, R16, R17..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los rodados</SelectItem>
              {extractUniqueValues.diameters.filter(({ count }) => count > 0).map(({ value, count }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex justify-between items-center w-full text-[11px]">
                    <span>R{value}"</span>
                    <span className="text-[10px] text-gray-500 ml-2">({count})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )

  // Show loading state
  if (isLoading) {
    return <ProductsSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar productos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="default">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // Show main content
  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Catálogo de Neumáticos</h1>
              <p className="text-sm text-gray-600">Encontrá el neumático perfecto para tu vehículo</p>
            </div>
            {stats && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="h-4 w-4" />
                <span>{stats.inStock} disponibles</span>
              </div>
            )}
          </div>

        </div>

        {/* Main Layout - 2 Columns */}
        <div className="relative flex flex-col lg:flex-row gap-8">

          {/* Left Sidebar - Filters (Hidden on mobile, visible on lg+) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-800">Filtros</h2>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-[11px] text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    <span className="text-[11px]">Limpiar</span>
                  </Button>
                )}
              </div>
              <div>
                <FiltersContent />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full h-auto py-3">
                    <SlidersHorizontal className="h-5 w-5 mr-2" />
                    <span className="font-medium">Filtros</span>
                    {activeFiltersCount > 0 && (
                      <Badge variant="default" className="ml-2 bg-black">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center justify-between">
                      <span>Filtros</span>
                      {hasActiveFilters && (
                        <Button
                          onClick={clearFilters}
                          variant="ghost"
                          size="sm"
                          className="h-auto py-1 px-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Limpiar
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <FiltersContent />
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full h-auto py-3 bg-black text-white hover:bg-gray-800 font-medium"
                    >
                      Ver {filteredProducts.length} productos
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Main Filter Section - Medidas */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-300 shadow-md p-3 sm:p-6 mb-6">
              <div className="mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Buscar por medida de neumático</h3>
                <p className="text-xs sm:text-sm text-gray-600">Seleccioná las medidas exactas que necesitás para tu vehículo</p>
              </div>

              {/* Mobile: Compact vertical layout with labels */}
              <div className="space-y-2 sm:hidden">
                {/* Ancho */}
                <div>
                  <label className="text-xs font-semibold text-gray-800 mb-1 block">Ancho (mm)</label>
                  <Select value={selectedWidth} onValueChange={setSelectedWidth}>
                    <SelectTrigger className="w-full h-9 text-xs font-medium bg-white border border-gray-300 rounded">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todos</SelectItem>
                      {extractUniqueValues.widths.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {value} mm ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Perfil */}
                <div>
                  <label className="text-xs font-semibold text-gray-800 mb-1 block">Perfil (%)</label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger className="w-full h-9 text-xs font-medium bg-white border border-gray-300 rounded">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todos</SelectItem>
                      {extractUniqueValues.profiles.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {value}% ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rodado */}
                <div>
                  <label className="text-xs font-semibold text-gray-800 mb-1 block">Rodado (")</label>
                  <Select value={selectedDiameter} onValueChange={setSelectedDiameter}>
                    <SelectTrigger className="w-full h-9 text-xs font-medium bg-white border border-gray-300 rounded">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todos</SelectItem>
                      {extractUniqueValues.diameters.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          R{value}" ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desktop: Original 3-column grid */}
              <div className="hidden sm:grid grid-cols-3 gap-4">
                {/* Ancho */}
                <div>
                  <Select value={selectedWidth} onValueChange={setSelectedWidth}>
                    <SelectTrigger className="w-full h-12 text-base font-medium bg-[#FFFFFF] border-2 border-gray-300 hover:border-gray-400 focus:border-black">
                      <SelectValue placeholder="Seleccioná el ancho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-base">Ver todos los anchos</SelectItem>
                      {extractUniqueValues.widths.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-base">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-medium">{value} mm</span>
                            <span className="text-sm text-gray-500 ml-3">({count})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Perfil */}
                <div>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger className="w-full h-12 text-base font-medium bg-[#FFFFFF] border-2 border-gray-300 hover:border-gray-400 focus:border-black">
                      <SelectValue placeholder="Seleccioná el perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-base">Ver todos los perfiles</SelectItem>
                      {extractUniqueValues.profiles.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-base">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-medium">{value}%</span>
                            <span className="text-sm text-gray-500 ml-3">({count})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rodado */}
                <div>
                  <Select value={selectedDiameter} onValueChange={setSelectedDiameter}>
                    <SelectTrigger className="w-full h-12 text-base font-medium bg-[#FFFFFF] border-2 border-gray-300 hover:border-gray-400 focus:border-black">
                      <SelectValue placeholder="Seleccioná el rodado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-base">Ver todos los rodados</SelectItem>
                      {extractUniqueValues.diameters.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-base">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-medium">R{value}"</span>
                            <span className="text-sm text-gray-500 ml-3">({count})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Size Display */}
              {(selectedWidth !== 'all' || selectedProfile !== 'all' || selectedDiameter !== 'all') && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-600">Medida seleccionada:</span>
                      <span className="text-base sm:text-lg font-bold text-black">
                        {selectedWidth !== 'all' ? selectedWidth : '---'}/
                        {selectedProfile !== 'all' ? selectedProfile : '--'}
                        {selectedDiameter !== 'all' ? `R${selectedDiameter}` : ''}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedWidth('all')
                        setSelectedProfile('all')
                        setSelectedDiameter('all')
                      }}
                      variant="link"
                      size="sm"
                      className="h-auto px-0 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto"
                    >
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Limpiar medidas
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Products List */}
            {filteredProducts.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                <p className="text-gray-600 mb-6">No hay neumáticos que coincidan con tus criterios de búsqueda.</p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {paginatedProducts.map((product, index) => {
                  const discountPercentage = Math.floor(20 + (index % 4) * 10)
                  const previousPrice = Math.floor(product.price * (1 + discountPercentage / 100))

                  return (
                    <div
                      key={product.id}
                      className="group"
                    >
                      <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out h-full">
                        <div className="flex flex-col h-full">
                          {/* Image - Using mock tire image for all products */}
                          <div className="w-full aspect-square bg-[#FFFFFF] relative overflow-hidden">
                            <Link href={`/productos/${product.id}`} className="block w-full h-full">
                              <img
                                src={product.image_url || "/tire.webp"}
                                alt={product.name}
                                className="w-full h-full object-contain p-3 lg:p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
                                loading="lazy"
                              />
                            </Link>

                            {/* Add to Cart Button - Positioned at bottom-right of image */}
                            <div className="absolute bottom-2 right-2 z-10">
                              <QuickAddButton
                                productId={product.id}
                                disabled={product.stock === 0}
                              />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col p-4">
                            {/* Brand */}
                            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate mb-2">
                              {product.brand}
                            </div>

                            {/* Size - Large and prominent */}
                            <Link href={`/productos/${product.id}`} className="mb-1">
                              <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                                {product.width && product.profile && product.diameter &&
                                 product.width > 0 && product.profile > 0 && product.diameter > 0
                                  ? `${product.width}/${product.profile}R${product.diameter}`
                                  : product.name}
                              </h3>
                            </Link>

                            {/* Model only - no size repetition */}
                            <div className="text-xs text-gray-600 truncate mb-2">
                              {product.model || '\u00A0'}
                            </div>

                            {/* Disponible y Envío gratis */}
                            <div className="flex items-center gap-2 mb-3">
                              {product.stock > 0 && (
                                <span className="text-xs text-green-600 font-medium">
                                  Disponible
                                </span>
                              )}
                              {product.stock > 15 && (
                                <span className="text-xs text-green-600 font-medium">
                                  • Envío gratis
                                </span>
                              )}
                            </div>

                            {/* Price Section */}
                            <div className="mt-auto pt-2 border-t border-gray-200">
                              {/* Price tachado y descuento */}
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500 line-through">
                                  ${previousPrice.toLocaleString('es-AR')}
                                </span>
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded transition-all duration-200 group-hover:bg-green-100">
                                  {discountPercentage}% OFF
                                </span>
                              </div>

                              <div className="mb-1">
                                <span className="text-xl font-bold text-gray-900">
                                  ${Number(product.price).toLocaleString('es-AR')}
                                </span>
                              </div>

                              <div className="text-[10px] text-gray-600">
                                6 cuotas de ${Math.floor(product.price / 6).toLocaleString('es-AR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Equivalences Section - Only show when all 3 size filters are selected */}
            {shouldShowEquivalences && (
              <EquivalencesSection
                equivalentTires={equivalents}
                hasExactMatch={hasExactMatch}
                loading={loadingEquivalents}
                originalSize={{
                  width: Number(selectedWidth),
                  profile: Number(selectedProfile),
                  diameter: Number(selectedDiameter)
                }}
              />
            )}

            {/* Results Header - Moved to the end */}
            {filteredProducts.length > 0 && (
              <div className="mt-8 bg-[#FFFFFF] p-3 rounded-lg border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    Mostrando <span className="font-medium text-black">{startResult}-{endResult}</span> de <span className="font-medium text-black">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'producto' : 'productos'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Por página:</span>
                      <Select value={String(itemsPerPage)} onValueChange={(val) => {
                        setItemsPerPage(Number(val))
                        setCurrentPage(1)
                      }}>
                        <SelectTrigger className="w-16 text-xs">
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
                      <SelectTrigger className="w-40 text-xs">
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
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-4 bg-[#FFFFFF] p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Info */}
                  <div className="text-sm text-gray-600">
                    Página <span className="font-medium text-black">{currentPage}</span> de <span className="font-medium text-black">{totalPages}</span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous */}
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="text-sm font-medium"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            onClick={() => handlePageChange(1)}
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                          >
                            1
                          </Button>
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
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            className={`h-9 w-9 p-0 ${
                              page === currentPage
                                ? 'bg-black text-white hover:bg-gray-800'
                                : ''
                            }`}
                          >
                            {page}
                          </Button>
                        ))}

                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            onClick={() => handlePageChange(totalPages)}
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Next */}
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="text-sm font-medium"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {/* Mobile page indicator */}
                  <div className="sm:hidden text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
