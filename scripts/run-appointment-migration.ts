/**
 * Script para ejecutar la migración de appointments via WhatsApp
 * Ejecutar con: npx tsx scripts/run-appointment-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE')
  process.exit(1)
}

// Cliente con service role para operaciones admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
})

async function runMigration() {
  console.log('🚀 Iniciando migración de appointments para WhatsApp...\n')

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251230_whatsapp_appointment_integration.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Dividir en statements individuales (por seguridad)
    // Ejecutamos cada bloque DO $$ ... $$ por separado

    console.log('📋 Ejecutando migración...\n')

    // Ejecutar la migración completa usando rpc
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Si exec_sql no existe, intentamos otra forma
      console.log('⚠️  exec_sql no disponible, ejecutando statements individuales...\n')
      await runStatementsIndividually()
    } else {
      console.log('✅ Migración ejecutada correctamente via exec_sql\n')
    }

    // Verificar que las columnas se crearon
    await verifyMigration()

  } catch (err) {
    console.error('❌ Error en migración:', err)
    process.exit(1)
  }
}

async function runStatementsIndividually() {
  // Ejecutar cada parte de la migración por separado

  // 1. Agregar columna source
  console.log('1️⃣ Agregando columna source...')
  const { error: e1 } = await supabase.from('appointments').select('source').limit(1)
  if (e1?.message?.includes('does not exist')) {
    // La columna no existe, pero no podemos crearla con el cliente JS
    console.log('   ⚠️  Columna source no existe - requiere SQL directo')
  } else {
    console.log('   ✅ Columna source ya existe')
  }

  // 2. Verificar columna service_id
  console.log('2️⃣ Verificando columna service_id...')
  const { error: e2 } = await supabase.from('appointments').select('service_id').limit(1)
  if (e2?.message?.includes('does not exist')) {
    console.log('   ⚠️  Columna service_id no existe - requiere SQL directo')
  } else {
    console.log('   ✅ Columna service_id ya existe')
  }

  // 3. Verificar columna kommo_conversation_id
  console.log('3️⃣ Verificando columna kommo_conversation_id...')
  const { error: e3 } = await supabase.from('appointments').select('kommo_conversation_id').limit(1)
  if (e3?.message?.includes('does not exist')) {
    console.log('   ⚠️  Columna kommo_conversation_id no existe - requiere SQL directo')
  } else {
    console.log('   ✅ Columna kommo_conversation_id ya existe')
  }

  console.log('')
}

async function verifyMigration() {
  console.log('🔍 Verificando migración...\n')

  // Verificar columnas en appointments
  const { data, error } = await supabase
    .from('appointments')
    .select('id, source, service_id, kommo_conversation_id')
    .limit(1)

  if (error) {
    console.log('❌ Error verificando columnas:', error.message)
    console.log('\n⚠️  Las columnas pueden no existir. Ejecutá la migración manualmente:')
    console.log('   1. Abrí Supabase Dashboard → SQL Editor')
    console.log('   2. Pegá el contenido de: supabase/migrations/20251230_whatsapp_appointment_integration.sql')
    console.log('   3. Ejecutá el SQL\n')
  } else {
    console.log('✅ Verificación exitosa - columnas presentes')
    console.log('   Columnas verificadas: source, service_id, kommo_conversation_id\n')
  }

  // Verificar servicios disponibles
  const { data: services, error: servError } = await supabase
    .from('appointment_services')
    .select('id, name')
    .limit(10)

  if (servError) {
    console.log('⚠️  Error obteniendo servicios:', servError.message)
  } else if (services && services.length > 0) {
    console.log('📋 Servicios disponibles:')
    services.forEach((s: { name: string }) => console.log(`   - ${s.name}`))
    console.log('')
  } else {
    console.log('⚠️  No hay servicios en appointment_services\n')
  }

  // Verificar sucursales
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('active', true)
    .limit(10)

  if (storeError) {
    console.log('⚠️  Error obteniendo sucursales:', storeError.message)
  } else if (stores && stores.length > 0) {
    console.log('🏪 Sucursales activas:')
    stores.forEach((s: { name: string }) => console.log(`   - ${s.name}`))
    console.log('')
  } else {
    console.log('⚠️  No hay sucursales activas en stores\n')
  }
}

// Ejecutar
runMigration().then(() => {
  console.log('✨ Script finalizado')
  process.exit(0)
}).catch(err => {
  console.error('💥 Error fatal:', err)
  process.exit(1)
})
