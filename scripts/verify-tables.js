const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyTables() {
  console.log('🔍 Checking which tables exist in database...\n')
  console.log('Testing table existence by attempting to query each one:\n')
  console.log('─'.repeat(50))

  const tablesToCheck = [
    'profiles',
    'stores',
    'branches',
    'categories',
    'brands',
    'products',
    'product_images',
    'vouchers',
    'appointments',
    'reviews',
    'review_images'
  ]

  const existingTables = []

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0)

      if (error) {
        console.log(`❌ ${table.padEnd(20)} - does NOT exist (${error.message})`)
      } else {
        console.log(`✅ ${table.padEnd(20)} - EXISTS`)
        existingTables.push(table)
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(20)} - does NOT exist (${err.message})`)
    }
  }

  console.log('─'.repeat(50))
  console.log(`\nFound ${existingTables.length} existing tables:`)
  existingTables.forEach((table, index) => {
    console.log(`  ${index + 1}. ${table}`)
  })
  console.log()

  // Now check current RLS policies on profiles
  console.log('🔍 Checking current RLS configuration...\n')

  // Try to query profiles to see if RLS is causing issues
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email')
    .limit(1)

  if (profileError) {
    console.log('❌ Error querying profiles:', profileError.message)
    console.log('   This confirms RLS is blocking queries\n')
  } else {
    console.log('✅ Successfully queried profiles table')
    console.log('   RLS appears to be working\n')
  }

  return existingTables
}

verifyTables().catch(console.error)
