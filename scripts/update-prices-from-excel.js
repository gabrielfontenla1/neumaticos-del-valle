#!/usr/bin/env node

/**
 * Script para actualizar precios desde un archivo Excel
 * Mapea códigos de proveedor y actualiza price (contado) y price_list (lista)
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

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

async function updatePricesFromExcel() {
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

    log('\n📊 ACTUALIZACIÓN DE PRECIOS DESDE EXCEL', 'blue')
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

    log(`✅ Se encontraron ${data.length} registros en el Excel`, 'green')

    // 2. Mostrar primeras filas para entender la estructura
    log('\n📋 Estructura del archivo (primeras 5 filas):', 'cyan')
    const sample = data.slice(0, 5)
    sample.forEach((row, index) => {
      log(`\nFila ${index + 1}:`, 'yellow')
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`)
      })
    })

    // 3. Identificar columnas - basado en la estructura real del Excel
    // El Excel tiene los headers en la primera fila pero mal interpretados
    // Las columnas reales son:
    // __EMPTY = Código proveedor (columna B)
    // __EMPTY_23 = Precio público/lista (columna Y)
    // -25% = Precio contado (columna Z)

    const firstRow = data[0] || {}
    const columns = Object.keys(firstRow)
    log('\n📋 Estructura identificada del Excel:', 'cyan')
    log('  - Código proveedor: columna __EMPTY', 'white')
    log('  - Precio lista: columna __EMPTY_23', 'white')
    log('  - Precio contado: columna -25%', 'white')

    // Asignar columnas basado en la estructura real
    let skuColumn = '__EMPTY'
    let listColumn = '__EMPTY_23'
    let cashColumn = '-25%'

    log('\n🔍 Mapeo detectado:', 'magenta')
    log(`  Código/SKU: ${skuColumn || 'NO ENCONTRADO'}`, skuColumn ? 'green' : 'red')
    log(`  Precio Lista: ${listColumn || 'NO ENCONTRADO'}`, listColumn ? 'green' : 'red')
    log(`  Precio Contado: ${cashColumn || 'NO ENCONTRADO'}`, cashColumn ? 'green' : 'red')

    if (!skuColumn) {
      log('\n❌ No se pudo identificar la columna de código/SKU', 'red')
      log('Columnas disponibles:', 'yellow')
      columns.forEach(col => log(`  - ${col}`, 'white'))
      return
    }

    // 5. Obtener todos los productos de la base de datos
    log('\n📋 Obteniendo productos de la base de datos...', 'cyan')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, sku, name, brand, price')

    if (fetchError) {
      throw new Error(`Error al obtener productos: ${fetchError.message}`)
    }

    log(`✅ Se encontraron ${products.length} productos en la base de datos`, 'green')

    // 6. Crear mapa de productos por SKU
    const productsBySku = {}
    let skuCount = 0
    products.forEach(product => {
      if (product.sku) {
        productsBySku[product.sku.trim()] = product
        skuCount++
      }
    })

    log(`\n📊 Productos con SKU en la base de datos: ${skuCount}`, 'cyan')

    // Mostrar algunos SKUs de ejemplo de la base de datos
    const sampleSkus = Object.keys(productsBySku).slice(0, 5)
    if (sampleSkus.length > 0) {
      log('Ejemplos de SKUs en la base de datos:', 'yellow')
      sampleSkus.forEach(sku => {
        const prod = productsBySku[sku]
        log(`  - ${sku}: ${prod.brand} - ${prod.name}`, 'white')
      })
    }

    // 7. Procesar actualizaciones
    log('\n🔄 Procesando actualizaciones...', 'cyan')

    let matched = 0
    let notFound = 0
    let updated = 0
    let errors = 0
    const updates = []
    const notFoundSkus = []

    // Filtrar solo las filas con datos válidos (ignorar headers)
    const validData = data.filter(row => {
      const sku = row[skuColumn]?.toString().trim()
      const price = row[cashColumn]
      // Solo procesar filas que tengan SKU numérico y precio
      return sku && !isNaN(sku) && price && !isNaN(price)
    })

    log(`✅ Se encontraron ${validData.length} registros válidos para procesar`, 'green')

    for (const row of validData) {
      const sku = row[skuColumn]?.toString().trim()
      if (!sku) continue

      const product = productsBySku[sku]

      if (product) {
        matched++

        // Obtener precios del Excel
        const newPriceList = listColumn ? parseFloat(row[listColumn]) : null
        const newPrice = cashColumn ? parseFloat(row[cashColumn]) : null

        // Preparar actualización
        const update = {
          id: product.id,
          sku: sku,
          oldPrice: product.price,
          oldPriceList: null, // No tenemos price_list aún
          newPrice: newPrice,
          newPriceList: newPriceList
        }

        // Solo actualizar si hay cambios en el precio
        if (newPrice && newPrice !== product.price) {
          updates.push(update)
        }
      } else {
        notFound++
        notFoundSkus.push(sku)
      }
    }

    log(`\n📊 Resultados del análisis:`, 'blue')
    log(`  ✅ Productos encontrados: ${matched}`, 'green')
    log(`  ❌ SKUs no encontrados: ${notFound}`, 'red')
    log(`  🔄 Actualizaciones pendientes: ${updates.length}`, 'yellow')

    if (notFoundSkus.length > 0 && notFoundSkus.length <= 20) {
      log('\n❌ SKUs no encontrados en la base de datos:', 'red')
      notFoundSkus.slice(0, 20).forEach(sku => {
        log(`  - ${sku}`, 'white')
      })
      if (notFoundSkus.length > 20) {
        log(`  ... y ${notFoundSkus.length - 20} más`, 'yellow')
      }
    }

    if (updates.length > 0) {
      log('\n📋 Primeras 10 actualizaciones pendientes:', 'cyan')
      updates.slice(0, 10).forEach((update, index) => {
        log(`\n${index + 1}. SKU: ${update.sku}`, 'yellow')
        if (update.newPrice) {
          log(`   Precio contado: $${update.oldPrice?.toLocaleString('es-AR') || 'N/A'} → $${update.newPrice.toLocaleString('es-AR')}`, 'white')
        }
        if (update.newPriceList) {
          log(`   Precio lista: $${update.oldPriceList?.toLocaleString('es-AR') || 'N/A'} → $${update.newPriceList.toLocaleString('es-AR')}`, 'white')
        }
      })

      // 8. Ejecutar actualizaciones
      log('\n🔄 Aplicando actualizaciones en la base de datos...', 'cyan')

      for (const update of updates) {
        const updateData = {}
        if (update.newPrice) updateData.price = update.newPrice
        // Por ahora no actualizamos price_list porque no existe la columna
        // if (update.newPriceList) updateData.price_list = update.newPriceList

        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', update.id)

        if (updateError) {
          log(`❌ Error actualizando SKU ${update.sku}: ${updateError.message}`, 'red')
          errors++
        } else {
          updated++
          if (updated % 50 === 0) {
            log(`   Actualizados: ${updated} productos...`, 'cyan')
          }
        }
      }
    }

    // 9. Mostrar resumen final
    log('\n' + '=' .repeat(60), 'blue')
    log('📊 RESUMEN DE ACTUALIZACIÓN', 'blue')
    log('=' .repeat(60), 'blue')

    log(`\n✅ Productos actualizados: ${updated}`, 'green')
    log(`⚠️  SKUs no encontrados: ${notFound}`, 'yellow')
    if (errors > 0) {
      log(`❌ Errores: ${errors}`, 'red')
    }

    log('\n✨ Actualización completada', 'green')

    if (notFound > 0) {
      log('\n📌 NOTA:', 'yellow')
      log('   Algunos SKUs del Excel no se encontraron en la base de datos.', 'yellow')
      log('   Esto puede deberse a:', 'yellow')
      log('   - Diferencias en el formato del código', 'yellow')
      log('   - Productos nuevos que no están en el sistema', 'yellow')
      log('   - SKUs mal escritos o diferentes', 'yellow')
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar
updatePricesFromExcel()