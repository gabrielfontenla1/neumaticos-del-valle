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

// Mapping of FORMULA models to their image files
const FORMULA_IMAGE_MAPPING = {
  'FORMULA ENERGY': '/energy.jpg',
  'FORMULA EVO': '/evo.jpg',
  'F.EVO': '/evo.jpg',  // Abbreviated version
  'FORMULA SPIDER': '/spider.jpg',
  'FORMULA DRAGON': '/dragon.jpg',
  'FORMULA S/T': '/formulaST',
  'F.S/T': '/formulaST',  // Abbreviated version
  'FORMULA AT X': '/formulaST'  // AT X is also S/T variant
};

async function updateFormulaImages() {
  console.log('🖼️  Updating FORMULA product images...\n');

  try {
    // Get all FORMULA products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('brand', 'FORMULA');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${products.length} FORMULA products\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Find which FORMULA model this product belongs to
        let matchedImage = null;

        for (const [model, imageUrl] of Object.entries(FORMULA_IMAGE_MAPPING)) {
          if (product.name.includes(model)) {
            matchedImage = imageUrl;
            break;
          }
        }

        // Skip if already has the correct image
        if (product.image_url === matchedImage) {
          skipped++;
          continue;
        }

        // Update the image_url
        if (matchedImage) {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              image_url: matchedImage,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id);

          if (updateError) {
            console.error(`❌ Error updating ${product.name}:`, updateError.message);
            errors++;
          } else {
            console.log(`✅ Updated: ${product.name.substring(0, 50)}... → ${matchedImage}`);
            updated++;
          }
        } else {
          console.log(`⚠️  No match found for: ${product.name.substring(0, 50)}...`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error.message);
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
    }
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateFormulaImages()
  .then(() => {
    console.log('\n✨ Image update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  });
