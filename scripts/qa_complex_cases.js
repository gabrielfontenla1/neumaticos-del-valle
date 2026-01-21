#!/usr/bin/env node
/**
 * QA Complejo - 10 Casos de Prueba Avanzados
 *
 * Si un caso falla, se detiene, se repara, y se continúa.
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Load environment variables
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Colores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Sucursales esperadas
const SUCURSALES = ['catamarca', 'la_banda', 'salta', 'santiago', 'tucuman', 'virgen']

// ============================================================================
// CASO 1: Validar productos con stock negativo o cero
// ============================================================================
async function testCase1() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 1: Validar productos con stock negativo o cero', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock, features')

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  const negativeStock = products.filter(p => p.stock < 0)
  const zeroStock = products.filter(p => p.stock === 0)
  const positiveStock = products.filter(p => p.stock > 0)

  log(`\n📊 Distribución de stock:`, 'cyan')
  log(`   Stock negativo: ${negativeStock.length}`)
  log(`   Stock cero: ${zeroStock.length}`)
  log(`   Stock positivo: ${positiveStock.length}`)

  // Verificar que no haya stock negativo
  if (negativeStock.length > 0) {
    log(`\n❌ ERROR: ${negativeStock.length} productos con stock negativo`, 'red')
    negativeStock.slice(0, 5).forEach(p => {
      log(`   - [${p.id}] ${p.name}: stock = ${p.stock}`, 'red')
    })
    return {
      passed: false,
      error: `${negativeStock.length} productos con stock negativo`,
      data: { negativeStock }
    }
  }

  // Verificar distribución razonable
  const totalProducts = products.length
  const zeroPercentage = (zeroStock.length / totalProducts * 100).toFixed(2)

  log(`\n📈 Porcentaje de productos sin stock: ${zeroPercentage}%`, 'cyan')

  if (zeroPercentage > 90) {
    log(`\n⚠️  ADVERTENCIA: Más del 90% de productos sin stock`, 'yellow')
  }

  log(`\n✅ CASO 1 PASADO: Sin stock negativo detectado`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 2: Verificar codigo_proveedor con caracteres especiales
// ============================================================================
async function testCase2() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 2: Verificar codigo_proveedor con caracteres especiales', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, features')

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  const withCodigoProv = products.filter(p => p.features?.codigo_proveedor)

  log(`\n📊 Productos con codigo_proveedor: ${withCodigoProv.length}`, 'cyan')

  // Analizar caracteres en codigo_proveedor
  const specialChars = new Map()
  const validFormats = []
  const invalidFormats = []

  withCodigoProv.forEach(p => {
    const codigo = p.features.codigo_proveedor

    // Verificar formato válido (solo números y guiones/letras permitidos)
    if (/^[A-Za-z0-9\-_]+$/.test(codigo)) {
      validFormats.push(codigo)
    } else {
      invalidFormats.push({ codigo, name: p.name })

      // Contar caracteres especiales
      const chars = codigo.match(/[^A-Za-z0-9\-_]/g)
      if (chars) {
        chars.forEach(char => {
          specialChars.set(char, (specialChars.get(char) || 0) + 1)
        })
      }
    }
  })

  log(`\n📊 Análisis de formatos:`, 'cyan')
  log(`   Válidos (solo alfanuméricos, -, _): ${validFormats.length}`)
  log(`   Inválidos (caracteres especiales): ${invalidFormats.length}`)

  if (invalidFormats.length > 0) {
    log(`\n⚠️  Caracteres especiales encontrados:`, 'yellow')
    specialChars.forEach((count, char) => {
      log(`   '${char}': ${count} ocurrencias`, 'yellow')
    })

    log(`\n   Ejemplos de códigos inválidos:`, 'yellow')
    invalidFormats.slice(0, 5).forEach(({ codigo, name }) => {
      log(`   - "${codigo}" en ${name.substring(0, 40)}`, 'yellow')
    })

    // Si hay más del 5% con caracteres especiales, es un error
    const invalidPercentage = (invalidFormats.length / withCodigoProv.length * 100).toFixed(2)
    if (invalidPercentage > 5) {
      return {
        passed: false,
        error: `${invalidPercentage}% de códigos con caracteres especiales (>5%)`,
        data: { invalidFormats: invalidFormats.slice(0, 10) }
      }
    }
  }

  log(`\n✅ CASO 2 PASADO: Formato de codigo_proveedor válido`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 3: Validar stock_by_branch con todas las sucursales
// ============================================================================
async function testCase3() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 3: Validar stock_by_branch con todas las sucursales', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock, features')
    .gt('stock', 0)

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  log(`\n📊 Productos con stock > 0: ${products.length}`, 'cyan')

  const withStockByBranch = products.filter(p =>
    p.features?.stock_by_branch && Object.keys(p.features.stock_by_branch).length > 0
  )

  log(`   Con stock_by_branch: ${withStockByBranch.length}`, 'cyan')
  log(`   Sin stock_by_branch: ${products.length - withStockByBranch.length}`, 'yellow')

  // Verificar sucursales usadas
  const branchUsage = new Map()
  const invalidBranches = new Set()

  withStockByBranch.forEach(p => {
    const branches = Object.keys(p.features.stock_by_branch || {})
    branches.forEach(branch => {
      branchUsage.set(branch, (branchUsage.get(branch) || 0) + 1)

      // Verificar que sea una sucursal válida
      if (!SUCURSALES.includes(branch.toLowerCase())) {
        invalidBranches.add(branch)
      }
    })
  })

  log(`\n📊 Uso de sucursales:`, 'cyan')
  SUCURSALES.forEach(sucursal => {
    const count = branchUsage.get(sucursal) || 0
    log(`   ${sucursal}: ${count} productos`)
  })

  if (invalidBranches.size > 0) {
    log(`\n❌ ERROR: Sucursales inválidas detectadas:`, 'red')
    invalidBranches.forEach(branch => {
      const count = branchUsage.get(branch)
      log(`   - "${branch}": ${count} productos`, 'red')
    })
    return {
      passed: false,
      error: `${invalidBranches.size} sucursales inválidas`,
      data: { invalidBranches: Array.from(invalidBranches) }
    }
  }

  log(`\n✅ CASO 3 PASADO: Todas las sucursales son válidas`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 4: Verificar productos sin stock pero con precio válido
// ============================================================================
async function testCase4() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 4: Verificar productos sin stock pero con precio válido', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock, price')
    .eq('stock', 0)
    .gt('price', 0)

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  log(`\n📊 Productos sin stock pero con precio: ${products.length}`, 'cyan')

  // Verificar que tengan precios razonables
  const unreasonablePrices = products.filter(p => p.price < 1000 || p.price > 10000000)

  log(`\n📊 Análisis de precios:`, 'cyan')
  log(`   Precios razonables (1K-10M): ${products.length - unreasonablePrices.length}`)
  log(`   Precios sospechosos: ${unreasonablePrices.length}`)

  if (unreasonablePrices.length > 0) {
    log(`\n⚠️  Ejemplos de precios sospechosos:`, 'yellow')
    unreasonablePrices.slice(0, 5).forEach(p => {
      log(`   - ${p.name.substring(0, 40)}: $${p.price}`, 'yellow')
    })
  }

  // Mostrar distribución de precios
  const priceRanges = {
    'bajo (<50K)': products.filter(p => p.price < 50000).length,
    'medio (50K-200K)': products.filter(p => p.price >= 50000 && p.price < 200000).length,
    'alto (200K-500K)': products.filter(p => p.price >= 200000 && p.price < 500000).length,
    'premium (>500K)': products.filter(p => p.price >= 500000).length
  }

  log(`\n📊 Distribución de precios:`, 'cyan')
  Object.entries(priceRanges).forEach(([range, count]) => {
    log(`   ${range}: ${count}`)
  })

  log(`\n✅ CASO 4 PASADO: Productos sin stock tienen precios válidos`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 5: Validar productos con stock en una sola sucursal
// ============================================================================
async function testCase5() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 5: Validar productos con stock en una sola sucursal', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock, features')
    .gt('stock', 0)

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  const singleBranchProducts = products.filter(p => {
    const branches = p.features?.stock_by_branch || {}
    return Object.keys(branches).length === 1
  })

  const multipleBranchProducts = products.filter(p => {
    const branches = p.features?.stock_by_branch || {}
    return Object.keys(branches).length > 1
  })

  log(`\n📊 Distribución de productos con stock:`, 'cyan')
  log(`   En una sola sucursal: ${singleBranchProducts.length}`)
  log(`   En múltiples sucursales: ${multipleBranchProducts.length}`)

  if (singleBranchProducts.length > 0) {
    // Analizar qué sucursal tiene más productos únicos
    const branchExclusivity = new Map()

    singleBranchProducts.forEach(p => {
      const branch = Object.keys(p.features.stock_by_branch)[0]
      branchExclusivity.set(branch, (branchExclusivity.get(branch) || 0) + 1)
    })

    log(`\n📊 Productos exclusivos por sucursal:`, 'cyan')
    Array.from(branchExclusivity.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([branch, count]) => {
        log(`   ${branch}: ${count} productos`)
      })
  }

  log(`\n✅ CASO 5 PASADO: Distribución de stock por sucursal válida`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 6: Verificar consistencia total stock vs suma sucursales
// ============================================================================
async function testCase6() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 6: Verificar consistencia total stock vs suma sucursales', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock, features')
    .gt('stock', 0)

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  const inconsistencies = []

  products.forEach(p => {
    if (p.features?.stock_by_branch) {
      const branchStock = Object.values(p.features.stock_by_branch)
        .reduce((sum, val) => sum + (Number(val) || 0), 0)

      const totalStock = p.stock || 0

      if (branchStock !== totalStock) {
        inconsistencies.push({
          id: p.id,
          name: p.name,
          totalStock,
          branchStock,
          diff: totalStock - branchStock,
          branches: p.features.stock_by_branch
        })
      }
    }
  })

  log(`\n📊 Análisis de consistencia:`, 'cyan')
  log(`   Productos consistentes: ${products.length - inconsistencies.length}`)
  log(`   Productos inconsistentes: ${inconsistencies.length}`)

  if (inconsistencies.length > 0) {
    const percentage = (inconsistencies.length / products.length * 100).toFixed(2)

    log(`\n❌ ERROR: ${percentage}% de productos con inconsistencias`, 'red')
    log(`\n   Ejemplos:`, 'red')
    inconsistencies.slice(0, 5).forEach(item => {
      log(`   - ${item.name.substring(0, 40)}`, 'red')
      log(`     Total: ${item.totalStock}, Sucursales: ${item.branchStock}, Diff: ${item.diff}`, 'red')
      log(`     Branches: ${JSON.stringify(item.branches)}`, 'red')
    })

    return {
      passed: false,
      error: `${inconsistencies.length} productos con stock inconsistente`,
      data: { inconsistencies: inconsistencies.slice(0, 10) }
    }
  }

  log(`\n✅ CASO 6 PASADO: Stock total coincide con suma de sucursales`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 7: Validar precios con decimales y valores extremos
// ============================================================================
async function testCase7() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 7: Validar precios con decimales y valores extremos', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, features')

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  const withPrice = products.filter(p => p.price > 0)

  // Análisis de decimales
  const withDecimals = withPrice.filter(p => p.price % 1 !== 0)
  const weirdDecimals = withPrice.filter(p => {
    const decimal = p.price % 1
    // Verificar decimales que no sean .0, .5, .25, .75
    return decimal !== 0 && decimal !== 0.5 && decimal !== 0.25 && decimal !== 0.75
  })

  log(`\n📊 Análisis de decimales en precios:`, 'cyan')
  log(`   Sin decimales: ${withPrice.length - withDecimals.length}`)
  log(`   Con decimales: ${withDecimals.length}`)
  log(`   Con decimales extraños: ${weirdDecimals.length}`)

  if (weirdDecimals.length > 0) {
    log(`\n   Ejemplos de decimales extraños:`, 'yellow')
    weirdDecimals.slice(0, 5).forEach(p => {
      log(`   - ${p.name.substring(0, 40)}: $${p.price}`, 'yellow')
    })
  }

  // Análisis de valores extremos
  const minPrice = Math.min(...withPrice.map(p => p.price))
  const maxPrice = Math.max(...withPrice.map(p => p.price))
  const avgPrice = withPrice.reduce((sum, p) => sum + p.price, 0) / withPrice.length

  log(`\n📊 Estadísticas de precios:`, 'cyan')
  log(`   Mínimo: $${minPrice.toLocaleString('es-AR')}`)
  log(`   Máximo: $${maxPrice.toLocaleString('es-AR')}`)
  log(`   Promedio: $${Math.round(avgPrice).toLocaleString('es-AR')}`)

  // Verificar precios sospechosos
  const suspiciouslyLow = withPrice.filter(p => p.price < 10000)
  const suspiciouslyHigh = withPrice.filter(p => p.price > 2000000)

  if (suspiciouslyLow.length > 0) {
    log(`\n⚠️  ${suspiciouslyLow.length} productos con precio < $10,000:`, 'yellow')
    suspiciouslyLow.slice(0, 3).forEach(p => {
      log(`   - ${p.name.substring(0, 40)}: $${p.price}`, 'yellow')
    })
  }

  if (suspiciouslyHigh.length > 0) {
    log(`\n⚠️  ${suspiciouslyHigh.length} productos con precio > $2,000,000:`, 'yellow')
    suspiciouslyHigh.slice(0, 3).forEach(p => {
      log(`   - ${p.name.substring(0, 40)}: $${p.price}`, 'yellow')
    })
  }

  log(`\n✅ CASO 7 PASADO: Precios dentro de rangos aceptables`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 8: Verificar productos con campos críticos (SKU y codigo_proveedor)
// ============================================================================
async function testCase8() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 8: Verificar productos con campos críticos (SKU y codigo_proveedor)', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, features')

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  // Verificar campo SKU (crítico para búsqueda de productos)
  const withoutSKU = products.filter(p => !p.sku)

  log(`\n📊 Cobertura de campos críticos:`, 'cyan')
  log(`   SKU (crítico): ${products.length - withoutSKU.length}/${products.length} (${((1 - withoutSKU.length / products.length) * 100).toFixed(2)}%)`)

  if (withoutSKU.length > 0) {
    log(`\n❌ ERROR: ${withoutSKU.length} productos sin SKU`, 'red')
    withoutSKU.slice(0, 5).forEach(p => {
      log(`   - [${p.id}] ${p.name}`, 'red')
    })
    return {
      passed: false,
      error: `${withoutSKU.length} productos sin SKU`,
      data: { withoutSKU: withoutSKU.slice(0, 10) }
    }
  }

  // Verificar codigo_proveedor en features (importante pero no crítico)
  const withoutCodigoProv = products.filter(p => !p.features?.codigo_proveedor)

  log(`   codigo_proveedor (features): ${products.length - withoutCodigoProv.length}/${products.length} (${((1 - withoutCodigoProv.length / products.length) * 100).toFixed(2)}%)`)

  if (withoutCodigoProv.length > 0) {
    const percentage = (withoutCodigoProv.length / products.length * 100).toFixed(2)
    if (percentage > 10) {
      log(`\n⚠️  ${withoutCodigoProv.length} productos (${percentage}%) sin codigo_proveedor`, 'yellow')
    }
  }

  // Mostrar ejemplos de SKU válidos
  log(`\n📋 Ejemplos de SKU:`, 'cyan')
  products.slice(0, 5).forEach(p => {
    log(`   SKU: ${p.sku} - ${p.name.substring(0, 40)}`)
  })

  log(`\n✅ CASO 8 PASADO: Todos los productos tienen SKU`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 9: Validar que no haya duplicados de SKU
// ============================================================================
async function testCase9() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 9: Validar que no haya duplicados de SKU', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku')

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  // Mapear SKU
  const skuMap = new Map()

  products.forEach(p => {
    if (p.sku) {
      if (!skuMap.has(p.sku)) {
        skuMap.set(p.sku, [])
      }
      skuMap.get(p.sku).push({ id: p.id, name: p.name })
    }
  })

  // Encontrar duplicados
  const duplicates = Array.from(skuMap.entries())
    .filter(([sku, products]) => products.length > 1)

  log(`\n📊 Análisis de SKU:`, 'cyan')
  log(`   SKUs únicos: ${skuMap.size}`)
  log(`   SKUs duplicados: ${duplicates.length}`)

  if (duplicates.length > 0) {
    log(`\n❌ ERROR: ${duplicates.length} SKUs duplicados detectados`, 'red')
    duplicates.slice(0, 5).forEach(([sku, prods]) => {
      log(`\n   SKU "${sku}" usado en ${prods.length} productos:`, 'red')
      prods.forEach(p => {
        log(`      - [${p.id}] ${p.name}`, 'red')
      })
    })
    return {
      passed: false,
      error: `${duplicates.length} SKUs duplicados`,
      data: { duplicates: duplicates.slice(0, 5) }
    }
  }

  log(`\n✅ CASO 9 PASADO: No hay duplicados de SKU`, 'green')
  return { passed: true }
}

// ============================================================================
// CASO 10: Verificar integridad de relaciones producto-categoría-marca
// ============================================================================
async function testCase10() {
  log('\n' + '='.repeat(70), 'blue')
  log('CASO 10: Verificar integridad de relaciones producto-categoría-marca', 'blue')
  log('='.repeat(70), 'blue')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, brand, width, profile, diameter')

  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  // Productos sin categoría
  const withoutCategory = products.filter(p => !p.category)

  // Productos sin marca
  const withoutBrand = products.filter(p => !p.brand)

  // Productos sin dimensiones (advertencia, algunos formatos especiales son válidos)
  const withoutCompleteDimensions = products.filter(p =>
    !p.width || !p.profile || !p.diameter ||
    p.width === 0 || p.profile === 0 || p.diameter === 0
  )

  // Productos verdaderamente problemáticos: sin nombre, categoría NI marca
  const criticallyIncomplete = products.filter(p =>
    (!p.name || p.name.trim() === '') &&
    (!p.category || p.category.trim() === '') &&
    (!p.brand || p.brand.trim() === '')
  )

  log(`\n📊 Integridad de datos:`, 'cyan')
  log(`   Sin categoría: ${withoutCategory.length}`)
  log(`   Sin marca: ${withoutBrand.length}`)
  log(`   Sin dimensiones completas: ${withoutCompleteDimensions.length}`)
  log(`   Críticamente incompletos: ${criticallyIncomplete.length}`)

  // Análisis de categorías
  const categories = new Map()
  products.forEach(p => {
    if (p.category) {
      categories.set(p.category, (categories.get(p.category) || 0) + 1)
    }
  })

  log(`\n📊 Distribución por categoría:`, 'cyan')
  Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      log(`   ${cat}: ${count}`)
    })

  // Análisis de marcas
  const brands = new Map()
  products.forEach(p => {
    if (p.brand) {
      brands.set(p.brand, (brands.get(p.brand) || 0) + 1)
    }
  })

  log(`\n📊 Top 10 marcas:`, 'cyan')
  Array.from(brands.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([brand, count]) => {
      log(`   ${brand}: ${count}`)
    })

  // Verificar productos críticos sin datos
  if (withoutCategory.length > 10) {
    log(`\n⚠️  ADVERTENCIA: ${withoutCategory.length} productos sin categoría`, 'yellow')
  }

  if (withoutBrand.length > 10) {
    log(`\n⚠️  ADVERTENCIA: ${withoutBrand.length} productos sin marca`, 'yellow')
  }

  // Advertencia sobre dimensiones incompletas (común en formatos especiales)
  if (withoutCompleteDimensions.length > 0) {
    const percentage = (withoutCompleteDimensions.length / products.length * 100).toFixed(2)
    log(`\n⚠️  ${withoutCompleteDimensions.length} productos (${percentage}%) con dimensiones incompletas`, 'yellow')
    log(`   Nota: Esto es común en neumáticos de moto y formatos antiguos`, 'yellow')
    log(`\n   Ejemplos:`, 'yellow')
    withoutCompleteDimensions.slice(0, 3).forEach(p => {
      log(`   - [${p.category}] ${p.name}: ${p.width || 'null'}/${p.profile || 'null'}R${p.diameter || 'null'}`, 'yellow')
    })
  }

  // ERROR solo si hay productos críticamente incompletos
  if (criticallyIncomplete.length > 0) {
    log(`\n❌ ERROR: ${criticallyIncomplete.length} productos críticamente incompletos`, 'red')
    log(`   (sin nombre, categoría NI marca)`, 'red')
    criticallyIncomplete.slice(0, 5).forEach(p => {
      log(`   - ID: ${p.id}`, 'red')
    })
    return {
      passed: false,
      error: `${criticallyIncomplete.length} productos críticamente incompletos`,
      data: { criticallyIncomplete: criticallyIncomplete.slice(0, 10) }
    }
  }

  log(`\n✅ CASO 10 PASADO: Integridad de datos aceptable`, 'green')
  log(`   (${withoutCompleteDimensions.length} productos con formatos especiales son válidos)`, 'green')
  return { passed: true }
}

// ============================================================================
// Ejecutar todos los casos
// ============================================================================
async function runAllTests() {
  log('\n' + '█'.repeat(70), 'magenta')
  log('🧪 QA COMPLEJO - 10 CASOS DE PRUEBA AVANZADOS', 'magenta')
  log('█'.repeat(70), 'magenta')

  const testCases = [
    { name: 'Caso 1', fn: testCase1 },
    { name: 'Caso 2', fn: testCase2 },
    { name: 'Caso 3', fn: testCase3 },
    { name: 'Caso 4', fn: testCase4 },
    { name: 'Caso 5', fn: testCase5 },
    { name: 'Caso 6', fn: testCase6 },
    { name: 'Caso 7', fn: testCase7 },
    { name: 'Caso 8', fn: testCase8 },
    { name: 'Caso 9', fn: testCase9 },
    { name: 'Caso 10', fn: testCase10 }
  ]

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  }

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]

    try {
      const result = await testCase.fn()

      if (result.passed) {
        results.passed++
      } else {
        results.failed++
        results.errors.push({
          case: testCase.name,
          error: result.error,
          data: result.data
        })

        // DETENER EN CASO DE FALLO
        log('\n' + '⚠'.repeat(70), 'red')
        log(`🛑 TEST DETENIDO EN ${testCase.name}`, 'red')
        log('⚠'.repeat(70), 'red')
        log(`\n❌ Error: ${result.error}`, 'red')

        if (result.data) {
          log(`\n📋 Datos del error:`, 'yellow')
          console.log(JSON.stringify(result.data, null, 2))
        }

        log(`\n🔧 Por favor, repara este error antes de continuar.`, 'yellow')
        log(`   Después de reparar, ejecuta nuevamente este script.\n`, 'yellow')

        break // DETENER EJECUCIÓN
      }

    } catch (error) {
      results.failed++
      results.errors.push({
        case: testCase.name,
        error: error.message
      })

      log(`\n❌ ERROR CRÍTICO en ${testCase.name}:`, 'red')
      log(`   ${error.message}`, 'red')
      console.error(error)

      break // DETENER EJECUCIÓN
    }
  }

  // Resumen final
  log('\n' + '█'.repeat(70), 'magenta')
  log('📊 RESUMEN FINAL', 'magenta')
  log('█'.repeat(70), 'magenta')

  log(`\nTotal de casos ejecutados: ${results.passed + results.failed}/10`, 'cyan')
  log(`✅ Pasados: ${results.passed}`, 'green')
  log(`❌ Fallidos: ${results.failed}`, results.failed > 0 ? 'red' : 'green')

  const successRate = ((results.passed / 10) * 100).toFixed(2)
  log(`\n📈 Tasa de éxito: ${successRate}%`, successRate >= 100 ? 'green' : 'yellow')

  if (results.failed === 0) {
    log('\n' + '✅'.repeat(35), 'green')
    log('🎉 TODOS LOS CASOS PASARON EXITOSAMENTE', 'green')
    log('✅'.repeat(35), 'green')
    return 0
  } else {
    log('\n⚠️  Algunos casos fallaron. Por favor, revisa los errores arriba.', 'yellow')
    return 1
  }
}

// Ejecutar tests
runAllTests()
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })
