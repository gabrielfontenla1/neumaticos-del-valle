#!/usr/bin/env node

/**
 * Script para agregar price_list a todos los productos
 * Establece price_list como un 25% más que el precio actual
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function updatePriceList() {
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

    log('\n🔄 ACTUALIZACIÓN DE PRICE_LIST EN PRODUCTOS', 'blue')
    log('=' .repeat(60), 'blue')

    // 1. Primero verificar si la columna price_list existe
    log('\n📋 Verificando estructura de la tabla...', 'cyan')
    const { data: sampleProduct, error: sampleError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single()

    if (sampleError && sampleError.code !== 'PGRST116') {
      throw new Error(`Error al verificar tabla: ${sampleError.message}`)
    }

    const hasPriceList = sampleProduct && 'price_list' in sampleProduct

    if (!hasPriceList) {
      log('❌ El campo price_list no existe en la tabla products', 'red')
      log('\n📌 INSTRUCCIONES:', 'yellow')
      log('1. Ejecuta la migración SQL en Supabase:', 'yellow')
      log('   supabase/migrations/20241211_add_price_list.sql', 'yellow')
      log('2. Luego vuelve a ejecutar este script', 'yellow')
      return
    }

    log('✅ Campo price_list detectado', 'green')

    // 2. Obtener todos los productos
    log('\n📋 Obteniendo productos...', 'cyan')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, brand, price, price_list')
      .order('brand', { ascending: true })

    if (fetchError) {
      throw new Error(`Error al obtener productos: ${fetchError.message}`)
    }

    log(`✅ Se encontraron ${products.length} productos`, 'green')

    // 3. Actualizar price_list para productos que no lo tienen
    let updated = 0
    let skipped = 0
    let errors = 0

    log('\n🔄 Actualizando productos...', 'cyan')

    for (const product of products) {
      // Si ya tiene price_list y es diferente de price, no lo tocamos
      if (product.price_list && product.price_list !== product.price) {
        skipped++
        continue
      }

      // Calcular nuevo price_list (25% más que price)
      const newPriceList = Math.round(product.price * 1.25 * 100) / 100

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('products')
        .update({ price_list: newPriceList })
        .eq('id', product.id)

      if (updateError) {
        log(`❌ Error actualizando ${product.brand} - ${product.name}: ${updateError.message}`, 'red')
        errors++
      } else {
        updated++
        if (updated % 50 === 0) {
          log(`   Actualizados: ${updated} productos...`, 'cyan')
        }
      }
    }

    // 4. Mostrar resumen
    log('\n' + '=' .repeat(60), 'blue')
    log('📊 RESUMEN DE ACTUALIZACIÓN', 'blue')
    log('=' .repeat(60), 'blue')

    log(`\n✅ Productos actualizados: ${updated}`, 'green')
    log(`⏭️  Productos omitidos (ya tenían price_list): ${skipped}`, 'yellow')
    if (errors > 0) {
      log(`❌ Errores: ${errors}`, 'red')
    }

    log('\n✨ Actualización completada', 'green')
    log('\n📌 NOTA:', 'yellow')
    log('   Los price_list se han establecido como un 25% más que el precio actual.', 'yellow')
    log('   Puedes ajustar estos valores manualmente en el panel de admin si necesitas', 'yellow')
    log('   precios de lista específicos para cada producto.', 'yellow')

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar
updatePriceList()