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

async function updatePirelliProducts() {
  console.log('🚀 Starting Pirelli products database update using Supabase...\n');

  try {
    // Read the JSON file with product data
    const jsonPath = path.join(__dirname, 'pirelli_products.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const products = JSON.parse(jsonData);

    console.log(`📦 Processing ${products.length} products...\n`);

    let updated = 0;
    let created = 0;
    let errors = 0;
    const errorDetails = [];

    // Process in batches
    const batchSize = 50;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length));

      const updatePromises = batch.map(async (product) => {
        try {
          // Map categories to valid values
          let category = 'auto'; // default
          if (product.category) {
            const cat = product.category.toLowerCase();
            if (cat.includes('camioneta') || cat.includes('suv')) {
              category = 'camioneta';
            } else if (cat.includes('camion')) {
              category = 'camion';
            } else if (cat === 'auto') {
              category = 'auto';
            }
            // If 'otro' or anything else, default to 'auto'
          }
          // First check if product exists - search by features.codigo_propio or sku
          const { data: existing, error: fetchError } = await supabase
            .from('products')
            .select('id, features')
            .eq('brand', 'PIRELLI')
            .or(`sku.eq.${product.sku},features->>codigo_propio.eq.${product.sku}`)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 means no rows returned, which is fine
            throw fetchError;
          }

          if (existing) {
            // Update existing product - also update features with price_list
            const updatedFeatures = {
              ...(existing.features || {}),
              price_list: product.price_list || product.list_price || product.price || 0,
              codigo_propio: product.sku,
              updated_from: 'pirelli_excel_import'
            };

            const { error: updateError } = await supabase
              .from('products')
              .update({
                name: product.name,
                stock: product.stock || 0,
                price: product.price || 0,
                width: product.width || null,
                profile: product.aspect_ratio || null,
                diameter: product.rim_diameter || null,
                category: category,
                features: updatedFeatures,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
            return { status: 'updated', sku: product.sku };
          } else if (process.argv.includes('--create')) {
            // Create new product if flag is set
            const newFeatures = {
              price_list: product.price_list || product.list_price || product.price || 0,
              codigo_propio: product.sku,
              created_from: 'pirelli_excel_import'
            };

            const { error: createError } = await supabase
              .from('products')
              .insert({
                sku: product.sku,
                name: product.name,
                brand: 'PIRELLI',
                stock: product.stock || 0,
                price: product.price || 0,
                width: product.width || null,
                profile: product.aspect_ratio || null,
                diameter: product.rim_diameter || null,
                category: category,
                features: newFeatures,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (createError) throw createError;
            return { status: 'created', sku: product.sku };
          } else {
            return { status: 'skipped', sku: product.sku };
          }
        } catch (error) {
          errorDetails.push({ sku: product.sku, error: error.message });
          return { status: 'error', sku: product.sku, error };
        }
      });

      const results = await Promise.all(updatePromises);

      // Count results
      results.forEach(result => {
        if (result.status === 'updated') updated++;
        else if (result.status === 'created') created++;
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
    if (created > 0) {
      console.log(`✨ Created new: ${created} products`);
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

    if (updated === 0 && created === 0 && !process.argv.includes('--create')) {
      console.log('\n💡 No products were updated. If these are new products, run with --create flag:');
      console.log('   node scripts/update_pirelli_supabase.js --create');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Check if we should create missing products
const shouldCreate = process.argv.includes('--create');

if (shouldCreate) {
  console.log('🔄 Mode: Update existing and CREATE new products\n');
} else {
  console.log('🔄 Mode: Update existing products only\n');
}

// Run the update
updatePirelliProducts()
  .then(() => {
    console.log('\n✨ Database update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  });