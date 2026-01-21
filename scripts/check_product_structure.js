#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Load environment variables
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStructure() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, features')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\n📊 Estructura de productos:')
  console.log('='.repeat(80))

  products.forEach((p, i) => {
    console.log(`\nProducto ${i + 1}:`)
    console.log(`  ID: ${p.id}`)
    console.log(`  Name: ${p.name}`)
    console.log(`  Features:`, JSON.stringify(p.features, null, 2))
  })

  // Verificar si id es UUID o codigo_propio
  const sample = products[0]
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sample.id)

  console.log(`\n📋 El campo 'id' es ${isUUID ? 'UUID' : 'codigo_propio'}`)
}

checkStructure()
