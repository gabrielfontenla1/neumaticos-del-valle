const { Client } = require('pg');

// Configuración de conexión
const DATABASE_PASSWORD = 'xesti0-sejgyb-Kepvym';
const PROJECT_REF = 'oyiwyzmaxgnzyhmmkstr';

// Intentemos con diferentes URLs posibles
const connections = [
  {
    name: 'AWS US East 1',
    url: `postgresql://postgres.${PROJECT_REF}:${DATABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'AWS US East 2',
    url: `postgresql://postgres.${PROJECT_REF}:${DATABASE_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Direct connection',
    url: `postgresql://postgres:${DATABASE_PASSWORD}@db.${PROJECT_REF}.supabase.co:6543/postgres`
  }
];

async function tryConnection(connInfo) {
  console.log(`\n🔄 Trying ${connInfo.name}...`);

  const client = new Client({
    connectionString: connInfo.url,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log(`✅ Connected successfully using ${connInfo.name}!`);

    // Crear tabla stores
    console.log('\n📍 Creating stores table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.stores (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        email VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        opening_hours JSONB DEFAULT '{}',
        is_main BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Stores table created/verified');

    // Agregar columna store_id a appointments si no existe
    console.log('\n📍 Updating appointments table...');
    try {
      await client.query(`
        ALTER TABLE public.appointments
        ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added store_id column');
    } catch (err) {
      console.log('   ⚠️  Column may already exist');
    }

    // Agregar otras columnas necesarias
    const columns = [
      { name: 'vehicle_make', type: 'VARCHAR(100)' },
      { name: 'vehicle_model', type: 'VARCHAR(100)' },
      { name: 'vehicle_year', type: 'INTEGER' },
      { name: 'preferred_date', type: 'DATE' },
      { name: 'preferred_time', type: 'VARCHAR(5)' },
      { name: 'customer_name', type: 'VARCHAR(255)' },
      { name: 'customer_email', type: 'VARCHAR(255)' },
      { name: 'customer_phone', type: 'VARCHAR(50)' },
      { name: 'notes', type: 'TEXT' }
    ];

    for (const col of columns) {
      try {
        await client.query(`
          ALTER TABLE public.appointments
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
        console.log(`   ✅ Added column ${col.name}`);
      } catch (err) {
        // Column probably exists
      }
    }

    // Habilitar RLS
    console.log('\n📍 Enabling Row Level Security...');
    await client.query('ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY');
    console.log('   ✅ RLS enabled on stores');

    // Crear política
    try {
      await client.query(`
        CREATE POLICY "Anyone can view active stores" ON public.stores
        FOR SELECT USING (active = true)
      `);
      console.log('   ✅ Policy created');
    } catch (err) {
      console.log('   ⚠️  Policy may already exist');
    }

    // Insertar sucursales de ejemplo
    console.log('\n📍 Inserting sample stores...');
    const insertResult = await client.query(`
      INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
      VALUES
      ('Sucursal Central', 'Av. San Martín 1234', 'Buenos Aires', '011-4444-5555', '5491144445555',
       'central@neumaticosdelValle.com',
       '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
       true, true),
      ('Sucursal Norte', 'Av. Maipú 567', 'Vicente López', '011-4444-6666', '5491144446666',
       'norte@neumaticosdelValle.com',
       '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
       false, true),
      ('Sucursal Sur', 'Av. Mitre 890', 'Avellaneda', '011-4444-7777', '5491144447777',
       'sur@neumaticosdelValle.com',
       '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
       false, true)
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    console.log(`   ✅ Inserted ${insertResult.rowCount} stores`);

    // Verificar stores
    console.log('\n📊 Verifying stores...');
    const result = await client.query('SELECT name, city, is_main FROM public.stores ORDER BY is_main DESC');
    console.log(`✅ Found ${result.rows.length} stores:`);
    result.rows.forEach(store => {
      console.log(`   ${store.is_main ? '⭐' : '•'} ${store.name} (${store.city})`);
    });

    console.log('\n🎉 SUCCESS! Database is now properly configured!');
    console.log('📍 Test the appointments page at: http://localhost:6001/appointments');

    await client.end();
    return true;

  } catch (err) {
    console.log(`   ❌ Failed: ${err.message}`);
    await client.end();
    return false;
  }
}

async function main() {
  console.log('🚀 Attempting to connect to PostgreSQL database...');

  for (const conn of connections) {
    const success = await tryConnection(conn);
    if (success) {
      process.exit(0);
    }
  }

  console.log('\n❌ Could not connect with any of the attempted URLs');
  console.log('\n📝 Please verify:');
  console.log('   1. The database password is correct');
  console.log('   2. The project is active in Supabase');
  console.log('   3. The database region is correctly configured');
  process.exit(1);
}

main();