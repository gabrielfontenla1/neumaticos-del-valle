#!/usr/bin/env node

/**
 * Script para verificar que los precios de la base de datos coincidan con el Excel
 * Toma una muestra de 100 productos y compara los precios
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

async function verifyPrices() {
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

    log('\n🔍 VERIFICACIÓN DE PRECIOS - MUESTRA DE 100 PRODUCTOS', 'blue')
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
    const skuColumn = '__EMPTY'          // Código proveedor
    const descColumn = '__EMPTY_1'       // Descripción
    const brandColumn = '__EMPTY_22'     // Marca
    const listColumn = '__EMPTY_23'      // Precio público
    const cashColumn = '-25%'            // Precio contado

    // Filtrar registros válidos y tomar muestra
    const validData = data.filter(row => {
      const sku = row[skuColumn]?.toString().trim()
      const price = row[cashColumn]
      return sku && !isNaN(sku) && price && !isNaN(price)
    })

    // Tomar una muestra aleatoria de 100 productos del Excel
    const sampleSize = Math.min(100, validData.length)
    const shuffled = validData.sort(() => 0.5 - Math.random())
    const excelSample = shuffled.slice(0, sampleSize)

    log(`✅ Muestra de ${sampleSize} productos del Excel seleccionada`, 'green')

    // 2. Obtener todos los productos de la base de datos
    log('\n📋 Obteniendo productos de la base de datos...', 'cyan')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, brand, price')

    if (fetchError) {
      throw new Error(`Error al obtener productos: ${fetchError.message}`)
    }

    log(`✅ Se encontraron ${products.length} productos en la base de datos`, 'green')

    // 3. Verificar coincidencias de precios
    log('\n🔄 Verificando coincidencias de precios...', 'cyan')

    let exactMatches = 0
    let closeMatches = 0 // Diferencia menor a $1
    let differentPrices = 0
    let notFound = 0
    const mismatches = []
    const notFoundProducts = []

    for (const excelRow of excelSample) {
      const excelDesc = excelRow[descColumn]?.toString() || ''
      const excelBrand = excelRow[brandColumn]?.toString() || ''
      const excelPrice = parseFloat(excelRow[cashColumn])
      const excelListPrice = parseFloat(excelRow[listColumn])

      // Extraer información del Excel
      const excelSize = extractSize(excelDesc)
      const excelModel = extractModel(excelDesc)
      const excelBrandNorm = normalizeText(excelBrand)

      // Buscar coincidencia en productos
      let bestMatch = null
      let bestScore = 0

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

        if (score > bestScore && score >= 50) {
          bestScore = score
          bestMatch = product
        }
      }

      if (bestMatch) {
        // Comparar precios
        const priceDiff = Math.abs(bestMatch.price - excelPrice)

        if (priceDiff < 0.01) {
          exactMatches++
        } else if (priceDiff < 1) {
          closeMatches++
        } else {
          differentPrices++
          if (mismatches.length < 10) {
            mismatches.push({
              product: `${bestMatch.brand} - ${bestMatch.name}`,
              dbPrice: bestMatch.price,
              excelPrice: excelPrice,
              difference: priceDiff,
              excelDesc: excelDesc
            })
          }
        }
      } else {
        notFound++
        if (notFoundProducts.length < 5) {
          notFoundProducts.push({
            brand: excelBrand,
            desc: excelDesc,
            price: excelPrice
          })
        }
      }
    }

    // 4. Mostrar resultados
    log('\n' + '=' .repeat(60), 'blue')
    log('📊 RESULTADOS DE VERIFICACIÓN', 'blue')
    log('=' .repeat(60), 'blue')

    const matchPercentage = ((exactMatches / sampleSize) * 100).toFixed(1)
    const closePercentage = ((closeMatches / sampleSize) * 100).toFixed(1)
    const differentPercentage = ((differentPrices / sampleSize) * 100).toFixed(1)
    const notFoundPercentage = ((notFound / sampleSize) * 100).toFixed(1)

    log(`\n✅ Coincidencias exactas: ${exactMatches} (${matchPercentage}%)`, 'green')
    log(`🟡 Coincidencias cercanas (< $1): ${closeMatches} (${closePercentage}%)`, 'yellow')
    log(`❌ Precios diferentes: ${differentPrices} (${differentPercentage}%)`, 'red')
    log(`⚠️  No encontrados: ${notFound} (${notFoundPercentage}%)`, 'yellow')

    if (mismatches.length > 0) {
      log('\n📋 Ejemplos de diferencias en precios:', 'cyan')
      mismatches.forEach((mismatch, index) => {
        log(`\n${index + 1}. ${mismatch.product}`, 'yellow')
        log(`   Excel: ${mismatch.excelDesc.substring(0, 50)}...`, 'white')
        log(`   Precio BD: $${mismatch.dbPrice.toLocaleString('es-AR')}`, 'red')
        log(`   Precio Excel: $${mismatch.excelPrice.toLocaleString('es-AR')}`, 'green')
        log(`   Diferencia: $${mismatch.difference.toLocaleString('es-AR')}`, 'magenta')
      })
    }

    if (notFoundProducts.length > 0) {
      log('\n📋 Ejemplos de productos no encontrados:', 'cyan')
      notFoundProducts.forEach((product, index) => {
        log(`${index + 1}. ${product.brand} - ${product.desc.substring(0, 40)}... - $${product.price.toLocaleString('es-AR')}`, 'yellow')
      })
    }

    // 5. Resumen final
    log('\n' + '=' .repeat(60), 'blue')
    log('📊 RESUMEN FINAL', 'blue')
    log('=' .repeat(60), 'blue')

    const totalMatched = exactMatches + closeMatches
    const accuracy = ((totalMatched / sampleSize) * 100).toFixed(1)

    if (accuracy >= 90) {
      log(`\n✅ EXCELENTE: ${accuracy}% de precisión en precios`, 'green')
      log('   Los precios están correctamente actualizados', 'green')
    } else if (accuracy >= 80) {
      log(`\n🟡 BUENO: ${accuracy}% de precisión en precios`, 'yellow')
      log('   La mayoría de los precios están correctos', 'yellow')
    } else {
      log(`\n❌ REVISAR: ${accuracy}% de precisión en precios`, 'red')
      log('   Hay diferencias significativas que requieren revisión', 'red')
    }

    log(`\nDe ${sampleSize} productos verificados:`, 'cyan')
    log(`  - ${totalMatched} tienen el precio correcto o casi correcto`, 'white')
    log(`  - ${differentPrices} tienen diferencias significativas`, 'white')
    log(`  - ${notFound} no se encontraron en la base de datos`, 'white')

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar
verifyPrices()