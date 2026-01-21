/**
 * Run Database Migrations Script
 * Executes SQL migrations directly against Supabase
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(name: string, sqlPath: string) {
  console.log(`\n📝 Running migration: ${name}`)
  console.log('─'.repeat(60))

  try {
    // Read SQL file
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log('SQL to execute:')
    console.log(sql.substring(0, 200) + '...\n')

    // Execute SQL using rpc or direct query
    // Note: Supabase client doesn't have direct SQL execution,
    // so we'll use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      // Try alternative method: split statements and execute individually
      console.log('⚠️  Direct RPC failed, trying individual statements...')

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.toUpperCase().startsWith('ALTER TABLE')) {
          const match = statement.match(/ALTER TABLE (\w+\.)?(\w+)/)
          if (match) {
            const tableName = match[2]
            console.log(`   Executing ALTER TABLE on ${tableName}...`)
          }
        } else if (statement.toUpperCase().startsWith('INSERT INTO')) {
          console.log('   Executing INSERT statement...')
        } else if (statement.toUpperCase().startsWith('CREATE POLICY')) {
          console.log('   Creating policy...')
        }

        // Note: We can't directly execute DDL through the JS client
        // User needs to run these in Supabase SQL Editor
      }

      console.log('\n⚠️  This migration requires manual execution in Supabase SQL Editor')
      console.log('   Please copy and paste the SQL from:')
      console.log(`   ${sqlPath}`)
      return false
    }

    console.log('✅ Migration completed successfully')
    return true

  } catch (error) {
    console.error('❌ Error executing migration:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n')
  console.log('=' .repeat(60))

  // Migration 1: Add columns to stores table
  const migration1 = await runMigration(
    'Add branch columns',
    resolve(process.cwd(), 'supabase/migrations/20260121_add_branch_columns.sql')
  )

  // Migration 2: Create storage bucket
  const migration2 = await runMigration(
    'Create branches storage',
    resolve(process.cwd(), 'supabase/migrations/20260121_branches_storage.sql')
  )

  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary:')
  console.log(`   Migration 1 (Columns): ${migration1 ? '✅ Success' : '⚠️  Manual Required'}`)
  console.log(`   Migration 2 (Storage): ${migration2 ? '✅ Success' : '⚠️  Manual Required'}`)
  console.log('='.repeat(60))

  if (!migration1 || !migration2) {
    console.log('\n⚠️  Some migrations require manual execution')
    console.log('\n📋 Manual Steps Required:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run the SQL from: supabase/migrations/20260121_add_branch_columns.sql')
    console.log('3. Run the SQL from: supabase/migrations/20260121_branches_storage.sql')
    console.log('\n💡 Or use the Supabase CLI:')
    console.log('   supabase db push --linked')
  } else {
    console.log('\n✅ All migrations completed successfully!')
  }
}

// Run migrations
main()
  .then(() => {
    console.log('\n✨ Script execution completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
