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

function cleanProductName(name) {
  let cleanName = name;

  // Remove size patterns (width/profile R diameter)
  // Patterns: 215/60R17, P265/70R16, 31X10.50R15LT, etc
  cleanName = cleanName.replace(/^\d{2,3}\/\d{2}R\d{2}\s*/gi, '').trim();
  cleanName = cleanName.replace(/^P\d{2,3}\/\d{2}R\d{2}\s*/gi, '').trim();
  cleanName = cleanName.replace(/^\d{2,3}\/\d{2}-\d{2}\s*/gi, '').trim();
  cleanName = cleanName.replace(/^LT\d{2,3}\/\d{2}R\d{2}\s*/gi, '').trim();
  cleanName = cleanName.replace(/^\d{2}X\d{1,2}\.\d{2}R\d{2}LT\s*/gi, '').trim();

  // Remove patterns like "80/100 - 14 M/C"
  cleanName = cleanName.replace(/^\d{2,3}\/\d{2,3}\s*-\s*\d{2}\s*M\/C\s*/gi, '').trim();

  // Remove patterns like "2.50 - 17 M/C" or "2.75 - 18 M/C"
  cleanName = cleanName.replace(/^\d\.\d{2}\s*-\s*\d{2}\s*M\/C\s*/gi, '').trim();

  // Remove patterns like "110/90 - 17 M/C"
  cleanName = cleanName.replace(/^\d{2,3}\/\d{2}\s*-\s*\d{2}\s*M\/C\s*/gi, '').trim();

  // Remove patterns like "185R14C"
  cleanName = cleanName.replace(/^\d{2,3}R\d{2}C\s*/gi, '').trim();

  // Remove patterns like "235/645-18" (racing tires)
  cleanName = cleanName.replace(/^\d{2,3}\/\d{2,3}-\d{2}\s*/gi, '').trim();

  // Remove extra spaces
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  // If cleaning resulted in empty string or too short, return original
  if (!cleanName || cleanName.length < 3) {
    return name;
  }

  return cleanName;
}

async function cleanProductNames() {
  console.log('🔧 Cleaning product names to remove size duplication...\n');

  try {
    // Get all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, width, profile, diameter');

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
        // Only clean if product has width/profile/diameter
        // (products without these fields will use name as fallback in UI)
        const hasSize = product.width && product.profile && product.diameter &&
                       product.width > 0 && product.profile > 0 && product.diameter > 0;

        if (hasSize) {
          const cleanName = cleanProductName(product.name);

          // Only update if name changed
          if (cleanName !== product.name) {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                name: cleanName,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id);

            if (updateError) {
              console.error(`❌ Error updating ${product.name}:`, updateError.message);
              errorDetails.push({ name: product.name, error: updateError.message });
              errors++;
            } else {
              console.log(`✅ ${product.name.substring(0, 50)}... → ${cleanName.substring(0, 50)}...`);
              updated++;
            }
          } else {
            skipped++;
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
    console.log(`⏭️  Skipped (no change needed): ${skipped} products`);
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

// Run the cleanup
cleanProductNames()
  .then(() => {
    console.log('\n✨ Cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
