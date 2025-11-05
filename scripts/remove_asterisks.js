const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function removeAsterisks(text) {
  if (!text) return text;

  // Remove (*) and * from text
  let cleaned = text;
  cleaned = cleaned.replace(/\(\*\)/g, '');  // Remove (*)
  cleaned = cleaned.replace(/\*/g, '');      // Remove standalone *

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function removeAsterisksFromProducts() {
  console.log('🔧 Removing asterisks from product data...\n');

  try {
    // Get all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, model, description');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${products.length} products\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    for (const product of products) {
      try {
        const hasAsterisks =
          product.name?.includes('*') ||
          product.model?.includes('*') ||
          product.description?.includes('*');

        if (hasAsterisks) {
          const cleanName = removeAsterisks(product.name);
          const cleanModel = removeAsterisks(product.model);
          const cleanDescription = removeAsterisks(product.description);

          const updateData = {
            updated_at: new Date().toISOString()
          };

          if (cleanName !== product.name) {
            updateData.name = cleanName;
          }
          if (cleanModel !== product.model) {
            updateData.model = cleanModel;
          }
          if (cleanDescription !== product.description) {
            updateData.description = cleanDescription;
          }

          const { error: updateError } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', product.id);

          if (updateError) {
            console.error(`❌ Error updating ${product.name}:`, updateError.message);
            errorDetails.push({ name: product.name, error: updateError.message });
            errors++;
          } else {
            console.log(`✅ Cleaned: ${product.name.substring(0, 50)}...`);
            updated++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error.message);
        errorDetails.push({ name: product.name, error: error.message });
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('                UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} products`);
    console.log(`⏭️  Skipped (no asterisks): ${skipped} products`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
      console.log('\nFirst 5 errors:');
      errorDetails.slice(0, 5).forEach(err => {
        console.log(`  - ${err.name}: ${err.error}`);
      });
    }
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

    // Verify no asterisks remain
    const { data: checkProducts } = await supabase
      .from('products')
      .select('id, name, model, description')
      .gt('stock', 0);

    const stillWithAsterisks = checkProducts.filter(p =>
      p.name?.includes('*') ||
      p.model?.includes('*') ||
      p.description?.includes('*')
    );

    console.log('\n📊 Verification:');
    console.log(`  - Products with stock: ${checkProducts.length}`);
    console.log(`  - Still with asterisks: ${stillWithAsterisks.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the cleanup
removeAsterisksFromProducts()
  .then(() => {
    console.log('\n✨ Cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
