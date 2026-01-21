/**
 * Migration Script: Hardcoded Branches to Database
 *
 * This script migrates the 6 hardcoded branches from /sucursales/page.tsx
 * into the stores table in Supabase.
 *
 * Run with: npx tsx scripts/migrate-hardcoded-branches.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hardcoded branches from the original /sucursales/page.tsx
const hardcodedBranches = [
  {
    name: 'Catamarca - Av. Belgrano',
    address: 'Av. Belgrano 938',
    city: 'San Fernando del Valle de Catamarca',
    province: 'Catamarca',
    phone: '0383 419-7501',
    whatsapp: '5493834197501',
    opening_hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:30 - 12:30',
      sunday: 'Cerrado'
    },
    is_main: true, // First branch is the main one
    active: true,
    background_image_url: null
  },
  {
    name: 'Catamarca - Av. Alem',
    address: 'Av. Alem 1118',
    city: 'San Fernando del Valle de Catamarca',
    province: 'Catamarca',
    phone: '03832 68-8634',
    whatsapp: '5493832688634',
    opening_hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:00 - 12:30',
      sunday: 'Cerrado'
    },
    is_main: false,
    active: true,
    background_image_url: null
  },
  {
    name: 'Santiago del Estero - La Banda',
    address: 'República del Líbano Sur 866',
    city: 'La Banda',
    province: 'Santiago del Estero',
    phone: '0385 601-1304',
    whatsapp: '5493856011304',
    opening_hours: {
      weekdays: '08:00 - 12:30 y 15:00 - 19:00',
      saturday: '08:00 - 12:30',
      sunday: 'Cerrado'
    },
    is_main: false,
    active: true,
    background_image_url: null
  },
  {
    name: 'Santiago del Estero - Belgrano',
    address: 'Av. Belgrano Sur 2834',
    city: 'Santiago del Estero',
    province: 'Santiago del Estero',
    phone: '0385 677-1265',
    whatsapp: '5493856771265',
    opening_hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:00 - 12:30',
      sunday: 'Cerrado'
    },
    is_main: false,
    active: true,
    background_image_url: null
  },
  {
    name: 'Salta',
    address: 'Av. Jujuy 330',
    city: 'Salta',
    province: 'Salta',
    phone: '0387 685-8577',
    whatsapp: '5493876858577',
    opening_hours: {
      weekdays: '08:30 - 18:00',
      saturday: '08:30 - 13:00',
      sunday: 'Cerrado'
    },
    is_main: false,
    active: true,
    background_image_url: null
  },
  {
    name: 'Tucumán',
    address: 'Av. Gdor. del Campo 436',
    city: 'San Miguel de Tucumán',
    province: 'Tucumán',
    phone: '0381 483-4520',
    whatsapp: '5493814834520',
    opening_hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:00 - 12:30',
      sunday: 'Cerrado'
    },
    is_main: false,
    active: true,
    background_image_url: null
  }
]

async function migrateBranches() {
  console.log('🚀 Starting branch migration...\n')

  try {
    // Check if stores table already has data
    const { data: existingStores, error: checkError } = await supabase
      .from('stores')
      .select('id, name')
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking existing stores:', checkError)
      process.exit(1)
    }

    if (existingStores && existingStores.length > 0) {
      console.log('⚠️  Warning: stores table already has data')
      console.log('   Existing stores found. Do you want to continue? (This will add more branches)')
      console.log('   Press Ctrl+C to cancel or modify the script to handle existing data.\n')
    }

    // Insert branches one by one
    let successCount = 0
    let errorCount = 0

    for (const branch of hardcodedBranches) {
      console.log(`📍 Inserting: ${branch.name}...`)

      const { data, error } = await supabase
        .from('stores')
        .insert(branch)
        .select()
        .single()

      if (error) {
        console.error(`   ❌ Error inserting ${branch.name}:`, error.message)
        errorCount++
      } else {
        console.log(`   ✅ Successfully inserted: ${data.name} (ID: ${data.id})`)
        successCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log(`   📦 Total: ${hardcodedBranches.length}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!')
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the logs above.')
    }

    // Verify the data
    console.log('\n🔍 Verifying inserted data...')
    const { data: allBranches, error: verifyError } = await supabase
      .from('stores')
      .select('id, name, city, province, active, is_main')
      .order('is_main', { ascending: false })
      .order('name', { ascending: true })

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError)
    } else {
      console.log('\n📋 Current branches in database:')
      allBranches?.forEach((branch, index) => {
        console.log(`   ${index + 1}. ${branch.name} - ${branch.city}, ${branch.province}`)
        console.log(`      ${branch.is_main ? '⭐ MAIN' : '  '} | ${branch.active ? '🟢 ACTIVE' : '🔴 INACTIVE'}`)
      })
    }

  } catch (error) {
    console.error('\n❌ Unexpected error during migration:', error)
    process.exit(1)
  }
}

// Run the migration
migrateBranches()
  .then(() => {
    console.log('\n✨ Script execution completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
