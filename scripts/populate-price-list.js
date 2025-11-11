#!/usr/bin/env node

/**
 * Script para poblar price_list desde el archivo Excel
 * Usa el mismo algoritmo de matching por descripción
 * IMPORTANTE: Ejecutar DESPUÉS de agregar la columna price_list en Supabase
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
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
}

// Extraer medida del texto
function extractSize(text) {
  if (!text) return null
  const match = text.match(/(\d{3}\/\d{2}R\d{2}|\d{3}\/\d{2}R\d{2}\.\d)/i)
  return match ? match[0] : null
}

// Extraer modelo de la descripción
function extractModel(text) {
  if (!text) return ''
  let cleaned = text.replace(/\d{3}\/\d{2}R\d{2}[\.\d]*/gi, '')
  cleaned = cleaned.replace(/\b\d{2,3}[HSTVWYZ]\b/gi, '')
  cleaned = cleaned.replace(/\b[HSTVWYZ]\d{2,3}\b/gi, '')
  cleaned = cleaned.replace(/XL|R-F|wl|\(.*?\)/gi, '')
  return normalizeText(cleaned)
}

async function populatePriceList() {
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

    log('\n📊 ACTUALIZACIÓN DE PRICE_LIST DESDE EXCEL', 'blue')
    log('=' .repeat(60), 'blue')

    // 1. Verificar que la columna price_list existe
    log('\n📋 Verificando columna price_list...', 'cyan')
    const { data: sampleProduct, error: sampleError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single()

    if (!sampleProduct || !('price_list' in sampleProduct)) {
      log('\n❌ La columna price_list no existe en la base de datos', 'red')
      log('\n📌 INSTRUCCIONES:', 'yellow')
      log('1. Ejecuta este SQL en Supabase Dashboard:', 'yellow')
      log('\n   ALTER TABLE products', 'cyan')
      log('   ADD COLUMN IF NOT EXISTS price_list DECIMAL(10, 2);', 'cyan')
      log('\n2. Luego vuelve a ejecutar este script', 'yellow')
      return
    }

    log('✅ Columna price_list detectada', 'green')

    // 2. Leer archivo Excel
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
    const listColumn = '__EMPTY_23'      // Precio público (price_list)
    const cashColumn = '-25%'            // Precio contado (price)

    // Filtrar registros válidos
    const validData = data.filter(row => {
      const sku = row[skuColumn]?.toString().trim()
      const listPrice = row[listColumn]
      return sku && !isNaN(sku) && listPrice && !isNaN(listPrice)
    })

    log(`✅ Se encontraron ${validData.length} registros válidos en el Excel`, 'green')

    // 3. Obtener todos los productos de la base de datos
    log('\n📋 Obteniendo productos de la base de datos...', 'cyan')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, sku, name, brand, price, price_list')

    if (fetchError) {
      throw new Error(`Error al obtener productos: ${fetchError.message}`)
    }

    log(`✅ Se encontraron ${products.length} productos en la base de datos`, 'green')

    // 4. Procesar actualizaciones
    log('\n🔄 Procesando actualizaciones de price_list...', 'cyan')

    let matched = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    const updates = []

    for (const row of validData) {
      const excelSku = row[skuColumn]?.toString().trim()
      const excelDesc = row[descColumn]?.toString() || ''
      const excelBrand = row[brandColumn]?.toString() || ''
      const excelListPrice = parseFloat(row[listColumn])
      const excelCashPrice = parseFloat(row[cashColumn])

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
        matched++

        // Solo actualizar si el price_list es diferente o null
        if (!bestMatch.price_list || bestMatch.price_list !== excelListPrice) {
          updates.push({
            id: bestMatch.id,
            name: bestMatch.name,
            brand: bestMatch.brand,
            oldPriceList: bestMatch.price_list,
            newPriceList: excelListPrice,
            newCashPrice: excelCashPrice,
            excelDesc: excelDesc,
            matchScore: bestScore
          })
        } else {
          skipped++
        }
      }
    }

    log(`\n📊 Resultados del análisis:`, 'blue')
    log(`  ✅ Productos encontrados: ${matched}`, 'green')
    log(`  🔄 Actualizaciones pendientes: ${updates.length}`, 'yellow')
    log(`  ⏭️  Ya actualizados: ${skipped}`, 'cyan')

    if (updates.length > 0) {
      log('\n📋 Primeras 10 actualizaciones:', 'cyan')
      updates.slice(0, 10).forEach((update, index) => {
        log(`\n${index + 1}. ${update.brand} - ${update.name}`, 'yellow')
        log(`   Score: ${update.matchScore}%`, 'magenta')
        log(`   Price List: $${update.oldPriceList?.toLocaleString('es-AR') || 'N/A'} → $${update.newPriceList.toLocaleString('es-AR')}`, 'green')
        log(`   Cash Price: $${update.newCashPrice.toLocaleString('es-AR')}`, 'green')
      })

      // Aplicar actualizaciones
      log('\n🔄 Aplicando actualizaciones en la base de datos...', 'cyan')

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ price_list: update.newPriceList })
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

    // Resumen final
    log('\n' + '=' .repeat(60), 'blue')
    log('📊 RESUMEN DE ACTUALIZACIÓN PRICE_LIST', 'blue')
    log('=' .repeat(60), 'blue')

    log(`\n✅ Price_list actualizados: ${updated}`, 'green')
    log(`⏭️  Ya tenían price_list correcto: ${skipped}`, 'cyan')
    if (errors > 0) {
      log(`❌ Errores: ${errors}`, 'red')
    }

    log('\n✨ Actualización de price_list completada', 'green')
    log('\n📌 NOTA:', 'yellow')
    log('   Los price_list ahora reflejan los precios de lista del Excel.', 'yellow')
    log('   La aplicación mostrará automáticamente el descuento calculado.', 'yellow')

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar
populatePriceList()