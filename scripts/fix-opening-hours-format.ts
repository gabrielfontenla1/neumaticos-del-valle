/**
 * Fix Opening Hours Format
 * Convierte el formato detallado a formato simple {weekdays, saturday, sunday}
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

interface DetailedHours {
  monday?: { open: string; close: string }
  tuesday?: { open: string; close: string }
  wednesday?: { open: string; close: string }
  thursday?: { open: string; close: string }
  friday?: { open: string; close: string }
  saturday?: { open: string; close: string; closed?: boolean }
  sunday?: { closed: boolean; open?: string; close?: string }
}

interface SimpleHours {
  weekdays: string
  saturday: string
  sunday?: string
}

function convertToSimpleFormat(detailed: DetailedHours): SimpleHours {
  // Formato weekdays (lunes a viernes)
  const monday = detailed.monday
  let weekdays = 'Cerrado'

  if (monday && monday.open && monday.close) {
    weekdays = `${monday.open} - ${monday.close}`
  }

  // Formato saturday
  const saturday = detailed.saturday
  let saturdayStr = 'Cerrado'

  if (saturday && !saturday.closed && saturday.open && saturday.close) {
    saturdayStr = `${saturday.open} - ${saturday.close}`
  }

  // Formato sunday
  const sunday = detailed.sunday
  let sundayStr = 'Cerrado'

  if (sunday && !sunday.closed && sunday.open && sunday.close) {
    sundayStr = `${sunday.open} - ${sunday.close}`
  }

  return {
    weekdays,
    saturday: saturdayStr,
    sunday: sundayStr
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         🔧 CORRECCIÓN DE FORMATO - OPENING HOURS            ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  // Obtener todas las sucursales
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, opening_hours')

  if (error || !stores) {
    console.error('❌ Error al cargar sucursales:', error)
    process.exit(1)
  }

  console.log(`📋 Encontradas ${stores.length} sucursales\n`)

  let updated = 0
  let skipped = 0

  for (const store of stores) {
    const hours = store.opening_hours as any

    // Verificar si ya está en formato simple
    if (hours && typeof hours === 'object' && 'weekdays' in hours && 'saturday' in hours) {
      console.log(`⏭️  ${store.name} - Ya tiene formato correcto`)
      skipped++
      continue
    }

    // Verificar si tiene formato detallado
    if (hours && typeof hours === 'object' && ('monday' in hours || 'saturday' in hours)) {
      console.log(`🔄 ${store.name} - Convirtiendo formato...`)

      const simpleHours = convertToSimpleFormat(hours as DetailedHours)

      const { error: updateError } = await supabase
        .from('stores')
        .update({ opening_hours: simpleHours })
        .eq('id', store.id)

      if (!updateError) {
        console.log(`   ✅ Actualizado a: L-V: ${simpleHours.weekdays}, Sáb: ${simpleHours.saturday}`)
        updated++
      } else {
        console.log(`   ❌ Error: ${updateError.message}`)
      }
    } else {
      console.log(`⚠️  ${store.name} - Formato desconocido, aplicando valores por defecto`)

      const defaultHours = {
        weekdays: '08:30 - 19:00',
        saturday: '08:30 - 13:00',
        sunday: 'Cerrado'
      }

      const { error: updateError } = await supabase
        .from('stores')
        .update({ opening_hours: defaultHours })
        .eq('id', store.id)

      if (!updateError) {
        console.log(`   ✅ Aplicados valores por defecto`)
        updated++
      }
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                      ✅ COMPLETADO                           ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  console.log(`📊 Resumen:`)
  console.log(`   ✅ Actualizadas: ${updated}`)
  console.log(`   ⏭️  Ya correctas: ${skipped}`)
  console.log(`   📋 Total: ${stores.length}\n`)

  // Verificar resultado
  console.log('🔍 Verificando formato...\n')

  const { data: verification } = await supabase
    .from('stores')
    .select('name, opening_hours')
    .limit(3)

  if (verification) {
    verification.forEach(store => {
      const hours = store.opening_hours as any
      console.log(`${store.name}:`)
      console.log(`   L-V: ${hours.weekdays}`)
      console.log(`   Sáb: ${hours.saturday}`)
      console.log(`   Dom: ${hours.sunday || 'Cerrado'}`)
      console.log('')
    })
  }

  console.log('✅ Formato corregido exitosamente!\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
