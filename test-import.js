// Real import test with actual Excel file
const fs = require('fs')
const path = require('path')

async function testImport() {
  console.log('🧪 Iniciando prueba de importación real\n')
  console.log('='.repeat(80))

  const filePath = '/Users/gabrielfontenla/Downloads/stock.xlsx'

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('❌ Error: Archivo no encontrado:', filePath)
    process.exit(1)
  }

  const stats = fs.statSync(filePath)
  console.log(`\n📁 Archivo encontrado:`)
  console.log(`   Ruta: ${filePath}`)
  console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`)
  console.log(`   Modificado: ${stats.mtime.toLocaleString()}`)

  try {
    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath)

    // Create FormData using native fetch FormData
    const formData = new FormData()
    const blob = new Blob([fileBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    formData.append('file', blob, 'stock.xlsx')

    console.log('\n🚀 Enviando archivo al endpoint /api/admin/stock/import...\n')

    const startTime = Date.now()

    const response = await fetch('http://localhost:6001/api/admin/stock/import', {
      method: 'POST',
      body: formData
    })

    const duration = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error en la respuesta del servidor:')
      console.error(`   Status: ${response.status}`)
      console.error(`   Error: ${errorText}`)
      process.exit(1)
    }

    const result = await response.json()

    console.log('✅ Importación completada\n')
    console.log('📊 Resultados:')
    console.log('─'.repeat(80))
    console.log(`   ⏱️  Tiempo de procesamiento: ${duration}ms`)
    console.log(`   📝 Total de filas: ${result.totalRows}`)
    console.log(`   ✓  Procesadas: ${result.processed}`)
    console.log(`   ➕ Creadas: ${result.created}`)
    console.log(`   ✏️  Actualizadas: ${result.updated}`)
    console.log(`   ❌ Errores: ${result.errors.length}`)
    console.log(`   ⚠️  Advertencias: ${result.warnings.length}`)

    if (result.errors.length > 0) {
      console.log('\n❌ Errores encontrados:')
      console.log('─'.repeat(80))
      result.errors.slice(0, 10).forEach((error, idx) => {
        console.log(`   ${idx + 1}. Fila ${error.row} - SKU: ${error.sku}`)
        console.log(`      Error: ${error.error}`)
      })
      if (result.errors.length > 10) {
        console.log(`   ... y ${result.errors.length - 10} errores más`)
      }
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Advertencias encontradas:')
      console.log('─'.repeat(80))
      result.warnings.slice(0, 10).forEach((warning, idx) => {
        console.log(`   ${idx + 1}. Fila ${warning.row} - SKU: ${warning.sku}`)
        console.log(`      Advertencia: ${warning.warning}`)
      })
      if (result.warnings.length > 10) {
        console.log(`   ... y ${result.warnings.length - 10} advertencias más`)
      }
    }

    // Success metrics
    const successRate = ((result.processed / result.totalRows) * 100).toFixed(1)
    const avgTime = (duration / result.totalRows).toFixed(0)

    console.log('\n📈 Métricas de rendimiento:')
    console.log('─'.repeat(80))
    console.log(`   Tasa de éxito: ${successRate}%`)
    console.log(`   Tiempo promedio por fila: ${avgTime}ms`)

    if (result.success) {
      console.log('\n✨ Importación exitosa!\n')
    } else {
      console.log('\n⚠️  Importación completada con errores\n')
    }

  } catch (error) {
    console.error('\n❌ Error durante la importación:')
    console.error(error)
    process.exit(1)
  }
}

testImport()
