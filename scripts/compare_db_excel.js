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

function normalizeProductName(name) {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\/.áéíóúñÁÉÍÓÚÑ]/g, '')
    .trim();
}

async function compareProducts() {
  console.log('=== COMPARACIÓN DE 20 PRODUCTOS: BASE DE DATOS vs EXCEL ===\n');

  try {
    // 1. Read Excel file with proper headers
    console.log('📖 Leyendo archivo Excel...');
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read without header to inspect the structure
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Find the header row (looking for "CODIGO" or "DESCRIPCION")
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
      if (item['DESCRIPCION'] || item['descripcion'] || item['Descripcion']) {
        excelData.push(item);
      }
    }

    console.log(`✅ Excel cargado: ${excelData.length} productos encontrados`);

    // Show the actual headers found
    if (headers) {
      console.log('📋 Columnas del Excel encontradas:', headers.filter(h => h).join(', '));
    }
    console.log();

    // 2. Get 20 random products from database that have prices
    console.log('🔍 Obteniendo 20 productos de la base de datos...');
    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('*')
      .not('price', 'is', null)
      .limit(20);

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    console.log(`✅ Productos obtenidos de la BD: ${dbProducts.length}\n`);
    console.log('━'.repeat(120));

    // 3. Compare each product
    let matchedCount = 0;
    let mismatchedCount = 0;
    const comparisonResults = [];

    for (const dbProduct of dbProducts) {
      // Normalize the database product name
      const dbNameNormalized = normalizeProductName(dbProduct.name);

      // Try to find matching product in Excel
      let excelMatch = null;

      // Get the description field name (could vary)
      const descField = Object.keys(excelData[0] || {}).find(k =>
        k && k.toUpperCase().includes('DESCRIPCION')
      ) || 'DESCRIPCION';

      const contadoField = Object.keys(excelData[0] || {}).find(k =>
        k && k.toUpperCase().includes('CONTADO')
      ) || 'CONTADO';

      const publicoField = Object.keys(excelData[0] || {}).find(k =>
        k && (k.toUpperCase().includes('PUBLICO') || k.toUpperCase().includes('PÚBLICO'))
      ) || 'PUBLICO';

      // First try exact match
      excelMatch = excelData.find(excelProd =>
        normalizeProductName(excelProd[descField]) === dbNameNormalized
      );

      // If no exact match, try partial match
      if (!excelMatch) {
        excelMatch = excelData.find(excelProd => {
          const excelNameNormalized = normalizeProductName(excelProd[descField]);
          return dbNameNormalized.includes(excelNameNormalized) ||
                 excelNameNormalized.includes(dbNameNormalized);
        });
      }

      const result = {
        dbId: dbProduct.id,
        dbName: dbProduct.name,
        dbPrice: dbProduct.price,
        dbPriceList: dbProduct.features?.price_list || null,
        excelName: excelMatch ? excelMatch[descField] : 'NO ENCONTRADO',
        excelContado: excelMatch ? excelMatch[contadoField] : null,
        excelPublico: excelMatch ? excelMatch[publicoField] : null,
        matched: !!excelMatch
      };

      if (excelMatch) {
        matchedCount++;
        result.priceMatch = dbProduct.price === excelMatch[contadoField];
        result.publicPriceMatch = dbProduct.features?.price_list === excelMatch[publicoField];
        result.priceDiff = dbProduct.price - excelMatch[contadoField];
        result.publicPriceDiff = (dbProduct.features?.price_list || 0) - (excelMatch[publicoField] || 0);
      }

      comparisonResults.push(result);
    }

    // 4. Display results
    console.log('\n📊 RESULTADOS DE LA COMPARACIÓN:\n');
    console.log(`✅ Productos encontrados en Excel: ${matchedCount}/${dbProducts.length}`);
    console.log(`❌ Productos NO encontrados en Excel: ${dbProducts.length - matchedCount}/${dbProducts.length}`);
    console.log('\n' + '━'.repeat(120));

    // Display detailed comparison table
    console.log('\n📋 DETALLE DE COMPARACIÓN (20 PRODUCTOS):\n');

    comparisonResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.dbName}`);
      console.log('   ' + '─'.repeat(100));

      if (result.matched) {
        console.log(`   📦 Excel Match: ${result.excelName}`);
        console.log(`   💰 Precio Contado:`);
        console.log(`      • BD: $${result.dbPrice?.toFixed(2) || 'N/A'}`);
        console.log(`      • Excel: $${result.excelContado?.toFixed(2) || 'N/A'}`);

        if (result.priceMatch) {
          console.log(`      ✅ COINCIDE`);
        } else {
          const diff = result.priceDiff;
          console.log(`      ⚠️ DIFERENCIA: $${Math.abs(diff).toFixed(2)} ${diff > 0 ? '(BD mayor)' : '(Excel mayor)'}`);
        }

        console.log(`   💵 Precio Público:`);
        console.log(`      • BD: $${result.dbPriceList?.toFixed(2) || 'N/A'}`);
        console.log(`      • Excel: $${result.excelPublico?.toFixed(2) || 'N/A'}`);

        if (result.publicPriceMatch) {
          console.log(`      ✅ COINCIDE`);
        } else {
          const diff = result.publicPriceDiff;
          if (result.dbPriceList && result.excelPublico) {
            console.log(`      ⚠️ DIFERENCIA: $${Math.abs(diff).toFixed(2)} ${diff > 0 ? '(BD mayor)' : '(Excel mayor)'}`);
          } else {
            console.log(`      ⚠️ Falta precio en ${!result.dbPriceList ? 'BD' : 'Excel'}`);
          }
        }
      } else {
        console.log(`   ❌ NO ENCONTRADO EN EXCEL`);
        console.log(`   💰 Precio en BD: $${result.dbPrice?.toFixed(2) || 'N/A'}`);
        console.log(`   💵 Precio Público en BD: $${result.dbPriceList?.toFixed(2) || 'N/A'}`);
      }
    });

    // 5. Summary statistics
    console.log('\n' + '━'.repeat(120));
    console.log('\n📈 RESUMEN ESTADÍSTICO:\n');

    const matchedResults = comparisonResults.filter(r => r.matched);
    const priceMatches = matchedResults.filter(r => r.priceMatch).length;
    const publicPriceMatches = matchedResults.filter(r => r.publicPriceMatch).length;

    console.log(`📊 De los ${matchedCount} productos encontrados en Excel:`);
    console.log(`   • Precios Contado coincidentes: ${priceMatches}/${matchedCount} (${(priceMatches/matchedCount*100).toFixed(1)}%)`);
    console.log(`   • Precios Público coincidentes: ${publicPriceMatches}/${matchedCount} (${(publicPriceMatches/matchedCount*100).toFixed(1)}%)`);

    // Calculate average differences for non-matching prices
    const priceDiffs = matchedResults
      .filter(r => !r.priceMatch && r.priceDiff !== undefined)
      .map(r => Math.abs(r.priceDiff));

    const publicPriceDiffs = matchedResults
      .filter(r => !r.publicPriceMatch && r.publicPriceDiff !== undefined)
      .map(r => Math.abs(r.publicPriceDiff));

    if (priceDiffs.length > 0) {
      const avgPriceDiff = priceDiffs.reduce((a, b) => a + b, 0) / priceDiffs.length;
      console.log(`   • Diferencia promedio en Precio Contado: $${avgPriceDiff.toFixed(2)}`);
    }

    if (publicPriceDiffs.length > 0) {
      const avgPublicPriceDiff = publicPriceDiffs.reduce((a, b) => a + b, 0) / publicPriceDiffs.length;
      console.log(`   • Diferencia promedio en Precio Público: $${avgPublicPriceDiff.toFixed(2)}`);
    }

    console.log('\n' + '━'.repeat(120));
    console.log('\n✅ Comparación completada exitosamente\n');

  } catch (error) {
    console.error('Error durante la comparación:', error);
  }
}

// Run comparison
compareProducts();