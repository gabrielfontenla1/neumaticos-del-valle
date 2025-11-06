const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to clean and normalize text for matching
function normalizeText(text) {
  if (!text) return '';
  return text.toString()
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\/\-]/g, ''); // Remove special characters except / and -
}

// Function to extract tire size from description
function extractTireSize(description) {
  const sizePattern = /(\d{2,3}\/\d{2}[A-Z]?R\d{2})/i;
  const match = description.match(sizePattern);
  return match ? match[1] : null;
}

// Function to extract brand from description
function extractBrand(description) {
  const brands = ['PIRELLI', 'BRIDGESTONE', 'MICHELIN', 'CONTINENTAL', 'GOODYEAR',
                  'FIRESTONE', 'FATE', 'DUNLOP', 'YOKOHAMA', 'TOYO', 'FORMULA'];

  const upperDesc = description.toUpperCase();
  for (const brand of brands) {
    if (upperDesc.includes(brand)) {
      return brand;
    }
  }
  return null;
}

async function updatePricesFromExcel() {
  console.log('=== Starting Price Update from Excel ===');
  console.log(`Reading Excel file: /Users/gabrielfontenla/Downloads/6nov.xlsx`);

  try {
    // Read Excel file
    const workbook = XLSX.readFile('/Users/gabrielfontenla/Downloads/6nov.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON, starting from row 2 (row 1 is the header)
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 1 // Skip the first row
    });

    // Get headers from the second row (index 0 after skipping first row)
    const headers = data[0];
    const codigoIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes('CODIGO'));
    const descripcionIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes('DESCRIPCION'));
    const publicoIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes('PUBLICO'));
    const contadoIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes('CONTADO'));

    console.log(`Found columns: CODIGO at ${codigoIndex}, DESCRIPCION at ${descripcionIndex}, PUBLICO at ${publicoIndex}, CONTADO at ${contadoIndex}`);

    // Process data rows (starting from index 1, which is the third row in the original file)
    const excelProducts = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        const codigo = row[codigoIndex]?.toString().replace(/[\[\]]/g, '').trim();
        const descripcion = row[descripcionIndex]?.toString().trim();
        const publico = parseFloat(row[publicoIndex]) || 0;
        const contado = parseFloat(row[contadoIndex]) || 0;

        if (descripcion && (publico > 0 || contado > 0)) {
          const tireSize = extractTireSize(descripcion);
          const brand = extractBrand(descripcion);

          excelProducts.push({
            codigo,
            descripcion,
            descripcion_normalized: normalizeText(descripcion),
            tire_size: tireSize,
            brand,
            publico,
            contado
          });
        }
      }
    }

    console.log(`Loaded ${excelProducts.length} products from Excel`);

    // Fetch all products from database
    console.log('Fetching products from database...');
    const { data: dbProducts, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return;
    }

    console.log(`Fetched ${dbProducts.length} products from database`);

    // Match and update products
    let matched = 0;
    let updated = 0;
    let notFound = [];

    for (const excelProduct of excelProducts) {
      let bestMatch = null;
      let matchType = '';

      // Try to match by codigo_propio first
      if (excelProduct.codigo) {
        bestMatch = dbProducts.find(p =>
          p.features?.codigo_propio?.toString() === excelProduct.codigo
        );
        if (bestMatch) matchType = 'codigo_propio';
      }

      // If not found by codigo, try matching by tire size and brand
      if (!bestMatch && excelProduct.tire_size) {
        bestMatch = dbProducts.find(p => {
          const dbName = normalizeText(p.name);
          const dbModel = normalizeText(p.model || '');
          const dbBrand = p.brand?.toUpperCase();

          // Check if tire size matches and brand matches (if we have brand info)
          const sizeMatch = dbName.includes(excelProduct.tire_size.toUpperCase()) ||
                           dbModel.includes(excelProduct.tire_size.toUpperCase());
          const brandMatch = !excelProduct.brand || dbBrand === excelProduct.brand;

          return sizeMatch && brandMatch;
        });
        if (bestMatch) matchType = 'tire_size_brand';
      }

      // If still not found, try fuzzy matching on normalized description
      if (!bestMatch) {
        const excelDesc = excelProduct.descripcion_normalized;
        bestMatch = dbProducts.find(p => {
          const dbNameNorm = normalizeText(p.name);
          const dbModelNorm = normalizeText(p.model || '');

          // Check if the database product contains most of the Excel description words
          const excelWords = excelDesc.split(' ').filter(w => w.length > 2);
          const matchingWords = excelWords.filter(word =>
            dbNameNorm.includes(word) || dbModelNorm.includes(word)
          );

          return matchingWords.length >= excelWords.length * 0.7; // 70% match threshold
        });
        if (bestMatch) matchType = 'fuzzy';
      }

      if (bestMatch) {
        matched++;

        // Update prices
        // According to user requirements:
        // - "Público" (what client pays) → features.price_list
        // - "Contado" (lista/cash price) → price field

        const updatedFeatures = {
          ...bestMatch.features,
          price_list: excelProduct.publico // Client price
        };

        const { error: updateError } = await supabase
          .from('products')
          .update({
            price: excelProduct.contado, // Lista/cash price
            features: updatedFeatures,
            updated_at: new Date().toISOString()
          })
          .eq('id', bestMatch.id);

        if (updateError) {
          console.error(`Error updating product ${bestMatch.id}:`, updateError);
        } else {
          updated++;
          console.log(`[${matchType}] Updated: ${bestMatch.name} - Público: $${excelProduct.publico}, Contado: $${excelProduct.contado}`);
        }
      } else {
        notFound.push({
          codigo: excelProduct.codigo,
          descripcion: excelProduct.descripcion,
          publico: excelProduct.publico,
          contado: excelProduct.contado
        });
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total products in Excel: ${excelProducts.length}`);
    console.log(`Products matched: ${matched}`);
    console.log(`Products updated: ${updated}`);
    console.log(`Products not found: ${notFound.length}`);

    if (notFound.length > 0) {
      console.log('\n=== Products Not Found in Database ===');
      console.log('These products from Excel could not be matched:');
      notFound.slice(0, 10).forEach(p => {
        console.log(`  - [${p.codigo || 'NO CODE'}] ${p.descripcion} - Público: $${p.publico}, Contado: $${p.contado}`);
      });
      if (notFound.length > 10) {
        console.log(`  ... and ${notFound.length - 10} more`);
      }

      // Save unmatched products to a file for review
      const fs = require('fs');
      const unmatchedPath = path.join(__dirname, 'unmatched_products.json');
      fs.writeFileSync(unmatchedPath, JSON.stringify(notFound, null, 2));
      console.log(`\nFull list of unmatched products saved to: ${unmatchedPath}`);
    }

    console.log('\n✅ Price update completed!');

  } catch (error) {
    console.error('Error during price update:', error);
  }
}

// Run the update
updatePricesFromExcel();