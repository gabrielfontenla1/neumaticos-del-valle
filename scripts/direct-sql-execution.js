require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQLDirectly() {
  console.log('🚀 Attempting to execute SQL directly...\n');

  const sqlQuery = `
    -- Create stores table
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

    -- Insert sample data
    INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
    SELECT * FROM (VALUES
      ('Sucursal Central', 'Av. San Martín 1234', 'Buenos Aires', '011-4444-5555', '5491144445555', 'central@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, true, true),
      ('Sucursal Norte', 'Av. Maipú 567', 'Vicente López', '011-4444-6666', '5491144446666', 'norte@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, false, true),
      ('Sucursal Sur', 'Av. Mitre 890', 'Avellaneda', '011-4444-7777', '5491144447777', 'sur@neumaticosdelValle.com', '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb, false, true)
    ) AS v(name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
    WHERE NOT EXISTS (SELECT 1 FROM public.stores LIMIT 1);
  `;

  try {
    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sqlQuery })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Direct SQL execution failed:', error);

      console.log('\n📝 Unfortunately, Supabase does not allow DDL operations (CREATE TABLE) through the API.');
      console.log('   This is a security feature to prevent unauthorized database structure changes.\n');

      console.log('🔧 YOU MUST CREATE THE TABLE MANUALLY:\n');
      console.log('   1. Open Supabase Dashboard:');
      console.log('      https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor\n');
      console.log('   2. Copy ALL the SQL from this file:');
      console.log('      supabase/migrations/create_stores_table.sql\n');
      console.log('   3. Paste it in the SQL Editor and click "Run"\n');
      console.log('   4. After running, test at: http://localhost:6001/appointments\n');

      console.log('❓ Why can\'t I do this programmatically?');
      console.log('   - Supabase restricts DDL operations (CREATE, ALTER, DROP) to the dashboard');
      console.log('   - This prevents accidental or malicious database structure changes');
      console.log('   - Only DML operations (INSERT, UPDATE, DELETE, SELECT) are allowed via API\n');

      return;
    }

    console.log('✅ SQL executed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);

    console.log('\n📋 MANUAL SETUP REQUIRED:');
    console.log('   Since automated table creation is not possible, please:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor');
    console.log('   2. Run the SQL from: supabase/migrations/create_stores_table.sql');
  }
}

executeSQLDirectly();