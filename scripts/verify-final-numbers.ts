/**
 * Verify Final Numbers - Confirm all phone and WhatsApp numbers are correct
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CORRECT_NUMBER = '5493855854741'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         ✅ VERIFICACIÓN FINAL DE NÚMEROS                     ║')
  console.log('║            Número Correcto: +54 9 385 585-4741              ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  // Get all branches
  const { data: stores, error } = await supabase
    .from('stores')
    .select('name, phone, whatsapp')
    .order('name')

  if (error || !stores) {
    console.error('❌ Error al cargar sucursales:', error)
    process.exit(1)
  }

  console.log(`📋 Verificando ${stores.length} sucursales:\n`)

  let allCorrect = true
  stores.forEach((store) => {
    const phoneOk = store.phone === CORRECT_NUMBER
    const whatsappOk = store.whatsapp === CORRECT_NUMBER
    const bothOk = phoneOk && whatsappOk

    if (!bothOk) allCorrect = false

    console.log(`${bothOk ? '✅' : '❌'} ${store.name}`)
    console.log(`   Teléfono:  ${phoneOk ? '✅' : '❌'} ${store.phone}`)
    console.log(`   WhatsApp:  ${whatsappOk ? '✅' : '❌'} ${store.whatsapp}\n`)
  })

  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                      📊 RESULTADO FINAL                      ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  if (allCorrect) {
    console.log('✅ ÉXITO: Todas las sucursales tienen el número correcto')
    console.log(`   Teléfono: ${CORRECT_NUMBER}`)
    console.log(`   WhatsApp: ${CORRECT_NUMBER}`)
    console.log(`   Formato visual: +54 9 385 585-4741\n`)
  } else {
    console.log('❌ ERROR: Algunas sucursales tienen números incorrectos\n')
    process.exit(1)
  }

  // Verify main branch
  const { data: mainBranch } = await supabase
    .from('stores')
    .select('name, phone, whatsapp')
    .eq('is_main', true)
    .single()

  if (mainBranch) {
    console.log('🏢 Sucursal Principal:\n')
    console.log(`   Nombre:   ${mainBranch.name}`)
    console.log(`   Teléfono: ${mainBranch.phone}`)
    console.log(`   WhatsApp: ${mainBranch.whatsapp}`)
    const mainOk = mainBranch.phone === CORRECT_NUMBER && mainBranch.whatsapp === CORRECT_NUMBER
    console.log(`   Estado:   ${mainOk ? '✅ CORRECTO' : '❌ INCORRECTO'}\n`)
  }

  console.log('✅ Verificación completada!\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
