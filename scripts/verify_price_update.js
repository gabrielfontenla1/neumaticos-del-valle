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

async function verifyPriceUpdate() {
  console.log('=== Verificando Actualización de Precios ===\n');

  try {
    // Sample some products with specific codigo_propio values to verify
    const sampleCodes = ['1', '10', '100', '200', '300', '400', '500', '600', '700', '741'];

    console.log('Verificando productos de muestra...\n');
    console.log('Formato: [Código] Nombre | Precio (Lista/Contado) | Precio Público (lo que paga el cliente)\n');
    console.log('-'.repeat(100));

    for (const code of sampleCodes) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('features->>codigo_propio', code)
        .single();

      if (error || !product) {
        console.log(`[${code}] No encontrado en la base de datos`);
        continue;
      }

      const precio = product.price || 0;
      const precioPublico = product.features?.price_list || 0;

      console.log(`[${code.padStart(3)}] ${product.name.substring(0, 50).padEnd(50)} | $${precio.toFixed(2).padStart(10)} | $${precioPublico.toFixed(2).padStart(10)}`);
    }

    // Get overall statistics
    const { data: stats, error: statsError } = await supabase
      .from('products')
      .select('price, features');

    if (!statsError && stats) {
      let totalProducts = stats.length;
      let productsWithPrice = 0;
      let productsWithPublicPrice = 0;
      let totalPrice = 0;
      let totalPublicPrice = 0;

      stats.forEach(p => {
        if (p.price && p.price > 0) {
          productsWithPrice++;
          totalPrice += p.price;
        }
        if (p.features?.price_list && p.features.price_list > 0) {
          productsWithPublicPrice++;
          totalPublicPrice += p.features.price_list;
        }
      });

      console.log('\n' + '='.repeat(100));
      console.log('\n=== Estadísticas Generales ===\n');
      console.log(`Total de productos en BD: ${totalProducts}`);
      console.log(`Productos con precio (Lista/Contado): ${productsWithPrice} (${(productsWithPrice/totalProducts*100).toFixed(1)}%)`);
      console.log(`Productos con precio público: ${productsWithPublicPrice} (${(productsWithPublicPrice/totalProducts*100).toFixed(1)}%)`);

      if (productsWithPrice > 0) {
        console.log(`Precio promedio (Lista/Contado): $${(totalPrice/productsWithPrice).toFixed(2)}`);
      }

      if (productsWithPublicPrice > 0) {
        console.log(`Precio público promedio: $${(totalPublicPrice/productsWithPublicPrice).toFixed(2)}`);

        // Check the discount ratio
        const avgDiscount = ((totalPublicPrice - totalPrice) / totalPublicPrice * 100).toFixed(1);
        console.log(`Descuento promedio (Público → Contado): ${avgDiscount}%`);
      }
    }

    console.log('\n✅ Verificación completada!');
    console.log('\nRecordatorio del mapeo de precios:');
    console.log('- Campo "price" (BD) = Precio CONTADO del Excel (precio con descuento)');
    console.log('- Campo "features.price_list" (BD) = Precio PÚBLICO del Excel (lo que paga el cliente)');

  } catch (error) {
    console.error('Error durante la verificación:', error);
  }
}

// Run verification
verifyPriceUpdate();