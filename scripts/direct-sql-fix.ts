#!/usr/bin/env node
/**
 * Direct SQL execution via Supabase SQL endpoint
 * This bypasses the PostgREST API and executes DDL directly
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0]

async function executeDDL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Try using the SQL query endpoint (v1/query)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${error}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function executeSQLStatements() {
  console.log('=' .repeat(80))
  console.log('🔧 EXECUTING SCHEMA FIX VIA DIRECT SQL')
  console.log('=' .repeat(80))
  console.log('')

  const statements = [
    {
      sql: `ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS requires_vehicle BOOLEAN DEFAULT false;`,
      desc: 'Adding requires_vehicle column'
    },
    {
      sql: `ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS icon TEXT;`,
      desc: 'Adding icon column'
    },
    {
      sql: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointment_services_price_check') THEN ALTER TABLE appointment_services DROP CONSTRAINT appointment_services_price_check; END IF; END $$;`,
      desc: 'Removing old price constraint'
    },
    {
      sql: `ALTER TABLE appointment_services ADD CONSTRAINT appointment_services_price_check CHECK (price >= 0);`,
      desc: 'Adding new price constraint (allows free services)'
    }
  ]

  console.log('⚠️  Note: This method may not work due to API limitations.')
  console.log('If this fails, you\'ll need to execute SQL via Supabase Dashboard.\n')

  for (const { sql, desc } of statements) {
    console.log(`📝 ${desc}`)
    console.log(`   ${sql.substring(0, 60)}...`)

    const result = await executeDDL(sql)

    if (result.success) {
      console.log('   ✅ Success\n')
    } else {
      console.log(`   ❌ Failed: ${result.error}\n`)
    }
  }

  console.log('=' .repeat(80))
  console.log('')
  console.log('📌 MANUAL ALTERNATIVE:')
  console.log('')
  console.log('Since automated execution is limited, please:')
  console.log('')
  console.log('1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql')
  console.log('2. Click "New Query"')
  console.log('3. Copy and paste this SQL:')
  console.log('')
  console.log('-'.repeat(80))

  const migrationSQL = fs.readFileSync(
    'supabase/migrations/20250121_fix_appointment_services_schema.sql',
    'utf8'
  )

  console.log(migrationSQL)
  console.log('-'.repeat(80))
  console.log('')
  console.log('4. Click "Run" (or press Cmd/Ctrl + Enter)')
  console.log('5. Verify success in the Results panel')
  console.log('')
  console.log('=' .repeat(80))
}

executeSQLStatements().catch(console.error)
