// Admin Products Management Page - Exact Rapicompras Style
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Package,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Plus,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { updateProductStock, deleteProduct } from '@/features/admin/api'
import { createClient } from '@supabase/supabase-js'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { EditProductDialog } from '@/features/admin/components/products'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  input: '#262626',
  secondary: '#262626',
}

interface Product {
  id: string
  name: string
  sku: string
  brand_name: string
  category: string
  size?: string
  price: number
  stock: number
  image_url?: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingStockProduct, setEditingStockProduct] = useState<string | null>(null)
  const [editStock, setEditStock] = useState<{ [key: string]: number }>({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, sortBy, sortOrder, selectedCategory])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])

  // Scroll to top when page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)
    return () => clearTimeout(timer)
  }, [currentPage])

  const loadProducts = async () => {
    setIsLoading(true)
    // Create untyped client to avoid type inference issues
    const untypedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await untypedClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data as Product[])
      // Initialize edit stock values
      const stockValues: { [key: string]: number } = {}
      data.forEach((p: Product) => {
        stockValues[p.id] = p.stock
      })
      setEditStock(stockValues)
    }
    setIsLoading(false)
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'stock':
          aVal = a.stock
          bVal = b.stock
          break
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        default:
          aVal = a.name
          bVal = b.name
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredProducts(filtered)
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleUpdateStock = async (productId: string) => {
    const newStock = editStock[productId]
    const result = await updateProductStock(productId, newStock)

    if (result.success) {
      // Update local state
      setProducts(products.map(p =>
        p.id === productId ? { ...p, stock: newStock } : p
      ))
      setEditingStockProduct(null)
    } else {
      alert(`Error al actualizar stock: ${result.error}`)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${productName}"?`)) {
      return
    }

    const result = await deleteProduct(productId)

    if (result.success) {
      setProducts(products.filter(p => p.id !== productId))
    } else {
      alert(`Error al eliminar producto: ${result.error}`)
    }
  }

  const toggleSort = (field: 'name' | 'stock' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getCategories = () => {
    const cats = new Set(products.map(p => p.category))
    return Array.from(cats).filter(Boolean)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const SortIcon = ({ field }: { field: 'name' | 'stock' | 'price' }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ?
      <ChevronUp className="w-4 h-4" /> :
      <ChevronDown className="w-4 h-4" />
  }

  const PaginationControls = () => (
    <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderTopColor: colors.border }}>
      <div className="text-sm" style={{ color: colors.mutedForeground }}>
        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} productos
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: colors.secondary,
            color: currentPage === 1 ? colors.mutedForeground : colors.foreground
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className="px-3 py-1 rounded-lg transition-colors"
                style={{
                  backgroundColor: currentPage === pageNum ? colors.primary : colors.secondary,
                  color: currentPage === pageNum ? '#ffffff' : colors.foreground
                }}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: colors.secondary,
            color: currentPage === totalPages ? colors.mutedForeground : colors.foreground
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <main className="p-6 space-y-6 min-h-screen">
        {/* Header Card Skeleton */}
        <div
          className="rounded-lg shadow-xl p-6 flex items-center justify-between"
          style={{ backgroundColor: colors.card }}
        >
          <div className="space-y-2">
            <div className="h-7 w-48 bg-[#3a3a38] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#3a3a38]/60 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-[#d97757]/30 rounded-lg animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-[#3a3a38] rounded-lg animate-pulse" />
            <div className="w-48 h-10 bg-[#3a3a38] rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: colors.card }}
        >
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 p-4 border-b border-[#3a3a38]">
            {['Producto', 'Marca', 'Categoría', 'Precio', 'Stock', 'Acciones'].map((_, i) => (
              <div key={i} className="h-4 bg-[#3a3a38]/60 rounded animate-pulse" />
            ))}
          </div>

          {/* Table Rows */}
          {Array.from({ length: 10 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-6 gap-4 p-4 border-b border-[#3a3a38]/50 items-center"
              style={{ animationDelay: `${rowIndex * 50}ms` }}
            >
              {/* Producto */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#3a3a38] rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[#3a3a38] rounded animate-pulse" />
                  <div className="h-3 w-20 bg-[#3a3a38]/40 rounded animate-pulse" />
                </div>
              </div>
              {/* Marca */}
              <div className="h-4 w-24 bg-[#3a3a38] rounded animate-pulse" />
              {/* Categoría */}
              <div className="h-6 w-20 bg-[#3a3a38] rounded-full animate-pulse" />
              {/* Precio */}
              <div className="h-4 w-20 bg-[#3a3a38] rounded animate-pulse" />
              {/* Stock */}
              <div className="h-8 w-16 bg-[#3a3a38] rounded animate-pulse" />
              {/* Acciones */}
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-[#3a3a38] rounded animate-pulse" />
                <div className="h-8 w-8 bg-[#3a3a38] rounded animate-pulse" />
                <div className="h-8 w-8 bg-[#3a3a38] rounded animate-pulse" />
              </div>
            </div>
          ))}

          {/* Pagination Skeleton */}
          <div className="px-6 py-4 border-t border-[#3a3a38] flex items-center justify-between">
            <div className="h-4 w-48 bg-[#3a3a38]/60 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-[#3a3a38] rounded-lg animate-pulse" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 w-8 bg-[#3a3a38] rounded-lg animate-pulse" />
                ))}
              </div>
              <div className="h-9 w-9 bg-[#3a3a38] rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-3 text-[#888888]">
          <Loader2 className="w-5 h-5 animate-spin text-[#d97757]" />
          <span className="text-sm">Cargando productos...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-6">
        {/* Header Card */}
        <motion.div
          className="rounded-lg shadow-xl p-6 flex items-center justify-between"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
              Gestión de Productos
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
              {products.length} productos en total
            </p>
          </div>
          <button className="font-semibold py-2 px-4 rounded-lg flex items-center gap-2 cursor-pointer transition-all"
            style={{
              backgroundColor: colors.primary,
              color: '#ffffff'
            }}>
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </motion.div>

        {/* Filters */}
        <div className="rounded-xl p-4" style={{
          backgroundColor: colors.card,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        }}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5" style={{ color: colors.mutedForeground }} />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg outline-none"
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.foreground
              }}
            >
              <option value="all">Todas las categorías</option>
              {getCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-xl overflow-hidden" style={{
          backgroundColor: colors.card,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        }}>
          {/* Pagination Top */}
          {filteredProducts.length > 0 && <PaginationControls />}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.secondary }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Producto
                  </th>
                  <th
                    onClick={() => toggleSort('name')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: colors.mutedForeground }}
                  >
                    <div className="flex items-center gap-1">
                      Nombre
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    SKU
                  </th>
                  <th
                    onClick={() => toggleSort('price')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: colors.mutedForeground }}
                  >
                    <div className="flex items-center gap-1">
                      Precio
                      <SortIcon field="price" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('stock')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: colors.mutedForeground }}
                  >
                    <div className="flex items-center gap-1">
                      Stock
                      <SortIcon field="stock" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderTopColor: colors.border }}>
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="transition-colors" style={{ borderBottomWidth: '1px', borderBottomColor: colors.border }}>
                    <td className="px-6 py-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: colors.secondary }}>
                          <Package className="w-6 h-6" style={{ color: colors.mutedForeground }} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium" style={{ color: colors.foreground }}>
                          {product.name}
                        </p>
                        <p className="text-sm" style={{ color: colors.mutedForeground }}>
                          {product.brand_name} • {product.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm" style={{ color: colors.foreground }}>
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 font-semibold" style={{ color: colors.foreground }}>
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4">
                      {editingStockProduct === product.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editStock[product.id]}
                            onChange={(e) => setEditStock({
                              ...editStock,
                              [product.id]: parseInt(e.target.value) || 0
                            })}
                            className="w-20 px-2 py-1 border rounded"
                            style={{
                              backgroundColor: colors.input,
                              borderColor: colors.border,
                              color: colors.foreground
                            }}
                            min="0"
                          />
                          <button
                            onClick={() => handleUpdateStock(product.id)}
                            className="p-1 rounded cursor-pointer transition-colors"
                            style={{ color: '#10b981' }}
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingStockProduct(null)}
                            className="p-1 rounded cursor-pointer transition-colors"
                            style={{ color: colors.mutedForeground }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-sm font-medium rounded-full"
                            style={{
                              backgroundColor: product.stock === 0 ? '#7f1d1d20' : product.stock < 5 ? '#78350f20' : '#14532d20',
                              color: product.stock === 0 ? '#fca5a5' : product.stock < 5 ? '#fcd34d' : '#86efac'
                            }}>
                            {product.stock}
                          </span>
                          {product.stock < 5 && product.stock > 0 && (
                            <AlertTriangle className="w-4 h-4" style={{ color: '#ca8a04' }} />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}`)}
                          className="p-1 rounded cursor-pointer transition-colors"
                          style={{ color: '#10b981' }}
                          title="Ver detalles completos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProductId(product.id)
                            setEditDialogOpen(true)
                          }}
                          className="p-1 rounded cursor-pointer transition-colors"
                          style={{ color: colors.primary }}
                          title="Editar producto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1 rounded cursor-pointer transition-colors"
                          style={{ color: '#ef4444' }}
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-3" style={{ color: colors.mutedForeground }} />
                <p style={{ color: colors.mutedForeground }}>
                  {searchTerm || selectedCategory !== 'all'
                    ? 'No se encontraron productos con los filtros aplicados'
                    : 'No hay productos registrados'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination Bottom */}
          {filteredProducts.length > 0 && <PaginationControls />}
        </div>

        {/* Edit Product Dialog */}
        <EditProductDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          productId={editingProductId}
          onSuccess={loadProducts}
        />
    </main>
  )
}
