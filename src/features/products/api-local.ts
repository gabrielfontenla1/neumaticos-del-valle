import { Product, ProductFilters } from './types'

// Mock products data
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Pilot Sport 4',
    brand: 'Michelin',
    model: 'Sport',
    category: 'Verano',
    width: 225,
    profile: 45,
    diameter: 17,
    price: 120000,
    stock: 20,
    description: 'Neumático deportivo de alta performance para verano',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'A',
      wet_grip: 'A',
      noise_level: 69
    },
    images: ['/tire.webp'],
    sku: 'MICH-PS4-225-45-17',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Potenza RE050',
    brand: 'Bridgestone',
    model: 'Potenza',
    category: 'Verano',
    width: 245,
    profile: 40,
    diameter: 18,
    price: 135000,
    stock: 15,
    description: 'Neumático de alta performance para vehículos deportivos',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'B',
      wet_grip: 'A',
      noise_level: 70
    },
    images: ['/tire.webp'],
    sku: 'BRID-RE050-245-40-18',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'P Zero',
    brand: 'Pirelli',
    model: 'P Zero',
    category: 'Verano',
    width: 255,
    profile: 35,
    diameter: 19,
    price: 180000,
    stock: 10,
    description: 'Neumático premium para autos deportivos de alta gama',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'B',
      wet_grip: 'A',
      noise_level: 71
    },
    images: ['/tire.webp'],
    sku: 'PIR-PZ-255-35-19',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'ContiSportContact 5',
    brand: 'Continental',
    model: 'SportContact',
    category: 'Verano',
    width: 215,
    profile: 55,
    diameter: 17,
    price: 95000,
    stock: 25,
    description: 'Neumático deportivo con excelente agarre en mojado',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'A',
      wet_grip: 'A',
      noise_level: 68
    },
    images: ['/tire.webp'],
    sku: 'CONT-SC5-215-55-17',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Eagle F1 Asymmetric 5',
    brand: 'Goodyear',
    model: 'Eagle F1',
    category: 'Verano',
    width: 235,
    profile: 45,
    diameter: 18,
    price: 110000,
    stock: 18,
    description: 'Neumático de ultra alta performance con tecnología ActiveBraking',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'B',
      wet_grip: 'A',
      noise_level: 69
    },
    images: ['/tire.webp'],
    sku: 'GOOD-EF1-235-45-18',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'SP Sport Maxx GT',
    brand: 'Dunlop',
    model: 'Sport Maxx',
    category: 'Verano',
    width: 265,
    profile: 30,
    diameter: 20,
    price: 195000,
    stock: 8,
    description: 'Neumático de máxima performance para vehículos de lujo',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'C',
      wet_grip: 'A',
      noise_level: 72
    },
    images: ['/tire.webp'],
    sku: 'DUNL-SM-265-30-20',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '7',
    name: 'CrossClimate 2',
    brand: 'Michelin',
    model: 'CrossClimate',
    category: 'All Season',
    width: 205,
    profile: 55,
    diameter: 16,
    price: 85000,
    stock: 30,
    description: 'Neumático todo clima con certificación 3PMSF para nieve',
    features: {
      season: 'Todo el año',
      terrain: 'Mixto',
      fuel_efficiency: 'B',
      wet_grip: 'A',
      noise_level: 69
    },
    images: ['/tire.webp'],
    sku: 'MICH-CC2-205-55-16',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Turanza T005',
    brand: 'Bridgestone',
    model: 'Turanza',
    category: 'Touring',
    width: 195,
    profile: 65,
    diameter: 15,
    price: 75000,
    stock: 35,
    description: 'Neumático de touring con excelente confort y durabilidad',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'A',
      wet_grip: 'A',
      noise_level: 67
    },
    images: ['/tire.webp'],
    sku: 'BRID-T005-195-65-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Cinturato P7',
    brand: 'Pirelli',
    model: 'Cinturato',
    category: 'Eco',
    width: 225,
    profile: 50,
    diameter: 17,
    price: 98000,
    stock: 22,
    description: 'Neumático ecológico con baja resistencia a la rodadura',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'A',
      wet_grip: 'B',
      noise_level: 68
    },
    images: ['/tire.webp'],
    sku: 'PIR-CP7-225-50-17',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '10',
    name: 'EcoContact 6',
    brand: 'Continental',
    model: 'EcoContact',
    category: 'Eco',
    width: 185,
    profile: 60,
    diameter: 15,
    price: 68000,
    stock: 40,
    description: 'Neumático optimizado para eficiencia de combustible',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'A',
      wet_grip: 'B',
      noise_level: 66
    },
    images: ['/tire.webp'],
    sku: 'CONT-EC6-185-60-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '11',
    name: 'Efficientgrip Performance',
    brand: 'Goodyear',
    model: 'Efficientgrip',
    category: 'Eco',
    width: 215,
    profile: 60,
    diameter: 16,
    price: 82000,
    stock: 28,
    description: 'Neumático con tecnología FuelSaving para menor consumo',
    features: {
      season: 'Verano',
      terrain: 'Asfalto',
      fuel_efficiency: 'A',
      wet_grip: 'B',
      noise_level: 67
    },
    images: ['/tire.webp'],
    sku: 'GOOD-EGP-215-60-16',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '12',
    name: 'Blizzak WS90',
    brand: 'Bridgestone',
    model: 'Blizzak',
    category: 'Invierno',
    width: 195,
    profile: 55,
    diameter: 16,
    price: 92000,
    stock: 0, // Sin stock para probar el filtro
    description: 'Neumático de invierno con tecnología NanoPro-Tech',
    features: {
      season: 'Invierno',
      terrain: 'Nieve/Hielo',
      fuel_efficiency: 'C',
      wet_grip: 'A',
      noise_level: 70
    },
    images: ['/tire.webp'],
    sku: 'BRID-WS90-195-55-16',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Generate more products with variations
function generateMoreProducts(): Product[] {
  const additionalProducts: Product[] = []
  const sizes = [
    { width: 175, profile: 65, diameter: 14 },
    { width: 185, profile: 65, diameter: 15 },
    { width: 195, profile: 55, diameter: 16 },
    { width: 205, profile: 55, diameter: 16 },
    { width: 215, profile: 55, diameter: 17 },
    { width: 225, profile: 45, diameter: 18 },
    { width: 235, profile: 40, diameter: 19 },
    { width: 245, profile: 35, diameter: 20 },
  ]

  const brands = ['Michelin', 'Bridgestone', 'Pirelli', 'Continental', 'Goodyear', 'Dunlop', 'Yokohama', 'Hankook', 'Falken', 'Toyo']
  const models = ['Sport', 'Touring', 'Eco', 'Performance', 'Comfort', 'All Season']

  let id = 13

  for (const brand of brands) {
    for (const size of sizes) {
      for (const model of models) {
        additionalProducts.push({
          id: String(id++),
          name: `${brand} ${model} ${size.width}/${size.profile}R${size.diameter}`,
          brand,
          model,
          category: model,
          width: size.width,
          profile: size.profile,
          diameter: size.diameter,
          price: 60000 + Math.floor(Math.random() * 100000),
          stock: Math.floor(Math.random() * 30),
          description: `Neumático ${model.toLowerCase()} de ${brand}`,
          features: {
            season: model === 'All Season' ? 'Todo el año' : 'Verano',
            terrain: 'Asfalto',
            fuel_efficiency: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
            wet_grip: ['A', 'B'][Math.floor(Math.random() * 2)],
            noise_level: 66 + Math.floor(Math.random() * 6)
          },
          images: ['/tire.webp'],
          sku: `${brand.substring(0, 4).toUpperCase()}-${model.substring(0, 2).toUpperCase()}-${size.width}-${size.profile}-${size.diameter}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        // Limit to reasonable number
        if (id > 500) break
      }
      if (id > 500) break
    }
    if (id > 500) break
  }

  return additionalProducts
}

// Combine mock products with generated ones
const ALL_PRODUCTS = [...MOCK_PRODUCTS, ...generateMoreProducts()]

// Get products with filters and pagination
export async function getProducts(
  filters: ProductFilters = {},
  page = 1,
  limit = 20
) {
  try {
    let products = [...ALL_PRODUCTS]

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase()
      products = products.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.model?.toLowerCase().includes(search)
      )
    }
    if (filters.brand) {
      products = products.filter(p => p.brand === filters.brand)
    }
    if (filters.category) {
      products = products.filter(p => p.category === filters.category)
    }
    if (filters.width) {
      products = products.filter(p => p.width === filters.width)
    }
    if (filters.profile) {
      products = products.filter(p => p.profile === filters.profile)
    }
    if (filters.diameter) {
      products = products.filter(p => p.diameter === filters.diameter)
    }
    if (filters.minPrice) {
      products = products.filter(p => p.price >= filters.minPrice!)
    }
    if (filters.maxPrice) {
      products = products.filter(p => p.price <= filters.maxPrice!)
    }
    if (filters.inStock) {
      products = products.filter(p => p.stock > 0)
    }

    // Sort by creation date (newest first)
    products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedProducts = products.slice(from, to)

    return {
      data: paginatedProducts,
      total: products.length,
      page,
      totalPages: Math.ceil(products.length / limit),
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

// Get product by ID
export async function getProductById(id: string) {
  try {
    const product = ALL_PRODUCTS.find(p => p.id === id)
    return product || null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Get unique brands
export async function getBrands() {
  try {
    const uniqueBrands = [...new Set(ALL_PRODUCTS.map(p => p.brand))]
    return uniqueBrands.filter(Boolean).sort()
  } catch (error) {
    console.error('Error fetching brands:', error)
    return []
  }
}

// Get unique categories
export async function getCategories() {
  try {
    const uniqueCategories = [...new Set(ALL_PRODUCTS.map(p => p.category))]
    return uniqueCategories.filter(Boolean).sort()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Get unique sizes
export async function getSizes() {
  try {
    const uniqueSizes = ALL_PRODUCTS
      .filter(p => p.width && p.profile && p.diameter)
      .reduce((acc: any[], product) => {
        const size = `${product.width}/${product.profile}R${product.diameter}`
        if (!acc.some(s => s.display === size)) {
          acc.push({
            display: size,
            width: product.width,
            profile: product.profile,
            diameter: product.diameter
          })
        }
        return acc
      }, [])

    return uniqueSizes.sort((a, b) => a.display.localeCompare(b.display))
  } catch (error) {
    console.error('Error fetching sizes:', error)
    return []
  }
}

// Search products (for autocomplete)
export async function searchProducts(query: string, limit = 10) {
  try {
    const search = query.toLowerCase()
    const results = ALL_PRODUCTS
      .filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search)
      )
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        size: `${p.width}/${p.profile}R${p.diameter}`,
        price: p.price
      }))

    return results
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

// Featured products
export async function getFeaturedProducts() {
  try {
    const featured = ALL_PRODUCTS
      .filter(p => p.stock > 0)
      .slice(0, 8)

    return featured
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}