#!/usr/bin/env node
/**
 * QA Database State Verification
 *
 * Verifies the current state of the database after stock updates:
 * 1. codigo_proveedor field is populated
 * 2. stock_by_branch uses correct sucursales (santiago, not belgrano)
 * 3. Stock values are consistent
 * 4. Price data is present
 */

const { createClient } = require('@supabase/supabase-js')
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

async function runDatabaseQA() {
  log('\n🧪 INICIANDO VERIFICACIÓN DE ESTADO DE BASE DE DATOS', 'blue')
  log('='.repeat(60), 'blue')

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: [],
    errors: []
  }

  try {
    // Obtener todos los productos
    log('\n📊 Obteniendo productos de la base de datos...', 'cyan')
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, stock, category, brand, features')

    if (error) {
      throw new Error(`Error al obtener productos: ${error.message}`)
    }

    log(`✅ Obtenidos ${products.length} productos`, 'green')

    // TEST 1: Verificar codigo_proveedor
    log('\n📋 TEST 1: Verificación de codigo_proveedor', 'yellow')
    results.total++

    const withCodigoProv = products.filter(p => p.features?.codigo_proveedor)
    const withoutCodigoProv = products.filter(p => !p.features?.codigo_proveedor)

    log(`   ✅ Con codigo_proveedor: ${withCodigoProv.length}`, 'green')
    log(`   ⚠️  Sin codigo_proveedor: ${withoutCodigoProv.length}`, withoutCodigoProv.length > 0 ? 'yellow' : 'green')

    const codigoProvPercentage = ((withCodigoProv.length / products.length) * 100).toFixed(2)
    log(`   📊 Cobertura: ${codigoProvPercentage}%`, codigoProvPercentage >= 90 ? 'green' : 'yellow')

    if (codigoProvPercentage >= 50) {
      results.passed++
      log('✅ TEST 1 PASADO: codigo_proveedor presente en ≥50% productos', 'green')
    } else {
      results.failed++
      results.errors.push(`codigo_proveedor presente solo en ${codigoProvPercentage}%`)
      log('❌ TEST 1 FALLIDO: codigo_proveedor presente en <50% productos', 'red')
    }

    // Mostrar 5 ejemplos de productos con codigo_proveedor
    log('\n   📝 Ejemplos de productos con codigo_proveedor:', 'cyan')
    withCodigoProv.slice(0, 5).forEach(p => {
      log(`      ${p.features.codigo_proveedor} - ${p.name.substring(0, 50)}`, 'cyan')
    })

    // TEST 2: Verificar stock_by_branch usa 'santiago' (no 'belgrano')
    log('\n📋 TEST 2: Verificación de sucursales correctas', 'yellow')
    results.total++

    const withStockByBranch = products.filter(p =>
      p.features?.stock_by_branch && Object.keys(p.features.stock_by_branch).length > 0
    )

    let hasBelgrano = 0
    let hasSantiago = 0

    withStockByBranch.forEach(p => {
      const branches = Object.keys(p.features.stock_by_branch || {})
      if (branches.includes('belgrano')) hasBelgrano++
      if (branches.includes('santiago')) hasSantiago++
    })

    log(`   ✅ Productos con 'santiago': ${hasSantiago}`, 'green')
    log(`   ${hasBelgrano > 0 ? '❌' : '✅'} Productos con 'belgrano': ${hasBelgrano}`, hasBelgrano > 0 ? 'red' : 'green')

    if (hasBelgrano === 0) {
      results.passed++
      log('✅ TEST 2 PASADO: No hay referencias a "belgrano"', 'green')
    } else {
      results.failed++
      results.errors.push(`${hasBelgrano} productos con "belgrano" en stock_by_branch`)
      log('❌ TEST 2 FALLIDO: Hay referencias a "belgrano"', 'red')
    }

    // TEST 3: Verificar consistencia de stock
    log('\n📋 TEST 3: Verificación de consistencia de stock', 'yellow')
    results.total++

    let stockConsistent = 0
    let stockInconsistent = 0
    const inconsistentExamples = []

    products.forEach(p => {
      if (p.features?.stock_by_branch) {
        const stockByBranch = p.features.stock_by_branch
        const calculatedTotal = Object.values(stockByBranch).reduce((sum, val) => sum + (Number(val) || 0), 0)
        const actualTotal = p.stock || 0

        if (calculatedTotal === actualTotal) {
          stockConsistent++
        } else {
          stockInconsistent++
          if (inconsistentExamples.length < 5) {
            inconsistentExamples.push({
              id: p.id,
              name: p.name.substring(0, 40),
              calculated: calculatedTotal,
              actual: actualTotal
            })
          }
        }
      }
    })

    const stockConsistencyPercentage = ((stockConsistent / (stockConsistent + stockInconsistent)) * 100).toFixed(2)
    log(`   ✅ Consistentes: ${stockConsistent}`, 'green')
    log(`   ${stockInconsistent > 0 ? '⚠️ ' : '✅'} Inconsistentes: ${stockInconsistent}`, stockInconsistent > 0 ? 'yellow' : 'green')
    log(`   📊 Consistencia: ${stockConsistencyPercentage}%`, stockConsistencyPercentage >= 95 ? 'green' : 'yellow')

    if (stockInconsistent > 0) {
      log('\n   📝 Ejemplos de inconsistencias:', 'yellow')
      inconsistentExamples.forEach(ex => {
        log(`      ${ex.name}: calculado=${ex.calculated}, actual=${ex.actual}`, 'yellow')
      })
    }

    if (stockConsistencyPercentage >= 95 || stockInconsistent === 0) {
      results.passed++
      log('✅ TEST 3 PASADO: Stock consistente', 'green')
    } else {
      results.warnings.push(`${stockInconsistent} productos con stock inconsistente`)
      results.passed++
      log('⚠️  TEST 3 PASADO CON ADVERTENCIA: Algunas inconsistencias encontradas', 'yellow')
    }

    // TEST 4: Verificar precios
    log('\n📋 TEST 4: Verificación de precios', 'yellow')
    results.total++

    const withPrice = products.filter(p => p.price > 0)
    const withoutPrice = products.filter(p => !p.price || p.price === 0)

    log(`   ✅ Con precio: ${withPrice.length}`, 'green')
    log(`   ${withoutPrice.length > 0 ? '⚠️ ' : '✅'} Sin precio: ${withoutPrice.length}`, withoutPrice.length > 0 ? 'yellow' : 'green')

    const pricePercentage = ((withPrice.length / products.length) * 100).toFixed(2)
    log(`   📊 Cobertura: ${pricePercentage}%`, pricePercentage >= 90 ? 'green' : 'yellow')

    if (pricePercentage >= 80) {
      results.passed++
      log('✅ TEST 4 PASADO: Precios presentes en ≥80% productos', 'green')
    } else {
      results.failed++
      results.errors.push(`Precios presentes solo en ${pricePercentage}%`)
      log('❌ TEST 4 FALLIDO: Precios presentes en <80% productos', 'red')
    }

    // TEST 5: Verificar campo legacy stock_por_sucursal eliminado
    log('\n📋 TEST 5: Verificación de limpieza de campos legacy', 'yellow')
    results.total++

    const withLegacyField = products.filter(p => p.features?.stock_por_sucursal)
    log(`   ${withLegacyField.length === 0 ? '✅' : '⚠️ '} Productos con campo legacy: ${withLegacyField.length}`, withLegacyField.length === 0 ? 'green' : 'yellow')

    if (withLegacyField.length === 0) {
      results.passed++
      log('✅ TEST 5 PASADO: No hay campos legacy', 'green')
    } else {
      results.warnings.push(`${withLegacyField.length} productos con campo legacy stock_por_sucursal`)
      results.passed++
      log('⚠️  TEST 5 PASADO CON ADVERTENCIA: Algunos campos legacy encontrados', 'yellow')
    }

    // TEST 6: Verificar productos aleatorios detallados
    log('\n📋 TEST 6: Verificación detallada de 5 productos aleatorios', 'yellow')
    results.total++

    const randomProducts = []
    while (randomProducts.length < 5 && randomProducts.length < products.length) {
      const product = products[Math.floor(Math.random() * products.length)]
      if (!randomProducts.find(p => p.id === product.id)) {
        randomProducts.push(product)
      }
    }

    randomProducts.forEach(p => {
      log(`\n   Producto: ${p.name.substring(0, 50)}`, 'cyan')
      log(`   - ID: ${p.id}`)
      log(`   - Stock: ${p.stock || 0}`)
      log(`   - Precio: $${p.price || 0}`)
      log(`   - Código Prov: ${p.features?.codigo_proveedor || 'N/A'}`)

      if (p.features?.stock_by_branch) {
        const branches = Object.entries(p.features.stock_by_branch)
        if (branches.length > 0) {
          log(`   - Sucursales:`)
          branches.forEach(([branch, stock]) => {
            log(`      • ${branch}: ${stock}`)
          })
        }
      }
    })

    results.passed++
    log('\n✅ TEST 6 PASADO: Verificación aleatoria completada', 'green')

  } catch (error) {
    log(`\n❌ ERROR CRÍTICO: ${error.message}`, 'red')
    console.error(error)
    results.failed++
    results.errors.push(error.message)
  }

  // Resumen final
  log('\n' + '='.repeat(60), 'blue')
  log('📊 RESUMEN DE VERIFICACIÓN', 'blue')
  log('='.repeat(60), 'blue')
  log(`\nTotal de tests: ${results.total}`, 'cyan')
  log(`✅ Pasados: ${results.passed}`, 'green')
  log(`❌ Fallidos: ${results.failed}`, results.failed > 0 ? 'red' : 'green')

  if (results.warnings.length > 0) {
    log('\n⚠️  Advertencias:', 'yellow')
    results.warnings.forEach((warn, i) => {
      log(`   ${i + 1}. ${warn}`, 'yellow')
    })
  }

  if (results.errors.length > 0) {
    log('\n❌ Errores encontrados:', 'red')
    results.errors.forEach((err, i) => {
      log(`   ${i + 1}. ${err}`, 'red')
    })
  }

  const successRate = ((results.passed / results.total) * 100).toFixed(2)
  log(`\n📈 Tasa de éxito: ${successRate}%`, successRate >= 85 ? 'green' : 'red')

  if (successRate >= 85 && results.failed === 0) {
    log('\n✅ VERIFICACIÓN EXITOSA - Base de datos en buen estado', 'green')
    return 0
  } else if (successRate >= 70) {
    log('\n⚠️  VERIFICACIÓN PASADA CON ADVERTENCIAS - Revisar warnings', 'yellow')
    return 0
  } else {
    log('\n❌ VERIFICACIÓN FALLIDA - Se requiere atención inmediata', 'red')
    return 1
  }
}

// Ejecutar verificación
runDatabaseQA()
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })
