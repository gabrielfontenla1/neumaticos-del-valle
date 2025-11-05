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

function extractModel(name) {
  // Remove size patterns like 215/60R17, 215/60R17, etc.
  let cleanName = name;

  // Remove size pattern (width/profile R diameter)
  cleanName = cleanName.replace(/\d{3}\/\d{2}R\d{2}/gi, '').trim();
  cleanName = cleanName.replace(/\d{3}\/\d{2}-\d{2}/gi, '').trim();
  cleanName = cleanName.replace(/P?\d{3}\/\d{2}R\d{2}/gi, '').trim();

  // Remove load index and speed rating (like 102H, 91V, etc)
  cleanName = cleanName.replace(/\s+\d{2,3}[A-Z]{1,2}\b/g, '').trim();

  // Remove XL, (NB), (KS), etc
  cleanName = cleanName.replace(/\s+XL\b/gi, '').trim();
  cleanName = cleanName.replace(/\(NB?\)x?/gi, '').trim();
  cleanName = cleanName.replace(/\(KS\)/gi, '').trim();

  // Remove extra spaces
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  // If empty or just numbers, return original name
  if (!cleanName || cleanName.length < 3) {
    return name;
  }

  return cleanName;
}

async function fixProductModels() {
  console.log('🔧 Fixing product model fields...\n');

  try {
    // Get all products with stock
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, model')
      .gt('stock', 0);

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${products.length} products with stock\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    for (const product of products) {
      try {
        const extractedModel = extractModel(product.name);

        // Only update if model is different
        if (product.model !== extractedModel) {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              model: extractedModel,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id);

          if (updateError) {
            console.error(`❌ Error updating ${product.name}:`, updateError.message);
            errorDetails.push({ name: product.name, error: updateError.message });
            errors++;
          } else {
            console.log(`✅ ${product.name.substring(0, 40)}... → ${extractedModel}`);
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
    console.log(`⏭️  Skipped (already correct): ${skipped} products`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
      console.log('\nFirst 5 errors:');
      errorDetails.slice(0, 5).forEach(err => {
        console.log(`  - ${err.name}: ${err.error}`);
      });
    }
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
fixProductModels()
  .then(() => {
    console.log('\n✨ Fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
