/**
 * Script de Limpieza de Datos - Sucursales
 * Corrige problemas detectados en QA
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixMissingProvinces() {
  console.log('\n📍 Corrigiendo provincias faltantes...')
  console.log('─'.repeat(60))

  const { data: noProvince } = await supabase
    .from('stores')
    .select('id, name, city')
    .is('province', null)

  if (!noProvince || noProvince.length === 0) {
    console.log('✅ Todas las sucursales tienen provincia')
    return { fixed: 0 }
  }

  console.log(`📋 Encontradas ${noProvince.length} sucursales sin provincia\n`)

  let fixed = 0

  for (const branch of noProvince) {
    let guessedProvince = null

    // Intentar detectar provincia desde el nombre o ciudad
    const text = `${branch.name} ${branch.city}`.toLowerCase()

    const provinceMap: Record<string, string[]> = {
      'Buenos Aires': ['buenos aires', 'caba', 'capital federal', 'vicente lópez', 'avellaneda'],
      'Catamarca': ['catamarca'],
      'Chaco': ['chaco', 'resistencia'],
      'Chubut': ['chubut', 'comodoro', 'trelew'],
      'Córdoba': ['córdoba', 'cordoba', 'villa carlos paz'],
      'Corrientes': ['corrientes'],
      'Entre Ríos': ['entre ríos', 'entre rios', 'paraná', 'concordia'],
      'Formosa': ['formosa'],
      'Jujuy': ['jujuy', 'san salvador'],
      'La Pampa': ['la pampa', 'santa rosa'],
      'La Rioja': ['la rioja'],
      'Mendoza': ['mendoza'],
      'Misiones': ['misiones', 'posadas'],
      'Neuquén': ['neuquén', 'neuquen'],
      'Río Negro': ['río negro', 'rio negro', 'bariloche', 'viedma'],
      'Salta': ['salta'],
      'San Juan': ['san juan'],
      'San Luis': ['san luis'],
      'Santa Cruz': ['santa cruz', 'río gallegos'],
      'Santa Fe': ['santa fe', 'rosario'],
      'Santiago del Estero': ['santiago', 'la banda'],
      'Tierra del Fuego': ['tierra del fuego', 'ushuaia'],
      'Tucumán': ['tucumán', 'tucuman', 'san miguel de tucumán']
    }

    for (const [province, keywords] of Object.entries(provinceMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        guessedProvince = province
        break
      }
    }

    if (guessedProvince) {
      const { error } = await supabase
        .from('stores')
        .update({ province: guessedProvince })
        .eq('id', branch.id)

      if (!error) {
        console.log(`✅ ${branch.name} → ${guessedProvince}`)
        fixed++
      } else {
        console.log(`❌ Error actualizando ${branch.name}: ${error.message}`)
      }
    } else {
      console.log(`⚠️  No se pudo detectar provincia para: ${branch.name}`)
      console.log(`   Ciudad: ${branch.city}`)
      console.log(`   Acción: Revisar manualmente`)
    }
  }

  console.log(`\n📊 Provincias actualizadas: ${fixed}/${noProvince.length}`)

  return { fixed, total: noProvince.length }
}

async function ensureSingleMainBranch() {
  console.log('\n⭐ Verificando sucursal principal única...')
  console.log('─'.repeat(60))

  const { data: mainBranches } = await supabase
    .from('stores')
    .select('id, name, created_at')
    .eq('is_main', true)
    .order('created_at', { ascending: true })

  if (!mainBranches || mainBranches.length === 0) {
    console.log('❌ No hay ninguna sucursal marcada como principal')
    console.log('   Acción: Marcar la primera sucursal como principal')

    const { data: firstBranch } = await supabase
      .from('stores')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (firstBranch) {
      await supabase
        .from('stores')
        .update({ is_main: true })
        .eq('id', firstBranch.id)

      console.log(`✅ Marcada como principal: ${firstBranch.name}`)
    }

    return { fixed: 1 }
  }

  if (mainBranches.length === 1) {
    console.log(`✅ Una única sucursal principal: ${mainBranches[0].name}`)
    return { fixed: 0 }
  }

  console.log(`⚠️  Múltiples sucursales principales detectadas: ${mainBranches.length}`)

  // Mantener solo la primera (más antigua)
  const keepMain = mainBranches[0]
  const toUnmark = mainBranches.slice(1)

  console.log(`\n📋 Manteniendo: ${keepMain.name} (creada: ${keepMain.created_at})`)
  console.log(`📋 Desmarcando ${toUnmark.length} sucursales:\n`)

  for (const branch of toUnmark) {
    const { error } = await supabase
      .from('stores')
      .update({ is_main: false })
      .eq('id', branch.id)

    if (!error) {
      console.log(`   ✅ Desmarcada: ${branch.name}`)
    } else {
      console.log(`   ❌ Error desmarcando ${branch.name}`)
    }
  }

  console.log(`\n✅ Problema de múltiples principales resuelto`)

  return { fixed: toUnmark.length }
}

async function standardizePhoneFormats() {
  console.log('\n📞 Estandarizando formatos de teléfono...')
  console.log('─'.repeat(60))

  const { data: allBranches } = await supabase
    .from('stores')
    .select('id, name, phone, whatsapp')

  if (!allBranches) {
    console.log('❌ No se pudieron cargar sucursales')
    return { fixed: 0 }
  }

  let fixed = 0

  for (const branch of allBranches) {
    const updates: any = {}

    // Limpiar teléfono: remover espacios extras, guiones, paréntesis
    if (branch.phone) {
      const cleanPhone = branch.phone.replace(/[\s\-\(\)]/g, '')
      if (cleanPhone !== branch.phone.replace(/\s/g, '')) {
        updates.phone = branch.phone // Mantener formato original pero sin espacios dobles
      }
    }

    // Verificar formato WhatsApp (debe empezar con 549)
    if (branch.whatsapp && !branch.whatsapp.startsWith('549')) {
      // Intentar corregir si parece número argentino
      const digits = branch.whatsapp.replace(/\D/g, '')

      if (digits.length >= 10) {
        // Si tiene 10+ dígitos, probablemente falta el prefijo
        const possibleArea = digits.substring(0, 3)

        // Áreas típicas de Argentina
        if (['383', '385', '381', '387'].includes(possibleArea)) {
          updates.whatsapp = `549${digits}`
          console.log(`   ⚠️  ${branch.name}: WhatsApp corregido → 549${digits}`)
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', branch.id)

      if (!error) {
        fixed++
      }
    }
  }

  if (fixed > 0) {
    console.log(`✅ Formatos actualizados: ${fixed} sucursales`)
  } else {
    console.log(`✅ Todos los formatos son correctos`)
  }

  return { fixed }
}

async function generateDataQualityReport() {
  console.log('\n📊 Generando reporte de calidad de datos...')
  console.log('─'.repeat(60))

  const { data: allBranches } = await supabase
    .from('stores')
    .select('*')

  if (!allBranches) {
    console.log('❌ No se pudieron cargar datos')
    return
  }

  const total = allBranches.length

  // Completitud
  const withEmail = allBranches.filter(b => b.email).length
  const withWhatsApp = allBranches.filter(b => b.whatsapp).length
  const withCoords = allBranches.filter(b => b.latitude && b.longitude).length
  const withImage = allBranches.filter(b => b.background_image_url).length
  const withProvince = allBranches.filter(b => b.province).length

  console.log('\n📈 Completitud de Datos:\n')
  console.log(`   Email:            ${withEmail}/${total} (${Math.round(withEmail/total*100)}%)`)
  console.log(`   WhatsApp:         ${withWhatsApp}/${total} (${Math.round(withWhatsApp/total*100)}%)`)
  console.log(`   Coordenadas:      ${withCoords}/${total} (${Math.round(withCoords/total*100)}%)`)
  console.log(`   Imagen:           ${withImage}/${total} (${Math.round(withImage/total*100)}%)`)
  console.log(`   Provincia:        ${withProvince}/${total} (${Math.round(withProvince/total*100)}%)`)

  // Sucursales activas/inactivas
  const active = allBranches.filter(b => b.active).length
  const inactive = total - active

  console.log('\n📍 Estado:\n')
  console.log(`   Activas:          ${active}/${total} (${Math.round(active/total*100)}%)`)
  console.log(`   Inactivas:        ${inactive}/${total} (${Math.round(inactive/total*100)}%)`)

  // Sucursales principales
  const main = allBranches.filter(b => b.is_main).length

  console.log('\n⭐ Sucursales Principales:\n')
  console.log(`   Principales:      ${main} (debe ser 1)`)

  // Distribución geográfica
  const byProvince = allBranches.reduce((acc, b) => {
    const prov = b.province || 'Sin provincia'
    acc[prov] = (acc[prov] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n🗺️  Distribución Geográfica:\n')
  Object.entries(byProvince)
    .sort(([,a], [,b]) => b - a)
    .forEach(([province, count]) => {
      const bar = '█'.repeat(Math.ceil(count / total * 20))
      console.log(`   ${province.padEnd(25)} ${bar} ${count}`)
    })

  // Recomendaciones
  console.log('\n💡 Recomendaciones:\n')

  if (withImage / total < 0.5) {
    console.log('   ⚠️  Menos del 50% tienen imagen - Subir imágenes')
  }

  if (withCoords / total < 0.3) {
    console.log('   ⚠️  Menos del 30% tienen coordenadas - Agregar ubicación GPS')
  }

  if (withProvince < total) {
    console.log(`   ⚠️  ${total - withProvince} sucursales sin provincia - Completar datos`)
  }

  if (main !== 1) {
    console.log(`   ⚠️  Debe haber exactamente 1 sucursal principal (hay ${main})`)
  }

  console.log('')
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         🧹 LIMPIEZA DE DATOS - SUCURSALES                   ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')

  const startTime = Date.now()

  try {
    // 1. Corregir provincias faltantes
    const provincesResult = await fixMissingProvinces()

    // 2. Asegurar sucursal principal única
    const mainResult = await ensureSingleMainBranch()

    // 3. Estandarizar formatos de teléfono
    const phoneResult = await standardizePhoneFormats()

    // 4. Generar reporte de calidad
    await generateDataQualityReport()

    const duration = Date.now() - startTime

    console.log('\n╔═══════════════════════════════════════════════════════════════╗')
    console.log('║                      ✅ COMPLETADO                           ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝\n')

    console.log('📊 Resumen de Cambios:\n')
    console.log(`   Provincias corregidas:     ${provincesResult.fixed}`)
    console.log(`   Principales corregidas:    ${mainResult.fixed}`)
    console.log(`   Teléfonos estandarizados:  ${phoneResult.fixed}`)
    console.log(`\n   ⏱️  Tiempo de ejecución:    ${duration}ms\n`)

    console.log('✅ Limpieza completada exitosamente!\n')

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
