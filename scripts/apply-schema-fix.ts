#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function executeSQL(sql: string, description: string) {
  console.log(`\n📝 ${description}`)
  console.log(`   SQL: ${sql.substring(0, 100)}...`)

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // Try direct query if RPC doesn't exist
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
          },
          body: JSON.stringify({ sql })
        }
      )

      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${await result.text()}`)
      }

      console.log('   ✅ Success (via REST API)')
      return true
    }

    console.log('   ✅ Success (via RPC)')
    return true
  } catch (error: any) {
    console.log(`   ⚠️  Note: ${error.message}`)
    return false
  }
}

async function applyFix() {
  console.log('=' .repeat(80))
  console.log('🔧 APPLYING SCHEMA FIX FOR appointment_services')
  console.log('=' .repeat(80))

  // Step 1: Add requires_vehicle column
  await executeSQL(
    `ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS requires_vehicle BOOLEAN DEFAULT false`,
    'Step 1/5: Adding requires_vehicle column'
  )

  // Step 2: Add icon column
  await executeSQL(
    `ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS icon TEXT`,
    'Step 2/5: Adding icon column'
  )

  // Step 3: Update existing records
  console.log('\n📝 Step 3/5: Updating existing records with default values')
  const { data: services, error: fetchError } = await supabase
    .from('appointment_services')
    .select('id')

  if (fetchError) {
    console.log(`   ❌ Error fetching services: ${fetchError.message}`)
  } else {
    console.log(`   Found ${services?.length || 0} services to update`)

    // Update each service
    const servicesThatNeedVehicle = [
      'inspection', 'tire-change', 'alignment', 'balancing',
      'rotation', 'front-end', 'tire-repair', 'installation'
    ]

    for (const service of services || []) {
      const needsVehicle = servicesThatNeedVehicle.includes(service.id)

      const { error: updateError } = await supabase
        .from('appointment_services')
        .update({
          requires_vehicle: needsVehicle,
          icon: null
        })
        .eq('id', service.id)

      if (updateError) {
        console.log(`   ⚠️  Error updating ${service.id}: ${updateError.message}`)
      } else {
        console.log(`   ✅ Updated ${service.id} (requires_vehicle: ${needsVehicle})`)
      }
    }
  }

  // Step 4: Try to drop old constraint (may not exist)
  console.log('\n📝 Step 4/5: Removing old price constraint (if exists)')
  await executeSQL(
    `ALTER TABLE appointment_services DROP CONSTRAINT IF EXISTS appointment_services_price_check`,
    'Dropping old constraint'
  )

  // Step 5: Add new constraint allowing price >= 0
  console.log('\n📝 Step 5/5: Adding new price constraint (allows free services)')
  await executeSQL(
    `ALTER TABLE appointment_services ADD CONSTRAINT appointment_services_price_check CHECK (price >= 0)`,
    'Adding new constraint'
  )

  // Verification
  console.log('\n' + '=' .repeat(80))
  console.log('🔍 VERIFYING FIX')
  console.log('=' .repeat(80))

  const { data: testService, error: verifyError } = await supabase
    .from('appointment_services')
    .select('*')
    .limit(1)
    .single()

  if (verifyError) {
    console.log('❌ Verification failed:', verifyError.message)
    process.exit(1)
  }

  const columns = Object.keys(testService)
  const hasRequiredColumns = columns.includes('requires_vehicle') && columns.includes('icon')

  console.log(`\n📊 Schema Status:`)
  console.log(`   Total columns: ${columns.length}`)
  console.log(`   Columns: ${columns.join(', ')}`)
  console.log(`\n   ${hasRequiredColumns ? '✅' : '❌'} requires_vehicle: ${columns.includes('requires_vehicle') ? 'Present' : 'MISSING'}`)
  console.log(`   ${columns.includes('icon') ? '✅' : '❌'} icon: ${columns.includes('icon') ? 'Present' : 'MISSING'}`)

  // Test creating a free service
  console.log('\n🧪 Testing free service creation (price = 0)...')
  const testId = `test-free-service-${Date.now()}`

  const { data: createTest, error: createError } = await supabase
    .from('appointment_services')
    .insert({
      id: testId,
      name: 'Free Test Service',
      description: 'Testing price = 0',
      duration: 15,
      price: 0,
      requires_vehicle: false,
      icon: 'TestTube'
    })
    .select()

  if (createError) {
    console.log(`   ❌ Cannot create free service: ${createError.message}`)
  } else {
    console.log(`   ✅ Free service created successfully!`)

    // Cleanup
    await supabase.from('appointment_services').delete().eq('id', testId)
    console.log(`   ✅ Test service cleaned up`)
  }

  console.log('\n' + '=' .repeat(80))

  if (hasRequiredColumns) {
    console.log('🎉 SCHEMA FIX APPLIED SUCCESSFULLY!')
    console.log('=' .repeat(80))
    console.log('\n✅ Next steps:')
    console.log('   1. Run QA tests: npx tsx tests/services-qa.test.ts')
    console.log('   2. Test dashboard: http://localhost:6001/admin/servicios')
    console.log('   3. Test turnero: http://localhost:6001/turnos')
    console.log('')
    process.exit(0)
  } else {
    console.log('⚠️  SCHEMA FIX INCOMPLETE')
    console.log('=' .repeat(80))
    console.log('\n❌ Some columns are still missing.')
    console.log('   Please run the SQL manually in Supabase Dashboard.')
    console.log('   See: MANUAL_FIX_REQUIRED.md')
    console.log('')
    process.exit(1)
  }
}

applyFix().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})
