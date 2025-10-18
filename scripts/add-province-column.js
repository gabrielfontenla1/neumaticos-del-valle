const { Client } = require('pg');

const connectionString = 'postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

console.log('🚀 Agregando columna provincia a las sucursales...\n');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addProvinceColumn() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL!\n');

    // 1. Agregar columna province si no existe
    console.log('📍 Paso 1: Agregando columna province...');
    try {
      await client.query(`
        ALTER TABLE public.stores
        ADD COLUMN province VARCHAR(100)
      `);
      console.log('   ✅ Columna province agregada');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ℹ️  Columna province ya existe');
      } else {
        throw err;
      }
    }

    // 2. Actualizar las provincias de cada sucursal
    console.log('\n📍 Paso 2: Actualizando provincias de las sucursales...');

    const updates = [
      { name: 'Sucursal Catamarca - Av Belgrano', province: 'Catamarca' },
      { name: 'Sucursal Catamarca - Alem', province: 'Catamarca' },
      { name: 'Sucursal Santiago del Estero - La Banda', province: 'Santiago del Estero' },
      { name: 'Sucursal Santiago del Estero - Belgrano', province: 'Santiago del Estero' },
      { name: 'Sucursal Salta', province: 'Salta' },
      { name: 'Sucursal Tucumán', province: 'Tucumán' }
    ];

    for (const update of updates) {
      const result = await client.query(
        'UPDATE public.stores SET province = $1 WHERE name = $2',
        [update.province, update.name]
      );
      if (result.rowCount > 0) {
        console.log(`   ✅ ${update.name} → ${update.province}`);
      }
    }

    // 3. Verificar la actualización
    console.log('\n📊 Verificando sucursales por provincia...');
    const verifyResult = await client.query(`
      SELECT province, COUNT(*) as count, array_agg(name ORDER BY name) as branches
      FROM public.stores
      WHERE active = true
      GROUP BY province
      ORDER BY province
    `);

    console.log('\n🌍 Distribución de sucursales:');
    console.log('='.repeat(60));
    verifyResult.rows.forEach(row => {
      console.log(`\n📍 ${row.province}: ${row.count} ${row.count === 1 ? 'sucursal' : 'sucursales'}`);
      row.branches.forEach(branch => {
        console.log(`   • ${branch}`);
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡ACTUALIZACIÓN COMPLETADA!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('\n🔚 Conexión cerrada');
  }
}

addProvinceColumn();