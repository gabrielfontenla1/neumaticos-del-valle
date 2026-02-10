const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oyiwyzmaxgnzyhmmkstr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MjM3OSwiZXhwIjoyMDc1ODU4Mzc5fQ.i6FMnZo-QsCYH6oQUQcrLtK6naPu5HdE-_3FXhwgWbM'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function exploreDatabase() {
  try {
    // Get products table structure
    console.log('=== PRODUCTS TABLE SCHEMA ===\n')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(10)

    if (productsError) {
      console.error('Error fetching products:', productsError)
    } else {
      console.log('Sample products (first 10):')
      console.log(JSON.stringify(products, null, 2))
    }

    // Get all table names
    console.log('\n\n=== CHECKING FOR RELATED TABLES ===\n')
    const tablesToCheck = ['brands', 'categories', 'product_types', 'services', 'orders', 'reviews', 'vouchers', 'branches', 'admin_users']
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (!error) {
          console.log(`✓ ${table} - EXISTS`)
        }
      } catch (e) {
        // Table doesn't exist
      }
    }

  } catch (e) {
    console.error('Error:', e.message)
  }
}

exploreDatabase()
