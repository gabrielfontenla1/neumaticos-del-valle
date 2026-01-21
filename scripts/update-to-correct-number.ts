/**
 * Update to Correct Number: 5493855854741
 * Updates ALL occurrences to the correct company number
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
  console.log('║         📱 ACTUALIZANDO AL NÚMERO CORRECTO                   ║')
  console.log('║            +54 9 385 585-4741                                ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  // Obtener todas las sucursales
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, phone, whatsapp')

  if (error || !stores) {
    console.error('❌ Error al cargar sucursales:', error)
    process.exit(1)
  }

  console.log(`📋 Actualizando ${stores.length} sucursales\n`)

  let updated = 0

  for (const store of stores) {
    console.log(`🔄 ${store.name}`)
    console.log(`   Antes:  phone="${store.phone}" whatsapp="${store.whatsapp}"`)

    const { error: updateError } = await supabase
      .from('stores')
      .update({
        phone: CORRECT_NUMBER,
        whatsapp: CORRECT_NUMBER
      })
      .eq('id', store.id)

    if (!updateError) {
      console.log(`   Ahora:  phone="${CORRECT_NUMBER}" whatsapp="${CORRECT_NUMBER}"`)
      console.log(`   ✅ Actualizado\n`)
      updated++
    } else {
      console.log(`   ❌ Error: ${updateError.message}\n`)
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                      📊 RESUMEN                              ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  console.log(`   ✅ Actualizadas:     ${updated}`)
  console.log(`   📋 Total:            ${stores.length}\n`)

  // Verificar sucursal principal
  console.log('🔍 Verificación - Sucursal Principal:\n')

  const { data: mainBranch } = await supabase
    .from('stores')
    .select('name, phone, whatsapp')
    .eq('is_main', true)
    .single()

  if (mainBranch) {
    console.log(`   Nombre:   ${mainBranch.name}`)
    console.log(`   Teléfono: ${mainBranch.phone}`)
    console.log(`   WhatsApp: ${mainBranch.whatsapp}`)
    console.log(`   Correcto? ${mainBranch.phone === CORRECT_NUMBER && mainBranch.whatsapp === CORRECT_NUMBER ? '✅ SÍ' : '❌ NO'}\n`)
  }

  console.log(`✅ Todas las sucursales ahora tienen el número: ${CORRECT_NUMBER}`)
  console.log(`📱 Formato visual: +54 9 385 585-4741\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
