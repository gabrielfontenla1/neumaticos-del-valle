const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oyiwyzmaxgnzyhmmkstr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MjM3OSwiZXhwIjoyMDc1ODU4Mzc5fQ.i6FMnZo-QsCYH6oQUQcrLtK6naPu5HdE-_3FXhwgWbM'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function exploreDatabase() {
  try {
    // Get orders
    console.log('=== ORDERS TABLE (Sample) ===\n')
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .limit(3)
    
    if (orders && orders.length > 0) {
      console.log(JSON.stringify(orders, null, 2))
    }

    // Get reviews
    console.log('\n\n=== REVIEWS TABLE (Sample) ===\n')
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .limit(3)
    
    if (reviews && reviews.length > 0) {
      console.log(JSON.stringify(reviews, null, 2))
    }

    // Get branches
    console.log('\n\n=== BRANCHES TABLE (Sample) ===\n')
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .limit(5)
    
    if (branches && branches.length > 0) {
      console.log(JSON.stringify(branches, null, 2))
    }

    // Get vouchers
    console.log('\n\n=== VOUCHERS TABLE (Sample) ===\n')
    const { data: vouchers } = await supabase
      .from('vouchers')
      .select('*')
      .limit(3)
    
    if (vouchers && vouchers.length > 0) {
      console.log(JSON.stringify(vouchers, null, 2))
    }

  } catch (e) {
    console.error('Error:', e.message)
  }
}

exploreDatabase()
