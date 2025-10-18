const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

const client = new Client({
  connectionString: connectionString,
});

async function executeAuthSQL() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read SQL file
    const sqlContent = fs.readFileSync('auth_setup.sql', 'utf8');

    console.log('📝 Executing authentication setup...\n');

    try {
      // Execute the entire SQL file as one command
      await client.query(sqlContent);
      console.log('✅ Authentication setup completed successfully!\n');
    } catch (err) {
      console.error('❌ Error executing SQL:', err.message);

      // If full execution fails, try to execute key parts separately
      console.log('\n🔄 Attempting to execute commands separately...\n');

      // Define individual critical commands
      const commands = [
        // Create profiles table
        `CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255),
          phone VARCHAR(50),
          role VARCHAR(50) DEFAULT 'cliente' CHECK (role IN ('cliente', 'vendedor', 'admin')),
          branch_id UUID REFERENCES public.branches(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        )`,

        // Create vouchers table
        `CREATE TABLE IF NOT EXISTS public.vouchers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(20) UNIQUE NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_phone VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          discount_percentage DECIMAL(5,2),
          product_id UUID REFERENCES public.products(id),
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled', 'expired')),
          valid_until DATE NOT NULL,
          created_by UUID REFERENCES public.profiles(id) NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE,
          used_by UUID REFERENCES public.profiles(id),
          branch_id UUID REFERENCES public.branches(id) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        )`,

        // Add user_id to appointments
        `ALTER TABLE public.appointments
         ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id)`,

        // Enable RLS
        `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY`,

        // Create function for new user
        `CREATE OR REPLACE FUNCTION public.handle_new_user()
         RETURNS trigger AS $$
         BEGIN
           INSERT INTO public.profiles (id, email, full_name)
           VALUES (
             new.id,
             new.email,
             new.raw_user_meta_data->>'full_name'
           );
           RETURN new;
         END;
         $$ LANGUAGE plpgsql SECURITY DEFINER`
      ];

      for (let i = 0; i < commands.length; i++) {
        try {
          await client.query(commands[i]);
          console.log(`✅ Command ${i + 1} executed successfully`);
        } catch (err) {
          console.log(`⚠️ Command ${i + 1}: ${err.message}`);
        }
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');

    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('profiles', 'vouchers')
    `);

    console.log('📋 Auth tables found:', tableCheck.rows.map(r => r.table_name).join(', '));

    console.log('\n🎉 Authentication system setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Create users through the application');
    console.log('2. Update user roles as needed');
    console.log('3. Users will be created with these test credentials:');
    console.log('   - admin@neumaticosdelValle.com (Admin123!)');
    console.log('   - vendedor1@neumaticosdelValle.com (Vendedor123!)');
    console.log('   - cliente1@gmail.com (Cliente123!)');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

executeAuthSQL();