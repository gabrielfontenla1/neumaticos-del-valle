const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión
const DATABASE_PASSWORD = 'xesti0-sejgyb-Kepvym';
const PROJECT_REF = 'oyiwyzmaxgnzyhmmkstr';

// Intentar con el endpoint directo
const connectionString = `postgresql://postgres:${DATABASE_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

console.log('🚀 Attempting direct PostgreSQL connection...\n');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
});

async function executeSQL() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!\n');

    // Comandos SQL individuales
    const commands = [
      {
        name: 'Create stores table',
        sql: `CREATE TABLE IF NOT EXISTS public.stores (
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
        )`
      },
      {
        name: 'Check if store_id exists in appointments',
        sql: `SELECT column_name FROM information_schema.columns
              WHERE table_name = 'appointments' AND column_name = 'store_id'`
      },
      {
        name: 'Add store_id to appointments',
        sql: `ALTER TABLE public.appointments
              ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE`,
        skipIfError: true
      },
      {
        name: 'Add missing columns to appointments',
        sql: `DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'vehicle_make') THEN
            ALTER TABLE public.appointments ADD COLUMN vehicle_make VARCHAR(100);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'vehicle_model') THEN
            ALTER TABLE public.appointments ADD COLUMN vehicle_model VARCHAR(100);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'vehicle_year') THEN
            ALTER TABLE public.appointments ADD COLUMN vehicle_year INTEGER;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'preferred_date') THEN
            ALTER TABLE public.appointments ADD COLUMN preferred_date DATE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'preferred_time') THEN
            ALTER TABLE public.appointments ADD COLUMN preferred_time VARCHAR(5);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'customer_name') THEN
            ALTER TABLE public.appointments ADD COLUMN customer_name VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'customer_email') THEN
            ALTER TABLE public.appointments ADD COLUMN customer_email VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'customer_phone') THEN
            ALTER TABLE public.appointments ADD COLUMN customer_phone VARCHAR(50);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'notes') THEN
            ALTER TABLE public.appointments ADD COLUMN notes TEXT;
          END IF;
        END $$;`
      },
      {
        name: 'Enable RLS on stores',
        sql: `ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY`,
        skipIfError: true
      },
      {
        name: 'Create policy for viewing stores',
        sql: `DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;
              CREATE POLICY "Anyone can view active stores" ON public.stores
              FOR SELECT USING (active = true)`,
        skipIfError: true
      },
      {
        name: 'Insert sample stores',
        sql: `INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
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
              ON CONFLICT DO NOTHING`
      }
    ];

    for (const command of commands) {
      try {
        console.log(`📍 ${command.name}...`);
        const result = await client.query(command.sql);

        if (command.name === 'Check if store_id exists in appointments') {
          console.log(`   ℹ️  Column exists: ${result.rows.length > 0}`);
        } else {
          console.log(`   ✅ Success`);
        }
      } catch (err) {
        if (command.skipIfError) {
          console.log(`   ⚠️  Skipped: ${err.message.split('\n')[0]}`);
        } else {
          console.log(`   ❌ Error: ${err.message.split('\n')[0]}`);
        }
      }
    }

    // Verificar que las stores se crearon
    console.log('\n📊 Verifying stores...');
    const result = await client.query('SELECT id, name, city, is_main FROM public.stores ORDER BY is_main DESC, name');
    console.log(`✅ Found ${result.rows.length} stores:`);
    result.rows.forEach(store => {
      console.log(`   ${store.is_main ? '⭐' : '•'} ${store.name} (${store.city})`);
    });

    console.log('\n🎉 Database setup complete!');
    console.log('📍 The appointments page should now work correctly');
    console.log('🔗 Test it at: http://localhost:6001/appointments');

  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.log('\n📝 Possible issues:');
    console.log('   - Check if the password is correct');
    console.log('   - Verify the database is accessible');
    console.log('   - Make sure the project is active in Supabase');
  } finally {
    await client.end();
    console.log('\n🔚 Connection closed');
  }
}

executeSQL();