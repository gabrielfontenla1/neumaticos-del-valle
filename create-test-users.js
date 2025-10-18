const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🚀 Starting user creation...\n');

  // Test users data
  const users = [
    {
      email: 'admin@neumaticosdelvalle.com',
      password: 'Admin123!',
      full_name: 'Administrador Sistema',
      phone: '(0383) 443-0000',
      role: 'admin',
      branch_id: null // Admin can access all branches
    },
    {
      email: 'vendedor1@neumaticosdelvalle.com',
      password: 'Vendedor123!',
      full_name: 'Juan Vendedor',
      phone: '(0383) 443-0001',
      role: 'vendedor',
      branch_name: 'Neumáticos del Valle Catamarca Centro'
    },
    {
      email: 'vendedor2@neumaticosdelvalle.com',
      password: 'Vendedor123!',
      full_name: 'María Vendedora',
      phone: '(0385) 427-0001',
      role: 'vendedor',
      branch_name: 'Neumáticos del Valle La Banda'
    },
    {
      email: 'cliente1@gmail.com',
      password: 'Cliente123!',
      full_name: 'Pedro Cliente',
      phone: '(0383) 155-1234',
      role: 'cliente',
      branch_id: null
    },
    {
      email: 'cliente2@gmail.com',
      password: 'Cliente123!',
      full_name: 'Ana Cliente',
      phone: '(0383) 155-5678',
      role: 'cliente',
      branch_id: null
    }
  ];

  // Get branches for vendedores
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name');

  console.log('📍 Branches found:', branches?.length || 0, '\n');

  for (const userData of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      });

      if (authError) {
        if (authError.message?.includes('already been registered')) {
          console.log(`⚠️  User ${userData.email} already exists`);

          // Get existing user
          const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.find(u => u.email === userData.email);

          if (existingUser) {
            // Update profile with role
            let branch_id = null;
            if (userData.branch_name && branches) {
              const branch = branches.find(b => b.name === userData.branch_name);
              branch_id = branch?.id || null;
            }

            await supabase
              .from('profiles')
              .upsert({
                id: existingUser.id,
                email: userData.email,
                full_name: userData.full_name,
                phone: userData.phone,
                role: userData.role,
                branch_id: branch_id
              });

            console.log(`✅ Updated profile for ${userData.email} (${userData.role})`);
          }
        } else {
          console.log(`❌ Error creating ${userData.email}:`, authError.message);
        }
        continue;
      }

      if (authData.user) {
        // Update profile with role and branch
        let branch_id = null;
        if (userData.branch_name && branches) {
          const branch = branches.find(b => b.name === userData.branch_name);
          branch_id = branch?.id || null;
        }

        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role,
            branch_id: branch_id
          });

        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      }
    } catch (error) {
      console.error(`❌ Error with ${userData.email}:`, error.message);
    }
  }

  console.log('\n🎉 User creation process completed!');
  console.log('\n📝 You can now login with these credentials:');
  console.log('----------------------------------------');
  users.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
  console.log('----------------------------------------\n');

  // Create sample vouchers for testing
  console.log('📋 Creating sample vouchers...\n');

  // Get a vendedor to create vouchers
  const { data: vendedorProfile } = await supabase
    .from('profiles')
    .select('id, branch_id')
    .eq('email', 'vendedor1@neumaticosdelvalle.com')
    .single();

  if (vendedorProfile) {
    // Get some products for vouchers
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(3);

    const sampleVouchers = [
      {
        code: 'PROMO2024',
        customer_name: 'Pedro Cliente',
        customer_email: 'cliente1@gmail.com',
        customer_phone: '(0383) 155-1234',
        amount: 5000,
        discount_percentage: 10,
        product_id: products?.[0]?.id || null,
        status: 'active',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_by: vendedorProfile.id,
        branch_id: vendedorProfile.branch_id,
        notes: 'Descuento por cliente frecuente'
      },
      {
        code: 'DESC15OFF',
        customer_name: 'Ana Cliente',
        customer_email: 'cliente2@gmail.com',
        customer_phone: '(0383) 155-5678',
        amount: 7500,
        discount_percentage: 15,
        product_id: products?.[1]?.id || null,
        status: 'active',
        valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
        created_by: vendedorProfile.id,
        branch_id: vendedorProfile.branch_id,
        notes: 'Promoción especial'
      }
    ];

    for (const voucher of sampleVouchers) {
      try {
        const { error } = await supabase
          .from('vouchers')
          .insert(voucher);

        if (error) {
          console.log(`⚠️ Voucher ${voucher.code}: ${error.message}`);
        } else {
          console.log(`✅ Created voucher: ${voucher.code}`);
        }
      } catch (error) {
        console.log(`❌ Error creating voucher ${voucher.code}:`, error.message);
      }
    }
  }

  console.log('\n✨ All done! The system is ready to use.');
  console.log('\n🔗 Access the application at:');
  console.log('   - Login: http://localhost:6001/auth/login');
  console.log('   - Products: http://localhost:6001/products');
  console.log('   - Appointments: http://localhost:6001/appointments (requires login)');
  console.log('   - Dashboard: http://localhost:6001/dashboard (vendedor/admin only)');
}

createTestUsers();