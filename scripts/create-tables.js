const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('🚀 Creating database tables...\n');

  try {
    // First, let's try to insert sample data - if the table doesn't exist, we'll get an error
    console.log('📍 Attempting to create/populate stores table...');

    const sampleStores = [
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
      },
      {
        name: 'Sucursal Norte',
        address: 'Av. Maipú 567',
        city: 'Vicente López',
        phone: '011-4444-6666',
        whatsapp: '5491144446666',
        email: 'norte@neumaticosdelValle.com',
        opening_hours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { closed: true }
        },
        is_main: false,
        active: true
      },
      {
        name: 'Sucursal Sur',
        address: 'Av. Mitre 890',
        city: 'Avellaneda',
        phone: '011-4444-7777',
        whatsapp: '5491144447777',
        email: 'sur@neumaticosdelValle.com',
        opening_hours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { closed: true }
        },
        is_main: false,
        active: true
      }
    ];

    // Try to check if stores already exist
    const { data: existingStores, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('relation "public.stores" does not exist')) {
      console.log('❌ The stores table does not exist.');
      console.log('\n⚠️  IMPORTANT: Table creation requires database admin access.');
      console.log('\n📝 Unfortunately, Supabase client libraries cannot create tables directly.');
      console.log('   This is a security feature of Supabase.\n');

      console.log('🔧 SOLUTION: You need to run the SQL in one of these ways:\n');
      console.log('   Option 1: Supabase Dashboard (Easiest)');
      console.log('   ----------------------------------------');
      console.log('   1. Open: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor');
      console.log('   2. Copy the SQL from: supabase/migrations/create_stores_table.sql');
      console.log('   3. Paste and run in the SQL Editor\n');

      console.log('   Option 2: Using Supabase CLI (if installed)');
      console.log('   -------------------------------------------');
      console.log('   1. Install Supabase CLI: npm install -g supabase');
      console.log('   2. Link project: npx supabase link --project-ref oyiwyzmaxgnzyhmmkstr');
      console.log('   3. Push migration: npx supabase db push\n');

      // Let's try using RPC to create the table
      console.log('🔄 Attempting alternative method using RPC...');

      // Try to execute raw SQL through RPC (this might work if you have the right permissions)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
        sql: `
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
        `
      }).single();

      if (rpcError) {
        console.log('❌ RPC method also failed:', rpcError.message);
        console.log('\n⚠️  You must create the table manually using the Supabase Dashboard.');
        return;
      }
    }

    if (existingStores !== null) {
      console.log('✅ Stores table exists. Checking for data...');

      const { data: stores, error: fetchError } = await supabase
        .from('stores')
        .select('*');

      if (fetchError) {
        console.error('❌ Error fetching stores:', fetchError);
        return;
      }

      if (stores && stores.length > 0) {
        console.log(`✅ Found ${stores.length} existing stores. No need to add more.`);
        console.log('\n🎉 Database is ready! The appointments system should work now.');
        console.log('📍 Test it at: http://localhost:6001/appointments');
        return;
      }
    }

    // If we get here, table exists but is empty, so let's populate it
    console.log('📍 Adding sample stores...');
    const { data: insertedStores, error: insertError } = await supabase
      .from('stores')
      .insert(sampleStores)
      .select();

    if (insertError) {
      console.error('❌ Error inserting stores:', insertError);
      return;
    }

    console.log(`✅ Successfully added ${insertedStores.length} stores!`);
    console.log('\n🎉 Database setup complete!');
    console.log('📍 Test the appointments system at: http://localhost:6001/appointments');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 TIP: Make sure you have the correct Supabase credentials in .env.local');
  }
}

createTables();