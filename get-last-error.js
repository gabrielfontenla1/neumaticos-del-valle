require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const XLSX = require('xlsx')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFirstRow() {
  console.log('Probando importacion de la primera fila del Excel...\n')
  
  const filePath = '/Users/gabrielfontenla/Downloads/stock.xlsx'
  const arrayBuffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(arrayBuffer, { type: 'buffer' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 1, defval: null })
  
  console.log('Primera fila del Excel:')
  console.log(JSON.stringify(jsonData[0], null, 2))
  
  const row = jsonData[0]
  
  // Simular el parseTireDescription
  const { parseTireDescription } = require('./src/lib/tire-parser.ts')
  const tireData = parseTireDescription(row.DESCRIPCION)
  
  console.log('\nDatos parseados:')
  console.log(JSON.stringify(tireData, null, 2))
  
  // Intentar insertar
  console.log('\nIntentando insertar en la base de datos...')
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: row.CODIGO_PROPIO,
        name: tireData.display_name,
        slug: row.CODIGO_PROPIO.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        width: tireData.width,
        aspect_ratio: tireData.aspect_ratio,
        rim_diameter: tireData.rim_diameter,
        construction: tireData.construction,
        load_index: tireData.load_index,
        speed_rating: tireData.speed_rating,
        extra_load: tireData.extra_load,
        run_flat: tireData.run_flat,
        seal_inside: tireData.seal_inside,
        tube_type: tireData.tube_type,
        homologation: tireData.homologation,
        original_description: tireData.original_description,
        display_name: tireData.display_name,
        parse_confidence: tireData.parse_confidence,
        parse_warnings: tireData.parse_warnings,
        price: row.PUBLICO || null,
        brand_name: row.MARCA || null,
      })
      .select()
    
    if (error) {
      console.error('\nError al insertar:')
      console.error(JSON.stringify(error, null, 2))
    } else {
      console.log('\nInsercion exitosa!')
      console.log(JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('\nException:')
    console.error(error)
  }
}

testFirstRow()
