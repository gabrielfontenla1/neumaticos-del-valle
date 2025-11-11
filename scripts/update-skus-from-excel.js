#!/usr/bin/env node

/**
 * Script para actualizar los SKUs de los productos con los códigos de proveedor del Excel
 * Usa el mismo algoritmo de matching por descripción para asignar los SKUs correctos
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

async function updateSKUsFromExcel() {
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

    log('\n🔄 ACTUALIZACIÓN DE SKUs CON CÓDIGOS DE PROVEEDOR', 'blue')
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

    // Filtrar registros válidos
    const validData = data.filter(row => {
      const sku = row[skuColumn]?.toString().trim()
      return sku && !isNaN(sku)
    })

    log(`✅ Se encontraron ${validData.length} registros válidos en el Excel`, 'green')

    // 2. Obtener todos los productos de la base de datos
    log('\n📋 Obteniendo productos de la base de datos...', 'cyan')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, sku, name, brand')

    if (fetchError) {
      throw new Error(`Error al obtener productos: ${fetchError.message}`)
    }

    log(`✅ Se encontraron ${products.length} productos en la base de datos`, 'green')

    // Contar productos que ya tienen SKU
    const productsWithSku = products.filter(p => p.sku).length
    log(`📊 Productos con SKU existente: ${productsWithSku}`, 'yellow')

    // 3. Procesar actualizaciones de SKU
    log('\n🔄 Procesando asignación de códigos de proveedor...', 'cyan')

    let matched = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    const updates = []
    const skuAssignments = new Map() // Para evitar SKUs duplicados

    for (const row of validData) {
      const excelSku = row[skuColumn]?.toString().trim()
      const excelDesc = row[descColumn]?.toString() || ''
      const excelBrand = row[brandColumn]?.toString() || ''

      // Extraer información del Excel
      const excelSize = extractSize(excelDesc)
      const excelModel = extractModel(excelDesc)
      const excelBrandNorm = normalizeText(excelBrand)

      // Buscar coincidencia en productos
      let bestMatch = null
      let bestScore = 0

      for (const product of products) {
        // Si este producto ya fue asignado a otro SKU, saltar
        if (skuAssignments.has(product.id)) continue

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

        // Marcar este producto como asignado
        skuAssignments.set(bestMatch.id, excelSku)

        // Si el SKU es diferente al actual, preparar actualización
        if (bestMatch.sku !== excelSku) {
          updates.push({
            id: bestMatch.id,
            name: bestMatch.name,
            brand: bestMatch.brand,
            oldSku: bestMatch.sku,
            newSku: excelSku,
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
    log(`  🔄 SKUs por actualizar: ${updates.length}`, 'yellow')
    log(`  ⏭️  SKUs ya correctos: ${skipped}`, 'cyan')

    if (updates.length > 0) {
      log('\n📋 Primeras 10 actualizaciones de SKU:', 'cyan')
      updates.slice(0, 10).forEach((update, index) => {
        log(`\n${index + 1}. ${update.brand} - ${update.name}`, 'yellow')
        log(`   SKU actual: ${update.oldSku || 'SIN SKU'}`, 'white')
        log(`   SKU nuevo: ${update.newSku}`, 'green')
        log(`   Match Score: ${update.matchScore}%`, 'magenta')
        log(`   Excel: ${update.excelDesc}`, 'white')
      })

      // Confirmar antes de actualizar
      log('\n⚠️  ATENCIÓN: Se actualizarán ' + updates.length + ' SKUs', 'yellow')
      log('Esto permitirá futuras actualizaciones directas por código de proveedor', 'cyan')

      // Aplicar actualizaciones
      log('\n🔄 Aplicando actualizaciones de SKU en la base de datos...', 'cyan')

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ sku: update.newSku })
          .eq('id', update.id)

        if (updateError) {
          log(`❌ Error actualizando SKU para ${update.name}: ${updateError.message}`, 'red')
          errors++
        } else {
          updated++
          if (updated % 10 === 0) {
            log(`   Actualizados: ${updated} SKUs...`, 'cyan')
          }
        }
      }
    }

    // Resumen final
    log('\n' + '=' .repeat(60), 'blue')
    log('📊 RESUMEN DE ACTUALIZACIÓN DE SKUs', 'blue')
    log('=' .repeat(60), 'blue')

    log(`\n✅ SKUs actualizados: ${updated}`, 'green')
    log(`⏭️  SKUs ya correctos: ${skipped}`, 'cyan')
    if (errors > 0) {
      log(`❌ Errores: ${errors}`, 'red')
    }

    log('\n✨ Actualización de SKUs completada', 'green')

    // Guardar mapeo de SKUs para referencia
    log('\n💾 Guardando mapeo de SKUs...', 'cyan')

    const skuMapping = updates.map(u => ({
      productId: u.id,
      productName: u.name,
      brand: u.brand,
      oldSku: u.oldSku,
      newSku: u.newSku,
      matchScore: u.matchScore
    }))

    fs.writeFileSync(
      'sku-mapping-reference.json',
      JSON.stringify(skuMapping, null, 2)
    )

    log('✅ Mapeo de SKUs guardado en sku-mapping-reference.json', 'green')

    log('\n📌 BENEFICIOS:', 'yellow')
    log('   ✅ Futuras actualizaciones serán directas por código de proveedor', 'green')
    log('   ✅ Mayor precisión en la identificación de productos', 'green')
    log('   ✅ Proceso más rápido y confiable', 'green')

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar
updateSKUsFromExcel()