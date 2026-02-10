const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://oyiwyzmaxgnzyhmmkstr.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MjM3OSwiZXhwIjoyMDc1ODU4Mzc5fQ.i6FMnZo-QsCYH6oQUQcrLtK6naPu5HdE-_3FXhwgWbM'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function countRecords() {
  try {
    // Count products with different categories
    console.log('=== PRODUCT STATISTICS ===\n')
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Total products: ${totalProducts}`)

    // Get categories
    const { data: categories } = await supabase
      .from('products')
      .select('category')
      .distinct()
    
    console.log('\nCategories found:')
    if (categories) {
      const cats = [...new Set(categories.map(c => c.category).filter(c => c))]
      cats.forEach(cat => console.log(`  - ${cat}`))
    }

    // Get brands
    const { data: brands } = await supabase
      .from('products')
      .select('brand')
      .distinct()
    
    console.log('\nBrands found:')
    if (brands) {
      const brandList = [...new Set(brands.map(b => b.brand).filter(b => b))]
      brandList.forEach(brand => console.log(`  - ${brand}`))
    }

    // Get sample products by category
    console.log('\n=== SAMPLE PRODUCTS BY CATEGORY ===\n')
    const { data: autoProducts } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'auto')
      .limit(2)
    
    console.log('AUTO category (2 samples):')
    if (autoProducts) {
      autoProducts.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} - $${p.price} (stock: ${p.stock})`)
      })
    }

    const { data: camionetaProducts } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'camioneta')
      .limit(2)
    
    console.log('\nCAMIONETA category (2 samples):')
    if (camionetaProducts) {
      camionetaProducts.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} - $${p.price} (stock: ${p.stock})`)
      })
    }

  } catch (e) {
    console.error('Error:', e.message)
  }
}

countRecords()
