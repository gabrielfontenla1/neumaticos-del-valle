const https = require('https');
require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'oyiwyzmaxgnzyhmmkstr';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// SQL to create the stores table
const createTableSQL = `
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
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT
  USING (active = true);

INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
VALUES
  ('Sucursal Central', 'Av. San Martín 1234', 'Buenos Aires', '011-4444-5555', '5491144445555', 'central@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, true, true),
  ('Sucursal Norte', 'Av. Maipú 567', 'Vicente López', '011-4444-6666', '5491144446666', 'norte@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, false, true),
  ('Sucursal Sur', 'Av. Mitre 890', 'Avellaneda', '011-4444-7777', '5491144447777', 'sur@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, false, true)
ON CONFLICT DO NOTHING;
`;

// Try to execute raw SQL through management API
async function executeSQL() {
  console.log('🚀 Attempting to create tables using Supabase Management API...\n');

  const options = {
    hostname: `${PROJECT_REF}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  };

  const postData = JSON.stringify({
    query: createTableSQL
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log('✅ Tables created successfully!');
          resolve(true);
        } else {
          console.log(`❌ API returned status ${res.statusCode}: ${data}`);
          reject(new Error(data));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Alternative: Try to access pg_catalog to create tables
async function alternativeMethod() {
  console.log('\n🔄 Trying alternative method...\n');

  // This is the last resort - we'll try to use the service role key
  // to bypass RLS and create the table
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_KEY,
    {
      auth: { persistSession: false },
      db: { schema: 'public' }
    }
  );

  try {
    // First, check if table exists in information_schema
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'stores');

    if (tableError) {
      console.log('Cannot access information_schema:', tableError.message);
    } else if (tables && tables.length === 0) {
      console.log('Table does not exist in information_schema');
    }

    // Try to insert data anyway - if table exists, it will work
    console.log('🔄 Attempting to insert sample data...');

    const { data, error } = await supabase
      .from('stores')
      .insert([
        {
          name: 'Sucursal Central',
          address: 'Av. San Martín 1234',
          city: 'Buenos Aires',
          phone: '011-4444-5555',
          whatsapp: '5491144445555',
          email: 'central@neumaticosdelValle.com',
          opening_hours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '13:00' },
            sunday: { closed: true }
          },
          is_main: true,
          active: true
        }
      ])
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);

      console.log('\n📋 CONCLUSIÓN: La tabla "stores" NO existe en Supabase.\n');
      console.log('🔧 SOLUCIÓN REQUERIDA:');
      console.log('   Como no se puede crear la tabla programáticamente, necesitas:');
      console.log('   1. Ir a: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor');
      console.log('   2. Ejecutar el SQL del archivo: supabase/migrations/create_stores_table.sql');
      console.log('\n   Esto es una limitación de seguridad de Supabase por diseño.');
      return false;
    }

    console.log('✅ Data inserted successfully!', data);
    return true;

  } catch (err) {
    console.error('❌ Error:', err);
    return false;
  }
}

// Main execution
async function main() {
  try {
    await executeSQL();
  } catch (error) {
    console.log('First method failed, trying alternative...');
    const success = await alternativeMethod();

    if (!success) {
      console.log('\n⚠️  ACCIÓN MANUAL REQUERIDA');
      console.log('   No se puede crear la tabla automáticamente.');
      console.log('   Por favor ejecuta el SQL manualmente en Supabase Dashboard.');
    }
  }
}

main();