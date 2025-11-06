const { createClient } = require('@supabase/supabase-js');
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

// Function to clean product text
function cleanProductText(text) {
  if (!text) return text;

  let cleaned = text;

  // Remove internal codes
  cleaned = cleaned.replace(/\(NB\)[xX]*/gi, '');  // (NB)x, (NB)xx, (NB)X, etc.
  cleaned = cleaned.replace(/\(NB\)/gi, '');        // Just (NB)
  cleaned = cleaned.replace(/\([A-Z]{1,3}\)/g, ''); // Any 1-3 letter codes in parentheses

  // Remove asterisks and related patterns
  cleaned = cleaned.replace(/\(\*\)/g, '');
  cleaned = cleaned.replace(/\*/g, '');

  // Remove other internal codes
  cleaned = cleaned.replace(/\b[A-Z]{2,3}\b(?=\s*$)/g, ''); // Remove trailing 2-3 letter codes
  cleaned = cleaned.replace(/ncs\b/gi, '');  // Remove 'ncs' suffix
  cleaned = cleaned.replace(/elt\b/gi, '');  // Remove 'elt' suffix
  cleaned = cleaned.replace(/wl\b/gi, '');   // Remove 'wl' suffix

  // Remove specific patterns
  cleaned = cleaned.replace(/\s+\([A-Z0-9]{1,2}\)$/g, ''); // Remove trailing codes like (F), (N1), etc.
  cleaned = cleaned.replace(/\s+[A-Z]{1,2}$/g, '');        // Remove trailing single/double letters

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Clean up leading/trailing spaces and special characters
  cleaned = cleaned.trim();

  // Fix common formatting issues
  cleaned = cleaned.replace(/\s+([,\.])/g, '$1'); // Remove space before punctuation
  cleaned = cleaned.replace(/([,\.])\s*([,\.])/g, '$1'); // Remove duplicate punctuation

  return cleaned;
}

// Function to clean model specifically
function cleanModel(model) {
  if (!model) return model;

  let cleaned = model;

  // First apply general cleaning
  cleaned = cleanProductText(cleaned);

  // Additional model-specific cleaning
  cleaned = cleaned.replace(/^(SCORPION|CINTURATO|CARRIER|CHRONO|FORMULA|PHANTOM|DRAGON|NERO|ZERO|ROSSO)\s*/i, '');

  // Remove redundant brand names
  cleaned = cleaned.replace(/^(PIRELLI|MICHELIN|BRIDGESTONE|CONTINENTAL|GOODYEAR|FIRESTONE|FATE|DUNLOP|YOKOHAMA|TOYO)\s*/i, '');

  // Clean specific model patterns
  cleaned = cleaned.replace(/\bS-HT\b/gi, 'S-HT');
  cleaned = cleaned.replace(/\bS-ATR\b/gi, 'S-ATR');
  cleaned = cleaned.replace(/\bS-A\/T\+?\b/gi, 'S-A/T+');
  cleaned = cleaned.replace(/\bS-MTR\b/gi, 'S-MTR');
  cleaned = cleaned.replace(/\bP\s+ZERO\b/gi, 'P ZERO');
  cleaned = cleaned.replace(/\bP-ZERO\b/gi, 'P ZERO');
  cleaned = cleaned.replace(/\bPZERO\b/gi, 'P ZERO');
  cleaned = cleaned.replace(/\bF\.S\/T\b/gi, 'F.S/T');
  cleaned = cleaned.replace(/\bF\.EVO\b/gi, 'F.EVO');

  // Remove trailing technical specs
  cleaned = cleaned.replace(/\s+(XL|R-F|r-f|s-i|S-I)\s*$/gi, '');

  return cleaned.trim();
}

// Function to normalize product name
function normalizeProductName(name, brand, model) {
  if (!name) return name;

  let normalized = cleanProductText(name);

  // Remove size from beginning if present
  normalized = normalized.replace(/^\d{2,3}\/\d{2}[A-Z]?R\d{2}\s*/gi, '');
  normalized = normalized.replace(/^P?\d{2,3}\/\d{2}[A-Z]?R\d{2}\s*/gi, '');

  // Remove load/speed ratings from beginning
  normalized = normalized.replace(/^\d{2,3}[A-Z]\s+/g, '');

  // Remove redundant model info if already in model field
  if (model) {
    const cleanedModel = cleanModel(model);
    if (cleanedModel && normalized.includes(cleanedModel)) {
      normalized = normalized.replace(cleanedModel, '').trim();
    }
  }

  // Ensure we have a meaningful name
  if (!normalized || normalized.length < 3) {
    if (model) {
      normalized = cleanModel(model);
    }
  }

  return normalized;
}

async function normalizeAllProducts() {
  console.log('=== Iniciando Normalización de Datos de Productos ===\n');

  try {
    // Fetch all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return;
    }

    console.log(`Procesando ${products.length} productos...\n`);

    let updated = 0;
    let errors = 0;
    const changes = [];

    for (const product of products) {
      const originalName = product.name;
      const originalModel = product.model;
      const originalDescription = product.description;

      // Clean each field
      const cleanedName = normalizeProductName(originalName, product.brand, originalModel);
      const cleanedModel = cleanModel(originalModel);
      const cleanedDescription = cleanProductText(originalDescription);

      // Check if any changes are needed
      if (cleanedName !== originalName ||
          cleanedModel !== originalModel ||
          cleanedDescription !== originalDescription) {

        // Update the product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: cleanedName,
            model: cleanedModel,
            description: cleanedDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError);
          errors++;
        } else {
          updated++;

          // Log significant changes
          if (originalName !== cleanedName || originalModel !== cleanedModel) {
            changes.push({
              id: product.id,
              originalName,
              cleanedName,
              originalModel,
              cleanedModel
            });

            console.log(`✅ [${product.features?.codigo_propio || product.id}]:`);
            if (originalName !== cleanedName) {
              console.log(`   Nombre: "${originalName}" → "${cleanedName}"`);
            }
            if (originalModel !== cleanedModel) {
              console.log(`   Modelo: "${originalModel}" → "${cleanedModel}"`);
            }
          }
        }
      }

      // Progress indicator every 50 products
      if ((products.indexOf(product) + 1) % 50 === 0) {
        process.stdout.write(`  Procesados: ${products.indexOf(product) + 1}/${products.length}\r`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n=== Resumen de Normalización ===\n');
    console.log(`✅ Total de productos procesados: ${products.length}`);
    console.log(`✅ Productos actualizados: ${updated}`);
    console.log(`❌ Errores encontrados: ${errors}`);

    // Show examples of major changes
    if (changes.length > 0) {
      console.log('\n=== Ejemplos de Cambios Significativos ===\n');
      changes.slice(0, 10).forEach(change => {
        console.log(`[${change.id.substring(0, 8)}...]`);
        if (change.originalName !== change.cleanedName) {
          console.log(`  Nombre: "${change.originalName}" → "${change.cleanedName}"`);
        }
        if (change.originalModel !== change.cleanedModel) {
          console.log(`  Modelo: "${change.originalModel}" → "${change.cleanedModel}"`);
        }
      });

      if (changes.length > 10) {
        console.log(`\n... y ${changes.length - 10} cambios más`);
      }
    }

    console.log('\n✅ Normalización completada exitosamente!');

  } catch (error) {
    console.error('Error durante la normalización:', error);
  }
}

// Run the normalization
normalizeAllProducts();