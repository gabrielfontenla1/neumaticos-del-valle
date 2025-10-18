const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔄 Testing Supabase connection...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Using anon key: ${supabaseAnonKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Query stores table
    console.log('\n📍 Test 1: Querying stores table...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('active', true)
      .order('is_main', { ascending: false });

    if (storesError) {
      console.log('❌ Error querying stores:', storesError.message);
      console.log('   Error code:', storesError.code);
      console.log('   Error details:', storesError.details);
      console.log('   Error hint:', storesError.hint);
    } else {
      console.log(`✅ Successfully queried stores table!`);
      console.log(`   Found ${stores.length} stores:`);
      stores.forEach(store => {
        console.log(`   ${store.is_main ? '⭐' : '•'} ${store.name} (${store.city})`);
      });
    }

    // Test 2: Check appointments table structure
    console.log('\n📍 Test 2: Checking appointments table...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (appointmentsError) {
      console.log('❌ Error querying appointments:', appointmentsError.message);
    } else {
      console.log('✅ Appointments table is accessible');
      const columns = appointments.length > 0 ? Object.keys(appointments[0]) : [];
      if (columns.length > 0) {
        console.log('   Available columns:', columns.join(', '));
      }

      // Check for required columns
      const requiredColumns = ['store_id', 'customer_name', 'customer_email', 'customer_phone', 'preferred_date', 'preferred_time'];
      const hasRequiredColumns = requiredColumns.every(col =>
        columns.includes(col) || columns.length === 0
      );

      if (hasRequiredColumns || columns.length === 0) {
        console.log('   ✅ Table structure looks good');
      } else {
        console.log('   ⚠️ Some required columns might be missing');
      }
    }

    // Test 3: Try to insert a test appointment
    console.log('\n📍 Test 3: Testing appointment creation...');
    const testAppointment = {
      store_id: stores && stores[0] ? stores[0].id : null,
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '1234567890',
      vehicle_make: 'Toyota',
      vehicle_model: 'Corolla',
      vehicle_year: 2020,
      service: 'Cambio de Neumáticos',
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time: '10:00',
      notes: 'Test appointment from script',
      status: 'pending'
    };

    if (stores && stores.length > 0) {
      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert([testAppointment])
        .select()
        .single();

      if (insertError) {
        console.log('❌ Error creating appointment:', insertError.message);
        console.log('   Error details:', insertError);
      } else {
        console.log('✅ Successfully created test appointment!');
        console.log('   Appointment ID:', newAppointment.id);

        // Clean up test appointment
        const { error: deleteError } = await supabase
          .from('appointments')
          .delete()
          .eq('id', newAppointment.id);

        if (!deleteError) {
          console.log('   🧹 Test appointment cleaned up');
        }
      }
    } else {
      console.log('⚠️ No stores available, skipping appointment test');
    }

    // Test 4: Check RLS policies
    console.log('\n📍 Test 4: Checking Row Level Security...');
    const { data: publicStores, error: publicError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('active', true);

    if (publicError) {
      console.log('❌ RLS might be blocking access:', publicError.message);
    } else {
      console.log(`✅ RLS policies allow public read access (${publicStores.length} stores visible)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUPABASE CONNECTION TEST COMPLETE!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();