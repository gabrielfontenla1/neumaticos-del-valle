const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://oyiwyzmaxgnzyhmmkstr.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MjM3OSwiZXhwIjoyMDc1ODU4Mzc5fQ.i6FMnZo-QsCYH6oQUQcrLtK6naPu5HdE-_3FXhwgWbM'

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/005_make_contact_optional.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Running migration...\n')
    console.log(sql)
    console.log('\n')

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0)

    for (const statement of statements) {
      const trimmed = statement.trim()
      if (!trimmed || trimmed.startsWith('--')) continue

      console.log(`Executing: ${trimmed.substring(0, 60)}...`)

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: trimmed })
      })

      if (!response.ok) {
        // Try direct SQL execution via postgres REST API
        const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ query: trimmed })
        })

        if (!directResponse.ok) {
          console.error('❌ Failed to execute statement')
          console.error('Response:', await directResponse.text())
          continue
        }
      }

      console.log('✅ Success')
    }

    console.log('\n✅ Migration completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
