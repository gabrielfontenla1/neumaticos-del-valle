/**
 * Script to run migration directly via Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running AI config migration...\n')

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260121_ai_config_settings.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('📝 Migration file loaded\n')
  console.log('⚠️  Note: This script will insert seed data into app_settings')
  console.log('⚠️  For table creation, please use Supabase Dashboard SQL Editor\n')

  // Verify seed data
  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('key')
    .in('key', [
      'ai_models_config',
      'whatsapp_bot_config',
      'ai_prompts_config',
      'whatsapp_function_tools',
      'services_config'
    ])

  if (settingsError) {
    console.log('⚠️  Error checking existing data:', settingsError.message)
  } else {
    console.log(`✅ Found ${settings.length}/5 existing configuration entries`)
    if (settings.length > 0) {
      settings.forEach(s => console.log(`   - ${s.key}`))
      console.log('\n⚠️  Some configs already exist. Migration will skip duplicates.')
    }
  }

  console.log('\n🎉 Please run the full SQL migration in Supabase Dashboard:\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/sql')
  console.log('2. Copy the contents of: supabase/migrations/20260121_ai_config_settings.sql')
  console.log('3. Paste and run in the SQL Editor\n')
}

runMigration().catch(err => {
  console.error('💥 Error:', err)
  process.exit(1)
})
