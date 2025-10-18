const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkPolicies() {
  console.log('🔍 Checking RLS policies on profiles table...\n')

  // Try to query profiles directly with service role (should bypass RLS)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(3)

  if (profilesError) {
    console.log('❌ Error querying profiles with service role:', profilesError.message)
  } else {
    console.log('✅ Profiles table accessible with service role:')
    profiles?.forEach(p => console.log(`   - ${p.email} (${p.role})`))
    console.log()
  }

  // Check if functions exist
  console.log('🔍 Checking if security functions exist...\n')

  const { data: functions, error: functionsError } = await supabase
    .from('pg_proc')
    .select('proname')
    .in('proname', ['is_admin', 'is_admin_or_vendedor', 'current_user_email'])
    .limit(10)

  if (functionsError) {
    console.log('❌ Cannot query pg_proc:', functionsError.message)
  } else if (functions && functions.length > 0) {
    console.log('✅ Found functions:')
    functions.forEach(f => console.log(`   - ${f.proname}`))
  } else {
    console.log('❌ Security functions NOT found in database')
    console.log('   This means the SQL was not executed successfully')
  }

  console.log()
}

checkPolicies().catch(console.error)
