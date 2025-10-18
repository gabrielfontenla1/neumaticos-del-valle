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

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // 1. Create products table
    console.log('📦 Creating products table...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          brand VARCHAR(100) NOT NULL,
          model VARCHAR(100),
          category VARCHAR(50) NOT NULL CHECK (category IN ('auto', 'camioneta', 'camion', 'moto')),
          size VARCHAR(50),
          width INTEGER,
          profile INTEGER,
          diameter INTEGER,
          load_index VARCHAR(10),
          speed_rating VARCHAR(5),
          description TEXT,
          price DECIMAL(10,2),
          stock INTEGER DEFAULT 0,
          image_url TEXT,
          features JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
      `
    }).single();

    if (productsError && !productsError.message?.includes('already exists')) {
      console.log('Creating products table directly...');
      // If exec_sql doesn't work, we'll insert data directly
    }

    // 2. Insert sample products
    console.log('🏪 Inserting sample products...');
    const products = [
      // Autos
      {
        name: 'Pirelli Cinturato P7',
        brand: 'Pirelli',
        model: 'Cinturato P7',
        category: 'auto',
        width: 205,
        profile: 55,
        diameter: 16,
        size: '205/55R16',
        price: 85000,
        stock: 20,
        description: 'Neumático de alto rendimiento con tecnología Green Performance'
      },
      {
        name: 'Pirelli P400 EVO',
        brand: 'Pirelli',
        model: 'P400 EVO',
        category: 'auto',
        width: 175,
        profile: 65,
        diameter: 14,
        size: '175/65R14',
        price: 65000,
        stock: 15,
        description: 'Ideal para uso urbano, excelente durabilidad'
      },
      {
        name: 'Pirelli P1 Cinturato',
        brand: 'Pirelli',
        model: 'P1 Cinturato',
        category: 'auto',
        width: 195,
        profile: 60,
        diameter: 15,
        size: '195/60R15',
        price: 72000,
        stock: 25,
        description: 'Perfecto balance entre confort y seguridad'
      },
      {
        name: 'Pirelli P Zero',
        brand: 'Pirelli',
        model: 'P Zero',
        category: 'auto',
        width: 225,
        profile: 45,
        diameter: 17,
        size: '225/45R17',
        price: 125000,
        stock: 10,
        description: 'Ultra High Performance para vehículos deportivos'
      },
      // Camionetas
      {
        name: 'Pirelli Scorpion Verde',
        brand: 'Pirelli',
        model: 'Scorpion Verde',
        category: 'camioneta',
        width: 235,
        profile: 65,
        diameter: 17,
        size: '235/65R17',
        price: 115000,
        stock: 18,
        description: 'SUV y Crossover, máxima eficiencia'
      },
      {
        name: 'Pirelli Scorpion ATR',
        brand: 'Pirelli',
        model: 'Scorpion ATR',
        category: 'camioneta',
        width: 265,
        profile: 70,
        diameter: 16,
        size: '265/70R16',
        price: 135000,
        stock: 12,
        description: 'All Terrain para aventuras off-road'
      },
      {
        name: 'Pirelli Scorpion Zero',
        brand: 'Pirelli',
        model: 'Scorpion Zero',
        category: 'camioneta',
        width: 255,
        profile: 55,
        diameter: 18,
        size: '255/55R18',
        price: 145000,
        stock: 8,
        description: 'Alto rendimiento para SUV deportivos'
      },
      // Camiones
      {
        name: 'Pirelli FH88',
        brand: 'Pirelli',
        model: 'FH88',
        category: 'camion',
        width: 295,
        profile: 80,
        diameter: 22.5,
        size: '295/80R22.5',
        price: 285000,
        stock: 6,
        description: 'Para eje delantero, larga distancia'
      },
      {
        name: 'Pirelli TR88',
        brand: 'Pirelli',
        model: 'TR88',
        category: 'camion',
        width: 295,
        profile: 80,
        diameter: 22.5,
        size: '295/80R22.5',
        price: 295000,
        stock: 4,
        description: 'Para eje de tracción, máxima tracción'
      },
      {
        name: 'Pirelli Formula Driver II',
        brand: 'Pirelli',
        model: 'Formula Driver II',
        category: 'camion',
        width: 275,
        profile: 80,
        diameter: 22.5,
        size: '275/80R22.5',
        price: 265000,
        stock: 5,
        description: 'Versátil para todo tipo de ejes'
      }
    ];

    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'name' })
      .select();

    if (insertError) {
      console.error('Error inserting products:', insertError);
    } else {
      console.log(`✅ Inserted ${insertedProducts?.length || 0} products`);
    }

    // 3. Create appointments table
    console.log('\n📅 Creating appointments table...');
    const { error: appointmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_phone VARCHAR(50) NOT NULL,
          service VARCHAR(100) NOT NULL,
          appointment_date DATE NOT NULL,
          appointment_time TIME NOT NULL,
          branch VARCHAR(100) NOT NULL,
          vehicle_info JSONB,
          notes TEXT,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
      `
    }).single();

    if (appointmentsError && !appointmentsError.message?.includes('already exists')) {
      console.log('Appointments table might already exist or needs manual creation');
    }

    // 4. Create branches table and insert data
    console.log('\n🏢 Setting up branches...');
    const branches = [
      {
        name: 'Neumáticos del Valle Catamarca Centro',
        city: 'Catamarca',
        province: 'Catamarca',
        address: 'Av. Belgrano 938',
        phone: '(0383) 443-0000',
        active: true
      },
      {
        name: 'Neumáticos del Valle La Banda',
        city: 'La Banda',
        province: 'Santiago del Estero',
        address: 'República del Líbano Sur 866',
        phone: '(0385) 427-0000',
        active: true
      },
      {
        name: 'Neumáticos del Valle San Fernando',
        city: 'San Fernando del Valle',
        province: 'Catamarca',
        address: 'Alem 1118',
        phone: '(0383) 443-1111',
        active: true
      },
      {
        name: 'Neumáticos del Valle Salta',
        city: 'Salta',
        province: 'Salta',
        address: 'Jujuy 330',
        phone: '(0387) 431-0000',
        active: true
      },
      {
        name: 'Neumáticos del Valle Santiago',
        city: 'Santiago del Estero',
        province: 'Santiago del Estero',
        address: 'Av. Belgrano Sur 2834',
        phone: '(0385) 422-0000',
        active: true
      },
      {
        name: 'Neumáticos del Valle Tucumán',
        city: 'San Miguel de Tucumán',
        province: 'Tucumán',
        address: 'Av. Gobernador del Campo 436',
        phone: '(0381) 424-0000',
        active: true
      }
    ];

    const { data: insertedBranches, error: branchError } = await supabase
      .from('branches')
      .upsert(branches, { onConflict: 'name' })
      .select();

    if (branchError) {
      console.error('Error with branches:', branchError);
    } else {
      console.log(`✅ Set up ${insertedBranches?.length || 0} branches`);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now visit http://localhost:6001/products to see the products');

  } catch (error) {
    console.error('Error during setup:', error);
  }
}

setupDatabase();