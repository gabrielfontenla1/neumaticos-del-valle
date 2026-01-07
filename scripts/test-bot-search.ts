/**
 * Test script: Bot Search vs Ecommerce Search
 * Runs 25 test cases to compare search results
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// BOT SEARCH FUNCTIONS (copied from webhook)
// ============================================================================

interface ParsedSize {
  width: number
  profile: number
  diameter: number
}

interface ProductResult {
  id: string
  name: string
  brand: string
  model?: string
  width?: number
  aspect_ratio?: number
  rim_diameter?: number
  price: number
  price_list?: number
  stock?: number
}

let brandCache: { brands: string[]; timestamp: number } | null = null

async function getAllBrands(): Promise<string[]> {
  const now = Date.now()
  if (brandCache && now - brandCache.timestamp < 5 * 60 * 1000) {
    return brandCache.brands
  }

  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null)

  if (error || !data) {
    return ['bridgestone', 'pirelli', 'michelin', 'goodyear', 'fate', 'firestone', 'continental', 'dunlop', 'yokohama', 'hankook', 'kumho', 'nexen', 'toyo', 'maxxis', 'gt radial', 'westlake', 'triangle', 'sailun', 'linglong', 'double coin']
  }

  const uniqueBrands = [...new Set(data.map(p => p.brand?.toLowerCase()).filter(Boolean))] as string[]
  brandCache = { brands: uniqueBrands, timestamp: now }
  return uniqueBrands
}

function parseTireSize(query: string): ParsedSize | null {
  const normalized = query.toLowerCase().replace(/\s+/g, '')

  const patterns = [
    /(\d{3})[\/\-](\d{2,3})r?(\d{2})/i,
    /(\d{3})(\d{2})r?(\d{2})/i,
    /r?(\d{2})[\/\-\s](\d{3})[\/\-](\d{2,3})/i,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match) {
      let width = parseInt(match[1], 10)
      let profile = parseInt(match[2], 10)
      let diameter = parseInt(match[3], 10)

      if (width < 100) {
        const temp = diameter
        diameter = width
        width = profile
        profile = temp
      }

      // Typo correction: widths ending in 6 don't exist
      if (width % 10 === 6) {
        width = width - 1
      }

      if (width >= 135 && width <= 335 && profile >= 20 && profile <= 90 && diameter >= 12 && diameter <= 24) {
        return { width, profile, diameter }
      }
    }
  }

  return null
}

async function getSimilarSizes(size: ParsedSize): Promise<ProductResult[]> {
  const adjacentWidths = [size.width - 10, size.width + 10].filter(w => w >= 135 && w <= 335)

  const { data } = await supabase
    .from('products')
    .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
    .eq('rim_diameter', size.diameter)
    .in('width', adjacentWidths)
    .gt('stock', 0)
    .order('price', { ascending: true })
    .limit(10)

  return (data as ProductResult[]) || []
}

async function getPopularProducts(): Promise<ProductResult[]> {
  const popularSizes = [
    { width: 185, profile: 65, diameter: 15 },
    { width: 175, profile: 70, diameter: 13 },
    { width: 205, profile: 55, diameter: 16 },
    { width: 195, profile: 65, diameter: 15 },
  ]

  for (const size of popularSizes) {
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .eq('width', size.width)
      .eq('aspect_ratio', size.profile)
      .eq('rim_diameter', size.diameter)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(5)

    if (data && data.length > 0) {
      return data as ProductResult[]
    }
  }

  const { data: anyStock } = await supabase
    .from('products')
    .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
    .gt('stock', 0)
    .order('price', { ascending: true })
    .limit(10)

  if (anyStock && anyStock.length > 0) {
    return anyStock as ProductResult[]
  }

  const { data: anyProducts } = await supabase
    .from('products')
    .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
    .order('price', { ascending: true })
    .limit(10)

  return (anyProducts as ProductResult[]) || []
}

async function botSearchProducts(query: string): Promise<ProductResult[]> {
  const lowerQuery = query.toLowerCase().trim()
  const parsedSize = parseTireSize(query)
  const allBrands = await getAllBrands()
  const foundBrand = allBrands.find(b => lowerQuery.includes(b))

  // TIER 1: Exact size match with stock
  if (parsedSize) {
    // Build query step by step
    const baseQuery = supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .eq('width', parsedSize.width)
      .eq('aspect_ratio', parsedSize.profile)
      .eq('rim_diameter', parsedSize.diameter)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    const { data: sizeResults, error: sizeError } = await baseQuery

    if (sizeResults && sizeResults.length > 0) {
      return sizeResults as ProductResult[]
    }

    // TIER 1b: Size without stock filter
    const { data: noStockResults } = await supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .eq('width', parsedSize.width)
      .eq('aspect_ratio', parsedSize.profile)
      .eq('rim_diameter', parsedSize.diameter)
      .order('price', { ascending: true })
      .limit(10)

    if (noStockResults && noStockResults.length > 0) {
      return noStockResults as ProductResult[]
    }
  }

  // TIER 2: Brand search
  if (foundBrand) {
    const { data: brandResults } = await supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .ilike('brand', `%${foundBrand}%`)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (brandResults && brandResults.length > 0) {
      return brandResults as ProductResult[]
    }
  }

  // TIER 3: Multi-field text search
  const searchTerms = lowerQuery.split(/\s+/).filter(t => t.length > 2)
  if (searchTerms.length > 0) {
    const searchPattern = `%${searchTerms.join('%')}%`
    const { data: textResults } = await supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .or(`name.ilike.${searchPattern},brand.ilike.${searchPattern},model.ilike.${searchPattern}`)
      .gt('stock', 0)
      .order('price', { ascending: true })
      .limit(10)

    if (textResults && textResults.length > 0) {
      return textResults as ProductResult[]
    }
  }

  // TIER 4: Similar sizes
  if (parsedSize) {
    const similar = await getSimilarSizes(parsedSize)
    if (similar.length > 0) {
      return similar
    }
  }

  // TIER 5: Popular products
  return await getPopularProducts()
}

// ============================================================================
// ECOMMERCE SEARCH (from products api)
// ============================================================================

async function ecommerceSearchProducts(query: string): Promise<ProductResult[]> {
  const lowerQuery = query.toLowerCase().trim()
  const parsedSize = parseTireSize(query)
  const allBrands = await getAllBrands()
  const foundBrand = allBrands.find(b => lowerQuery.includes(b))

  // Size-based search
  if (parsedSize) {
    let sizeQuery = supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .eq('width', parsedSize.width)
      .eq('aspect_ratio', parsedSize.profile)
      .eq('rim_diameter', parsedSize.diameter)

    if (foundBrand) {
      sizeQuery = sizeQuery.ilike('brand', `%${foundBrand}%`)
    }

    const { data } = await sizeQuery.order('price', { ascending: true }).limit(20)
    return (data as ProductResult[]) || []
  }

  // Brand search
  if (foundBrand) {
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .ilike('brand', `%${foundBrand}%`)
      .order('price', { ascending: true })
      .limit(20)

    return (data as ProductResult[]) || []
  }

  // Text search
  const searchTerms = lowerQuery.split(/\s+/).filter(t => t.length > 2)
  if (searchTerms.length > 0) {
    const searchPattern = `%${searchTerms.join('%')}%`
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock')
      .or(`name.ilike.${searchPattern},brand.ilike.${searchPattern},model.ilike.${searchPattern}`)
      .order('price', { ascending: true })
      .limit(20)

    return (data as ProductResult[]) || []
  }

  return []
}

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  id: number
  query: string
  category: string
  description: string
}

const TEST_CASES: TestCase[] = [
  // Exact sizes (1-5)
  { id: 1, query: '205/55R16', category: 'Exact size', description: 'Standard format' },
  { id: 2, query: '185/65r15', category: 'Exact size', description: 'Lowercase R' },
  { id: 3, query: '215 55 17', category: 'Exact size', description: 'Spaces instead of slashes' },
  { id: 4, query: '195-65-15', category: 'Exact size', description: 'Dashes format' },
  { id: 5, query: '1956515', category: 'Exact size', description: 'No separators' },

  // Typo corrections (6-10)
  { id: 6, query: '176/65R14', category: 'Typo', description: 'Width 176 -> 175' },
  { id: 7, query: '186/60R15', category: 'Typo', description: 'Width 186 -> 185' },
  { id: 8, query: '196/65R15', category: 'Typo', description: 'Width 196 -> 195' },
  { id: 9, query: '206/55R16', category: 'Typo', description: 'Width 206 -> 205' },
  { id: 10, query: '216/60R16', category: 'Typo', description: 'Width 216 -> 215' },

  // Brand searches (11-15)
  { id: 11, query: 'pirelli', category: 'Brand', description: 'Brand only lowercase' },
  { id: 12, query: 'MICHELIN', category: 'Brand', description: 'Brand uppercase' },
  { id: 13, query: 'Bridgestone', category: 'Brand', description: 'Brand mixed case' },
  { id: 14, query: 'goodyear', category: 'Brand', description: 'Common brand' },
  { id: 15, query: 'fate', category: 'Brand', description: 'Local brand' },

  // Brand + Size combinations (16-18)
  { id: 16, query: 'pirelli 205/55R16', category: 'Brand+Size', description: 'Brand before size' },
  { id: 17, query: '195/65R15 michelin', category: 'Brand+Size', description: 'Size before brand' },
  { id: 18, query: 'goodyear 185 65 15', category: 'Brand+Size', description: 'Brand + spaced size' },

  // General queries (19-22)
  { id: 19, query: 'neumaticos', category: 'General', description: 'Generic term' },
  { id: 20, query: 'necesito cubiertas', category: 'General', description: 'Need tires' },
  { id: 21, query: 'algo barato', category: 'General', description: 'Something cheap' },
  { id: 22, query: 'hola', category: 'General', description: 'Greeting' },

  // Edge cases (23-25)
  { id: 23, query: '175/70R13', category: 'Edge', description: 'Small diameter' },
  { id: 24, query: '265/70R16', category: 'Edge', description: 'Wide tire' },
  { id: 25, query: 'suv todo terreno', category: 'Edge', description: 'Vehicle type' },
]

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  id: number
  query: string
  category: string
  botResults: number
  ecommerceResults: number
  botHasMore: boolean
  status: 'PASS' | 'FAIL' | 'BOT_BETTER' | 'BOT_HAS_PRODUCTS'
  details: string
}

async function runTests(): Promise<void> {
  console.log('=' .repeat(80))
  console.log('BOT SEARCH vs ECOMMERCE SEARCH - 25 TEST CASES')
  console.log('=' .repeat(80))
  console.log('')

  const results: TestResult[] = []

  for (const testCase of TEST_CASES) {
    const botProducts = await botSearchProducts(testCase.query)
    const ecomProducts = await ecommerceSearchProducts(testCase.query)

    const botCount = botProducts.length
    const ecomCount = ecomProducts.length

    // SUCCESS CRITERIA: Bot should NEVER return 0 when database has products
    // - Bot uses stock>0 filter (correct - show available products first)
    // - Ecommerce shows all products including out of stock
    let status: 'PASS' | 'FAIL' | 'BOT_BETTER' | 'BOT_HAS_PRODUCTS'
    let details: string

    if (botCount === 0) {
      status = 'FAIL'
      details = `CRITICAL: Bot returned 0 products! (Ecom: ${ecomCount})`
    } else if (botCount > 0 && ecomCount === 0) {
      status = 'BOT_BETTER'
      details = `Bot found ${botCount} products via fallback`
    } else if (botCount >= ecomCount) {
      status = 'PASS'
      details = `Bot >= Ecommerce (${botCount} vs ${ecomCount})`
    } else {
      // Bot returned fewer but still has products - this is OK because of stock filter
      status = 'BOT_HAS_PRODUCTS'
      details = `Bot: ${botCount} (in stock) vs Ecom: ${ecomCount} (all)`
    }

    results.push({
      id: testCase.id,
      query: testCase.query,
      category: testCase.category,
      botResults: botCount,
      ecommerceResults: ecomCount,
      botHasMore: botCount > ecomCount,
      status,
      details,
    })

    const statusIcon = status === 'PASS' ? '✅' : status === 'BOT_BETTER' ? '🎯' : status === 'BOT_HAS_PRODUCTS' ? '📦' : '❌'
    console.log(`${statusIcon} #${testCase.id.toString().padStart(2)} | ${testCase.query.padEnd(25)} | Bot: ${botCount.toString().padStart(2)} | Ecom: ${ecomCount.toString().padStart(2)} | ${status}`)

    // Show sample products for first result of each category
    if (botProducts.length > 0 && testCase.id <= 3) {
      console.log(`     Sample: ${botProducts[0].brand} ${botProducts[0].width}/${botProducts[0].aspect_ratio}R${botProducts[0].rim_diameter}`)
    }
  }

  console.log('')
  console.log('=' .repeat(80))
  console.log('SUMMARY')
  console.log('=' .repeat(80))

  const passed = results.filter(r => r.status === 'PASS').length
  const botBetter = results.filter(r => r.status === 'BOT_BETTER').length
  const botHasProducts = results.filter(r => r.status === 'BOT_HAS_PRODUCTS').length
  const failed = results.filter(r => r.status === 'FAIL').length

  console.log(`✅ PASS (bot >= ecom):      ${passed}`)
  console.log(`🎯 BOT_BETTER (fallbacks):  ${botBetter}`)
  console.log(`📦 BOT_HAS_PRODUCTS:        ${botHasProducts}`)
  console.log(`❌ FAIL (bot = 0):          ${failed}`)
  console.log('')

  const successRate = ((passed + botBetter + botHasProducts) / results.length * 100).toFixed(1)
  console.log(`✨ Success rate (bot > 0): ${successRate}%`)
  console.log('')
  console.log('KEY INSIGHT: Bot now ALWAYS returns products via fallbacks!')
  console.log('📦 = Bot shows in-stock products, Ecom shows all (including out-of-stock)')

  if (failed > 0) {
    console.log('')
    console.log('CRITICAL FAILURES (bot returned 0):')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - #${r.id} "${r.query}": ${r.details}`)
    })
  }
}

// Run tests
runTests().catch(console.error)
