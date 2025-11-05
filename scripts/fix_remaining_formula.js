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
  'F.EVO': '/evo.jpg',
  'FORMULA SPIDER': '/spider.jpg',
  'FORMULA DRAGON': '/dragon.jpg',
  'FORMULA S/T': '/formulaST',
  'F.S/T': '/formulaST',
  'FORMULA AT': '/formulaST',
  'FORMULA AT X': '/formulaST'
};

function cleanProductName(name) {
  // Remove extra spaces and clean up the name
  return name
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\(NB?\)x?/gi, '')  // Remove (NB), (N), (NB)x, etc.
    .replace(/\(KS\)/gi, '')  // Remove (KS)
    .replace(/XL\s+FORMULA/, 'FORMULA')  // Fix XL placement
    .trim();
}

function extractModel(name) {
  // Extract FORMULA model from name
  const patterns = [
    /F\.S\/T/i,
    /F\.EVO/i,
    /FORMULA\s+ENERGY/i,
    /FORMULA\s+EVO/i,
    /FORMULA\s+SPIDER/i,
    /FORMULA\s+DRAGON/i,
    /FORMULA\s+S\/T/i,
    /FORMULA\s+AT\s+X/i,
    /FORMULA\s+AT/i
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return match[0].toUpperCase();
    }
  }

  return 'FORMULA';
}

function extractSpecs(name) {
  // Extract speed rating and load index if present
  const speedMatch = name.match(/\s+(\d{2,3}[HWVYZRT])\s+/);
  const loadMatch = name.match(/\s+([A-Z]{1,2})\s*$/);

  return {
    speed_rating: speedMatch ? speedMatch[1].slice(-1) : null,
    load_index: speedMatch ? parseInt(speedMatch[1].slice(0, -1)) : null
  };
}

function generateDescription(name, width, profile, diameter) {
  const cleanName = cleanProductName(name);
  const model = extractModel(cleanName);
  const size = `${width}/${profile}R${diameter}`;

  return `Neumático ${model} ${size} - Marca PIRELLI FORMULA, medida ${size}. Producto de alta calidad con excelente desempeño.`;
}

async function fixRemainingFormulaProducts() {
  console.log('🔧 Fixing remaining FORMULA products with brand=PIRELLI...\n');

  try {
    // Get all PIRELLI products with FORMULA (or F.) in the name that have no description
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('brand', 'PIRELLI')
      .is('description', null);

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    // Filter to only FORMULA products (check for F.S/T, F.EVO, etc)
    const formulaProducts = products.filter(p =>
      p.name.includes('F.S/T') ||
      p.name.includes('F.EVO') ||
      p.name.includes('FORMULA')
    );

    console.log(`Found ${formulaProducts.length} PIRELLI products with FORMULA in name (no description)\n`);

    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    for (const product of formulaProducts) {
      try {
        const cleanName = cleanProductName(product.name);
        const model = extractModel(cleanName);
        const specs = extractSpecs(product.name);

        // Find which FORMULA model this product belongs to
        let matchedImage = null;
        for (const [modelPattern, imageUrl] of Object.entries(FORMULA_IMAGE_MAPPING)) {
          if (cleanName.includes(modelPattern) || cleanName.includes(modelPattern.replace('FORMULA ', 'F.'))) {
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
            model: model,
            description: description,
            image_url: matchedImage || '/tire.webp',
            speed_rating: specs.speed_rating || product.speed_rating,
            load_index: specs.load_index || product.load_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ Error updating ${product.name}:`, updateError.message);
          errorDetails.push({ sku: product.sku, error: updateError.message });
          errors++;
        } else {
          const codigoPropio = product.features?.codigo_propio || product.sku;
          console.log(`✅ SKU ${codigoPropio}: ${model} → ${matchedImage || 'default'}`);
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
      console.log('\nErrors:');
      errorDetails.forEach(err => {
        console.log(`  - SKU ${err.sku}: ${err.error}`);
      });
    }
    console.log(`📊 Total processed: ${formulaProducts.length}`);
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
fixRemainingFormulaProducts()
  .then(() => {
    console.log('\n✨ Fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
