const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function fixRLS() {
  console.log('🔧 Fixing RLS infinite recursion...\n')
  console.log('This will:')
  console.log('  1. Create SECURITY DEFINER functions to bypass RLS')
  console.log('  2. Update policies on existing tables only')
  console.log('  Tables: profiles, stores, branches, products, vouchers, appointments\n')

  const sql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/010_fix_rls_recursion_final.sql'),
    'utf8'
  )

  // Split SQL into individual statements, handling multi-line CREATE FUNCTION
  const statements = []
  let currentStatement = ''
  let inFunction = false

  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('--')) {
      continue
    }

    currentStatement += line + '\n'

    // Detect function boundaries
    if (trimmed.includes('CREATE OR REPLACE FUNCTION')) {
      inFunction = true
    }

    if (inFunction && trimmed.includes('$$ LANGUAGE plpgsql SECURITY DEFINER;')) {
      inFunction = false
      statements.push(currentStatement.trim())
      currentStatement = ''
      continue
    }

    // Regular statements end with semicolon
    if (!inFunction && trimmed.endsWith(';')) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  }

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
  console.log('─'.repeat(50))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    const preview = statement.substring(0, 80).replace(/\n/g, ' ')

    console.log(`\n[${i + 1}/${statements.length}] ${preview}...`)

    const { error } = await supabase.rpc('exec_sql', { sql: statement })

    if (error) {
      errorCount++
      console.error('❌ Error:', error.message)
      // Continue anyway - some statements might fail if policies don't exist
    } else {
      successCount++
      console.log('✅ Success')
    }
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors\n`)

  if (errorCount === 0) {
    console.log('✅ All RLS policies updated successfully!')
    console.log('🎉 You can now try logging in again.')
  } else {
    console.log('⚠️  Some statements failed, but the main fix should work.')
    console.log('   (Errors are expected for policies that don\'t exist)')
    console.log('🔍 Please try logging in to test.')
  }
}

fixRLS().catch(console.error)
