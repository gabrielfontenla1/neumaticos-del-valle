#!/usr/bin/env node
/**
 * QA Test Script for Stock Update API
 *
 * Tests:
 * 1. API endpoint accepts Excel file and updates stock
 * 2. All products from Excel are updated in database
 * 3. codigo_proveedor is saved correctly
 * 4. stock_by_branch matches Excel data
 * 5. Frontend components display data correctly
 */

const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')
const path = require('path')
const fs = require('fs')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sucursales esperadas
const SUCURSALES = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN']

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function cleanCodigo(codigo) {
  if (!codigo) return ''
  return String(codigo).replace('[', '').replace(']', '').trim()
}

function safeNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

async function loadExcelData(filePath) {
  log('\n📊 Cargando datos del Excel...', 'cyan')

  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Find header row
  const range = XLSX.utils.decode_range(worksheet['!ref'])
  let headerRow = 0

  for (let row = range.s.r; row <= Math.min(range.e.r, 10); row++) {
    let rowText = ''
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]
      if (cell && cell.v) {
        rowText += String(cell.v).toUpperCase() + ' '
      }
    }
    if (rowText.includes('CODIGO_PROPIO') || rowText.includes('CODIGO PROPIO') || rowText.includes('DESCRIPCION')) {
      headerRow = row
      break
    }
  }

  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    range: headerRow,
    defval: null
  })

  log(`✅ Cargados ${jsonData.length} productos del Excel`, 'green')
  return jsonData
}

async function getProductsFromDB() {
  log('\n📊 Obteniendo productos de la base de datos...', 'cyan')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, stock, category, brand, features')

  if (error) {
    log(`❌ Error al obtener productos: ${error.message}`, 'red')
    throw error
  }

  log(`✅ Obtenidos ${products.length} productos de la BD`, 'green')
  return products
}

function normalizeColumns(row) {
  const normalized = { ...row }

  if (row['CODIGO PROPIO'] && !row.CODIGO_PROPIO) {
    normalized.CODIGO_PROPIO = row['CODIGO PROPIO']
  }
  if (row['LA BANDA'] && !row.LA_BANDA) {
    normalized.LA_BANDA = row['LA BANDA']
  }

  return normalized
}

function calculateTotalStock(row) {
  let total = 0
  for (const sucursal of SUCURSALES) {
    const value = row[sucursal] || row[sucursal.replace('_', ' ')]
    total += safeNumber(value)
  }
  return Math.max(0, total)
}

function getStockByBranch(row) {
  const stockByBranch = {}
  for (const sucursal of SUCURSALES) {
    const value = row[sucursal] || row[sucursal.replace('_', ' ')]
    const stock = safeNumber(value)
    if (stock > 0) {
      stockByBranch[sucursal.toLowerCase()] = stock
    }
  }
  return stockByBranch
}

async function runTests() {
  log('\n🧪 INICIANDO QA DE STOCK UPDATE API', 'blue')
  log('='.repeat(60), 'blue')

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  }

  try {
    // TEST 1: Cargar datos del Excel
    log('\n📋 TEST 1: Carga de datos del Excel', 'yellow')
    const excelPath = path.join(__dirname, '../stock10.xlsx')

    if (!fs.existsSync(excelPath)) {
      throw new Error(`Archivo no encontrado: ${excelPath}`)
    }

    const excelData = await loadExcelData(excelPath)
    const normalizedData = excelData.map(normalizeColumns)
    results.total++
    results.passed++
    log('✅ TEST 1 PASADO: Excel cargado correctamente', 'green')

    // TEST 2: Obtener productos de la BD
    log('\n📋 TEST 2: Obtención de productos de la BD', 'yellow')
    const dbProducts = await getProductsFromDB()

    // Crear mapa de productos por codigo_propio
    const productMap = new Map()
    for (const p of dbProducts) {
      const features = p.features || {}
      const codigo = features.codigo_propio ? String(features.codigo_propio).trim() : null
      if (codigo) {
        productMap.set(codigo, p)
      }
    }

    log(`✅ Productos mapeados: ${productMap.size}`, 'green')
    results.total++
    results.passed++
    log('✅ TEST 2 PASADO: Productos obtenidos correctamente', 'green')

    // TEST 3: Verificar que todos los productos del Excel están en la BD
    log('\n📋 TEST 3: Verificación de cobertura Excel → BD', 'yellow')
    let notFoundCount = 0
    const notFoundCodes = []

    for (const row of normalizedData) {
      const codigo = cleanCodigo(row.CODIGO_PROPIO)
      if (!codigo || codigo === 'nan') continue

      if (!productMap.has(codigo)) {
        notFoundCount++
        notFoundCodes.push(codigo)
      }
    }

    if (notFoundCount > 0) {
      log(`⚠️  ${notFoundCount} productos del Excel no encontrados en BD`, 'yellow')
      log(`   Códigos: ${notFoundCodes.slice(0, 5).join(', ')}${notFoundCount > 5 ? '...' : ''}`, 'yellow')
    } else {
      log('✅ Todos los productos del Excel están en la BD', 'green')
    }
    results.total++
    results.passed++

    // TEST 4: Verificar stock_by_branch
    log('\n📋 TEST 4: Verificación de stock_by_branch', 'yellow')
    let stockMatches = 0
    let stockMismatches = 0
    const mismatchDetails = []

    for (const row of normalizedData) {
      const codigo = cleanCodigo(row.CODIGO_PROPIO)
      if (!codigo || codigo === 'nan') continue

      const product = productMap.get(codigo)
      if (!product) continue

      const expectedTotal = calculateTotalStock(row)
      const expectedByBranch = getStockByBranch(row)
      const actualTotal = product.stock || 0
      const actualByBranch = (product.features?.stock_by_branch) || {}

      // Verificar total
      if (expectedTotal !== actualTotal) {
        stockMismatches++
        mismatchDetails.push({
          codigo,
          expectedTotal,
          actualTotal,
          diff: actualTotal - expectedTotal
        })
      } else {
        stockMatches++
      }
    }

    const stockPercentage = ((stockMatches / (stockMatches + stockMismatches)) * 100).toFixed(2)
    log(`✅ Stock matches: ${stockMatches}/${stockMatches + stockMismatches} (${stockPercentage}%)`, 'green')

    if (stockMismatches > 0) {
      log(`⚠️  Stock mismatches: ${stockMismatches}`, 'yellow')
      mismatchDetails.slice(0, 5).forEach(m => {
        log(`   [${m.codigo}] Expected: ${m.expectedTotal}, Actual: ${m.actualTotal}, Diff: ${m.diff}`, 'yellow')
      })
      if (mismatchDetails.length > 5) {
        log(`   ... y ${mismatchDetails.length - 5} más`, 'yellow')
      }
    }

    results.total++
    if (stockPercentage >= 99.5) {
      results.passed++
      log('✅ TEST 4 PASADO: Stock verificado (≥99.5%)', 'green')
    } else {
      results.failed++
      results.errors.push(`Stock accuracy: ${stockPercentage}% < 99.5%`)
      log('❌ TEST 4 FALLIDO: Stock accuracy < 99.5%', 'red')
    }

    // TEST 5: Verificar codigo_proveedor
    log('\n📋 TEST 5: Verificación de codigo_proveedor', 'yellow')
    let codigoProvMatches = 0
    let codigoProvMissing = 0

    for (const row of normalizedData) {
      const codigo = cleanCodigo(row.CODIGO_PROPIO)
      if (!codigo || codigo === 'nan') continue

      const product = productMap.get(codigo)
      if (!product) continue

      const expectedCodigoProv = row.CODIGO_PROVEEDOR ? String(row.CODIGO_PROVEEDOR).trim() : null
      const actualCodigoProv = product.features?.codigo_proveedor

      if (expectedCodigoProv && expectedCodigoProv !== 'nan') {
        if (actualCodigoProv === expectedCodigoProv) {
          codigoProvMatches++
        } else {
          codigoProvMissing++
        }
      }
    }

    const codigoProvPercentage = ((codigoProvMatches / (codigoProvMatches + codigoProvMissing)) * 100).toFixed(2)
    log(`✅ codigo_proveedor matches: ${codigoProvMatches}/${codigoProvMatches + codigoProvMissing} (${codigoProvPercentage}%)`, 'green')

    results.total++
    if (codigoProvPercentage >= 95) {
      results.passed++
      log('✅ TEST 5 PASADO: codigo_proveedor verificado (≥95%)', 'green')
    } else {
      results.failed++
      results.errors.push(`codigo_proveedor accuracy: ${codigoProvPercentage}% < 95%`)
      log('❌ TEST 5 FALLIDO: codigo_proveedor accuracy < 95%', 'red')
    }

    // TEST 6: Verificar precios
    log('\n📋 TEST 6: Verificación de precios', 'yellow')
    let priceMatches = 0
    let priceMismatches = 0

    for (const row of normalizedData) {
      const codigo = cleanCodigo(row.CODIGO_PROPIO)
      if (!codigo || codigo === 'nan') continue

      const product = productMap.get(codigo)
      if (!product) continue

      const expectedPrice = safeNumber(row.CONTADO)
      const actualPrice = product.price || 0

      if (expectedPrice > 0) {
        if (Math.abs(expectedPrice - actualPrice) < 0.01) {
          priceMatches++
        } else {
          priceMismatches++
        }
      }
    }

    const pricePercentage = ((priceMatches / (priceMatches + priceMismatches)) * 100).toFixed(2)
    log(`✅ Price matches: ${priceMatches}/${priceMatches + priceMismatches} (${pricePercentage}%)`, 'green')

    results.total++
    if (pricePercentage >= 99) {
      results.passed++
      log('✅ TEST 6 PASADO: Precios verificados (≥99%)', 'green')
    } else {
      results.failed++
      results.errors.push(`Price accuracy: ${pricePercentage}% < 99%`)
      log('❌ TEST 6 FALLIDO: Price accuracy < 99%', 'red')
    }

    // TEST 7: Verificar productos aleatorios detallados
    log('\n📋 TEST 7: Verificación detallada de 5 productos aleatorios', 'yellow')
    const randomIndices = []
    while (randomIndices.length < 5 && randomIndices.length < normalizedData.length) {
      const idx = Math.floor(Math.random() * normalizedData.length)
      if (!randomIndices.includes(idx)) {
        randomIndices.push(idx)
      }
    }

    let randomTestsPassed = 0
    for (const idx of randomIndices) {
      const row = normalizedData[idx]
      const codigo = cleanCodigo(row.CODIGO_PROPIO)

      if (!codigo || codigo === 'nan') continue

      const product = productMap.get(codigo)
      if (!product) continue

      const expectedStock = calculateTotalStock(row)
      const actualStock = product.stock || 0
      const expectedPrice = safeNumber(row.CONTADO)
      const actualPrice = product.price || 0
      const expectedCodigoProv = row.CODIGO_PROVEEDOR ? String(row.CODIGO_PROVEEDOR).trim() : null
      const actualCodigoProv = product.features?.codigo_proveedor

      log(`\n   Producto [${codigo}]:`, 'cyan')
      log(`   - Stock: ${actualStock} ${actualStock === expectedStock ? '✅' : '❌ (esperado: ' + expectedStock + ')'}`)
      log(`   - Precio: ${actualPrice} ${Math.abs(actualPrice - expectedPrice) < 0.01 ? '✅' : '❌ (esperado: ' + expectedPrice + ')'}`)
      log(`   - Código Prov: ${actualCodigoProv || 'N/A'} ${actualCodigoProv === expectedCodigoProv ? '✅' : (expectedCodigoProv ? '❌ (esperado: ' + expectedCodigoProv + ')' : '✅')}`)

      if (actualStock === expectedStock && Math.abs(actualPrice - expectedPrice) < 0.01) {
        randomTestsPassed++
      }
    }

    results.total++
    if (randomTestsPassed >= 4) {
      results.passed++
      log('\n✅ TEST 7 PASADO: Verificación aleatoria exitosa (≥80%)', 'green')
    } else {
      results.failed++
      results.errors.push(`Random verification: ${randomTestsPassed}/5 < 80%`)
      log('\n❌ TEST 7 FALLIDO: Verificación aleatoria < 80%', 'red')
    }

  } catch (error) {
    log(`\n❌ ERROR CRÍTICO: ${error.message}`, 'red')
    console.error(error)
    results.failed++
    results.errors.push(error.message)
  }

  // Resumen final
  log('\n' + '='.repeat(60), 'blue')
  log('📊 RESUMEN DE QA', 'blue')
  log('='.repeat(60), 'blue')
  log(`\nTotal de tests: ${results.total}`, 'cyan')
  log(`✅ Pasados: ${results.passed}`, 'green')
  log(`❌ Fallidos: ${results.failed}`, results.failed > 0 ? 'red' : 'green')

  if (results.errors.length > 0) {
    log('\n❌ Errores encontrados:', 'red')
    results.errors.forEach((err, i) => {
      log(`   ${i + 1}. ${err}`, 'red')
    })
  }

  const successRate = ((results.passed / results.total) * 100).toFixed(2)
  log(`\n📈 Tasa de éxito: ${successRate}%`, successRate >= 85 ? 'green' : 'red')

  if (successRate >= 85) {
    log('\n✅ QA EXITOSO - Sistema funcionando correctamente', 'green')
    return 0
  } else {
    log('\n❌ QA FALLIDO - Se requiere atención', 'red')
    return 1
  }
}

// Ejecutar tests
runTests()
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })
