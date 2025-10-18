const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up database tables...\n');

  try {
    // Check if stores table exists
    console.log('📍 Checking for stores table...');
    const { data: existingStores, error: storesCheckError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (storesCheckError?.code === 'PGRST204' || storesCheckError?.message?.includes('relation "public.stores" does not exist')) {
      console.log('❌ Stores table does not exist');
      console.log('ℹ️  Please create the stores table manually in Supabase Dashboard');
      console.log('\n📋 SQL Script location: supabase/migrations/create_stores_table.sql');
      console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor');
      console.log('\nSteps:');
      console.log('1. Go to the SQL Editor in Supabase Dashboard');
      console.log('2. Copy the contents of supabase/migrations/create_stores_table.sql');
      console.log('3. Paste and execute the SQL');
      console.log('4. Run this script again to verify');
      return;
    }

    console.log('✅ Stores table exists');

    // Check if there are stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*');

    if (storesError) {
      console.error('❌ Error fetching stores:', storesError);
      return;
    }

    console.log(`✅ Found ${stores.length} store(s) in database`);

    if (stores.length === 0) {
      console.log('\n📍 No stores found. Creating sample stores...');

      const sampleStores = [
        {
          name: 'Sucursal Central',
          address: 'Av. San Martín 1234',
          city: 'Buenos Aires',
          phone: '011-4444-5555',
          whatsapp: '5491144445555',
          email: 'central@neumaticosdelv alle.com',
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
          email: 'norte@neumaticosdelv alle.com',
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
          email: 'sur@neumaticosdelv alle.com',
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

      const { data: insertedStores, error: insertError } = await supabase
        .from('stores')
        .insert(sampleStores)
        .select();

      if (insertError) {
        console.error('❌ Error inserting stores:', insertError);
        return;
      }

      console.log(`✅ Created ${insertedStores.length} sample stores`);
    }

    // Check appointments table
    console.log('\n📍 Checking appointments table...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);

    if (appointmentsError?.code === 'PGRST204' || appointmentsError?.message?.includes('relation "public.appointments" does not exist')) {
      console.log('❌ Appointments table does not exist');
      console.log('ℹ️  Please create the appointments table using the SQL script');
    } else {
      console.log('✅ Appointments table exists');
    }

    console.log('\n🎉 Database setup complete!');
    console.log('You can now test the appointments flow.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupDatabase();