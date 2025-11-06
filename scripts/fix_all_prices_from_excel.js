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

// Excel file path
const EXCEL_FILE_PATH = '/Users/gabrielfontenla/Downloads/6nov.xlsx';

function normalizeForComparison(text) {
  if (!text) return '';
  return text
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\/.áéíóúñÁÉÍÓÚÑ]/g, '')
    .trim();
}

// Extract tire size from product name
function extractTireSize(productName) {
  if (!productName) return null;

  // Pattern to match tire sizes like "225/45R17" or "225/45/17" or variations
  const sizePattern = /(\d{3})\/(\d{2})[R\/]?(\d{2})/i;
  const match = productName.match(sizePattern);

  if (match) {
    return {
      width: parseInt(match[1]),
      profile: parseInt(match[2]),
      diameter: parseInt(match[3]),
      full: `${match[1]}/${match[2]}R${match[3]}`
    };
  }

  return null;
}

async function fixAllPrices() {
  console.log('=== CORRECCIÓN MASIVA DE PRECIOS DESDE EXCEL ===\n');

  try {
    // 1. Read Excel file
    console.log('📖 Leyendo archivo Excel...');
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read without header to inspect the structure
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Find the header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (row && row.some(cell =>
        cell && (
          cell.toString().toUpperCase().includes('CODIGO') ||
          cell.toString().toUpperCase().includes('DESCRIPCION') ||
          cell.toString().toUpperCase().includes('CONTADO')
        )
      )) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.error('❌ No se encontró la fila de encabezados en el Excel');
      return;
    }

    // Get the correct data starting from the row after headers
    const headers = rawData[headerRowIndex];
    const excelData = [];

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const item = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          item[header.toString().trim()] = row[index];
        }
      });

      // Only add if it has a description
      if (item['DESCRIPCION']) {
        // Extract tire size for better matching
        const tireSize = extractTireSize(item['DESCRIPCION']);
        item.tireSize = tireSize;
        item.normalizedDesc = normalizeForComparison(item['DESCRIPCION']);
        excelData.push(item);
      }
    }

    console.log(`✅ Excel cargado: ${excelData.length} productos encontrados\n`);

    // 2. Get all products from database
    console.log('🔍 Obteniendo todos los productos de la base de datos...');
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    console.log(`✅ Productos en BD: ${dbProducts.length}\n`);

    // 3. Process each database product
    let updatedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;
    const updates = [];

    for (const dbProduct of dbProducts) {
      // Normalize DB product name
      const dbNameNormalized = normalizeForComparison(dbProduct.name);

      // Use the database tire size fields
      const dbTireSize = (dbProduct.width && dbProduct.profile && dbProduct.diameter) ? {
        width: dbProduct.width,
        profile: dbProduct.profile,
        diameter: dbProduct.diameter,
        full: `${dbProduct.width}/${dbProduct.profile}R${dbProduct.diameter}`
      } : null;

      // Find best match in Excel
      let bestMatch = null;
      let matchScore = 0;

      for (const excelItem of excelData) {
        let currentScore = 0;

        // First priority: exact tire size match
        if (dbTireSize && excelItem.tireSize) {
          if (dbTireSize.width === excelItem.tireSize.width &&
              dbTireSize.profile === excelItem.tireSize.profile &&
              dbTireSize.diameter === excelItem.tireSize.diameter) {
            currentScore += 100;
          }
        }

        // Second priority: check if the main product name matches
        const dbMainName = dbNameNormalized
          .replace(/\d{3}\/\d{2}[R\/]?\d{2}/gi, '') // Remove tire size
          .replace(/\s+/g, ' ')
          .trim();

        const excelMainName = excelItem.normalizedDesc
          .replace(/\d{3}\/\d{2}[R\/]?\d{2}/gi, '') // Remove tire size
          .replace(/\s+/g, ' ')
          .trim();

        if (dbMainName && excelMainName) {
          // Check for common words
          const dbWords = dbMainName.split(' ').filter(w => w.length > 2);
          const excelWords = excelMainName.split(' ').filter(w => w.length > 2);

          let commonWords = 0;
          for (const dbWord of dbWords) {
            if (excelWords.includes(dbWord)) {
              commonWords++;
            }
          }

          if (dbWords.length > 0) {
            currentScore += (commonWords / dbWords.length) * 50;
          }
        }

        // Update best match if this is better
        if (currentScore > matchScore) {
          matchScore = currentScore;
          bestMatch = excelItem;
        }
      }

      // Only update if we have a good match (score > 100 means tire size matches)
      if (bestMatch && matchScore > 100) {
        const contadoPrice = parseFloat(bestMatch['CONTADO']);
        const publicoPrice = parseFloat(bestMatch['PUBLICO']);

        // Check if prices need updating
        const needsUpdate =
          dbProduct.price !== contadoPrice ||
          dbProduct.features?.price_list !== publicoPrice;

        if (needsUpdate) {
          updates.push({
            id: dbProduct.id,
            name: dbProduct.name,
            oldPrice: dbProduct.price,
            newPrice: contadoPrice,
            oldPublicPrice: dbProduct.features?.price_list,
            newPublicPrice: publicoPrice,
            excelMatch: bestMatch['DESCRIPCION'],
            matchScore: matchScore
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        notFoundCount++;
        console.log(`⚠️ No se encontró match para: ${dbProduct.name}`);
      }
    }

    // 4. Apply updates
    if (updates.length > 0) {
      console.log(`\n📝 Aplicando ${updates.length} actualizaciones de precios...\n`);

      for (const update of updates) {
        const { data: dbProduct } = await supabase
          .from('products')
          .select('features')
          .eq('id', update.id)
          .single();

        const updatedFeatures = {
          ...dbProduct.features,
          price_list: update.newPublicPrice
        };

        const { error: updateError } = await supabase
          .from('products')
          .update({
            price: update.newPrice,
            features: updatedFeatures,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`❌ Error actualizando ${update.name}:`, updateError);
        } else {
          console.log(`✅ ${update.name}`);
          console.log(`   Excel: ${update.excelMatch}`);
          console.log(`   Precio: $${update.oldPrice?.toFixed(2) || 'N/A'} → $${update.newPrice.toFixed(2)}`);
          console.log(`   Público: $${update.oldPublicPrice?.toFixed(2) || 'N/A'} → $${update.newPublicPrice.toFixed(2)}`);
          console.log(`   Score: ${update.matchScore.toFixed(0)}\n`);
        }
      }
    }

    // 5. Show summary
    console.log('\n' + '━'.repeat(80));
    console.log('\n📊 RESUMEN DE LA CORRECCIÓN:\n');
    console.log(`✅ Productos actualizados: ${updatedCount}`);
    console.log(`⏭️ Productos sin cambios (precios correctos): ${skippedCount}`);
    console.log(`❌ Productos no encontrados en Excel: ${notFoundCount}`);
    console.log(`📦 Total productos procesados: ${dbProducts.length}`);

    const successRate = ((updatedCount + skippedCount) / dbProducts.length * 100).toFixed(1);
    console.log(`\n📈 Tasa de éxito: ${successRate}%`);

    console.log('\n' + '━'.repeat(80));
    console.log('\n✅ Corrección de precios completada\n');

  } catch (error) {
    console.error('Error durante la corrección:', error);
  }
}

// Run the fix
fixAllPrices();