/**
 * Unify Phone and WhatsApp Numbers
 * Makes phone field equal to whatsapp field in all stores
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║      🔄 UNIFICANDO TELÉFONO Y WHATSAPP                       ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  // Obtener todas las sucursales
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, phone, whatsapp')

  if (error || !stores) {
    console.error('❌ Error al cargar sucursales:', error)
    process.exit(1)
  }

  console.log(`📋 Procesando ${stores.length} sucursales\n`)

  let updated = 0
  let alreadyEqual = 0

  for (const store of stores) {
    if (store.phone !== store.whatsapp) {
      console.log(`🔄 ${store.name}`)
      console.log(`   Antes:  phone="${store.phone}" whatsapp="${store.whatsapp}"`)

      const { error: updateError } = await supabase
        .from('stores')
        .update({ phone: store.whatsapp })
        .eq('id', store.id)

      if (!updateError) {
        console.log(`   Ahora:  phone="${store.whatsapp}" whatsapp="${store.whatsapp}"`)
        console.log(`   ✅ Unificado\n`)
        updated++
      } else {
        console.log(`   ❌ Error: ${updateError.message}\n`)
      }
    } else {
      console.log(`⏭️  ${store.name} - Ya están unificados`)
      alreadyEqual++
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                      📊 RESUMEN                              ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  console.log(`   ✅ Actualizadas:     ${updated}`)
  console.log(`   ⏭️  Ya unificadas:    ${alreadyEqual}`)
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
    console.log(`   ¿Iguales? ${mainBranch.phone === mainBranch.whatsapp ? '✅ SÍ' : '❌ NO'}\n`)
  }

  console.log('✅ Proceso completado!\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
