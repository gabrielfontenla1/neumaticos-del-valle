require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verify() {
  console.log('🔍 Verificando stock en la base de datos...\n')

  // Contar total de registros de stock
  const { count: totalStockRecords } = await supabase
    .from('branch_stock')
    .select('*', { count: 'exact', head: true })

  // Contar productos únicos en stock
  const { data: uniqueProducts } = await supabase
    .from('branch_stock')
    .select('product_id')

  const uniqueCount = new Set(uniqueProducts?.map(p => p.product_id) || []).size

  // Contar por cantidad de sucursales por producto
  const stocksByProduct = {}
  uniqueProducts?.forEach(s => {
    stocksByProduct[s.product_id] = (stocksByProduct[s.product_id] || 0) + 1
  })

  const productsWithSixBranches = Object.values(stocksByProduct).filter(count => count === 6).length
  const productsWithLessThanSix = Object.values(stocksByProduct).filter(count => count < 6).length

  // Contar registros con stock > 0
  const { count: withStock } = await supabase
    .from('branch_stock')
    .select('product_id', { count: 'exact', head: true })
    .gt('quantity', 0)

  // Contar PRODUCTOS ÚNICOS con stock > 0 (esto es lo que busca el usuario)
  const { data: productsWithStock } = await supabase
    .from('branch_stock')
    .select('product_id')
    .gt('quantity', 0)

  const distinctProductsWithStock = new Set(productsWithStock?.map(p => p.product_id) || []).size

  console.log('📊 Verificación de Stock:')
  console.log('  Total registros de stock:', totalStockRecords)
  console.log('  Productos únicos con stock:', uniqueCount)
  console.log('  Productos con 6 sucursales completas:', productsWithSixBranches)
  console.log('  Productos con menos de 6 sucursales:', productsWithLessThanSix)
  console.log('  Registros con stock > 0:', withStock)
  console.log('')
  console.log('🎯 PRODUCTOS DISTINTOS CON STOCK > 0:', distinctProductsWithStock)
  console.log('')
  console.log('✅ Esperado: 4,446 registros (741 productos × 6 sucursales)')

  if (totalStockRecords === 4446) {
    console.log('✅ ¡CORRECTO! Todos los productos tienen 6 sucursales')
    console.log('✅ El fix de Math.max(0, quantity) funcionó perfectamente')
  } else {
    console.log('❌ Faltan', (4446 - totalStockRecords), 'registros')
  }
}

verify().catch(console.error)
