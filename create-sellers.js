require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Mapeo de sucursales
const BRANCHES = {
  'Santiago': '6c6053e9-1e88-4695-bc57-271858149508',
  'La Banda': 'aa8b29e4-c73b-4700-8b0b-d9df053edb0e',
  'Tucumán': 'b6c750e5-e7fe-4594-a985-cc9eddb310e4',
  'Salta': 'a4670ae9-dda6-42c5-8b73-bbe24553ac41',
  'Belgrano': '5f02d7b2-aaa6-4241-b5c0-8ac5046e836a',
  'Alem': '81f9cc1e-610d-4bca-8ffa-cfd189fb1b87'
}

// Lista de vendedores por sucursal
const sellers = [
  // Santiago del Estero
  { name: 'Díaz Anahí', branch: 'Santiago' },
  { name: 'Camus Luis', branch: 'Santiago' },
  // La Banda
  { name: 'Carrizo Eliezer', branch: 'La Banda' },
  { name: 'Cameranesi Lionel', branch: 'La Banda' },
  // Tucumán
  { name: 'Rodríguez Luis', branch: 'Tucumán' },
  // Salta
  { name: 'Beltrán Raúl', branch: 'Salta' },
  { name: 'Visentini Analia', branch: 'Salta' },
  { name: 'López Matías', branch: 'Salta' },
  // Catamarca Belgrano
  { name: 'Sosa Pamela', branch: 'Belgrano' },
  // Catamarca Alem (San Fernando)
  { name: 'Bustamante Luis', branch: 'Alem' }
]

// Función para generar email del vendedor
function generateEmail(name) {
  const cleanName = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '.')
  return `${cleanName}@neumaticosdelvalle.com`
}

// Función para generar contraseña temporal (sin acentos)
function generatePassword(name) {
  const firstName = name.split(' ')[0].toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
  return `${firstName}2025!`
}

async function createSellers() {
  console.log('🚀 Creando vendedores en Supabase Auth...\n')

  let created = 0
  let failed = 0

  for (const seller of sellers) {
    const email = generateEmail(seller.name)
    const password = generatePassword(seller.name)
    const branchId = BRANCHES[seller.branch]

    console.log(`\n📝 Creando: ${seller.name}`)
    console.log(`   Email: ${email}`)
    console.log(`   Contraseña temporal: ${password}`)
    console.log(`   Sucursal: ${seller.branch}`)

    try {
      // Crear usuario en Supabase Auth usando Admin API
      // El trigger handle_new_user() creará automáticamente el perfil
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          full_name: seller.name,
          role: 'vendedor' // El trigger usará este valor
        }
      })

      if (authError) {
        console.log(`   ❌ Error auth: ${authError.message}`)
        failed++
        continue
      }

      console.log(`   ✅ Usuario auth creado: ${authData.user.id}`)

      // El trigger ya creó el perfil, ahora actualizar el branch_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ branch_id: branchId })
        .eq('id', authData.user.id)

      if (updateError) {
        console.log(`   ⚠️  Advertencia al actualizar branch: ${updateError.message}`)
        // No eliminamos el usuario porque ya está creado correctamente
      } else {
        console.log(`   ✅ Sucursal asignada exitosamente`)
      }

      created++

    } catch (error) {
      console.log(`   ❌ Error inesperado: ${error.message}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Resumen:`)
  console.log(`   ✅ Creados exitosamente: ${created}`)
  console.log(`   ❌ Fallidos: ${failed}`)
  console.log(`   📋 Total: ${sellers.length}`)

  console.log('\n🔑 Credenciales de acceso:')
  sellers.forEach(seller => {
    console.log(`   ${seller.name}: ${generateEmail(seller.name)} / ${generatePassword(seller.name)}`)
  })
}

createSellers()
  .then(() => {
    console.log('\n✅ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
