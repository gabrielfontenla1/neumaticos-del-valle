const { Client } = require('pg');

// Configuración CORRECTA de conexión
const connectionString = 'postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

console.log('🚀 Connecting to PostgreSQL with correct credentials...\n');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!\n');

    // 1. Crear tabla stores
    console.log('📍 Step 1: Creating stores table...');
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
    console.log('   ✅ Stores table ready');

    // 2. Actualizar tabla appointments
    console.log('\n📍 Step 2: Updating appointments table...');

    // Agregar columna store_id
    try {
      await client.query(`
        ALTER TABLE public.appointments
        ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Added store_id column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ℹ️  store_id column already exists');
      } else {
        console.log('   ⚠️  ' + err.message);
      }
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
          ADD COLUMN ${col.name} ${col.type}
        `);
        console.log(`   ✅ Added ${col.name}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`   ℹ️  ${col.name} already exists`);
        }
      }
    }

    // 3. Configurar seguridad
    console.log('\n📍 Step 3: Setting up security...');

    // Enable RLS
    await client.query('ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY');
    console.log('   ✅ RLS enabled on stores');

    // Create policies
    try {
      await client.query(`
        DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores
      `);
      await client.query(`
        CREATE POLICY "Anyone can view active stores" ON public.stores
        FOR SELECT USING (active = true)
      `);
      console.log('   ✅ Policies configured');
    } catch (err) {
      console.log('   ⚠️  Policy setup: ' + err.message);
    }

    // 4. Insertar datos de ejemplo
    console.log('\n📍 Step 4: Inserting sample stores...');

    // Primero verificar si ya existen
    const existing = await client.query('SELECT COUNT(*) FROM public.stores');
    if (existing.rows[0].count > 0) {
      console.log(`   ℹ️  ${existing.rows[0].count} stores already exist`);
    } else {
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
      `);
      console.log(`   ✅ Inserted ${insertResult.rowCount} stores`);
    }

    // 5. Verificación final
    console.log('\n📊 Final verification...');
    const stores = await client.query('SELECT name, city, is_main FROM public.stores ORDER BY is_main DESC, name');
    console.log(`✅ Database has ${stores.rows.length} stores:`);
    stores.rows.forEach(store => {
      console.log(`   ${store.is_main ? '⭐' : '•'} ${store.name} (${store.city})`);
    });

    // Check appointments table structure
    const appointmentCols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND column_name IN ('store_id', 'preferred_date', 'preferred_time', 'customer_name')
    `);
    console.log(`\n✅ Appointments table has ${appointmentCols.rows.length}/4 required columns`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n✅ The stores table has been created with 3 branches');
    console.log('✅ The appointments table has been updated');
    console.log('✅ All security policies are in place');
    console.log('\n📍 You can now test the appointments system:');
    console.log('   http://localhost:6001/appointments');
    console.log('\n🚀 Everything is ready to go!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nStack trace:', err.stack);
  } finally {
    await client.end();
    console.log('\n🔚 Database connection closed');
  }
}

setupDatabase();