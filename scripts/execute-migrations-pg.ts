/**
 * Execute Migrations via Direct PostgreSQL Connection
 * Uses pg library to apply DDL migrations
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { Client } from 'pg'

config({ path: resolve(process.cwd(), '.env.local') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL environment variable')
  process.exit(1)
}

async function executeMigrations() {
  const client = new Client({
    connectionString: databaseUrl,
  })

  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         🚀 EXECUTING MIGRATIONS VIA POSTGRESQL              ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  try {
    await client.connect()
    console.log('✅ Connected to PostgreSQL\n')

    // Read SQL file
    const sqlFile = resolve(process.cwd(), 'scripts/APPLY_THIS.sql')
    const sql = readFileSync(sqlFile, 'utf-8')

    // Split into individual statements (handle multi-line comments and statements)
    const statements = sql
      .split(/;(?=\s*(?:--|$))/)
      .map(s => s.trim())
      .filter(s => {
        // Remove pure comment lines and empty statements
        const cleaned = s.replace(/--.*$/gm, '').trim()
        return cleaned.length > 0 &&
               !cleaned.startsWith('/*') &&
               !cleaned.startsWith('--') &&
               cleaned !== 'END $$'
      })

    console.log(`📄 Executing ${statements.length} migration statements...\n`)

    let successCount = 0
    let skipCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip if it's just a comment block
      if (statement.match(/^\/\*.*\*\/$/s)) {
        continue
      }

      // Extract description from comment if available
      const match = statement.match(/--\s*(.+)$/m)
      const description = match ? match[1].substring(0, 60) : `Statement ${i + 1}`

      try {
        process.stdout.write(`   [${i + 1}/${statements.length}] ${description}...`)

        await client.query(statement)

        console.log(' ✅')
        successCount++
      } catch (error: any) {
        // Check if error is about already existing objects
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate column') ||
            error.message.includes('no rows returned')) {
          console.log(' ⏭️  (already exists)')
          skipCount++
        } else {
          console.log(` ❌`)
          console.log(`      Error: ${error.message}\n`)
        }
      }
    }

    console.log('\n╔═══════════════════════════════════════════════════════════════╗')
    console.log('║                      📊 MIGRATION SUMMARY                    ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝\n')
    console.log(`   ✅ Executed: ${successCount} statements`)
    console.log(`   ⏭️  Skipped:  ${skipCount} statements (already applied)`)
    console.log(`   📋 Total:    ${successCount + skipCount} statements\n`)

    // Run verification queries
    console.log('🔍 Running verification...\n')

    // Check columns
    const colsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'stores'
        AND column_name IN ('province', 'background_image_url')
    `)

    console.log('   Columns in stores table:')
    colsResult.rows.forEach(row => {
      console.log(`      ✅ ${row.column_name} (${row.data_type})`)
    })

    // Check trigger
    const triggerResult = await client.query(`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE trigger_name = 'ensure_single_main_branch'
    `)

    if (triggerResult.rows.length > 0) {
      console.log('      ✅ ensure_single_main_branch trigger')
    }

    // Check main branches count
    const mainResult = await client.query(`
      SELECT COUNT(*) as count
      FROM stores
      WHERE is_main = true
    `)

    console.log(`\n   Main branches: ${mainResult.rows[0].count} (should be 1)`)

    // Show current stores
    const storesResult = await client.query(`
      SELECT id, name, province, is_main, active,
             background_image_url IS NOT NULL as has_image
      FROM stores
      ORDER BY is_main DESC, name
    `)

    console.log('\n   Current stores:\n')
    storesResult.rows.forEach((store: any) => {
      const mainFlag = store.is_main ? '⭐' : '  '
      const activeFlag = store.active ? '✅' : '❌'
      const imageFlag = store.has_image ? '🖼️' : '  '
      console.log(`      ${mainFlag} ${activeFlag} ${imageFlag} ${store.name} (${store.province || 'No province'})`)
    })

    console.log('\n╔═══════════════════════════════════════════════════════════════╗')
    console.log('║                      ✅ MIGRATION COMPLETED                   ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝\n')
    console.log('🎯 Next step: npx tsx scripts/cleanup-branch-data.ts\n')

    await client.end()

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\n💡 If using PgBouncer, some DDL statements may not work.')
    console.error('   Try executing scripts/APPLY_THIS.sql manually in Supabase Dashboard.\n')
    await client.end()
    process.exit(1)
  }
}

executeMigrations()
