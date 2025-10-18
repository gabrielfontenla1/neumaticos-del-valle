const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Necesitarás proporcionar la contraseña correcta de tu base de datos
// La URL de conexión debe tener este formato:
// postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

// Por seguridad, voy a usar variables de entorno
const DATABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'TU_PASSWORD_AQUI';
const PROJECT_REF = 'oyiwyzmaxgnzyhmmkstr';

// Probemos diferentes endpoints
const connectionStrings = [
  `postgresql://postgres.${PROJECT_REF}:${DATABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${DATABASE_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  `postgresql://postgres:${DATABASE_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
];

let connectionString = connectionStrings[0];

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeStoresSQL() {
  console.log('🚀 Connecting to PostgreSQL...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Try to execute the complete SQL file first
    try {
      const sqlContent = fs.readFileSync(
        path.join(__dirname, '..', 'supabase', 'stores_setup.sql'),
        'utf8'
      );

      console.log('📝 Executing complete SQL script...');
      await client.query(sqlContent);
      console.log('✅ All tables and data created successfully!\n');

    } catch (err) {
      console.log('⚠️  Complete execution failed, trying individual commands...\n');
      console.error('Error:', err.message);

      // If complete execution fails, try individual commands
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
          name: 'Add store_id to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE`
        },
        {
          name: 'Add vehicle_make to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS vehicle_make VARCHAR(100)`
        },
        {
          name: 'Add vehicle_model to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100)`
        },
        {
          name: 'Add vehicle_year to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS vehicle_year INTEGER`
        },
        {
          name: 'Add preferred_date to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS preferred_date DATE`
        },
        {
          name: 'Add preferred_time to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS preferred_time VARCHAR(5)`
        },
        {
          name: 'Add customer_name to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)`
        },
        {
          name: 'Add customer_email to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)`
        },
        {
          name: 'Add customer_phone to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)`
        },
        {
          name: 'Add notes to appointments',
          sql: `ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS notes TEXT`
        },
        {
          name: 'Create index on stores active',
          sql: `CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(active)`
        },
        {
          name: 'Create index on stores is_main',
          sql: `CREATE INDEX IF NOT EXISTS idx_stores_is_main ON public.stores(is_main)`
        },
        {
          name: 'Create index on appointments store_id',
          sql: `CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON public.appointments(store_id)`
        },
        {
          name: 'Enable RLS on stores',
          sql: `ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY`
        },
        {
          name: 'Enable RLS on appointments',
          sql: `ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY`
        },
        {
          name: 'Create policy for viewing stores',
          sql: `CREATE POLICY "Anyone can view active stores" ON public.stores
                FOR SELECT
                USING (active = true)`
        },
        {
          name: 'Insert Sucursal Central',
          sql: `INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
                VALUES ('Sucursal Central', 'Av. San Martín 1234', 'Buenos Aires', '011-4444-5555', '5491144445555',
                'central@neumaticosdelValle.com',
                '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
                true, true)
                ON CONFLICT (id) DO NOTHING`
        },
        {
          name: 'Insert Sucursal Norte',
          sql: `INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
                VALUES ('Sucursal Norte', 'Av. Maipú 567', 'Vicente López', '011-4444-6666', '5491144446666',
                'norte@neumaticosdelValle.com',
                '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
                false, true)
                ON CONFLICT (id) DO NOTHING`
        },
        {
          name: 'Insert Sucursal Sur',
          sql: `INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
                VALUES ('Sucursal Sur', 'Av. Mitre 890', 'Avellaneda', '011-4444-7777', '5491144447777',
                'sur@neumaticosdelValle.com',
                '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
                false, true)
                ON CONFLICT (id) DO NOTHING`
        }
      ];

      for (const command of commands) {
        try {
          console.log(`📍 ${command.name}...`);
          await client.query(command.sql);
          console.log(`   ✅ Success`);
        } catch (cmdErr) {
          console.log(`   ⚠️ ${cmdErr.message}`);
        }
      }
    }

    // Verify the stores were created
    console.log('\n📊 Verifying stores...');
    const result = await client.query('SELECT id, name, city FROM public.stores');
    console.log(`✅ Found ${result.rows.length} stores:`);
    result.rows.forEach(store => {
      console.log(`   - ${store.name} (${store.city})`);
    });

    console.log('\n🎉 Database setup complete!');
    console.log('📍 Test the appointments system at: http://localhost:6001/appointments');

  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.log('\n⚠️  Make sure to set the database password:');
    console.log('   export SUPABASE_DB_PASSWORD="your-database-password"');
    console.log('   node scripts/execute-stores-sql.js');
    console.log('\nYou can find your database password in:');
    console.log('   Supabase Dashboard > Settings > Database');
  } finally {
    await client.end();
    console.log('\n🔚 Connection closed');
  }
}

// Check if password is provided
if (DATABASE_PASSWORD === 'TU_PASSWORD_AQUI') {
  console.log('⚠️  Database password not set!');
  console.log('\n📝 Please set your database password:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/settings/database');
  console.log('   2. Find your database password');
  console.log('   3. Run: export SUPABASE_DB_PASSWORD="your-password"');
  console.log('   4. Run: node scripts/execute-stores-sql.js');
  process.exit(1);
}

executeStoresSQL();