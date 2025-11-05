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

async function swapPrices() {
  console.log('🔄 Swapping prices to correct mapping...\n');
  console.log('BEFORE:');
  console.log('  - price (DB field) = Precio Público (lo que paga el cliente)');
  console.log('  - price_list (features) = Precio Lista');
  console.log('\nAFTER:');
  console.log('  - price (DB field) = Precio Lista');
  console.log('  - price_list (features) = Precio Público (lo que paga el cliente)\n');

  try {
    // Get all products with prices
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, price, features');

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
        const currentPrice = product.price;
        const currentPriceList = product.features?.price_list;

        // Skip if no price_list in features
        if (!currentPriceList) {
          skipped++;
          continue;
        }

        // Swap the prices
        // currentPrice (was public/client) → becomes price_list in features
        // currentPriceList (was lista) → becomes price in DB

        const updatedFeatures = {
          ...product.features,
          price_list: currentPrice  // What client pays goes to features.price_list
        };

        const { error: updateError } = await supabase
          .from('products')
          .update({
            price: currentPriceList,  // Lista price goes to DB price field
            features: updatedFeatures,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ Error updating ${product.name}:`, updateError.message);
          errorDetails.push({ name: product.name, error: updateError.message });
          errors++;
        } else {
          console.log(`✅ ${product.name.substring(0, 40)}... | Lista: $${currentPriceList.toLocaleString('es-AR')} | Público: $${currentPrice.toLocaleString('es-AR')}`);
          updated++;
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
    console.log(`✅ Successfully swapped: ${updated} products`);
    console.log(`⏭️  Skipped (no price_list): ${skipped} products`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
      console.log('\nFirst 5 errors:');
      errorDetails.slice(0, 5).forEach(err => {
        console.log(`  - ${err.name}: ${err.error}`);
      });
    }
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

    // Verify the swap
    const { data: verifyProducts } = await supabase
      .from('products')
      .select('name, price, features')
      .gt('stock', 0)
      .limit(3);

    console.log('\n✅ Verification - Sample products after swap:\n');
    verifyProducts.forEach(p => {
      const priceList = p.features?.price_list;
      console.log(`${p.name.substring(0, 40)}...`);
      console.log(`  price (Lista): $${p.price?.toLocaleString('es-AR')}`);
      console.log(`  price_list (Público): $${priceList?.toLocaleString('es-AR')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the swap
swapPrices()
  .then(() => {
    console.log('✨ Price swap completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Swap failed:', error);
    process.exit(1);
  });
