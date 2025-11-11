#!/usr/bin/env node

/**
 * Script para analizar los productos del Excel que no se encontraron en la base de datos
 * Genera un reporte detallado para revisión manual
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')
const fs = require('fs')

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Función para normalizar texto
function normalizeText(text) {
  if (!text) return ''
  return text
    .toString()
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
}

// Extraer medida
function extractSize(text) {
  if (!text) return null
  const match = text.match(/(\d{3}\/\d{2}R\d{2}|\d{3}\/\d{2}R\d{2}\.\d)/i)
  return match ? match[0] : null
}

// Extraer modelo
function extractModel(text) {
  if (!text) return ''
  let cleaned = text.replace(/\d{3}\/\d{2}R\d{2}[\.\d]*/gi, '')
  cleaned = cleaned.replace(/\b\d{2,3}[HSTVWYZ]\b/gi, '')
  cleaned = cleaned.replace(/\b[HSTVWYZ]\d{2,3}\b/gi, '')
  cleaned = cleaned.replace(/XL|R-F|wl|\(.*?\)/gi, '')
  return normalizeText(cleaned)
}

async function analyzeMissingProducts() {
  try {
    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Falta configuración de Supabase en .env.local')
    }

    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    log('\n🔍 ANÁLISIS DE PRODUCTOS NO ENCONTRADOS', 'blue')
    log('=' .repeat(60), 'blue')

    // 1. Leer archivo Excel
    const excelPath = '/Users/gabrielfontenla/Downloads/3.xlsx'

    if (!fs.existsSync(excelPath)) {
      throw new Error(`No se encontró el archivo: ${excelPath}`)
    }

    log('\n📋 Leyendo archivo Excel...', 'cyan')
    const workbook = XLSX.readFile(excelPath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet)

    // Columnas del Excel
    const skuColumn = '__EMPTY'
    const descColumn = '__EMPTY_1'
    const brandColumn = '__EMPTY_22'
    const listColumn = '__EMPTY_23'
    const cashColumn = '-25%'

    // Filtrar registros válidos
    const validData = data.filter(row => {
      const sku = row[skuColumn]?.toString().trim()
      const price = row[cashColumn]
      return sku && !isNaN(sku) && price && !isNaN(price)
    })

    log(`✅ Se encontraron ${validData.length} registros válidos en el Excel`, 'green')

    // 2. Obtener todos los productos de la base de datos
    log('\n📋 Obteniendo productos de la base de datos...', 'cyan')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, sku, name, brand, price')

    if (fetchError) {
      throw new Error(`Error al obtener productos: ${fetchError.message}`)
    }

    log(`✅ Se encontraron ${products.length} productos en la base de datos`, 'green')

    // 3. Encontrar productos sin match
    log('\n🔄 Analizando productos sin coincidencia...', 'cyan')

    const notFoundProducts = []
    const partialMatches = []

    for (const row of validData) {
      const excelSku = row[skuColumn]?.toString().trim()
      const excelDesc = row[descColumn]?.toString() || ''
      const excelBrand = row[brandColumn]?.toString() || ''
      const excelListPrice = parseFloat(row[listColumn])
      const excelCashPrice = parseFloat(row[cashColumn])

      // Extraer información
      const excelSize = extractSize(excelDesc)
      const excelModel = extractModel(excelDesc)
      const excelBrandNorm = normalizeText(excelBrand)

      // Buscar coincidencia
      let bestMatch = null
      let bestScore = 0
      let partialMatchProduct = null

      for (const product of products) {
        const prodSize = extractSize(product.name)
        const prodModel = extractModel(product.name)
        const prodBrand = normalizeText(product.brand)

        let score = 0

        // Comparar marca
        if (prodBrand && excelBrandNorm && prodBrand.includes(excelBrandNorm)) {
          score += 40
        }

        // Comparar medida
        if (prodSize && excelSize && prodSize === excelSize) {
          score += 50
        }

        // Comparar modelo
        if (prodModel && excelModel) {
          const excelWords = excelModel.split(' ').filter(w => w.length > 2)
          const prodWords = prodModel.split(' ').filter(w => w.length > 2)

          for (const word of excelWords) {
            if (prodWords.includes(word)) {
              score += 10
            }
          }
        }

        if (score >= 50) {
          bestScore = score
          bestMatch = product
        } else if (score > 0 && score < 50 && !partialMatchProduct) {
          partialMatchProduct = {
            product: product,
            score: score
          }
        }
      }

      if (!bestMatch) {
        const notFoundItem = {
          sku: excelSku,
          description: excelDesc,
          brand: excelBrand,
          size: excelSize,
          model: excelModel,
          listPrice: excelListPrice,
          cashPrice: excelCashPrice
        }

        if (partialMatchProduct) {
          notFoundItem.partialMatch = {
            name: partialMatchProduct.product.name,
            brand: partialMatchProduct.product.brand,
            score: partialMatchProduct.score
          }
          partialMatches.push(notFoundItem)
        } else {
          notFoundProducts.push(notFoundItem)
        }
      }
    }

    // 4. Generar reporte
    log('\n📊 REPORTE DE PRODUCTOS NO ENCONTRADOS', 'red')
    log('=' .repeat(60), 'red')

    log(`\n❌ Productos sin ninguna coincidencia: ${notFoundProducts.length}`, 'red')
    if (notFoundProducts.length > 0) {
      log('\nPrimeros 10 productos sin coincidencia:', 'yellow')
      notFoundProducts.slice(0, 10).forEach((item, index) => {
        log(`\n${index + 1}. SKU: ${item.sku}`, 'cyan')
        log(`   Marca: ${item.brand}`, 'white')
        log(`   Descripción: ${item.description}`, 'white')
        log(`   Medida: ${item.size || 'N/A'}`, 'white')
        log(`   Precio Lista: $${item.listPrice.toLocaleString('es-AR')}`, 'green')
        log(`   Precio Contado: $${item.cashPrice.toLocaleString('es-AR')}`, 'green')
      })
    }

    log(`\n⚠️  Productos con coincidencia parcial (<50%): ${partialMatches.length}`, 'yellow')
    if (partialMatches.length > 0) {
      log('\nPrimeros 5 productos con coincidencia parcial:', 'yellow')
      partialMatches.slice(0, 5).forEach((item, index) => {
        log(`\n${index + 1}. SKU: ${item.sku}`, 'cyan')
        log(`   Excel: ${item.brand} - ${item.description}`, 'white')
        log(`   Parcial en BD: ${item.partialMatch.brand} - ${item.partialMatch.name}`, 'yellow')
        log(`   Score: ${item.partialMatch.score}%`, 'magenta')
        log(`   Precio Lista: $${item.listPrice.toLocaleString('es-AR')}`, 'green')
        log(`   Precio Contado: $${item.cashPrice.toLocaleString('es-AR')}`, 'green')
      })
    }

    // 5. Guardar reporte en archivo JSON
    const report = {
      date: new Date().toISOString(),
      summary: {
        totalExcel: validData.length,
        totalDatabase: products.length,
        notFound: notFoundProducts.length,
        partialMatches: partialMatches.length
      },
      notFoundProducts: notFoundProducts,
      partialMatches: partialMatches
    }

    const reportPath = 'missing-products-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    log(`\n💾 Reporte completo guardado en: ${reportPath}`, 'green')

    // 6. Analizar patrones
    log('\n📊 ANÁLISIS DE PATRONES', 'blue')
    log('=' .repeat(60), 'blue')

    // Análisis por marca
    const brandCounts = {}
    notFoundProducts.forEach(item => {
      const brand = item.brand || 'SIN MARCA'
      brandCounts[brand] = (brandCounts[brand] || 0) + 1
    })

    log('\n🏷️  Productos no encontrados por marca:', 'cyan')
    Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([brand, count]) => {
        log(`   ${brand}: ${count} productos`, 'white')
      })

    // Análisis por medida
    const sizeCounts = {}
    notFoundProducts.forEach(item => {
      const size = item.size || 'SIN MEDIDA'
      sizeCounts[size] = (sizeCounts[size] || 0) + 1
    })

    log('\n📏 Productos no encontrados por medida:', 'cyan')
    Object.entries(sizeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([size, count]) => {
        log(`   ${size}: ${count} productos`, 'white')
      })

    // 7. Recomendaciones
    log('\n💡 RECOMENDACIONES', 'yellow')
    log('=' .repeat(60), 'yellow')
    log('\n1. Revisar si estos productos son nuevos y deben agregarse a la BD', 'white')
    log('2. Verificar si hay diferencias en los nombres/descripciones', 'white')
    log('3. Considerar agregar los SKUs del Excel a los productos existentes', 'white')
    log('4. Para los matches parciales, revisar manualmente si son el mismo producto', 'white')

    log('\n✨ Análisis completado', 'green')

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar
analyzeMissingProducts()