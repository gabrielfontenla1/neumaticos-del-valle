require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('Verificando estructura de la tabla products...\n')
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }
  
  if (data && data.length > 0) {
    console.log('Columnas disponibles:')
    console.log(Object.keys(data[0]).sort())
  } else {
    console.log('No hay productos en la tabla')
  }
}

checkSchema()
