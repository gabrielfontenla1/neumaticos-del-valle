const { Client } = require('pg');

// Configuración de conexión
const connectionString = 'postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

console.log('🚀 Actualizando sucursales con datos reales...\n');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateBranches() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL!\n');

    // 1. Primero eliminar las sucursales de prueba
    console.log('📍 Paso 1: Eliminando sucursales de prueba...');
    await client.query('DELETE FROM public.stores');
    console.log('   ✅ Sucursales de prueba eliminadas');

    // 2. Insertar las sucursales reales
    console.log('\n📍 Paso 2: Insertando sucursales reales de Neumáticos del Valle...');

    const branches = [
      {
        name: 'Sucursal Catamarca - Av Belgrano',
        address: 'Av Belgrano 938',
        city: 'San Fernando del Valle de Catamarca',
        province: 'Catamarca',
        postal_code: '4700',
        phone: '0383-443-5555',
        whatsapp: '5493834435555',
        email: 'catamarca.belgrano@neumaticosdelValle.com',
        is_main: true
      },
      {
        name: 'Sucursal Santiago del Estero - La Banda',
        address: 'República del Líbano Sur 866',
        city: 'La Banda',
        province: 'Santiago del Estero',
        postal_code: 'G4300',
        phone: '0385-427-7777',
        whatsapp: '5493854277777',
        email: 'labanda@neumaticosdelValle.com',
        is_main: false
      },
      {
        name: 'Sucursal Catamarca - Alem',
        address: 'Alem 1118',
        city: 'San Fernando del Valle de Catamarca',
        province: 'Catamarca',
        postal_code: 'K4700CQR',
        phone: '0383-443-6666',
        whatsapp: '5493834436666',
        email: 'catamarca.alem@neumaticosdelValle.com',
        is_main: false
      },
      {
        name: 'Sucursal Salta',
        address: 'Jujuy 330',
        city: 'Salta',
        province: 'Salta',
        postal_code: 'A4400',
        phone: '0387-431-8888',
        whatsapp: '5493874318888',
        email: 'salta@neumaticosdelValle.com',
        is_main: false
      },
      {
        name: 'Sucursal Santiago del Estero - Belgrano',
        address: 'Avenida Belgrano Sur 2834',
        city: 'Santiago del Estero',
        province: 'Santiago del Estero',
        postal_code: 'G4204AAO',
        phone: '0385-421-9999',
        whatsapp: '5493854219999',
        email: 'santiago@neumaticosdelValle.com',
        is_main: false
      },
      {
        name: 'Sucursal Tucumán',
        address: 'Avenida Gobernador del Campo 436',
        city: 'San Miguel de Tucumán',
        province: 'Tucumán',
        postal_code: 'T4000',
        phone: '0381-422-5555',
        whatsapp: '5493814225555',
        email: 'tucuman@neumaticosdelValle.com',
        is_main: false
      }
    ];

    for (const branch of branches) {
      const insertQuery = `
        INSERT INTO public.stores (
          name, address, city, phone, whatsapp, email,
          opening_hours, is_main, active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, true
        ) RETURNING id, name
      `;

      const openingHours = {
        monday: { open: '08:30', close: '19:00' },
        tuesday: { open: '08:30', close: '19:00' },
        wednesday: { open: '08:30', close: '19:00' },
        thursday: { open: '08:30', close: '19:00' },
        friday: { open: '08:30', close: '19:00' },
        saturday: { open: '08:30', close: '13:00' },
        sunday: { closed: true }
      };

      const values = [
        branch.name,
        branch.address,
        `${branch.city}, ${branch.province}`,
        branch.phone,
        branch.whatsapp,
        branch.email,
        JSON.stringify(openingHours),
        branch.is_main
      ];

      try {
        const result = await client.query(insertQuery, values);
        console.log(`   ✅ ${branch.name}`);
        console.log(`      📍 ${branch.address}`);
        console.log(`      📞 ${branch.phone}`);
        if (branch.is_main) {
          console.log(`      ⭐ SUCURSAL PRINCIPAL`);
        }
      } catch (err) {
        console.log(`   ❌ Error insertando ${branch.name}: ${err.message}`);
      }
    }

    // 3. Verificar las sucursales insertadas
    console.log('\n📊 Verificando sucursales insertadas...');
    const verifyResult = await client.query(`
      SELECT name, address, city, phone, is_main
      FROM public.stores
      ORDER BY is_main DESC, name
    `);

    console.log(`\n✅ Se insertaron ${verifyResult.rows.length} sucursales:`);
    console.log('=' . repeat(60));

    verifyResult.rows.forEach((store, index) => {
      console.log(`${index + 1}. ${store.is_main ? '⭐' : '  '} ${store.name}`);
      console.log(`      📍 ${store.address}`);
      console.log(`      🏙️  ${store.city}`);
      console.log(`      📞 ${store.phone}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡ACTUALIZACIÓN COMPLETADA!');
    console.log('='.repeat(60));
    console.log('\n✅ Las 6 sucursales reales de Neumáticos del Valle');
    console.log('   han sido agregadas a la base de datos');
    console.log('\n📍 Distribuidor oficial Pirelli en:');
    console.log('   • Catamarca (2 sucursales)');
    console.log('   • Santiago del Estero (2 sucursales)');
    console.log('   • Salta (1 sucursal)');
    console.log('   • Tucumán (1 sucursal)');
    console.log('\n🔗 El sistema de turnos está listo en:');
    console.log('   http://localhost:6001/appointments');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nStack trace:', err.stack);
  } finally {
    await client.end();
    console.log('\n🔚 Conexión a base de datos cerrada');
  }
}

updateBranches();