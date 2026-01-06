"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, X, Package, RotateCcw, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, Share2, Copy, Truck, ArrowRight, Calendar } from "lucide-react"
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
import AgroCamionesSkeleton from "./AgroCamionesSkeleton"
import { useEquivalentTires } from "@/features/tire-equivalence/hooks/useEquivalentTires"
import { EquivalencesSection } from "@/features/tire-equivalence/components/EquivalencesSection"
import { useURLFilters } from "@/hooks/useURLFilters"
import { useFilterPersistence } from "@/hooks/useFilterPersistence"
import { generateShareableURL } from "@/lib/products/url-filters"
import { StockInfoPopup } from "@/components/ui/stock-info-popup"

// Type for product features with known properties
interface ProductFeatures {
  price_list?: number
  codigo_proveedor?: string
  [key: string]: unknown
}

// Filter option type for dynamic counters
interface FilterOption {
  value: string
  count: number
}

// Size suggestion type
interface SizeSuggestion {
  size: string
  count: number
}

// Props interface for FiltersContent component
interface FiltersContentProps {
  sizeSearchTerm: string
  inputSizeSearchTerm: string
  setInputSizeSearchTerm: (value: string) => void
  handleSizeSearchSubmit: () => void
  searchTerm: string
  inputSearchTerm: string
  setInputSearchTerm: (value: string) => void
  handleSearchSubmit: () => void
  selectedBrand: string
  selectedCategory: string
  selectedModel: string
  selectedWidth: string
  selectedProfile: string
  selectedDiameter: string
  updateFilter: (key: string, value: string | number) => void
  updateFilters: (filters: Record<string, string | number>) => void
  showSizeSuggestions: boolean
  setShowSizeSuggestions: (show: boolean) => void
  extractUniqueValues: {
    brands: FilterOption[]
    categories: FilterOption[]
    models: FilterOption[]
    widths: FilterOption[]
    profiles: FilterOption[]
    diameters: FilterOption[]
    sizeSuggestions: SizeSuggestion[]
  }
  applyQuickSize: (width: string, profile: string, diameter: string) => void
}

// FiltersContent component extracted outside to prevent recreation on each render
const FiltersContent = ({
  sizeSearchTerm,
  inputSizeSearchTerm,
  setInputSizeSearchTerm,
  handleSizeSearchSubmit,
  searchTerm,
  inputSearchTerm,
  setInputSearchTerm,
  handleSearchSubmit,
  selectedBrand,
  selectedCategory,
  selectedModel,
  selectedWidth,
  selectedProfile,
  selectedDiameter,
  updateFilter,
  updateFilters,
  showSizeSuggestions,
  setShowSizeSuggestions,
  extractUniqueValues,
  applyQuickSize
}: FiltersContentProps) => (
  <>
    {/* Size search */}
    <div className="mb-4 pb-4 border-b border-gray-100">
      <label className="text-[11px] font-medium text-gray-700 mb-2 block">
        Buscar por medida
      </label>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder=""
            value={inputSizeSearchTerm}
            onChange={(e) => {
              setInputSizeSearchTerm(e.target.value)
              setShowSizeSuggestions(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSizeSearchSubmit()
                setShowSizeSuggestions(false)
              }
            }}
            onFocus={() => setShowSizeSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSizeSuggestions(false), 200)}
            className="w-full h-8 text-[11px]"
          />
          {inputSizeSearchTerm && (
            <Button
              onClick={() => {
                setInputSizeSearchTerm("")
                updateFilters({
                  sizeSearchTerm: "",
                  selectedWidth: "all",
                  selectedProfile: "all",
                  selectedDiameter: "all"
                })
              }}
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button
          onClick={() => {
            handleSizeSearchSubmit()
            setShowSizeSuggestions(false)
          }}
          size="sm"
          className="h-8 px-3 bg-black text-white hover:bg-gray-800"
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>

      {showSizeSuggestions && extractUniqueValues.sizeSuggestions.length > 0 && (
        <div className="mt-2 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {extractUniqueValues.sizeSuggestions.map(({ size, count }) => (
            <Button
              key={size}
              onClick={() => {
                // Al hacer click en sugerencia, aplicar inmediatamente
                setInputSizeSearchTerm(size)
                updateFilter('sizeSearchTerm', size)
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
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            type="text"
            placeholder=""
            value={inputSearchTerm}
            onChange={(e) => setInputSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearchSubmit()
              }
            }}
            className="w-full pl-9 pr-9 h-8 text-[11px]"
          />
          {inputSearchTerm && (
            <Button
              onClick={() => {
                setInputSearchTerm("")
                updateFilter('searchTerm', "")
              }}
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button
          onClick={handleSearchSubmit}
          size="sm"
          className="h-8 px-3 bg-black text-white hover:bg-gray-800"
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>
    </div>

    {/* Brand Filter */}
    <div className="mb-4">
      <label className="text-[11px] font-medium text-gray-700 mb-2 block">Marca</label>
      <Select value={selectedBrand} onValueChange={(value) => updateFilter('selectedBrand', value)}>
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
      <Select value={selectedCategory} onValueChange={(value) => updateFilter('selectedCategory', value)}>
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
      <Select value={selectedModel} onValueChange={(value) => updateFilter('selectedModel', value)}>
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

      <div className="mb-2.5">
        <label className="text-[10px] font-normal text-gray-600 mb-1 block">Ancho (mm)</label>
        <Select value={selectedWidth} onValueChange={(value) => updateFilter('selectedWidth', value)}>
          <SelectTrigger className="w-full text-[11px] h-8">
            <SelectValue placeholder="Ej: 295, 385..." />
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

      <div className="mb-2.5">
        <label className="text-[10px] font-normal text-gray-600 mb-1 block">Perfil (%)</label>
        <Select value={selectedProfile} onValueChange={(value) => updateFilter('selectedProfile', value)}>
          <SelectTrigger className="w-full text-[11px] h-8">
            <SelectValue placeholder="Ej: 80, 65..." />
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

      <div>
        <label className="text-[10px] font-normal text-gray-600 mb-1 block">Rodado (pulgadas)</label>
        <Select value={selectedDiameter} onValueChange={(value) => updateFilter('selectedDiameter', value)}>
          <SelectTrigger className="w-full text-[11px] h-8">
            <SelectValue placeholder="Ej: R22.5, R24..." />
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

interface AgroCamionesClientProps {
  products: Product[]
  stats?: {
    total: number
    inStock: number
    brands: number
    categories: number
  } | null
}

// Medidas populares para agro y camiones
const POPULAR_SIZES = [
  { label: "11R22.5", width: "11", profile: "R", diameter: "22.5" },
  { label: "295/80R22.5", width: "295", profile: "80", diameter: "22.5" },
  { label: "275/80R22.5", width: "275", profile: "80", diameter: "22.5" },
  { label: "385/65R22.5", width: "385", profile: "65", diameter: "22.5" },
  { label: "12.4-24", width: "12.4", profile: "", diameter: "24" },
  { label: "18.4-34", width: "18.4", profile: "", diameter: "34" },
]

export default function AgroCamionesClient({ products: initialProducts, stats: initialStats }: AgroCamionesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use URL filters hook for state management
  const {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    isLoading: isURLLoading
  } = useURLFilters({
    debounceMs: 300,
    replaceHistory: true,
    basePath: '/agro-camiones'
  })

  // Use filter persistence for saving presets and localStorage
  const {
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    presets,
    saveToSession,
    loadFromSession,
    saveFallback,
    loadFallback
  } = useFilterPersistence()

  // State for fetched products
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [stats, setStats] = useState(initialStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRestoringFilters, setIsRestoringFilters] = useState(true)

  // UI State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [showSizeSuggestions, setShowSizeSuggestions] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm || "")
  const [inputSearchTerm, setInputSearchTerm] = useState(filters.searchTerm || "")
  const [inputSizeSearchTerm, setInputSizeSearchTerm] = useState(filters.sizeSearchTerm || "")

  // Extract filter values from URL filters
  const {
    searchTerm = "",
    selectedBrand = "all",
    selectedCategory = "all",
    selectedModel = "all",
    selectedWidth = "all",
    selectedProfile = "all",
    selectedDiameter = "all",
    sortBy = "price-asc",
    sizeSearchTerm = "",
    currentPage = 1,
    itemsPerPage = 50
  } = filters

  // Fetch products from API on mount - filter by agro/camiones category
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/products?limit=1000')
        const data = await response.json()

        if (response.ok) {
          // Filter products by agro/camiones categories
          // Note: Use exact match for 'camion' to exclude 'camioneta' (SUV tires)
          const agroProducts = data.products?.filter((p: Product) => {
            const cat = p.category?.toLowerCase() || ''
            return (
              cat.includes('agro') ||
              cat === 'camion' ||  // Exact match - excludes 'camioneta'
              cat.includes('truck') ||
              cat.includes('agricola') ||
              cat.includes('pesado') ||
              cat.includes('industrial')
            )
          }) || []

          setProducts(agroProducts)

          // Calculate stats
          if (agroProducts.length > 0) {
            const uniqueBrands = new Set(agroProducts.map((p: Product) => p.brand).filter(Boolean))
            const uniqueCategories = new Set(agroProducts.map((p: Product) => p.category).filter(Boolean))

            setStats({
              total: agroProducts.length,
              inStock: agroProducts.filter((p: Product) => p.stock > 0).length,
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
  }, [])

  // Load filters from localStorage on mount
  useEffect(() => {
    const storedFilters = loadFallback()
    const hasStoredFilters = storedFilters && Object.keys(storedFilters).length > 0
    const hasURLFilters = searchParams.toString().length > 0

    if (hasStoredFilters && !hasURLFilters) {
      updateFilters(storedFilters)
    }

    setIsRestoringFilters(false)
  }, [])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (isRestoringFilters) return
    saveFallback(filters)
  }, [filters, isRestoringFilters, saveFallback])

  // Sync inputSearchTerm when searchTerm changes from URL or clear
  useEffect(() => {
    setInputSearchTerm(searchTerm)
  }, [searchTerm])

  // Sync inputSizeSearchTerm when sizeSearchTerm changes from URL or clear
  useEffect(() => {
    setInputSizeSearchTerm(sizeSearchTerm)
  }, [sizeSearchTerm])

  // Parse size search
  const parseSizeSearch = useCallback((value: string) => {
    const cleanValue = value.replace(/\s/g, "").toUpperCase()
    const match = cleanValue.match(/^(\d{2,3})[-/](\d{2})[-/R]?(\d{2})$/)

    if (match) {
      return {
        width: match[1],
        profile: match[2],
        diameter: match[3]
      }
    }
    return null
  }, [])

  // Apply size search
  useEffect(() => {
    if (sizeSearchTerm) {
      const parsed = parseSizeSearch(sizeSearchTerm)
      if (parsed) {
        updateFilters({
          selectedWidth: parsed.width,
          selectedProfile: parsed.profile,
          selectedDiameter: parsed.diameter
        })
      }
    }
  }, [sizeSearchTerm, parseSizeSearch, updateFilters])

  // Extract unique values with dynamic counter
  const extractUniqueValues = useMemo(() => {
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

    // Calculate unique values with counters
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))]
      .map(brand => ({
        value: brand,
        count: baseProducts.filter(p => p.brand === brand).length
      }))
      .sort((a, b) => a.value.localeCompare(b.value))

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
      .map(cat => ({
        value: cat,
        count: baseProducts.filter(p => p.category === cat).length
      }))
      .sort((a, b) => a.value.localeCompare(b.value))

    const models = [...new Set(products.map(p => p.model).filter((m): m is string => Boolean(m)))]
      .map(model => ({
        value: model,
        count: baseProducts.filter(p => p.model === model).length
      }))
      .sort((a, b) => a.value.localeCompare(b.value))

    const widths = [...new Set(products.map(p => p.width).filter(Boolean))]
      .map(w => ({
        value: String(w),
        count: baseProducts.filter(p => String(p.width) === String(w)).length
      }))
      .sort((a, b) => Number(a.value) - Number(b.value))

    const profiles = [...new Set(products.map(p => p.profile).filter(Boolean))]
      .map(p => ({
        value: String(p),
        count: baseProducts.filter(pr => String(pr.profile) === String(p)).length
      }))
      .sort((a, b) => Number(a.value) - Number(b.value))

    const diameters = [...new Set(products.map(p => p.diameter).filter(Boolean))]
      .map(d => ({
        value: String(d),
        count: baseProducts.filter(p => String(p.diameter) === String(d)).length
      }))
      .sort((a, b) => Number(a.value) - Number(b.value))

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

    const isSearchingBySize =
      (selectedWidth !== "all" && selectedWidth !== "") &&
      (selectedProfile !== "all" && selectedProfile !== "") &&
      (selectedDiameter !== "all" && selectedDiameter !== "")

    if (!isSearchingBySize) {
      filtered = filtered.filter(p => p.stock > 0)
    }

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

    if (selectedBrand && selectedBrand !== "all") {
      filtered = filtered.filter(p => p.brand === selectedBrand)
    }

    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (selectedModel && selectedModel !== "all") {
      filtered = filtered.filter(p => p.model === selectedModel)
    }

    if (selectedWidth && selectedWidth !== "all") {
      filtered = filtered.filter(p => String(p.width) === selectedWidth)
    }
    if (selectedProfile && selectedProfile !== "all") {
      filtered = filtered.filter(p => String(p.profile) === selectedProfile)
    }
    if (selectedDiameter && selectedDiameter !== "all") {
      filtered = filtered.filter(p => String(p.diameter) === selectedDiameter)
    }

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
  }, [products, debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter, sortBy])

  // Equivalences
  const shouldShowEquivalences =
    selectedWidth !== "all" &&
    selectedProfile !== "all" &&
    selectedDiameter !== "all"

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

  const hasExactMatch = filteredProducts.length > 0
  const hasExactMatchWithStock = filteredProducts.some(p => p.stock > 0)
  const hasExactMatchWithoutStock = hasExactMatch && !hasExactMatchWithStock

  const scrollToTop = useCallback(() => {
    setTimeout(() => {
      window.scrollTo(0, 0)
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        })
      })
    }, 50)
  }, [])

  useEffect(() => {
    updateFilter('currentPage', 1)
  }, [debouncedSearchTerm, selectedBrand, selectedCategory, selectedModel, selectedWidth, selectedProfile, selectedDiameter, sortBy, updateFilter])

  useEffect(() => {
    if (currentPage && !isLoading) {
      scrollToTop()
    }
  }, [currentPage, isLoading, scrollToTop])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startResult = filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endResult = Math.min(currentPage * itemsPerPage, filteredProducts.length)

  const handleClearFilters = useCallback(() => {
    setDebouncedSearchTerm("")
    clearFilters()
  }, [clearFilters])

  const handlePageChange = useCallback((page: number) => {
    updateFilter('currentPage', page)
    scrollToTop()
  }, [scrollToTop, updateFilter])

  const applyQuickSize = useCallback((width: string, profile: string, diameter: string) => {
    updateFilters({
      selectedWidth: width,
      selectedProfile: profile,
      selectedDiameter: diameter,
      sizeSearchTerm: profile ? `${width}/${profile}R${diameter}` : `${width}-${diameter}`
    })
  }, [updateFilters])

  // Handle search submit (on Enter or button click)
  // Each search is independent - clears all other filters
  const handleSearchSubmit = useCallback(() => {
    // Clear all other filters and only apply the search term
    setInputSizeSearchTerm("")
    updateFilters({
      searchTerm: inputSearchTerm,
      selectedBrand: "all",
      selectedCategory: "all",
      selectedModel: "all",
      selectedWidth: "all",
      selectedProfile: "all",
      selectedDiameter: "all",
      sizeSearchTerm: ""
    })
  }, [inputSearchTerm, updateFilters])

  // Handle size search submit (on Enter or button click)
  const handleSizeSearchSubmit = useCallback(() => {
    updateFilter('sizeSearchTerm', inputSizeSearchTerm)
  }, [inputSizeSearchTerm, updateFilter])

  const hasActiveFilters = searchTerm || (selectedBrand !== "all") || (selectedCategory !== "all") || (selectedModel !== "all") || (selectedWidth !== "all") || (selectedProfile !== "all") || (selectedDiameter !== "all")

  const activeFiltersCount = [
    selectedBrand !== "all",
    selectedCategory !== "all",
    selectedModel !== "all",
    selectedWidth !== "all",
    selectedProfile !== "all",
    selectedDiameter !== "all"
  ].filter(Boolean).length

  // Props object for FiltersContent component (extracted outside to prevent re-renders)
  const filtersProps: FiltersContentProps = {
    sizeSearchTerm,
    inputSizeSearchTerm,
    setInputSizeSearchTerm,
    handleSizeSearchSubmit,
    searchTerm,
    inputSearchTerm,
    setInputSearchTerm,
    handleSearchSubmit,
    selectedBrand,
    selectedCategory,
    selectedModel,
    selectedWidth,
    selectedProfile,
    selectedDiameter,
    updateFilter: updateFilter as (key: string, value: string | number) => void,
    updateFilters: updateFilters as (filters: Record<string, string | number>) => void,
    showSizeSuggestions,
    setShowSizeSuggestions,
    extractUniqueValues,
    applyQuickSize
  }

  if (isLoading) {
    return <AgroCamionesSkeleton />
  }

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

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <StockInfoPopup delayMs={2000} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Agro y Camiones</h1>
              <p className="text-sm text-gray-600">Neumáticos para vehículos pesados y maquinaria agrícola</p>
            </div>
            {stats && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="h-4 w-4" />
                <span>{stats.inStock} disponibles</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="relative flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-800">Filtros</h2>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <>
                      <Button
                        onClick={() => {
                          const url = generateShareableURL(filters)
                          navigator.clipboard.writeText(url)
                            .then(() => alert('Enlace copiado al portapapeles!'))
                            .catch(() => alert('No se pudo copiar el enlace'))
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-[11px] text-gray-500 hover:text-gray-700"
                        title="Compartir filtros actuales"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        <span className="text-[11px]">Compartir</span>
                      </Button>
                      <Button
                        onClick={handleClearFilters}
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-[11px] text-gray-500 hover:text-gray-700"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        <span className="text-[11px]">Limpiar</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <FiltersContent {...filtersProps} />
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
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              const url = generateShareableURL(filters)
                              navigator.clipboard.writeText(url)
                                .then(() => alert('Enlace copiado al portapapeles!'))
                                .catch(() => alert('No se pudo copiar el enlace'))
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-sm text-gray-500 hover:text-gray-700"
                            title="Compartir filtros actuales"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={handleClearFilters}
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-sm text-gray-500 hover:text-gray-700"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Limpiar
                          </Button>
                        </div>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <FiltersContent {...filtersProps} />
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

            {/* Size Filter Section */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-300 shadow-md p-3 sm:p-5 mb-6">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1">Buscar por medida</h3>
                <p className="text-xs sm:text-sm text-gray-600">Seleccioná las medidas exactas para tu vehículo</p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 block">Ancho</label>
                  <Select value={selectedWidth} onValueChange={(value) => updateFilter('selectedWidth', value)}>
                    <SelectTrigger className="w-full h-9 sm:h-11 text-xs sm:text-sm font-medium bg-[#FFFFFF] border border-gray-300 sm:border-2 hover:border-gray-400 focus:border-black rounded-md">
                      <SelectValue>
                        <span className={selectedWidth === 'all' ? 'text-gray-400' : ''}>
                          {selectedWidth === 'all' ? 'ej: 295 mm' : `${selectedWidth} mm`}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm text-gray-400">ej: 295 mm</SelectItem>
                      {extractUniqueValues.widths.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-xs sm:text-sm">
                          <span className="font-medium">{value} mm</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 block">Perfil</label>
                  <Select value={selectedProfile} onValueChange={(value) => updateFilter('selectedProfile', value)}>
                    <SelectTrigger className="w-full h-9 sm:h-11 text-xs sm:text-sm font-medium bg-[#FFFFFF] border border-gray-300 sm:border-2 hover:border-gray-400 focus:border-black rounded-md">
                      <SelectValue>
                        <span className={selectedProfile === 'all' ? 'text-gray-400' : ''}>
                          {selectedProfile === 'all' ? 'ej: 80%' : `${selectedProfile}%`}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm text-gray-400">ej: 80%</SelectItem>
                      {extractUniqueValues.profiles.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-xs sm:text-sm">
                          <span className="font-medium">{value}%</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 block">Rodado</label>
                  <Select value={selectedDiameter} onValueChange={(value) => updateFilter('selectedDiameter', value)}>
                    <SelectTrigger className="w-full h-9 sm:h-11 text-xs sm:text-sm font-medium bg-[#FFFFFF] border border-gray-300 sm:border-2 hover:border-gray-400 focus:border-black rounded-md">
                      <SelectValue>
                        <span className={selectedDiameter === 'all' ? 'text-gray-400' : ''}>
                          {selectedDiameter === 'all' ? 'ej: R22.5"' : `R${selectedDiameter}"`}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm text-gray-400">ej: R22.5"</SelectItem>
                      {extractUniqueValues.diameters.filter(({ count }) => count > 0).map(({ value, count }) => (
                        <SelectItem key={value} value={value} className="text-xs sm:text-sm">
                          <span className="font-medium">R{value}"</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                        updateFilters({
                          selectedWidth: 'all',
                          selectedProfile: 'all',
                          selectedDiameter: 'all'
                        })
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
                {products.length === 0 ? (
                  <>
                    <div className="bg-yellow-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <Truck className="h-12 w-12 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Próximamente: Neumáticos para Agro y Camiones
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Estamos preparando nuestro catálogo especializado en neumáticos para vehículos agrícolas y camiones.
                      ¡Volvé pronto para ver nuestra selección!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/productos"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                      >
                        Ver catálogo general
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/turnos"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-colors font-medium"
                      >
                        <Calendar className="w-4 h-4" />
                        Consultar por turno
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                    <p className="text-gray-600 mb-6">
                      No hay productos que coincidan con tus criterios de búsqueda.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        onClick={handleClearFilters}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  {paginatedProducts.map((product) => {
                    const priceListFromFeatures = (product.features as ProductFeatures | undefined)?.price_list
                    const listPrice = priceListFromFeatures || product.price_list || Math.round(product.price / 0.75)
                    const discountPercentage = Math.round(((listPrice - product.price) / listPrice) * 100)

                    return (
                      <div key={product.id} className="group">
                        <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out h-full">
                          <div className="flex flex-col h-full">
                            <div className="w-full aspect-square bg-[#FFFFFF] relative overflow-hidden">
                              <Link href={`/agro-camiones/${product.id}`} className="block w-full h-full">
                                <img
                                  src={product.image_url || "/tire.webp"}
                                  alt={product.name}
                                  className={`w-full h-full object-contain p-3 lg:p-4 transition-transform duration-500 ease-out ${
                                    product.stock === 0 ? 'opacity-50' : 'group-hover:scale-105'
                                  }`}
                                  loading="lazy"
                                />
                              </Link>

                              {product.stock === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                  <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transform rotate-[-5deg]">
                                    <span className="text-base lg:text-lg font-bold uppercase tracking-wider">Sin Stock</span>
                                  </div>
                                </div>
                              )}

                              {product.stock > 0 && (
                                <div className="absolute bottom-2 right-2 z-10">
                                  <QuickAddButton
                                    productId={product.id}
                                    disabled={product.stock === 0}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col p-4">
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate mb-2">
                                {product.brand}
                              </div>

                              <Link href={`/agro-camiones/${product.id}`} className="mb-1">
                                <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                                  {product.width && product.profile && product.diameter &&
                                   product.width > 0 && product.profile > 0 && product.diameter > 0
                                    ? `${product.width}/${product.profile}R${product.diameter}`
                                    : product.name}
                                </h3>
                              </Link>

                              <div className="text-xs text-gray-600 truncate mb-2">
                                {product.model || '\u00A0'}
                              </div>

                              {(product.features as ProductFeatures | undefined)?.codigo_proveedor && (
                                <div className="text-[10px] text-gray-500 mb-2">
                                  Cód: {(product.features as ProductFeatures).codigo_proveedor}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {product.stock > 0 ? (
                                  <>
                                    <span className={`text-[10px] px-2 py-1 rounded font-semibold ${
                                      product.stock === 1
                                        ? 'bg-orange-50 text-orange-700'
                                        : 'bg-green-50 text-green-700'
                                    }`}>
                                      Stock: {(() => {
                                        if (product.stock === 1) return 'Última unidad'
                                        if (product.stock <= 10) return `${product.stock} unidades`
                                        if (product.stock <= 50) return '+10 unidades'
                                        if (product.stock <= 100) return '+50 unidades'
                                        return '+100 unidades'
                                      })()}
                                    </span>
                                    {product.stock > 15 && (
                                      <span className="text-[10px] text-green-600 font-medium">
                                        Envío gratis
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] px-2 py-1 rounded font-semibold bg-gray-100 text-gray-600">
                                    Sin stock
                                  </span>
                                )}
                              </div>

                              {product.stock > 0 ? (
                                <div className="mt-auto pt-2 border-t border-gray-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500 line-through">
                                      ${listPrice.toLocaleString('es-AR')}
                                    </span>
                                    {discountPercentage > 0 && (
                                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded transition-all duration-200 group-hover:bg-green-100">
                                        {discountPercentage}% OFF
                                      </span>
                                    )}
                                  </div>

                                  <div className="mb-1">
                                    <span className="text-xl font-bold text-gray-900">
                                      ${Number(product.price).toLocaleString('es-AR')}
                                    </span>
                                  </div>

                                  <div className="text-[10px] text-gray-600">
                                    3 cuotas sin interés de ${Math.floor(product.price / 3).toLocaleString('es-AR')}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-auto pt-2 border-t border-gray-200">
                                  <div className="py-3 flex flex-col items-center justify-center space-y-2">
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <svg
                                        className="w-5 h-5 text-green-600"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                      </svg>
                                      <span className="text-sm font-medium">Consultá disponibilidad</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const message = `Hola! Me interesa el neumático ${product.brand} ${product.name} ${product.model || ''} (${product.width}/${product.profile}R${product.diameter}). En la web figura sin stock. ¿Cuándo tendrán disponible?`;
                                        const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493855946462';
                                        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                                        window.open(whatsappUrl, '_blank');
                                      }}
                                      className="text-xs text-green-600 hover:text-green-700 underline transition-colors"
                                    >
                                      Escribinos por WhatsApp
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {shouldShowEquivalences && (
              <EquivalencesSection
                equivalentTires={equivalents}
                hasExactMatch={hasExactMatchWithStock}
                hasExactMatchWithoutStock={hasExactMatchWithoutStock}
                loading={loadingEquivalents}
                originalSize={{
                  width: Number(selectedWidth),
                  profile: Number(selectedProfile),
                  diameter: Number(selectedDiameter)
                }}
              />
            )}

            {filteredProducts.length > 0 && (
              <div className="mt-8 bg-[#FFFFFF] p-3 rounded-lg border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    Mostrando <span className="font-medium text-black">{startResult}-{endResult}</span> de <span className="font-medium text-black">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'producto' : 'productos'}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Por página:</span>
                      <Select value={String(itemsPerPage)} onValueChange={(val) => {
                        updateFilters({
                          itemsPerPage: Number(val),
                          currentPage: 1
                        })
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

                    <Select value={sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
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

            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-8 mb-8">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[40px] h-[40px] flex items-center justify-center text-sm rounded-lg transition-all ${
                          page === currentPage
                            ? 'text-blue-600 border-2 border-blue-600 font-medium'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="sm:hidden text-center mt-4 text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
