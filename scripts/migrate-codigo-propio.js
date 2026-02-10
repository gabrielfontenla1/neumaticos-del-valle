#!/usr/bin/env node

/**
 * Script de migración: SKU → features.codigo_propio
 *
 * Este script migra el valor de SKU al campo features.codigo_propio
 * para que el proceso de stock/update pueda encontrar los productos.
 *
 * El SKU tiene formato "[102]" y codigo_propio debe ser "102"
 *
 * Uso:
 *   node scripts/migrate-codigo-propio.js
 *
 * Requiere:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function migrate() {
  console.log('🚀 Iniciando migración SKU → features.codigo_propio...\n')

  // 1. Obtener todos los productos
  const { data: products, error } = await supabase
    .from('products')
    .select('id, sku, features')

  if (error) {
    console.error('❌ Error al obtener productos:', error.message)
    process.exit(1)
  }

  console.log(`📊 Total productos en BD: ${products.length}`)

  let updated = 0
  let skipped = 0
  let noSku = 0
  let errors = []

  for (const product of products) {
    // Si ya tiene codigo_propio válido, saltar
    if (product.features?.codigo_propio) {
      skipped++
      continue
    }

    // Si no tiene SKU, saltar
    if (!product.sku) {
      noSku++
      continue
    }

    // Limpiar el SKU (remover corchetes)
    const codigoPropio = product.sku.replace(/[\[\]]/g, '').trim()

    if (!codigoPropio || codigoPropio === 'nan' || codigoPropio === '') {
      noSku++
      continue
    }

    // Actualizar features con codigo_propio
    const newFeatures = {
      ...product.features,
      codigo_propio: codigoPropio
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ features: newFeatures })
      .eq('id', product.id)

    if (updateError) {
      errors.push({ sku: product.sku, error: updateError.message })
      console.error(`   ❌ Error [${product.sku}]: ${updateError.message}`)
    } else {
      updated++
      // Mostrar progreso cada 100 productos
      if (updated % 100 === 0) {
        console.log(`   ✅ Procesados: ${updated}...`)
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMEN DE MIGRACIÓN')
  console.log('='.repeat(50))
  console.log(`✅ Actualizados: ${updated}`)
  console.log(`⏭️  Ya tenían codigo_propio: ${skipped}`)
  console.log(`⚠️  Sin SKU válido: ${noSku}`)
  console.log(`❌ Errores: ${errors.length}`)

  if (errors.length > 0) {
    console.log('\n📋 Detalle de errores:')
    errors.slice(0, 10).forEach(e => {
      console.log(`   [${e.sku}]: ${e.error}`)
    })
    if (errors.length > 10) {
      console.log(`   ... y ${errors.length - 10} errores más`)
    }
  }

  // Verificación final
  console.log('\n🔍 Verificando migración...')
  const { count: withCodigo, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('features->codigo_propio', 'is', null)

  if (!countError) {
    console.log(`✅ Productos con codigo_propio: ${withCodigo}`)
  }

  console.log('\n✅ Migración completada!')
  console.log('   Ahora puedes usar /admin/stock/update para actualizar precios y stock.\n')
}

// Ejecutar
migrate().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
