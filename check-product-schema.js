require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('🔍 Consultando esquema de tabla products...\n')

  // Obtener un producto completo para ver todos los campos
  const { data: sampleProduct, error } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('📊 Campos disponibles en la tabla products:\n')

  if (sampleProduct) {
    Object.keys(sampleProduct).forEach(key => {
      const value = sampleProduct[key]
      const type = typeof value
      console.log(`  ${key}: ${type} = ${JSON.stringify(value)}`)
    })
  }

  // También obtener información de stock asociado
  console.log('\n🏪 Verificando stock asociado...\n')
  const { data: stockData } = await supabase
    .from('branch_stock')
    .select('*')
    .eq('product_id', sampleProduct.id)

  if (stockData && stockData.length > 0) {
    console.log(`Stock en ${stockData.length} sucursales:`)
    stockData.forEach(s => {
      console.log(`  - ${s.branch_id}: ${s.quantity} unidades`)
    })
  }
}

checkSchema().catch(console.error)
