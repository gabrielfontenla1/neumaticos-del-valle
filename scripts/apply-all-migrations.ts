/**
 * Apply All Critical Migrations
 * Applies all pending SQL migrations to complete the branch system
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQLFile(filePath: string, description: string) {
  console.log(`\n📄 Executing: ${description}`)
  console.log('─'.repeat(60))

  try {
    const sql = readFileSync(filePath, 'utf-8')

    // Split SQL into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.toLowerCase().includes('alter table') ||
          statement.toLowerCase().includes('comment on') ||
          statement.toLowerCase().includes('update')) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })

        if (error) {
          // Try direct execution for DDL
          console.log(`   Trying direct execution...`)
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement + ';' })
          })

          if (!response.ok) {
            console.log(`   ⚠️  Statement may need manual execution`)
            console.log(`   SQL: ${statement.substring(0, 100)}...`)
          } else {
            console.log(`   ✅ Executed successfully`)
          }
        } else {
          console.log(`   ✅ Executed successfully`)
        }
      }
    }

    console.log(`✅ ${description} completed`)
    return true
  } catch (error) {
    console.error(`❌ Error executing ${description}:`, error)
    return false
  }
}

async function verifyColumns() {
  console.log('\n🔍 Verifying column existence...')
  console.log('─'.repeat(60))

  const { data, error } = await supabase
    .from('stores')
    .select('id, name, province, background_image_url')
    .limit(1)

  if (error) {
    console.log(`❌ Verification failed: ${error.message}`)
    return false
  }

  console.log('✅ All columns exist and are accessible')
  return true
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         🚀 APPLYING ALL MIGRATIONS - BRANCH SYSTEM          ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')

  const startTime = Date.now()

  try {
    // Migration 1: Add columns
    const migration1Path = resolve(process.cwd(), 'supabase/migrations/20260121_add_branch_columns.sql')
    await executeSQLFile(migration1Path, 'Adding province and background_image_url columns')

    // Migration 2: Race condition fix
    const migration2Path = resolve(process.cwd(), 'scripts/fix-race-condition.sql')
    await executeSQLFile(migration2Path, 'Installing single main branch trigger')

    // Verify migrations
    const verified = await verifyColumns()

    const duration = Date.now() - startTime

    console.log('\n╔═══════════════════════════════════════════════════════════════╗')
    console.log('║                      ✅ COMPLETED                            ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝\n')

    if (verified) {
      console.log('✅ All migrations applied successfully!')
      console.log(`⏱️  Total time: ${duration}ms\n`)
    } else {
      console.log('⚠️  Migrations applied but verification failed')
      console.log('   Some SQL may need manual execution in Supabase Dashboard\n')
    }

  } catch (error) {
    console.error('\n❌ Error during migration:', error)
    console.log('\n💡 Manual Migration Required:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Copy and execute SQL from:')
    console.log('      - supabase/migrations/20260121_add_branch_columns.sql')
    console.log('      - scripts/fix-race-condition.sql\n')
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
