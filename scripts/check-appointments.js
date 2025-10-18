const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAppointments() {
  console.log('🔍 Checking appointments in database...\n');

  try {
    // Get all appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('❌ Error querying appointments:', error.message);
      return;
    }

    console.log(`📊 Found ${appointments.length} recent appointments:\n`);

    if (appointments.length === 0) {
      console.log('   No appointments found in database');
      return;
    }

    // Display appointments
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. Appointment ID: ${apt.id}`);
      console.log(`   Customer: ${apt.customer_name || 'N/A'}`);
      console.log(`   Email: ${apt.customer_email || 'N/A'}`);
      console.log(`   Phone: ${apt.customer_phone || 'N/A'}`);
      console.log(`   Service: ${apt.service || 'N/A'}`);
      console.log(`   Date: ${apt.preferred_date || apt.appointment_date || 'N/A'}`);
      console.log(`   Time: ${apt.preferred_time || apt.appointment_time || 'N/A'}`);
      console.log(`   Status: ${apt.status || 'N/A'}`);
      console.log(`   Created: ${apt.created_at}`);
      console.log(`   Store ID: ${apt.store_id || 'N/A'}`);
      console.log(`   Vehicle: ${apt.vehicle_make || ''} ${apt.vehicle_model || ''} ${apt.vehicle_year || ''}`);
      console.log('   ---');
    });

    // Check for test appointments
    console.log('\n🧪 Looking for test appointments...');
    const { data: testApts, error: testError } = await supabase
      .from('appointments')
      .select('*')
      .like('customer_email', 'test%@example.com');

    if (!testError && testApts.length > 0) {
      console.log(`Found ${testApts.length} test appointments`);

      // Clean up old test appointments
      const oldTestApts = testApts.filter(apt => {
        const created = new Date(apt.created_at);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return created < hourAgo;
      });

      if (oldTestApts.length > 0) {
        console.log(`\n🧹 Cleaning up ${oldTestApts.length} old test appointments...`);
        for (const apt of oldTestApts) {
          const { error: deleteError } = await supabase
            .from('appointments')
            .delete()
            .eq('id', apt.id);

          if (!deleteError) {
            console.log(`   ✅ Deleted: ${apt.customer_email}`);
          }
        }
      }
    }

    // Check database structure
    console.log('\n📋 Checking table structure...');
    const { data: sampleApt } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (sampleApt && sampleApt.length > 0) {
      const columns = Object.keys(sampleApt[0]);
      console.log('Available columns:', columns.join(', '));

      // Check for required columns
      const requiredColumns = ['customer_name', 'customer_email', 'customer_phone', 'service', 'status', 'store_id'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));

      if (missingColumns.length > 0) {
        console.log('⚠️ Missing columns:', missingColumns.join(', '));
      } else {
        console.log('✅ All required columns present');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAppointments();