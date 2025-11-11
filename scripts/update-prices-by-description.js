#!/usr/bin/env node

/**
 * Script para actualizar precios desde Excel usando descripción y marca
 * Intenta hacer match por descripción ya que los SKUs no coinciden
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

// Función para normalizar texto para comparación
function normalizeText(text) {
  if (!text) return ''
  return text
    .toString()
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
    .replace(/[^\w\s]/g, '') // Remover caracteres especiales
}

// Extraer medida del texto (ej: 205/75R15)
function extractSize(text) {
  if (!text) return null
  const match = text.match(/(\d{3}\/\d{2}R\d{2}|\d{3}\/\d{2}R\d{2}\.\d)/i)
  return match ? match[0] : null
}

// Extraer modelo de la descripción
function extractModel(text) {
  if (!text) return ''
  // Remover medida primero
  let cleaned = text.replace(/\d{3}\/\d{2}R\d{2}[\.\d]*/gi, '')
  // Remover índices de carga/velocidad
  cleaned = cleaned.replace(/\b\d{2,3}[HSTVWYZ]\b/gi, '')
  cleaned = cleaned.replace(/\b[HSTVWYZ]\d{2,3}\b/gi, '')
  cleaned = cleaned.replace(/XL|R-F|wl|\(.*?\)/gi, '')
  return normalizeText(cleaned)
}

async function updatePricesByDescription() {
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

    log('\n📊 ACTUALIZACIÓN DE PRECIOS POR DESCRIPCIÓN', 'blue')
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

    // 3. Intentar hacer match por descripción
    log('\n🔄 Procesando actualizaciones por descripción...', 'cyan')

    let matched = 0
    let notFound = 0
    let updated = 0
    let errors = 0
    const updates = []
    const notFoundItems = []

    for (const row of validData) {
      const excelSku = row[skuColumn]?.toString().trim()
      const excelDesc = row[descColumn]?.toString() || ''
      const excelBrand = row[brandColumn]?.toString() || ''
      const excelPrice = parseFloat(row[cashColumn])
      const excelListPrice = parseFloat(row[listColumn])

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

        // Comparar marca (peso alto)
        if (prodBrand && excelBrandNorm && prodBrand.includes(excelBrandNorm)) {
          score += 40
        }

        // Comparar medida (peso muy alto)
        if (prodSize && excelSize && prodSize === excelSize) {
          score += 50
        }

        // Comparar modelo (peso medio)
        if (prodModel && excelModel) {
          // Buscar palabras clave comunes
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
        matched++

        // Preparar actualización
        if (excelPrice && excelPrice !== bestMatch.price) {
          updates.push({
            id: bestMatch.id,
            name: bestMatch.name,
            brand: bestMatch.brand,
            oldPrice: bestMatch.price,
            newPrice: excelPrice,
            newListPrice: excelListPrice,
            excelDesc: excelDesc,
            excelSku: excelSku,
            matchScore: bestScore
          })
        }
      } else {
        notFound++
        notFoundItems.push({
          sku: excelSku,
          desc: excelDesc,
          brand: excelBrand
        })
      }
    }

    log(`\n📊 Resultados del análisis:`, 'blue')
    log(`  ✅ Productos encontrados: ${matched}`, 'green')
    log(`  ❌ No encontrados: ${notFound}`, 'red')
    log(`  🔄 Actualizaciones pendientes: ${updates.length}`, 'yellow')

    if (updates.length > 0) {
      log('\n📋 Primeras 10 actualizaciones pendientes:', 'cyan')
      updates.slice(0, 10).forEach((update, index) => {
        log(`\n${index + 1}. ${update.brand} - ${update.name}`, 'yellow')
        log(`   Excel: ${update.excelDesc}`, 'white')
        log(`   SKU Excel: ${update.excelSku}`, 'white')
        log(`   Score de match: ${update.matchScore}%`, 'magenta')
        log(`   Precio: $${update.oldPrice?.toLocaleString('es-AR') || 'N/A'} → $${update.newPrice.toLocaleString('es-AR')}`, 'green')
        if (update.newListPrice) {
          log(`   Lista: $${update.newListPrice.toLocaleString('es-AR')}`, 'green')
        }
      })

      // Pedir confirmación antes de actualizar
      log('\n⚠️  ATENCIÓN: Se actualizarán ' + updates.length + ' productos', 'yellow')
      log('Los matches se hicieron por descripción y pueden no ser 100% exactos', 'yellow')

      // Aplicar actualizaciones
      log('\n🔄 Aplicando actualizaciones en la base de datos...', 'cyan')

      for (const update of updates) {
        const updateData = {
          price: update.newPrice
        }

        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', update.id)

        if (updateError) {
          log(`❌ Error actualizando ${update.name}: ${updateError.message}`, 'red')
          errors++
        } else {
          updated++
          if (updated % 10 === 0) {
            log(`   Actualizados: ${updated} productos...`, 'cyan')
          }
        }
      }
    }

    // Mostrar algunos productos no encontrados
    if (notFoundItems.length > 0) {
      log('\n❌ Algunos productos del Excel no se encontraron:', 'red')
      notFoundItems.slice(0, 10).forEach(item => {
        log(`  - SKU ${item.sku}: ${item.brand} - ${item.desc}`, 'white')
      })
      if (notFoundItems.length > 10) {
        log(`  ... y ${notFoundItems.length - 10} más`, 'yellow')
      }
    }

    // Resumen final
    log('\n' + '=' .repeat(60), 'blue')
    log('📊 RESUMEN DE ACTUALIZACIÓN', 'blue')
    log('=' .repeat(60), 'blue')

    log(`\n✅ Productos actualizados: ${updated}`, 'green')
    log(`⚠️  No encontrados: ${notFound}`, 'yellow')
    if (errors > 0) {
      log(`❌ Errores: ${errors}`, 'red')
    }

    log('\n✨ Actualización completada', 'green')

    // Guardar lista de precios para referencia futura
    log('\n💾 Guardando lista de precios del Excel para referencia...', 'cyan')

    const priceList = validData.map(row => ({
      sku: row[skuColumn]?.toString().trim(),
      description: row[descColumn]?.toString() || '',
      brand: row[brandColumn]?.toString() || '',
      listPrice: parseFloat(row[listColumn]),
      cashPrice: parseFloat(row[cashColumn])
    }))

    fs.writeFileSync(
      'price-list-reference.json',
      JSON.stringify(priceList, null, 2)
    )

    log('✅ Lista de precios guardada en price-list-reference.json', 'green')

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar
updatePricesByDescription()