/**
 * Script de Migración de Imágenes de Productos
 *
 * Este script actualiza el campo image_url de todos los productos
 * usando el nuevo sistema centralizado de mapeo de imágenes.
 *
 * Uso:
 *   node scripts/update-product-images.mjs
 *
 * El script:
 * 1. Lee todos los productos de Supabase
 * 2. Aplica el mapeo de imágenes basado en nombre y marca
 * 3. Actualiza los productos con las nuevas URLs de imágenes
 * 4. Muestra un resumen de los cambios
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// MAPEO DE IMÁGENES (copiado de tire-image-mapping.ts)
// ============================================

const TIRE_IMAGE_MAPPINGS = [
  // PIRELLI - Modelos específicos primero
  { pattern: 'SCORPION VERDE ALL SEASON', image: '/pirelli-scorpion-verde-all-season.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ZERO ALL SEASON', image: '/pirelli-scorpion-zero-all-season.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ZERO ASIMMETRICO', image: '/pirelli-scorpion-zero-asimmetrico.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ALL TERRAIN PLUS', image: '/pirelli-scorpion-at-plus.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ALL TERRAIN', image: '/pirelli-scorpion-at-plus.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION VERDE', image: '/pirelli-scorpion-verde.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ZERO', image: '/pirelli-scorpion-zero.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ATR', image: '/pirelli-scorpion-atr.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION MTR', image: '/pirelli-scorpion-mtr.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION HT', image: '/pirelli-scorpion-ht.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPN', image: '/pirelli-scorpion.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION', image: '/pirelli-scorpion.webp', brand: 'PIRELLI' },
  { pattern: 'CINTURATO P7', image: '/pirelli-cinturato-p7.webp', brand: 'PIRELLI' },
  { pattern: 'CINTURATO P1', image: '/pirelli-cinturato-p1.webp', brand: 'PIRELLI' },
  { pattern: 'CINTURATO', image: '/pirelli-cinturato-p7.webp', brand: 'PIRELLI' },
  { pattern: 'P ZERO CORSA SYSTEM', image: '/pirelli-pzero-corsa-system.webp', brand: 'PIRELLI' },
  { pattern: 'PZERO CORSA SYSTEM', image: '/pirelli-pzero-corsa-system.webp', brand: 'PIRELLI' },
  { pattern: 'P ZERO CORSA', image: '/pirelli-pzero-corsa.webp', brand: 'PIRELLI' },
  { pattern: 'PZERO CORSA', image: '/pirelli-pzero-corsa.webp', brand: 'PIRELLI' },
  { pattern: 'P-ZERO', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'P ZERO', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'PZERO', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'P400 EVO', image: '/pirelli-p400-evo.webp', brand: 'PIRELLI' },
  { pattern: 'P400EVO', image: '/pirelli-p400-evo.webp', brand: 'PIRELLI' },
  { pattern: 'P400', image: '/pirelli-p400-evo.webp', brand: 'PIRELLI' },
  { pattern: 'CHRONO', image: '/pirelli-chrono.webp', brand: 'PIRELLI' },
  { pattern: 'NERO GT', image: '/nerogt.jpg', brand: 'PIRELLI' },
  { pattern: 'NEROGT', image: '/nerogt.jpg', brand: 'PIRELLI' },
  { pattern: 'P6000', image: '/p6000.jpg', brand: 'PIRELLI' },
  { pattern: 'POWERGY', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'PWRGY', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'CARRIER', image: '/pirelli-chrono.webp', brand: 'PIRELLI' },

  // FORMULA
  { pattern: 'FORMULA ENERGY', image: '/formula-energy.jpg', brand: 'FORMULA' },
  { pattern: 'F.ENERGY', image: '/formula-energy.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA EVO', image: '/formula-evo.jpg', brand: 'FORMULA' },
  { pattern: 'F.EVO', image: '/formula-evo.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA S/T', image: '/formula-st.jpg', brand: 'FORMULA' },
  { pattern: 'F.S/T', image: '/formula-st.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA SPIDER', image: '/spider.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA DRAGON', image: '/dragon.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA AT', image: '/formula-st.jpg', brand: 'FORMULA' },
];

const BRAND_FALLBACKS = {
  'PIRELLI': '/pirelli-scorpion.webp',
  'FORMULA': '/formula-energy.jpg',
  'DEFAULT': '/tire.webp'
};

function getTireImage(productName, brand) {
  if (!productName || !brand) {
    return BRAND_FALLBACKS['DEFAULT'];
  }

  const searchText = productName.toUpperCase();
  const brandUpper = brand.toUpperCase();

  for (const mapping of TIRE_IMAGE_MAPPINGS) {
    if (mapping.brand !== brandUpper) continue;

    if (searchText.includes(mapping.pattern)) {
      return mapping.image;
    }
  }

  return BRAND_FALLBACKS[brandUpper] || BRAND_FALLBACKS['DEFAULT'];
}

// ============================================
// MIGRACIÓN
// ============================================

async function migrate() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       MIGRACIÓN DE IMÁGENES DE PRODUCTOS                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  // 1. Leer todos los productos
  console.log('📊 Leyendo productos de la base de datos...');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand_name, image_url')
    .order('name');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`   ✅ ${products.length} productos encontrados`);
  console.log('');

  // 2. Calcular nuevas imágenes
  console.log('🔄 Calculando nuevas imágenes...');

  const updates = [];
  const stats = {
    unchanged: 0,
    updated: 0,
    byBrand: {}
  };

  for (const product of products) {
    const brand = product.brand_name || 'UNKNOWN';
    const newImage = getTireImage(product.name, brand);
    const oldImage = product.image_url || '/tire.webp';

    if (!stats.byBrand[brand]) {
      stats.byBrand[brand] = { total: 0, updated: 0 };
    }
    stats.byBrand[brand].total++;

    if (newImage !== oldImage) {
      updates.push({
        id: product.id,
        name: product.name,
        brand,
        oldImage,
        newImage
      });
      stats.updated++;
      stats.byBrand[brand].updated++;
    } else {
      stats.unchanged++;
    }
  }

  console.log(`   📊 Sin cambios: ${stats.unchanged}`);
  console.log(`   📊 A actualizar: ${stats.updated}`);
  console.log('');

  // 3. Mostrar resumen por marca
  console.log('📋 RESUMEN POR MARCA');
  console.log('─────────────────────────────────────────────────────────────────────');

  for (const [brand, data] of Object.entries(stats.byBrand)) {
    console.log(`   ${brand.padEnd(15)} Total: ${String(data.total).padStart(4)} | Actualizar: ${String(data.updated).padStart(4)}`);
  }
  console.log('');

  // 4. Mostrar ejemplos de cambios
  if (updates.length > 0) {
    console.log('📝 EJEMPLOS DE CAMBIOS (primeros 10)');
    console.log('─────────────────────────────────────────────────────────────────────');

    for (const update of updates.slice(0, 10)) {
      console.log(`   ${update.name.substring(0, 40).padEnd(42)}`);
      console.log(`      ${update.oldImage} → ${update.newImage}`);
    }
    console.log('');
  }

  // 5. Aplicar cambios
  if (updates.length > 0) {
    console.log('💾 Aplicando cambios en la base de datos...');

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: update.newImage })
        .eq('id', update.id);

      if (updateError) {
        errorCount++;
        console.error(`   ❌ Error actualizando ${update.id}: ${updateError.message}`);
      } else {
        successCount++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(`   ✅ Actualizados: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log('═══════════════════════════════════════════════════════════════════════');
  } else {
    console.log('✅ No hay cambios necesarios. Todas las imágenes están actualizadas.');
  }
}

migrate().catch(console.error);
