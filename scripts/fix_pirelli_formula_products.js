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
  'FORMULA SPIDER': '/spider.jpg',
  'FORMULA DRAGON': '/dragon.jpg',
  'FORMULA S/T': '/formulaST',
  'FORMULA AT': '/formulaST'  // AT is also S/T variant
};

function cleanProductName(name) {
  // Remove extra spaces and clean up the name
  return name
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\(NB?\)x?/gi, '')  // Remove (NB), (N), (NB)x, etc.
    .replace(/XL\s+FORMULA/, 'FORMULA')  // Fix XL placement
    .trim();
}

function generateDescription(name, width, profile, diameter) {
  const cleanName = cleanProductName(name);
  const size = `${width}/${profile}R${diameter}`;

  // Extract model from name
  const modelMatch = cleanName.match(/FORMULA\s+(\w+(?:\s*\/\s*\w+)?)/i);
  const model = modelMatch ? modelMatch[0] : 'FORMULA';

  return `Neumático ${model} ${size} - Marca PIRELLI FORMULA, medida ${size}. Producto de alta calidad con excelente desempeño.`;
}

async function fixPirelliFormulaProducts() {
  console.log('🔧 Fixing PIRELLI products that are actually FORMULA...\n');

  try {
    // Get all PIRELLI products with FORMULA in the name
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('brand', 'PIRELLI')
      .ilike('name', '%FORMULA%');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${products.length} PIRELLI products with FORMULA in name\n`);

    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    for (const product of products) {
      try {
        const cleanName = cleanProductName(product.name);

        // Find which FORMULA model this product belongs to
        let matchedImage = null;
        for (const [model, imageUrl] of Object.entries(FORMULA_IMAGE_MAPPING)) {
          if (cleanName.includes(model)) {
            matchedImage = imageUrl;
            break;
          }
        }

        // Generate description
        const description = generateDescription(
          cleanName,
          product.width || 175,
          product.profile || 65,
          product.diameter || 14
        );

        // Update the product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            brand: 'FORMULA',  // Change brand from PIRELLI to FORMULA
            name: cleanName,
            description: description,
            image_url: matchedImage || '/tire.webp',
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ Error updating ${product.name}:`, updateError.message);
          errorDetails.push({ sku: product.sku, error: updateError.message });
          errors++;
        } else {
          const codigoPropio = product.features?.codigo_propio || product.sku;
          console.log(`✅ SKU ${codigoPropio}: ${cleanName.substring(0, 50)}... → ${matchedImage || 'default'}`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error.message);
        errorDetails.push({ sku: product.sku, error: error.message });
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('                UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} products`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
      console.log('\nFirst 5 errors:');
      errorDetails.slice(0, 5).forEach(err => {
        console.log(`  - SKU ${err.sku}: ${err.error}`);
      });
    }
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

    // Verify the update
    const { data: formulaCheck } = await supabase
      .from('products')
      .select('brand, stock')
      .eq('brand', 'FORMULA');

    const totalFormula = formulaCheck.length;
    const withStock = formulaCheck.filter(p => p.stock > 0).length;

    console.log('\n📊 FORMULA brand verification:');
    console.log(`  - Total FORMULA products: ${totalFormula}`);
    console.log(`  - Products with stock: ${withStock}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
fixPirelliFormulaProducts()
  .then(() => {
    console.log('\n✨ Fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
