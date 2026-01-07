/**
 * Test script: Excel vs Ecommerce (DB) vs Bot - 50 Test Cases
 * Compares product data across three sources to ensure consistency
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// TYPES
// ============================================================================

interface ExcelRow {
  CODIGO_PROPIO: string
  CODIGO_PROVEEDOR: string
  DESCRIPCION: string
  MARCA: string
  PUBLICO: number
  CONTADO: number
  SANTIAGO: number
  TUCUMAN: number
  CATAMARCA: number
  LA_BANDA: number
  SALTA: number
  VIRGEN: number
}

interface ParsedTire {
  width: number
  profile: number
  diameter: number
  brand: string
  priceList: number
  priceCash: number
  totalStock: number
  rawDescription: string
  modelHint: string // Extracted model hint from description
}

interface DBProduct {
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
  features?: {
    price_list?: number
  }
}

interface TestResult {
  testNum: number
  description: string
  brand: string
  size: string
  excel: {
    price: number
    priceList: number
    stock: number
  }
  db: {
    found: boolean
    price: number | null
    priceList: number | null
    stock: number | null
    count: number
  }
  bot: {
    found: boolean
    price: number | null
    count: number
  }
  status: 'PASS' | 'FAIL'
  failures: string[]
}

// ============================================================================
// EXCEL PARSING
// ============================================================================

function parseExcelTireDescription(desc: string): { width: number; profile: number; diameter: number } | null {
  // Parse sizes like "205/55R16", "185/65 R15", "195/65R15 91H", "235/35ZR19"
  const patterns = [
    /(\d{3})[\/\-\s](\d{2})Z?[Rr](\d{2})/,  // Standard format: 205/55R16 or 235/35ZR19
    /(\d{3})(\d{2})Z?[Rr](\d{2})/,            // No separator: 2055516
  ]

  for (const pattern of patterns) {
    const match = desc.match(pattern)
    if (match) {
      const width = parseInt(match[1], 10)
      const profile = parseInt(match[2], 10)
      const diameter = parseInt(match[3], 10)

      if (width >= 135 && width <= 335 && profile >= 20 && profile <= 90 && diameter >= 12 && diameter <= 24) {
        return { width, profile, diameter }
      }
    }
  }

  return null
}

function extractModelHint(description: string): string {
  // Extract model name from description after the size and load/speed index
  // E.g., "195/65R15 91H P1cint" -> "P1cint"
  // E.g., "205/55R16 91V CINTURATO P7" -> "CINTURATO P7"
  const cleaned = description
    .replace(/\d{3}\/\d{2}Z?R\d{2}/i, '')  // Remove size
    .replace(/\d{2,3}[HVSTWYZ](\s|$)/i, '') // Remove load/speed index
    .replace(/XL|R-F|RFT|TT|TL|\(.*?\)/gi, '') // Remove markers
    .trim()

  return cleaned.toLowerCase()
}

function parseExcelRow(row: ExcelRow): ParsedTire | null {
  if (!row.DESCRIPCION || !row.MARCA) return null

  const size = parseExcelTireDescription(row.DESCRIPCION)
  if (!size) return null

  const totalStock =
    (Number(row.SANTIAGO) || 0) +
    (Number(row.TUCUMAN) || 0) +
    (Number(row.CATAMARCA) || 0) +
    (Number(row.LA_BANDA) || 0) +
    (Number(row.SALTA) || 0) +
    (Number(row.VIRGEN) || 0)

  return {
    width: size.width,
    profile: size.profile,
    diameter: size.diameter,
    brand: row.MARCA.trim(),
    priceList: Number(row.PUBLICO) || 0,
    priceCash: Number(row.CONTADO) || 0,
    totalStock,
    rawDescription: row.DESCRIPCION,
    modelHint: extractModelHint(row.DESCRIPCION),
  }
}

function loadExcel(filePath: string): ExcelRow[] {
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Excel file not found: ${absolutePath}`)
  }

  const workbook = XLSX.readFile(absolutePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Skip the first row (title row) - data starts at row 2 (index 1)
  const data = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { range: 1 })

  return data
}

// ============================================================================
// BOT SEARCH FUNCTIONS (copied from webhook)
// ============================================================================

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

function parseTireSize(query: string): { width: number; profile: number; diameter: number } | null {
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

async function botSearchProducts(width: number, profile: number, diameter: number, brand?: string): Promise<DBProduct[]> {
  // TIER 1: Exact size match with stock
  let query = supabase
    .from('products')
    .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock, features')
    .eq('width', width)
    .eq('aspect_ratio', profile)
    .eq('rim_diameter', diameter)

  if (brand) {
    query = query.ilike('brand', `%${brand}%`)
  }

  const { data: withStock } = await query.gt('stock', 0).order('price', { ascending: true }).limit(10)

  if (withStock && withStock.length > 0) {
    return withStock as DBProduct[]
  }

  // TIER 1b: Without stock filter
  const { data: noStock } = await supabase
    .from('products')
    .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock, features')
    .eq('width', width)
    .eq('aspect_ratio', profile)
    .eq('rim_diameter', diameter)
    .order('price', { ascending: true })
    .limit(10)

  return (noStock as DBProduct[]) || []
}

// ============================================================================
// DATABASE QUERY
// ============================================================================

async function queryDBForProduct(width: number, profile: number, diameter: number, brand: string): Promise<DBProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, model, width, aspect_ratio, rim_diameter, price, price_list, stock, features')
    .eq('width', width)
    .eq('aspect_ratio', profile)
    .eq('rim_diameter', diameter)
    .ilike('brand', `%${brand}%`)
    .order('price', { ascending: true })

  if (error) {
    console.error(`DB Query error: ${error.message}`)
    return []
  }

  return (data as DBProduct[]) || []
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTest(testNum: number, excelProduct: ParsedTire): Promise<TestResult> {
  const size = `${excelProduct.width}/${excelProduct.profile}R${excelProduct.diameter}`

  // Query database
  const dbProducts = await queryDBForProduct(
    excelProduct.width,
    excelProduct.profile,
    excelProduct.diameter,
    excelProduct.brand
  )

  // Query bot
  const botProducts = await botSearchProducts(
    excelProduct.width,
    excelProduct.profile,
    excelProduct.diameter,
    excelProduct.brand
  )

  const failures: string[] = []

  // Check DB results
  const dbFound = dbProducts.length > 0
  let dbPrice: number | null = null
  let dbPriceList: number | null = null
  let dbStock: number | null = null
  let matchedProduct: DBProduct | null = null

  if (dbFound) {
    // Strategy: Find product matching by price (exact) OR by model name
    // 1. First, try to find a product with EXACT price match
    const priceMatch = dbProducts.find(p => p.price === excelProduct.priceCash)

    // 2. If no price match, try to find by model hint
    const modelMatch = dbProducts.find(p => {
      const dbName = (p.name + ' ' + (p.model || '')).toLowerCase()
      return excelProduct.modelHint && dbName.includes(excelProduct.modelHint)
    })

    matchedProduct = priceMatch || modelMatch || dbProducts[0]

    dbPrice = matchedProduct.price
    dbPriceList = matchedProduct.price_list || matchedProduct.features?.price_list || null
    dbStock = matchedProduct.stock ?? null

    // Compare prices - if we found an exact match, it passes
    if (priceMatch) {
      // Perfect - product with matching price exists
    } else if (modelMatch && modelMatch.price === excelProduct.priceCash) {
      // Model match with matching price
    } else {
      // No exact match - check if ANY product has this price
      const anyPriceMatch = dbProducts.some(p => p.price === excelProduct.priceCash)
      if (!anyPriceMatch) {
        failures.push(`DB price mismatch: Excel=$${excelProduct.priceCash.toLocaleString()}, DB products have different prices`)
      }
    }
  } else {
    failures.push(`Not found in DB: ${excelProduct.brand} ${size}`)
  }

  // Check Bot results
  const botFound = botProducts.length > 0
  let botPrice: number | null = null

  if (botFound) {
    // Find matching product in bot results
    const botPriceMatch = botProducts.find(p => p.price === excelProduct.priceCash)
    const botModelMatch = botProducts.find(p => {
      const dbName = (p.name + ' ' + (p.model || '')).toLowerCase()
      return excelProduct.modelHint && dbName.includes(excelProduct.modelHint)
    })

    const matchingBotProduct = botPriceMatch || botModelMatch || botProducts[0]
    botPrice = matchingBotProduct.price
  } else {
    if (dbFound && dbProducts.some(p => (p.stock ?? 0) > 0)) {
      failures.push(`Bot could not find product that exists in DB with stock`)
    }
  }

  const status: 'PASS' | 'FAIL' = failures.length === 0 ? 'PASS' : 'FAIL'

  return {
    testNum,
    description: excelProduct.rawDescription,
    brand: excelProduct.brand,
    size,
    excel: {
      price: excelProduct.priceCash,
      priceList: excelProduct.priceList,
      stock: excelProduct.totalStock,
    },
    db: {
      found: dbFound,
      price: dbPrice,
      priceList: dbPriceList,
      stock: dbStock,
      count: dbProducts.length,
    },
    bot: {
      found: botFound,
      price: botPrice,
      count: botProducts.length,
    },
    status,
    failures,
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═'.repeat(80))
  console.log('EXCEL vs DATABASE vs BOT - 50 TEST CASES')
  console.log('═'.repeat(80))
  console.log('')

  // Load Excel
  const excelPath = '/Users/gabrielfontenla/Downloads/stock5.xlsx'
  console.log(`📊 Loading Excel: ${excelPath}`)

  let excelData: ExcelRow[]
  try {
    excelData = loadExcel(excelPath)
    console.log(`   Found ${excelData.length} rows`)
  } catch (error) {
    console.error(`❌ Failed to load Excel: ${error}`)
    process.exit(1)
  }

  // Parse and filter valid products
  const validProducts: ParsedTire[] = []
  for (const row of excelData) {
    const parsed = parseExcelRow(row)
    if (parsed) {
      validProducts.push(parsed)
    }
  }
  console.log(`   Parsed ${validProducts.length} valid tire products`)
  console.log('')

  // Select 50 diverse products
  const testProducts: ParsedTire[] = []

  // Get unique brands
  const brandMap = new Map<string, ParsedTire[]>()
  for (const p of validProducts) {
    const existing = brandMap.get(p.brand) || []
    existing.push(p)
    brandMap.set(p.brand, existing)
  }
  const brands = Array.from(brandMap.keys())
  console.log(`   Found brands: ${brands.join(', ')}`)
  console.log('')

  // Strategy: select diverse mix
  // 1. First 10: Common sizes from different brands
  const commonSizes = [
    { width: 185, profile: 65, diameter: 15 },
    { width: 175, profile: 70, diameter: 13 },
    { width: 205, profile: 55, diameter: 16 },
    { width: 195, profile: 65, diameter: 15 },
    { width: 175, profile: 65, diameter: 14 },
    { width: 185, profile: 60, diameter: 14 },
    { width: 195, profile: 55, diameter: 15 },
    { width: 205, profile: 65, diameter: 15 },
    { width: 215, profile: 55, diameter: 17 },
    { width: 225, profile: 45, diameter: 17 },
  ]

  for (const size of commonSizes) {
    const match = validProducts.find(p =>
      p.width === size.width &&
      p.profile === size.profile &&
      p.diameter === size.diameter &&
      !testProducts.includes(p)
    )
    if (match && testProducts.length < 10) {
      testProducts.push(match)
    }
  }

  // 2. Next 10: Different brands
  for (const brand of brands) {
    const products = brandMap.get(brand) || []
    const notYetSelected = products.find(p => !testProducts.includes(p))
    if (notYetSelected && testProducts.length < 20) {
      testProducts.push(notYetSelected)
    }
  }

  // 3. Next 10: With stock > 0
  for (const p of validProducts) {
    if (p.totalStock > 0 && !testProducts.includes(p) && testProducts.length < 30) {
      testProducts.push(p)
    }
  }

  // 4. Next 10: With stock = 0
  for (const p of validProducts) {
    if (p.totalStock === 0 && !testProducts.includes(p) && testProducts.length < 40) {
      testProducts.push(p)
    }
  }

  // 5. Last 10: Edge cases (XL, RF, unusual sizes)
  const edgeCases = validProducts.filter(p =>
    (p.rawDescription.includes('XL') ||
     p.rawDescription.includes('R-F') ||
     p.rawDescription.includes('RFT') ||
     p.rawDescription.includes('ZR') ||
     p.diameter >= 20 ||
     p.width >= 265) &&
    !testProducts.includes(p)
  )

  for (const p of edgeCases) {
    if (testProducts.length < 50) {
      testProducts.push(p)
    }
  }

  // Fill remaining with any products
  for (const p of validProducts) {
    if (!testProducts.includes(p) && testProducts.length < 50) {
      testProducts.push(p)
    }
  }

  console.log(`📋 Selected ${testProducts.length} test products`)
  console.log('')
  console.log('═'.repeat(80))
  console.log('RUNNING TESTS (stops on first failure)')
  console.log('═'.repeat(80))
  console.log('')

  let passCount = 0
  let failCount = 0

  for (let i = 0; i < testProducts.length; i++) {
    const product = testProducts[i]
    const result = await runTest(i + 1, product)

    if (result.status === 'PASS') {
      passCount++
      console.log(`✅ Test ${(i + 1).toString().padStart(2)}/50: PASS | ${result.brand.padEnd(15)} | ${result.size.padEnd(12)} | DB:${result.db.count} Bot:${result.bot.count}`)
    } else {
      failCount++
      console.log('')
      console.log(`❌ Test ${(i + 1).toString().padStart(2)}/50: FAIL`)
      console.log(`   Product: ${result.brand} ${result.size}`)
      console.log(`   Description: ${result.description}`)
      console.log(`   `)
      console.log(`   Excel:`)
      console.log(`     - Price (CONTADO): $${result.excel.price.toLocaleString()}`)
      console.log(`     - Price List (PUBLICO): $${result.excel.priceList.toLocaleString()}`)
      console.log(`     - Stock: ${result.excel.stock}`)
      console.log(`   `)
      console.log(`   Database:`)
      console.log(`     - Found: ${result.db.found ? 'YES' : 'NO'} (${result.db.count} products)`)
      if (result.db.found) {
        console.log(`     - Price: $${result.db.price?.toLocaleString() || 'N/A'}`)
        console.log(`     - Price List: $${result.db.priceList?.toLocaleString() || 'N/A'}`)
        console.log(`     - Stock: ${result.db.stock ?? 'N/A'}`)
      }
      console.log(`   `)
      console.log(`   Bot Search:`)
      console.log(`     - Found: ${result.bot.found ? 'YES' : 'NO'} (${result.bot.count} products)`)
      if (result.bot.found) {
        console.log(`     - Price: $${result.bot.price?.toLocaleString() || 'N/A'}`)
      }
      console.log(`   `)
      console.log(`   ❌ FAILURES:`)
      for (const failure of result.failures) {
        console.log(`     - ${failure}`)
      }
      console.log('')
      console.log('═'.repeat(80))
      console.log('STOPPING: Fix this issue before continuing')
      console.log('═'.repeat(80))
      break
    }
  }

  console.log('')
  console.log('═'.repeat(80))
  console.log('SUMMARY')
  console.log('═'.repeat(80))
  console.log(`✅ Passed: ${passCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📊 Total:  ${passCount + failCount}/50`)
  console.log('')

  if (failCount === 0 && passCount === 50) {
    console.log('🎉 ALL 50 TESTS PASSED! Ready to push to main.')
  } else if (failCount > 0) {
    console.log('⚠️  Fix the failure above and re-run the test.')
    process.exit(1)
  } else {
    console.log(`⚠️  Only ${passCount} tests completed. Need 50.`)
  }
}

main().catch(console.error)
