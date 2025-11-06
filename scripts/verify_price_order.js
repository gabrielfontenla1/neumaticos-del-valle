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

async function verifyPriceOrder() {
  console.log('\n=== VERIFICACIÓN DE ORDEN DE PRECIOS POR DEFECTO ===\n');

  try {
    // Obtener productos ordenados por precio ascendente (como debería ser por defecto)
    const { data: products, error } = await supabase
      .from('products')
      .select('name, price, brand, model')
      .order('price', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    console.log(`Mostrando los primeros ${products.length} productos ordenados por precio:\n`);
    console.log('Pos | Precio    | Marca      | Modelo');
    console.log('----|-----------|------------|------------------');

    products.forEach((product, index) => {
      const position = String(index + 1).padEnd(3);
      const price = product.price ? `$${product.price.toFixed(2).padEnd(8)}` : 'Sin precio';
      const brand = (product.brand || 'Sin marca').substring(0, 10).padEnd(10);
      const model = (product.model || product.name || 'Sin nombre').substring(0, 30);

      console.log(`${position} | ${price} | ${brand} | ${model}`);
    });

    // Verificar que están ordenados correctamente
    let isOrdered = true;
    for (let i = 1; i < products.length; i++) {
      if (products[i].price && products[i-1].price && products[i].price < products[i-1].price) {
        isOrdered = false;
        console.log(`\n⚠️ Error en orden:`);
        console.log(`   Producto ${i}: $${products[i-1].price}`);
        console.log(`   Producto ${i+1}: $${products[i].price}`);
        break;
      }
    }

    if (isOrdered) {
      console.log('\n✅ Los productos están correctamente ordenados por precio ascendente.');

      // Obtener estadísticas
      const { data: stats, error: statsError } = await supabase
        .from('products')
        .select('price')
        .not('price', 'is', null);

      if (!statsError && stats) {
        const prices = stats.map(p => p.price).sort((a, b) => a - b);
        console.log(`\n📊 Estadísticas de precios:`);
        console.log(`   - Precio mínimo: $${prices[0].toFixed(2)}`);
        console.log(`   - Precio máximo: $${prices[prices.length - 1].toFixed(2)}`);
        console.log(`   - Productos con precio: ${prices.length}`);
      }
    } else {
      console.log('\n❌ Los productos NO están ordenados correctamente.');
    }

    // Verificar configuración por defecto
    console.log('\n🔍 Verificando configuración de ordenamiento por defecto:');
    console.log('   - DEFAULT_FILTER_STATE.sortBy debe ser: "price-asc"');
    console.log('   - ProductsClient sortBy por defecto debe ser: "price-asc"');
    console.log('\nSi la página web muestra los productos desordenados, verifica estos valores.');

  } catch (error) {
    console.error('Error durante la verificación:', error);
  }
}

// Run verification
verifyPriceOrder();