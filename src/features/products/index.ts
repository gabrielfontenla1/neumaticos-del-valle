// Tipos
export type { Product, ProductFilters, ImportRow } from './types'

// API
export {
  getProducts,
  getProductById,
  getBrands,
  getCategories,
  getSizes,
  importProducts,
  searchProducts,
  getFeaturedProducts
} from './api'

// Hooks
export { useProducts, useFeaturedProducts, useProductSearch } from './hooks/useProducts'

// Componentes
export { default as ProductCard } from './catalog/ProductCard'
export { default as ProductGrid } from './catalog/ProductGrid'
export { default as ProductDetail } from './catalog/ProductDetail'
export { default as FeaturedProducts } from './catalog/FeaturedProducts'
export { default as ExcelImporter } from './import/ExcelImporter'