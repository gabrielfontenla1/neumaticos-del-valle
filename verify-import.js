// Verify import results in database
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyImport() {
  console.log('Verificando resultados de la importacion\n')
  console.log('='.repeat(80))

  try {
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (productError) throw productError

    console.log('\nProductos en la base de datos:', productCount)

    const { count: parsedCount, error: parsedError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('display_name', 'is', null)

    if (parsedError) throw parsedError

    console.log('Productos con datos procesados:', parsedCount)

    const { count: stockCount, error: stockError } = await supabase
      .from('branch_stock')
      .select('*', { count: 'exact', head: true })

    if (stockError) throw stockError

    console.log('Registros de stock por sucursal:', stockCount)

    const { data: samples, error: sampleError } = await supabase
      .from('products')
      .select('sku, original_description, display_name, width, aspect_ratio, rim_diameter, parse_confidence')
      .not('display_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (sampleError) throw sampleError

    console.log('\nMuestra de productos procesados:')
    console.log('-'.repeat(80))
    samples.forEach((product, idx) => {
      console.log('\n' + (idx + 1) + '. SKU: ' + product.sku)
      console.log('   Original: "' + product.original_description + '"')
      console.log('   Limpio:   "' + product.display_name + '"')
      console.log('   Medida: ' + product.width + '/' + product.aspect_ratio + 'R' + product.rim_diameter)
      console.log('   Confianza: ' + product.parse_confidence + '%')
    })

    const { data: zeroStockBranches, error: zeroError } = await supabase
      .from('branch_stock')
      .select('quantity, products(sku), branches(code)')
      .eq('quantity', 0)
      .limit(5)

    if (zeroError) throw zeroError

    if (zeroStockBranches && zeroStockBranches.length > 0) {
      console.log('\nVerificacion de stock = 0 (celdas vacias):')
      console.log('-'.repeat(80))
      zeroStockBranches.forEach((record, idx) => {
        console.log('   ' + (idx + 1) + '. SKU: ' + record.products?.sku + ' - Sucursal: ' + record.branches?.code + ' - Stock: ' + record.quantity)
      })
    }

    const { data: confidenceStats, error: confError } = await supabase
      .from('products')
      .select('parse_confidence')
      .not('parse_confidence', 'is', null)

    if (confError) throw confError

    const avgConfidence = confidenceStats.reduce((sum, p) => sum + p.parse_confidence, 0) / confidenceStats.length
    const lowConfidence = confidenceStats.filter(p => p.parse_confidence < 70).length

    console.log('\nEstadisticas de calidad del parsing:')
    console.log('-'.repeat(80))
    console.log('   Confianza promedio: ' + avgConfidence.toFixed(1) + '%')
    console.log('   Productos con baja confianza (<70%): ' + lowConfidence)

    console.log('\nVerificacion completada exitosamente!\n')

  } catch (error) {
    console.error('\nError durante la verificacion:')
    console.error(error)
    process.exit(1)
  }
}

verifyImport()
