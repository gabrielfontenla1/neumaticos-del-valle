import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeo de sucursales Excel → BD
const BRANCH_MAPPING = {
  'CATAMARCA': 'CATAMARCA',
  'LA_BANDA': 'LA_BANDA',
  'SALTA': 'SALTA',
  'SANTIAGO': 'SANTIAGO',
  'TUCUMAN': 'TUCUMAN',
  'VIRGEN': 'VIRGEN',
};

// Función simple de parsing de neumáticos (RegEx)
function parseTireDescription(description) {
  const result = {
    width: null,
    aspect_ratio: null,
    rim_diameter: null,
    construction: null,
    load_index: null,
    speed_rating: null,
    extra_load: false,
    run_flat: false,
    seal_inside: false,
    tube_type: false,
    homologation: null,
    display_name: description,
    original_description: description,
    parse_confidence: 0,
    parse_warnings: []
  };

  try {
    // Patrón principal: 205/75R15 o 175R13 o 31x10.5R15
    const metricPattern = /(\d{2,3})\/(\d{2,3})([RZBDrzbd])(\d{2})/;
    const simplePattern = /(\d{2,3})([RZrzbd])(\d{2})/;
    const inchPattern = /(\d{2,3})[xX](\d+\.?\d*)([RZrzbd])(\d{2})/;

    let match = description.match(metricPattern);
    if (match) {
      result.width = parseInt(match[1]);
      result.aspect_ratio = parseInt(match[2]);
      result.construction = match[3].toUpperCase();
      result.rim_diameter = parseInt(match[4]);
      result.parse_confidence += 70;
    } else {
      match = description.match(simplePattern);
      if (match) {
        result.width = parseInt(match[1]);
        result.construction = match[2].toUpperCase();
        result.rim_diameter = parseInt(match[3]);
        result.parse_confidence += 50;
      } else {
        match = description.match(inchPattern);
        if (match) {
          result.width = parseInt(match[1]);
          result.aspect_ratio = parseFloat(match[2]) * 10;
          result.construction = match[3].toUpperCase();
          result.rim_diameter = parseInt(match[4]);
          result.parse_confidence += 60;
        }
      }
    }

    // Índice de carga y velocidad: 99T, 102H, etc.
    const loadSpeedPattern = /\b(\d{2,3})([A-Z])\b/;
    const loadSpeedMatch = description.match(loadSpeedPattern);
    if (loadSpeedMatch) {
      result.load_index = parseInt(loadSpeedMatch[1]);
      result.speed_rating = loadSpeedMatch[2];
      result.parse_confidence += 15;
    }

    // Extra Load
    if (/\bXL\b/i.test(description) || /EXTRA\s*LOAD/i.test(description)) {
      result.extra_load = true;
      result.parse_confidence += 5;
    }

    // Run Flat
    if (/\bR-?F\b/i.test(description) || /RUN.?FLAT/i.test(description)) {
      result.run_flat = true;
      result.parse_confidence += 5;
    }

    // Tube Type
    if (/\bTT\b/.test(description)) {
      result.tube_type = true;
      result.parse_confidence += 5;
    }

    // Limpiar display_name
    let cleanName = description
      .replace(/\(NB\)\w*/gi, '')
      .replace(/\bwl\b/gi, '')
      .replace(/\(K1\)|\(KS\)|\(JP\)|\(RO1\)|\(RO2\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    result.display_name = cleanName;

  } catch (error) {
    result.parse_warnings.push('Parse error: ' + error.message);
  }

  return result;
}

async function main() {
  console.log('=== IMPORTACIÓN DIRECTA DE STOCK ===');
  console.log('');

  // 1. Leer Excel
  const filePath = '/Users/gabrielfontenla/Downloads/stock5.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Headers en fila 1, datos desde fila 2
  const headers = rawData[1];
  const dataRows = rawData.slice(2);

  console.log('📊 Excel leído:');
  console.log('   Headers:', headers.length, 'columnas');
  console.log('   Datos:', dataRows.length, 'filas');
  console.log('');

  // Mapear columnas
  const colIndex = {};
  headers.forEach((h, i) => { colIndex[h] = i; });

  // 2. Obtener sucursales
  const { data: branches } = await supabase
    .from('branches')
    .select('id, code, name');

  const branchMap = {};
  branches.forEach(b => { branchMap[b.code] = b.id; });

  console.log('🏪 Sucursales encontradas:', Object.keys(branchMap).join(', '));
  console.log('');

  // 3. Limpiar datos existentes
  console.log('🗑️  Limpiando datos existentes...');

  await supabase.from('branch_stock').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('vouchers').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().gte('id', '00000000-0000-0000-0000-000000000000');

  console.log('   ✅ Datos limpiados');
  console.log('');

  // 4. Procesar productos
  console.log('📦 Procesando productos...');

  const products = [];
  const stockData = [];
  const errors = [];
  let regexUsed = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 3; // +3 por headers

    try {
      const sku = row[colIndex['CODIGO_PROPIO']];
      const description = row[colIndex['DESCRIPCION']];
      const marca = row[colIndex['MARCA']];
      const publico = row[colIndex['PUBLICO']];
      const contado = row[colIndex['CONTADO']];

      if (!sku || !description) {
        errors.push({ row: rowNum, sku: sku || 'N/A', error: 'Faltan campos requeridos' });
        continue;
      }

      // Parsear descripción
      const parsed = parseTireDescription(description);
      regexUsed++;

      // Preparar producto
      const product = {
        sku: sku,
        name: parsed.display_name,
        slug: String(sku).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        width: parsed.width,
        aspect_ratio: parsed.aspect_ratio,
        rim_diameter: parsed.rim_diameter,
        construction: parsed.construction,
        load_index: parsed.load_index,
        speed_rating: parsed.speed_rating,
        extra_load: parsed.extra_load,
        run_flat: parsed.run_flat,
        seal_inside: parsed.seal_inside,
        tube_type: parsed.tube_type,
        homologation: parsed.homologation,
        original_description: parsed.original_description,
        display_name: parsed.display_name,
        parse_confidence: parsed.parse_confidence,
        parse_warnings: parsed.parse_warnings,
        price: contado || publico || null,
        price_list: publico || null,
        brand_name: marca || null,
      };

      products.push(product);

      // Preparar stock por sucursal
      const productStocks = [];
      for (const [excelCol, branchCode] of Object.entries(BRANCH_MAPPING)) {
        const qty = row[colIndex[excelCol]] || 0;
        const branchId = branchMap[branchCode];
        if (branchId) {
          productStocks.push({
            branchCode,
            branchId,
            quantity: Math.max(0, qty)
          });
        }
      }
      stockData.push({ sku, stocks: productStocks });

      // Progreso
      if ((i + 1) % 100 === 0) {
        console.log(`   Procesados: ${i + 1}/${dataRows.length}`);
      }

    } catch (error) {
      errors.push({ row: rowNum, sku: 'N/A', error: error.message });
    }
  }

  console.log(`   ✅ ${products.length} productos parseados`);
  console.log(`   ⚡ RegEx usado: ${regexUsed}`);
  console.log('');

  // 5. Insertar productos en chunks
  console.log('💾 Insertando productos en base de datos...');

  const CHUNK_SIZE = 500;
  const insertedProducts = [];

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const { data: inserted, error } = await supabase
      .from('products')
      .insert(chunk)
      .select('id, sku');

    if (error) {
      console.error('   ❌ Error insertando chunk:', error.message);
      continue;
    }

    insertedProducts.push(...inserted);
    console.log(`   Insertados: ${insertedProducts.length}/${products.length}`);
  }

  console.log(`   ✅ ${insertedProducts.length} productos insertados`);
  console.log('');

  // 6. Crear mapa SKU → ID
  const skuToId = {};
  insertedProducts.forEach(p => { skuToId[p.sku] = p.id; });

  // 7. Insertar stocks
  console.log('📊 Insertando stocks por sucursal...');

  const allStocks = [];
  for (const { sku, stocks } of stockData) {
    const productId = skuToId[sku];
    if (!productId) continue;

    for (const stock of stocks) {
      allStocks.push({
        product_id: productId,
        branch_id: stock.branchId,
        quantity: stock.quantity,
        last_updated: new Date().toISOString()
      });
    }
  }

  const STOCK_CHUNK_SIZE = 1000;
  let stocksInserted = 0;

  for (let i = 0; i < allStocks.length; i += STOCK_CHUNK_SIZE) {
    const chunk = allStocks.slice(i, i + STOCK_CHUNK_SIZE);
    const { error } = await supabase.from('branch_stock').insert(chunk);

    if (error) {
      console.error('   ❌ Error insertando stocks:', error.message);
      continue;
    }

    stocksInserted += chunk.length;
  }

  console.log(`   ✅ ${stocksInserted} registros de stock insertados`);
  console.log('');

  // 8. Resumen
  console.log('=== RESUMEN DE IMPORTACIÓN ===');
  console.log('');
  console.log('📊 Excel:');
  console.log('   Filas procesadas:', dataRows.length);
  console.log('');
  console.log('💾 Base de Datos:');
  console.log('   Productos creados:', insertedProducts.length);
  console.log('   Stocks insertados:', stocksInserted);
  console.log('');
  console.log('❌ Errores:', errors.length);
  if (errors.length > 0) {
    console.log('   Primeros 5 errores:');
    errors.slice(0, 5).forEach(e => {
      console.log(`   - Fila ${e.row} [${e.sku}]: ${e.error}`);
    });
  }
  console.log('');
  console.log('✅ IMPORTACIÓN COMPLETADA');

  // Guardar resultado
  const result = {
    success: true,
    excelRows: dataRows.length,
    productsCreated: insertedProducts.length,
    stocksInserted: stocksInserted,
    errors: errors
  };

  fs.writeFileSync('/tmp/import-result.json', JSON.stringify(result, null, 2));
  console.log('📄 Resultado guardado en /tmp/import-result.json');
}

main().catch(console.error);
