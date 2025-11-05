const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updatePirelliStock() {
  console.log('🚀 Updating Pirelli products stock from corrected data...\n');

  try {
    // Read the fixed JSON file
    const jsonPath = path.join(__dirname, 'pirelli_products_fixed.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const products = JSON.parse(jsonData);

    console.log(`📦 Processing ${products.length} products...\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;
    const errorDetails = [];

    // Process in batches
    const batchSize = 50;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length));

      const updatePromises = batch.map(async (product) => {
        try {
          // Find product by SKU and brand, or by features.codigo_propio
          const { data: existing, error: fetchError } = await supabase
            .from('products')
            .select('id, stock')
            .eq('brand', 'PIRELLI')
            .or(`sku.eq.${product.sku},features->>codigo_propio.eq.${product.sku}`)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (existing) {
            // Only update if stock has changed
            if (existing.stock !== product.stock) {
              const { error: updateError } = await supabase
                .from('products')
                .update({
                  stock: product.stock || 0,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

              if (updateError) throw updateError;
              return {
                status: 'updated',
                sku: product.sku,
                oldStock: existing.stock,
                newStock: product.stock
              };
            } else {
              return { status: 'unchanged', sku: product.sku, stock: product.stock };
            }
          } else {
            return { status: 'not_found', sku: product.sku };
          }
        } catch (error) {
          errorDetails.push({ sku: product.sku, error: error.message });
          return { status: 'error', sku: product.sku, error };
        }
      });

      const results = await Promise.all(updatePromises);

      // Count results
      results.forEach(result => {
        if (result.status === 'updated') {
          updated++;
          if (result.newStock > 0) {
            console.log(`✅ Updated SKU ${result.sku}: ${result.oldStock} → ${result.newStock}`);
          }
        }
        else if (result.status === 'not_found') notFound++;
        else if (result.status === 'error') errors++;
      });

      // Progress indicator
      const progress = Math.min(i + batchSize, products.length);
      console.log(`Progress: ${progress}/${products.length} (${Math.round(progress * 100 / products.length)}%)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('                   UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} products`);
    if (notFound > 0) {
      console.log(`❓ Not found: ${notFound} products`);
    }
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
      console.log('\nFirst 5 errors:');
      errorDetails.slice(0, 5).forEach(err => {
        console.log(`  - SKU ${err.sku}: ${err.error}`);
      });
    }
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

    // Verify stock update
    const { data: stockCheck } = await supabase
      .from('products')
      .select('stock')
      .eq('brand', 'PIRELLI');

    const withStock = stockCheck.filter(p => p.stock > 0).length;
    const totalStock = stockCheck.reduce((sum, p) => sum + p.stock, 0);

    console.log('\n📊 Database verification:');
    console.log(`  - Total Pirelli products: ${stockCheck.length}`);
    console.log(`  - Products with stock: ${withStock}`);
    console.log(`  - Total stock units: ${totalStock}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updatePirelliStock()
  .then(() => {
    console.log('\n✨ Stock update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  });
