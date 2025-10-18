require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

// Lista de vendedores
const sellers = [
  { name: 'Díaz Anahí', branch: 'Santiago' },
  { name: 'Camus Luis', branch: 'Santiago' },
  { name: 'Carrizo Eliezer', branch: 'La Banda' },
  { name: 'Cameranesi Lionel', branch: 'La Banda' },
  { name: 'Rodríguez Luis', branch: 'Tucumán' },
  { name: 'Beltrán Raúl', branch: 'Salta' },
  { name: 'Visentini Analia', branch: 'Salta' },
  { name: 'López Matías', branch: 'Salta' },
  { name: 'Sosa Pamela', branch: 'Belgrano' },
  { name: 'Bustamante Luis', branch: 'Alem' }
]

function generateEmail(name) {
  const cleanName = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
  return `${cleanName}@neumaticosdelvalle.com`
}

async function createSellers() {
  console.log('🚀 Creando vendedores directamente en las tablas...\n')

  const password = 'Vendedor2025!'

  for (const seller of sellers) {
    const email = generateEmail(seller.name)
    const branchId = BRANCHES[seller.branch]

    console.log(`\n📝 Creando: ${seller.name}`)
    console.log(`   Email: ${email}`)
    console.log(`   Sucursal: ${seller.branch}`)

    try {
      // Usar el Admin API que bypasea RLS
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: seller.name,
          role: 'vendedor'
        }
      })

      if (authError) {
        console.log(`   ❌ Error: ${authError.message}`)
        console.log(`   Detalles:`, JSON.stringify(authError, null, 2))
        continue
      }

      console.log(`   ✅ Usuario creado: ${authData.user.id}`)

      // Actualizar branch_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ branch_id: branchId })
        .eq('id', authData.user.id)

      if (updateError) {
        console.log(`   ⚠️  Warning: ${updateError.message}`)
      } else {
        console.log(`   ✅ Sucursal asignada`)
      }

    } catch (error) {
      console.log(`   ❌ Error inesperado: ${error.message}`)
      console.log(`   Stack:`, error.stack)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n🔑 Credenciales de acceso:')
  console.log(`   Password para todos: ${password}`)
  sellers.forEach(seller => {
    console.log(`   ${seller.name}: ${generateEmail(seller.name)}`)
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
