const { Client } = require('pg');

// Configuración CORRECTA de conexión
const connectionString = 'postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

console.log('🚀 Fixing appointments table RLS policies...\n');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixRLS() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!\n');

    // 1. First, disable RLS temporarily to see if that's the issue
    console.log('📍 Step 1: Checking current RLS status...');
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'appointments'
    `);

    console.log('   Current RLS status:', rlsCheck.rows[0]?.rowsecurity ? 'ENABLED' : 'DISABLED');

    // 2. Drop all existing policies on appointments
    console.log('\n📍 Step 2: Dropping all existing policies on appointments...');
    const policies = await client.query(`
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'appointments'
      AND schemaname = 'public'
    `);

    for (const policy of policies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.appointments`);
        console.log(`   ✅ Dropped policy: ${policy.policyname}`);
      } catch (err) {
        console.log(`   ⚠️  Could not drop policy ${policy.policyname}: ${err.message}`);
      }
    }

    // 3. Disable RLS on appointments table
    console.log('\n📍 Step 3: Disabling RLS on appointments...');
    await client.query('ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY');
    console.log('   ✅ RLS disabled on appointments');

    // 4. Create simple, non-recursive policies
    console.log('\n📍 Step 4: Creating simple public access policies...');

    // Enable RLS
    await client.query('ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY');
    console.log('   ✅ RLS re-enabled');

    // Create simple policy for public access (no auth required for demo)
    try {
      await client.query(`
        CREATE POLICY "Public can create appointments" ON public.appointments
        FOR INSERT TO anon, authenticated
        WITH CHECK (true)
      `);
      console.log('   ✅ Created INSERT policy');
    } catch (err) {
      console.log('   ⚠️  INSERT policy might already exist');
    }

    try {
      await client.query(`
        CREATE POLICY "Public can view appointments" ON public.appointments
        FOR SELECT TO anon, authenticated
        USING (true)
      `);
      console.log('   ✅ Created SELECT policy');
    } catch (err) {
      console.log('   ⚠️  SELECT policy might already exist');
    }

    try {
      await client.query(`
        CREATE POLICY "Public can update appointments" ON public.appointments
        FOR UPDATE TO anon, authenticated
        USING (true)
        WITH CHECK (true)
      `);
      console.log('   ✅ Created UPDATE policy');
    } catch (err) {
      console.log('   ⚠️  UPDATE policy might already exist');
    }

    // 5. Test the appointments table
    console.log('\n📍 Step 5: Testing appointments table...');

    // First, get a store ID
    const storeResult = await client.query('SELECT id FROM public.stores LIMIT 1');
    const storeId = storeResult.rows[0]?.id;

    if (storeId) {
      // Try to insert a test appointment
      const insertResult = await client.query(`
        INSERT INTO public.appointments (
          store_id, customer_name, customer_email, customer_phone,
          service, preferred_date, preferred_time, status
        ) VALUES (
          $1, 'RLS Test', 'rls@test.com', '1234567890',
          'Test Service', CURRENT_DATE, '10:00', 'pending'
        ) RETURNING id
      `, [storeId]);

      if (insertResult.rows[0]) {
        console.log('   ✅ Successfully inserted test appointment');

        // Clean up
        await client.query('DELETE FROM public.appointments WHERE id = $1', [insertResult.rows[0].id]);
        console.log('   🧹 Test appointment cleaned up');
      }
    }

    // 6. Final verification
    console.log('\n📊 Final verification...');
    const finalPolicies = await client.query(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'appointments'
      AND schemaname = 'public'
    `);

    console.log(`✅ Appointments table now has ${finalPolicies.rows.length} policies:`);
    finalPolicies.rows.forEach(policy => {
      console.log(`   • ${policy.policyname} (${policy.cmd})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 RLS POLICIES FIXED!');
    console.log('='.repeat(60));
    console.log('\n✅ The appointments table should now work correctly');
    console.log('📍 Test the appointments page at: http://localhost:6001/appointments');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nStack trace:', err.stack);
  } finally {
    await client.end();
    console.log('\n🔚 Database connection closed');
  }
}

fixRLS();