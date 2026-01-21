/**
 * Execute Migrations via Supabase Management API
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const projectRef = supabaseUrl?.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]

if (!supabaseUrl || !supabaseKey || !projectRef) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function executeSQL(sql: string): Promise<boolean> {
  try {
    // Try executing via PostgREST query endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    })

    if (response.ok) {
      return true
    }

    // If RPC doesn't work, try Management API
    const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    })

    return mgmtResponse.ok
  } catch (error) {
    return false
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         🚀 EXECUTING MIGRATIONS                              ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  const sqlFile = resolve(process.cwd(), 'scripts/APPLY_THIS.sql')
  const sql = readFileSync(sqlFile, 'utf-8')

  console.log('📄 Attempting to execute migrations via API...\n')

  const success = await executeSQL(sql)

  if (success) {
    console.log('✅ Migrations executed successfully!\n')
    return
  }

  // If automatic execution fails, provide manual instructions
  console.log('⚠️  Automatic execution not supported by Supabase API')
  console.log('   DDL statements require manual execution\n')
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                   📋 MANUAL EXECUTION REQUIRED               ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')
  console.log('Follow these steps:\n')
  console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('2. Copy all content from: scripts/APPLY_THIS.sql')
  console.log('3. Paste into SQL Editor')
  console.log('4. Click "Run" button\n')
  console.log('The file contains:')
  console.log('   ✓ Add province and background_image_url columns')
  console.log('   ✓ Single main branch trigger')
  console.log('   ✓ Data cleanup')
  console.log('   ✓ Verification queries\n')
  console.log('After execution, run: npx tsx scripts/cleanup-branch-data.ts\n')
}

main().catch(console.error)
