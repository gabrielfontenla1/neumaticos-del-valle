#!/usr/bin/env node

/**
 * Script para verificar que los precios en el listado de productos coincidan con los del detalle
 * Selecciona 100 productos al azar y compara los precios
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

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

async function getAllProducts() {
  log('📋 Obteniendo todos los productos...', 'cyan')
  const data = await fetchWithRetry(`${BASE_URL}/api/products?limit=1000`)

  if (!data.products || !Array.isArray(data.products)) {
    throw new Error('No se pudieron obtener los productos')
  }

  const productsWithStock = data.products.filter(p => p.stock > 0)
  log(`✅ Se encontraron ${data.products.length} productos (${productsWithStock.length} con stock)`, 'green')

  return productsWithStock
}

async function getProductDetail(productId) {
  const data = await fetchWithRetry(`${BASE_URL}/api/products/${productId}`)
  return data.product
}

async function verifyProductPrices(sampleSize = 100) {
  try {
    log('\n🔍 VERIFICADOR DE PRECIOS DE PRODUCTOS', 'blue')
    log('=' .repeat(50), 'blue')

    // Obtener todos los productos
    const allProducts = await getAllProducts()

    if (allProducts.length === 0) {
      log('❌ No hay productos con stock para verificar', 'red')
      return
    }

    // Seleccionar muestra aleatoria
    const actualSampleSize = Math.min(sampleSize, allProducts.length)
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5)
    const sample = shuffled.slice(0, actualSampleSize)

    log(`\n🎲 Verificando ${actualSampleSize} productos al azar...`, 'cyan')
    log('-' .repeat(50))

    let correctCount = 0
    let incorrectCount = 0
    const errors = []

    // Verificar cada producto
    for (let i = 0; i < sample.length; i++) {
      const listProduct = sample[i]

      process.stdout.write(`\rVerificando: ${i + 1}/${actualSampleSize}`)

      try {
        // Obtener detalles del producto
        const detailProduct = await getProductDetail(listProduct.id)

        // Comparar precios
        const listPrice = Number(listProduct.price)
        const detailPrice = Number(detailProduct.price)

        if (Math.abs(listPrice - detailPrice) < 0.01) {
          correctCount++
        } else {
          incorrectCount++
          errors.push({
            id: listProduct.id,
            name: listProduct.name,
            brand: listProduct.brand,
            model: listProduct.model,
            size: `${listProduct.width}/${listProduct.profile}R${listProduct.diameter}`,
            listPrice,
            detailPrice,
            difference: detailPrice - listPrice
          })
        }

        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 50))

      } catch (error) {
        incorrectCount++
        errors.push({
          id: listProduct.id,
          name: listProduct.name,
          error: error.message
        })
      }
    }

    // Limpiar línea de progreso
    process.stdout.write('\r' + ' '.repeat(30) + '\r')

    // Mostrar resultados
    log('\n' + '=' .repeat(50), 'blue')
    log('📊 RESULTADOS DE LA VERIFICACIÓN', 'blue')
    log('=' .repeat(50), 'blue')

    log(`\n✅ Productos con precios correctos: ${correctCount} (${(correctCount/actualSampleSize*100).toFixed(1)}%)`, 'green')
    log(`❌ Productos con precios incorrectos: ${incorrectCount} (${(incorrectCount/actualSampleSize*100).toFixed(1)}%)`, incorrectCount > 0 ? 'red' : 'green')

    // Mostrar errores si los hay
    if (errors.length > 0) {
      log('\n⚠️  PRODUCTOS CON DIFERENCIAS:', 'yellow')
      log('-' .repeat(50))

      errors.slice(0, 10).forEach((error, index) => {
        if (error.error) {
          log(`\n${index + 1}. Error obteniendo producto ${error.id}: ${error.error}`, 'red')
        } else {
          log(`\n${index + 1}. ID: ${error.id}`, 'yellow')
          log(`   Producto: ${error.brand} ${error.name} ${error.model || ''}`, 'reset')
          log(`   Medida: ${error.size}`, 'reset')
          log(`   Precio en lista: $${error.listPrice.toLocaleString('es-AR')}`, 'reset')
          log(`   Precio en detalle: $${error.detailPrice.toLocaleString('es-AR')}`, 'reset')
          log(`   Diferencia: $${Math.abs(error.difference).toLocaleString('es-AR')} ${error.difference > 0 ? '(más caro)' : '(más barato)'}`, 'red')
        }
      })

      if (errors.length > 10) {
        log(`\n... y ${errors.length - 10} productos más con diferencias`, 'yellow')
      }
    }

    // Resumen final
    log('\n' + '=' .repeat(50), 'blue')
    if (incorrectCount === 0) {
      log('🎉 ¡TODOS LOS PRECIOS ESTÁN CORRECTOS!', 'green')
    } else {
      const accuracy = (correctCount/actualSampleSize*100).toFixed(1)
      if (accuracy >= 95) {
        log(`✅ Precisión del ${accuracy}% - Sistema funcionando correctamente`, 'green')
      } else if (accuracy >= 80) {
        log(`⚠️  Precisión del ${accuracy}% - Revisar algunos productos`, 'yellow')
      } else {
        log(`❌ Precisión del ${accuracy}% - Problema detectado en los precios`, 'red')
      }
    }
    log('=' .repeat(50), 'blue')

    // Retornar estadísticas
    return {
      total: actualSampleSize,
      correct: correctCount,
      incorrect: incorrectCount,
      accuracy: (correctCount/actualSampleSize*100).toFixed(1),
      errors: errors.slice(0, 10)
    }

  } catch (error) {
    log(`\n❌ Error durante la verificación: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar verificación
async function main() {
  const sampleSize = process.argv[2] ? parseInt(process.argv[2]) : 100

  if (isNaN(sampleSize) || sampleSize < 1) {
    log('❌ Por favor proporciona un tamaño de muestra válido', 'red')
    log('Uso: node verify-product-prices.js [cantidad]', 'yellow')
    log('Ejemplo: node verify-product-prices.js 100', 'yellow')
    process.exit(1)
  }

  await verifyProductPrices(sampleSize)
}

// Verificar si el servidor está corriendo
fetch(`${BASE_URL}/api/products?limit=1`)
  .then(() => main())
  .catch(() => {
    log(`❌ Error: El servidor no está corriendo en ${BASE_URL}`, 'red')
    log('Por favor, inicia el servidor con: npm run dev', 'yellow')
    process.exit(1)
  })