/**
 * Script to execute Twilio WhatsApp support migration
 * Execute with: npx tsx scripts/execute-twilio-migration.ts
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Use direct connection URL (not pooler for DDL)
const databaseUrl = process.env.DATABASE_URL?.replace('?pgbouncer=true', '') || ''

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL not configured')
  process.exit(1)
}

async function runMigration() {
  console.log('🚀 Connecting to database...\n')

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Test connection
    const client = await pool.connect()
    console.log('✅ Connection established\n')

    // Read migration file
    console.log('📋 Reading migration file...\n')
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20250101_twilio_whatsapp_support.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Execute migration
    console.log('📋 Executing Twilio WhatsApp support migration...\n')
    await client.query(migrationSQL)
    console.log('   ✅ Migration executed successfully\n')

    // Verification
    console.log('🔍 Verifying migration...\n')

    // Check provider column in conversations
    const { rows: convCols } = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'kommo_conversations'
      AND column_name IN ('provider', 'last_user_message_at')
      ORDER BY column_name
    `)
    console.log('   📋 New columns in kommo_conversations:')
    convCols.forEach(col => {
      console.log(`      - ${col.column_name} (${col.data_type}) default: ${col.column_default}`)
    })

    // Check provider column in messages
    const { rows: msgCols } = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'kommo_messages'
      AND column_name = 'provider'
    `)
    console.log('\n   📋 New columns in kommo_messages:')
    msgCols.forEach(col => {
      console.log(`      - ${col.column_name} (${col.data_type}) default: ${col.column_default}`)
    })

    // Check constraints
    const { rows: constraints } = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname IN ('check_valid_provider', 'check_kommo_requires_chat_id')
      ORDER BY conname
    `)
    console.log('\n   📋 Constraints added:')
    constraints.forEach(c => {
      console.log(`      - ${c.conname}`)
    })

    // Check indexes
    const { rows: indexes } = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('kommo_conversations', 'kommo_messages')
      AND indexname LIKE '%provider%'
      ORDER BY indexname
    `)
    console.log('\n   📋 Indexes created:')
    indexes.forEach(idx => {
      console.log(`      - ${idx.indexname}`)
    })

    // Check view
    const { rows: views } = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE viewname = 'active_conversations_by_provider'
    `)
    console.log('\n   📋 Views created:')
    views.forEach(v => {
      console.log(`      - ${v.viewname}`)
    })

    // Check function and trigger
    const { rows: functions } = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_name = 'update_last_user_message_timestamp'
    `)
    console.log('\n   📋 Functions created:')
    functions.forEach(f => {
      console.log(`      - ${f.routine_name}`)
    })

    const { rows: triggers } = await client.query(`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE trigger_name = 'trigger_update_last_user_message'
    `)
    console.log('\n   📋 Triggers created:')
    triggers.forEach(t => {
      console.log(`      - ${t.trigger_name}`)
    })

    // Test view query
    console.log('\n   📊 Testing active_conversations_by_provider view...')
    const { rows: viewData } = await client.query(`
      SELECT * FROM active_conversations_by_provider
    `)
    console.log('      View query successful!')
    if (viewData.length > 0) {
      viewData.forEach(row => {
        console.log(`      - Provider: ${row.provider}, Total: ${row.total}, Active: ${row.active}`)
      })
    } else {
      console.log('      (No data yet - this is normal for a new migration)')
    }

    client.release()
    await pool.end()

    console.log('\n✅ Migration completed and verified successfully!\n')

  } catch (err) {
    console.error('❌ Error executing migration:', err)
    await pool.end()
    process.exit(1)
  }
}

runMigration()
