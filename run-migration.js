require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('Ejecutando migracion 012_add_sku_column.sql...\n')
  
  const sql = fs.readFileSync('supabase/migrations/012_add_sku_column.sql', 'utf8')
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    console.error('Error ejecutando migracion:', error)
    console.log('\nIntentando metodo alternativo...\n')
    
    // Try executing statements one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'))
    
    for (const statement of statements) {
      console.log('Ejecutando:', statement.substring(0, 100) + '...')
      const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (stmtError) {
        console.error('Error:', stmtError.message)
      } else {
        console.log('OK')
      }
    }
  } else {
    console.log('Migracion ejecutada exitosamente!')
  }
}

runMigration()
