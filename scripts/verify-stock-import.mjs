import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BRANCH_MAPPING = {
  'CATAMARCA': 'CATAMARCA',
  'LA_BANDA': 'LA_BANDA',
  'SALTA': 'SALTA',
  'SANTIAGO': 'SANTIAGO',
  'TUCUMAN': 'TUCUMAN',
  'VIRGEN': 'VIRGEN',
};

async function verify() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       VERIFICACIÓN PROFUNDA: EXCEL vs SISTEMA                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  // 1. LEER EXCEL
  console.log('📊 FASE 1: Leyendo Excel...');
  const filePath = '/Users/gabrielfontenla/Downloads/stock5.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const headers = rawData[1];
  const dataRows = rawData.slice(2);

  const colIndex = {};
  headers.forEach((h, i) => { colIndex[h] = i; });

  // Crear mapa de Excel
  const excelProducts = {};
  for (const row of dataRows) {
    const sku = row[colIndex['CODIGO_PROPIO']];
    if (!sku) continue;

    excelProducts[sku] = {
      sku,
      description: row[colIndex['DESCRIPCION']],
      marca: row[colIndex['MARCA']],
      publico: row[colIndex['PUBLICO']] || 0,
      contado: row[colIndex['CONTADO']] || 0,
      stocks: {}
    };

    for (const [excelCol, branchCode] of Object.entries(BRANCH_MAPPING)) {
      excelProducts[sku].stocks[branchCode] = row[colIndex[excelCol]] || 0;
    }
  }

  console.log(`   ✅ ${Object.keys(excelProducts).length} productos leídos del Excel`);
  console.log('');

  // 2. LEER SUPABASE
  console.log('💾 FASE 2: Consultando Supabase...');

  // Obtener todos los productos
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, sku, name, display_name, price, price_list, brand_name, original_description');

  if (prodError) {
    console.error('   ❌ Error consultando productos:', prodError.message);
    return;
  }

  console.log(`   ✅ ${products.length} productos en Supabase`);

  // Obtener branches
  const { data: branches } = await supabase
    .from('branches')
    .select('id, code, name');

  const branchIdToCode = {};
  branches.forEach(b => { branchIdToCode[b.id] = b.code; });

  // Obtener todos los stocks (sin límite)
  let allStocks = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: batch } = await supabase
      .from('branch_stock')
      .select('product_id, branch_id, quantity')
      .range(offset, offset + pageSize - 1);

    if (!batch || batch.length === 0) break;
    allStocks = allStocks.concat(batch);
    offset += pageSize;
    if (batch.length < pageSize) break;
  }

  // Crear mapa de productos del sistema
  const systemProducts = {};
  for (const p of products) {
    systemProducts[p.sku] = {
      id: p.id,
      sku: p.sku,
      name: p.name,
      display_name: p.display_name,
      price: p.price,
      price_list: p.price_list,
      brand_name: p.brand_name,
      original_description: p.original_description,
      stocks: {}
    };

    // Inicializar stocks en 0
    for (const code of Object.values(BRANCH_MAPPING)) {
      systemProducts[p.sku].stocks[code] = 0;
    }
  }

  // Agregar stocks al mapa
  for (const stock of allStocks) {
    const product = products.find(p => p.id === stock.product_id);
    if (product && systemProducts[product.sku]) {
      const branchCode = branchIdToCode[stock.branch_id];
      if (branchCode && BRANCH_MAPPING[branchCode]) {
        systemProducts[product.sku].stocks[branchCode] = stock.quantity;
      }
    }
  }

  console.log(`   ✅ ${allStocks.length} registros de stock encontrados`);
  console.log('');

  // 3. COMPARACIÓN PROFUNDA
  console.log('🔍 FASE 3: Comparación profunda...');
  console.log('');

  const discrepancies = {
    missingInSystem: [],
    missingInExcel: [],
    priceDiscrepancies: [],
    stockDiscrepancies: [],
    dataDiscrepancies: []
  };

  let perfectMatches = 0;
  let totalChecks = 0;

  // Verificar cada producto del Excel
  for (const [sku, excel] of Object.entries(excelProducts)) {
    totalChecks++;
    const system = systemProducts[sku];

    if (!system) {
      discrepancies.missingInSystem.push({
        sku,
        description: excel.description
      });
      continue;
    }

    let hasDiscrepancy = false;

    // Comparar precio (CONTADO del Excel = price del sistema)
    const excelPrice = excel.contado;
    const systemPrice = system.price;

    if (Math.abs(excelPrice - systemPrice) > 0.01) {
      discrepancies.priceDiscrepancies.push({
        sku,
        excelPrice,
        systemPrice,
        diff: systemPrice - excelPrice
      });
      hasDiscrepancy = true;
    }

    // Comparar stock por sucursal
    for (const [branch, excelQty] of Object.entries(excel.stocks)) {
      const systemQty = system.stocks[branch] || 0;
      if (excelQty !== systemQty) {
        discrepancies.stockDiscrepancies.push({
          sku,
          branch,
          excelQty,
          systemQty,
          diff: systemQty - excelQty
        });
        hasDiscrepancy = true;
      }
    }

    if (!hasDiscrepancy) {
      perfectMatches++;
    }
  }

  // Verificar productos en sistema que no están en Excel
  for (const sku of Object.keys(systemProducts)) {
    if (!excelProducts[sku]) {
      discrepancies.missingInExcel.push({
        sku,
        name: systemProducts[sku].name
      });
    }
  }

  // 4. REPORTE
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    REPORTE DE VERIFICACIÓN                        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  console.log('📊 RESUMEN GENERAL');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log(`   Productos en Excel:              ${Object.keys(excelProducts).length}`);
  console.log(`   Productos en Sistema:            ${Object.keys(systemProducts).length}`);
  console.log(`   Verificaciones realizadas:       ${totalChecks}`);
  console.log(`   ✅ Coincidencias perfectas:      ${perfectMatches}`);
  console.log(`   ❌ Con discrepancias:            ${totalChecks - perfectMatches}`);
  console.log('');

  // SKUs faltantes
  console.log('📋 SKUS FALTANTES');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log(`   En Sistema (Excel tiene, Sistema no):  ${discrepancies.missingInSystem.length}`);
  if (discrepancies.missingInSystem.length > 0 && discrepancies.missingInSystem.length <= 10) {
    discrepancies.missingInSystem.forEach(m => {
      console.log(`      • ${m.sku}: ${m.description.substring(0, 40)}...`);
    });
  }
  console.log(`   En Excel (Sistema tiene, Excel no):    ${discrepancies.missingInExcel.length}`);
  if (discrepancies.missingInExcel.length > 0 && discrepancies.missingInExcel.length <= 10) {
    discrepancies.missingInExcel.forEach(m => {
      console.log(`      • ${m.sku}: ${m.name}`);
    });
  }
  console.log('');

  // Discrepancias de precio
  console.log('💰 DISCREPANCIAS DE PRECIO');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log(`   Total discrepancias:             ${discrepancies.priceDiscrepancies.length}`);
  if (discrepancies.priceDiscrepancies.length > 0) {
    console.log('   Primeras 10:');
    discrepancies.priceDiscrepancies.slice(0, 10).forEach(d => {
      const diffSign = d.diff > 0 ? '+' : '';
      console.log(`      • ${d.sku}: Excel=$${d.excelPrice} vs Sistema=$${d.systemPrice} (${diffSign}${d.diff.toFixed(2)})`);
    });
  }
  console.log('');

  // Discrepancias de stock
  console.log('📦 DISCREPANCIAS DE STOCK');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log(`   Total discrepancias:             ${discrepancies.stockDiscrepancies.length}`);

  // Agrupar por sucursal
  const stockByBranch = {};
  for (const d of discrepancies.stockDiscrepancies) {
    if (!stockByBranch[d.branch]) stockByBranch[d.branch] = [];
    stockByBranch[d.branch].push(d);
  }

  for (const [branch, items] of Object.entries(stockByBranch)) {
    console.log(`   ${branch}: ${items.length} discrepancias`);
    if (items.length <= 5) {
      items.forEach(d => {
        const diffSign = d.diff > 0 ? '+' : '';
        console.log(`      • ${d.sku}: Excel=${d.excelQty} vs Sistema=${d.systemQty} (${diffSign}${d.diff})`);
      });
    }
  }
  console.log('');

  // Verificación de totales por sucursal
  console.log('📊 TOTALES DE STOCK POR SUCURSAL');
  console.log('─────────────────────────────────────────────────────────────────────');

  for (const branch of Object.values(BRANCH_MAPPING)) {
    let excelTotal = 0;
    let systemTotal = 0;

    for (const excel of Object.values(excelProducts)) {
      excelTotal += excel.stocks[branch] || 0;
    }

    for (const system of Object.values(systemProducts)) {
      systemTotal += system.stocks[branch] || 0;
    }

    const match = excelTotal === systemTotal ? '✅' : '❌';
    console.log(`   ${branch.padEnd(12)} Excel: ${String(excelTotal).padStart(5)} | Sistema: ${String(systemTotal).padStart(5)} ${match}`);
  }
  console.log('');

  // Verificación de muestra aleatoria
  console.log('🎲 VERIFICACIÓN DE MUESTRA ALEATORIA (5 productos)');
  console.log('─────────────────────────────────────────────────────────────────────');

  const skus = Object.keys(excelProducts);
  const sampleIndices = [];
  while (sampleIndices.length < 5 && sampleIndices.length < skus.length) {
    const idx = Math.floor(Math.random() * skus.length);
    if (!sampleIndices.includes(idx)) sampleIndices.push(idx);
  }

  for (const idx of sampleIndices) {
    const sku = skus[idx];
    const excel = excelProducts[sku];
    const system = systemProducts[sku];

    console.log(`\n   SKU: ${sku}`);
    console.log(`   Descripción: ${excel.description.substring(0, 50)}...`);

    if (!system) {
      console.log('   ❌ NO ENCONTRADO EN SISTEMA');
      continue;
    }

    const priceMatch = Math.abs(excel.contado - system.price) < 0.01;
    console.log(`   Precio: Excel=$${excel.contado} vs Sistema=$${system.price} ${priceMatch ? '✅' : '❌'}`);

    let allStocksMatch = true;
    const stockLine = [];
    for (const [branch, excelQty] of Object.entries(excel.stocks)) {
      const systemQty = system.stocks[branch] || 0;
      const match = excelQty === systemQty;
      if (!match) allStocksMatch = false;
      stockLine.push(`${branch.substring(0,3)}:${excelQty}/${systemQty}${match ? '✓' : '✗'}`);
    }
    console.log(`   Stock: ${stockLine.join(' | ')} ${allStocksMatch ? '✅' : '❌'}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════');

  // Calcular score
  const totalPossible = Object.keys(excelProducts).length;
  const score = ((perfectMatches / totalPossible) * 100).toFixed(2);
  console.log(`   SCORE DE INTEGRIDAD: ${score}% (${perfectMatches}/${totalPossible} perfectos)`);
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('');

  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      excelProducts: Object.keys(excelProducts).length,
      systemProducts: Object.keys(systemProducts).length,
      perfectMatches,
      integrityScore: parseFloat(score)
    },
    discrepancies
  };

  fs.writeFileSync('/tmp/verification-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Reporte completo guardado en /tmp/verification-report.json');
}

verify().catch(console.error);
