#!/usr/bin/env node

/**
 * Script para verificar los precios y price_list de los productos
 * Compara lo que viene de la API con lo que se muestra
 */

const BASE_URL = 'http://localhost:6001'

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testProductPrices() {
  try {
    log('\n🔍 ANALIZANDO PRECIOS DE PRODUCTOS', 'blue')
    log('=' .repeat(60), 'blue')

    // 1. Obtener productos de la API
    log('\n📋 Obteniendo productos desde /api/products...', 'cyan')
    const response = await fetch(`${BASE_URL}/api/products?limit=10`)
    const data = await response.json()

    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('No se pudieron obtener los productos')
    }

    const products = data.products.slice(0, 10) // Analizar los primeros 10
    log(`✅ Se obtuvieron ${products.length} productos`, 'green')

    // 2. Analizar cada producto
    log('\n📊 ANÁLISIS DE PRECIOS:', 'yellow')
    log('-' .repeat(60))

    let withPriceList = 0
    let withoutPriceList = 0
    let priceListEqualsPrice = 0
    let priceListGreaterThanPrice = 0

    products.forEach((product, index) => {
      log(`\n${index + 1}. ${product.brand} - ${product.name}`, 'cyan')
      log(`   ID: ${product.id}`)
      log(`   SKU: ${product.sku || 'N/A'}`)

      // Información de precios
      log(`   📌 Precio actual (price): $${product.price?.toLocaleString('es-AR') || 'NO DEFINIDO'}`, 'green')

      if (product.price_list !== undefined && product.price_list !== null) {
        log(`   📌 Precio de lista (price_list): $${product.price_list.toLocaleString('es-AR')}`, 'yellow')
        withPriceList++

        if (product.price_list === product.price) {
          log(`   ⚠️  price_list = price (no hay descuento real)`, 'yellow')
          priceListEqualsPrice++
        } else if (product.price_list > product.price) {
          const discount = Math.round(((product.price_list - product.price) / product.price_list) * 100)
          log(`   ✅ Descuento real: ${discount}%`, 'green')
          priceListGreaterThanPrice++
        } else {
          log(`   ❌ ERROR: price_list ($${product.price_list}) es menor que price ($${product.price})`, 'red')
        }
      } else {
        log(`   ⚠️  price_list: NO EXISTE en la base de datos`, 'red')
        withoutPriceList++
      }

      // Cálculo simulado (lo que hace el front cuando no hay price_list)
      if (!product.price_list) {
        const simulatedListPrice = Math.floor(product.price * 1.25)
        log(`   🔄 Precio de lista SIMULADO en frontend: $${simulatedListPrice.toLocaleString('es-AR')} (25% más)`, 'magenta')
      }

      log(`   Stock: ${product.stock || 0}`)
    })

    // 3. Resumen estadístico
    log('\n' + '=' .repeat(60), 'blue')
    log('📈 RESUMEN ESTADÍSTICO', 'blue')
    log('=' .repeat(60), 'blue')

    log(`\n✅ Productos CON price_list: ${withPriceList} (${(withPriceList/products.length*100).toFixed(1)}%)`, withPriceList > 0 ? 'green' : 'red')
    log(`❌ Productos SIN price_list: ${withoutPriceList} (${(withoutPriceList/products.length*100).toFixed(1)}%)`, withoutPriceList > 0 ? 'yellow' : 'green')

    if (withPriceList > 0) {
      log(`   - Con descuento real: ${priceListGreaterThanPrice}`, 'green')
      log(`   - Sin descuento (price_list = price): ${priceListEqualsPrice}`, 'yellow')
    }

    // 4. Verificar un producto específico en detalle
    if (products.length > 0) {
      const testProduct = products[0]
      log('\n' + '=' .repeat(60), 'blue')
      log('🔎 VERIFICACIÓN DETALLADA DEL PRIMER PRODUCTO', 'blue')
      log('=' .repeat(60), 'blue')

      // Obtener el detalle del producto
      const detailResponse = await fetch(`${BASE_URL}/api/products/${testProduct.id}`)
      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        const detailProduct = detailData.product

        log(`\nComparando producto: ${testProduct.name}`, 'cyan')
        log('\n📋 Desde /api/products (listado):', 'yellow')
        log(`   price: $${testProduct.price}`)
        log(`   price_list: ${testProduct.price_list ? `$${testProduct.price_list}` : 'NO EXISTE'}`)

        log('\n📋 Desde /api/products/[id] (detalle):', 'yellow')
        log(`   price: $${detailProduct.price}`)
        log(`   price_list: ${detailProduct.price_list ? `$${detailProduct.price_list}` : 'NO EXISTE'}`)

        // Comparar
        if (testProduct.price === detailProduct.price) {
          log('\n✅ Los precios (price) coinciden', 'green')
        } else {
          log(`\n❌ ERROR: Los precios NO coinciden!`, 'red')
          log(`   Listado: $${testProduct.price}`, 'red')
          log(`   Detalle: $${detailProduct.price}`, 'red')
        }

        if (testProduct.price_list === detailProduct.price_list) {
          log('✅ Los price_list coinciden', 'green')
        } else {
          log(`❌ ERROR: Los price_list NO coinciden!`, 'red')
          log(`   Listado: ${testProduct.price_list || 'null'}`, 'red')
          log(`   Detalle: ${detailProduct.price_list || 'null'}`, 'red')
        }
      } else {
        log(`\n❌ No se pudo obtener el detalle del producto ${testProduct.id}`, 'red')
      }
    }

    // 5. Conclusiones
    log('\n' + '=' .repeat(60), 'blue')
    log('💡 CONCLUSIONES', 'blue')
    log('=' .repeat(60), 'blue')

    if (withoutPriceList === products.length) {
      log('\n⚠️  PROBLEMA DETECTADO:', 'red')
      log('   Ningún producto tiene price_list en la base de datos.', 'red')
      log('   El frontend está SIMULANDO todos los precios de lista (25% más).', 'red')
      log('\n   SOLUCIÓN:', 'yellow')
      log('   1. Agregar campo price_list a la tabla products en Supabase', 'yellow')
      log('   2. Poblar price_list con los precios reales de lista', 'yellow')
      log('   3. O usar el campo price como precio de lista y crear un campo price_sale para el precio con descuento', 'yellow')
    } else if (withoutPriceList > 0) {
      log(`\n⚠️  ${withoutPriceList} productos no tienen price_list definido.`, 'yellow')
      log('   Estos productos mostrarán un precio de lista simulado.', 'yellow')
    } else {
      log('\n✅ Todos los productos tienen price_list definido correctamente.', 'green')
    }

    return {
      total: products.length,
      withPriceList,
      withoutPriceList,
      priceListEqualsPrice,
      priceListGreaterThanPrice
    }

  } catch (error) {
    log(`\n❌ Error durante el análisis: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar el test
fetch(`${BASE_URL}/api/products?limit=1`)
  .then(() => testProductPrices())
  .catch(() => {
    log(`❌ Error: El servidor no está corriendo en ${BASE_URL}`, 'red')
    log('Por favor, inicia el servidor con: npm run dev', 'yellow')
    process.exit(1)
  })