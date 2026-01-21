import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
  console.log('🔧 Fixing appointment_services schema...\n')

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250121_fix_appointment_services_schema.sql')
    const sqlContent = fs.readFileSync(migrationPath, 'utf8')

    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

    console.log(`📝 Executing ${statements.length} SQL statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`${i + 1}. ${statement.substring(0, 80)}...`)

      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        console.error(`   ❌ Error: ${error.message}`)
        // Continue with other statements
      } else {
        console.log(`   ✅ Success`)
      }
    }

    // Verify the fix
    console.log('\n🔍 Verifying schema...')
    const { data, error } = await supabase
      .from('appointment_services')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error(`❌ Verification failed: ${error.message}`)
      return
    }

    const columns = Object.keys(data)
    const hasRequiredColumns = columns.includes('requires_vehicle') && columns.includes('icon')

    if (hasRequiredColumns) {
      console.log('✅ Schema fixed successfully!')
      console.log(`   Columns found: ${columns.join(', ')}`)
    } else {
      console.log('⚠️  Schema still incomplete')
      console.log(`   Missing: ${['requires_vehicle', 'icon'].filter(c => !columns.includes(c)).join(', ')}`)
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
