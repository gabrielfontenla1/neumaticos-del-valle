/**
 * Verify Migrations Script
 * Checks if migrations were applied successfully
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyMigrations() {
  console.log('🔍 Verifying database migrations...\n')
  console.log('=' .repeat(60))

  let allPassed = true

  // Test 1: Check if province column exists
  console.log('📝 Test 1: Checking province column...')
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('province')
      .limit(1)

    if (error) {
      console.log('   ❌ FAILED: province column not found')
      console.log(`   Error: ${error.message}`)
      allPassed = false
    } else {
      console.log('   ✅ PASSED: province column exists')
    }
  } catch (err) {
    console.log('   ❌ FAILED: Could not query province column')
    console.log(`   Error: ${err}`)
    allPassed = false
  }

  // Test 2: Check if background_image_url column exists
  console.log('\n📝 Test 2: Checking background_image_url column...')
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('background_image_url')
      .limit(1)

    if (error) {
      console.log('   ❌ FAILED: background_image_url column not found')
      console.log(`   Error: ${error.message}`)
      allPassed = false
    } else {
      console.log('   ✅ PASSED: background_image_url column exists')
    }
  } catch (err) {
    console.log('   ❌ FAILED: Could not query background_image_url column')
    console.log(`   Error: ${err}`)
    allPassed = false
  }

  // Test 3: Check if branches bucket exists
  console.log('\n📝 Test 3: Checking branches storage bucket...')
  try {
    const { data, error } = await supabase
      .storage
      .from('branches')
      .list('', { limit: 1 })

    if (error) {
      console.log('   ❌ FAILED: branches bucket not found or not accessible')
      console.log(`   Error: ${error.message}`)
      allPassed = false
    } else {
      console.log('   ✅ PASSED: branches bucket exists and is accessible')
    }
  } catch (err) {
    console.log('   ❌ FAILED: Could not access branches bucket')
    console.log(`   Error: ${err}`)
    allPassed = false
  }

  // Test 4: Check if we can query stores with all new fields
  console.log('\n📝 Test 4: Querying stores table with new fields...')
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, province, background_image_url, active')
      .limit(1)

    if (error) {
      console.log('   ❌ FAILED: Could not query stores with new fields')
      console.log(`   Error: ${error.message}`)
      allPassed = false
    } else {
      console.log('   ✅ PASSED: Successfully queried stores with new fields')
      if (data && data.length > 0) {
        console.log(`   📊 Sample record: ${data[0].name} (${data[0].province})`)
      }
    }
  } catch (err) {
    console.log('   ❌ FAILED: Error querying stores')
    console.log(`   Error: ${err}`)
    allPassed = false
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Verification Summary:')
  console.log('='.repeat(60))

  if (allPassed) {
    console.log('✅ All migrations applied successfully!')
    console.log('\n🎉 Your database is ready!')
    console.log('\n📋 Next steps:')
    console.log('   1. Run data migration: npx tsx scripts/migrate-hardcoded-branches.ts')
    console.log('   2. Test admin panel: http://localhost:6001/admin/configuracion/sucursales')
    console.log('   3. Test public page: http://localhost:6001/sucursales')
  } else {
    console.log('❌ Some migrations failed to apply')
    console.log('\n📋 Please:')
    console.log('   1. Go to Supabase SQL Editor')
    console.log('   2. Run the migrations from:')
    console.log('      - supabase/migrations/20260121_add_branch_columns.sql')
    console.log('      - supabase/migrations/20260121_branches_storage.sql')
    console.log('   3. Run this verification again: npx tsx scripts/verify-migrations.ts')
  }
  console.log('='.repeat(60))

  return allPassed
}

// Run verification
verifyMigrations()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
