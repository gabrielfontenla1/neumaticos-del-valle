const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

const client = new Client({
  connectionString: connectionString,
});

async function executeSQLFile() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read SQL file
    const sqlContent = fs.readFileSync('supabase_setup.sql', 'utf8');

    console.log('📝 Executing SQL setup...\n');

    try {
      // Execute the entire SQL file as one command
      await client.query(sqlContent);
      console.log('✅ All SQL commands executed successfully!\n');
    } catch (err) {
      console.error('❌ Error executing SQL:', err.message);

      // If full execution fails, try to execute key parts separately
      console.log('\n🔄 Attempting to execute commands separately...\n');

      // Define individual critical commands
      const commands = [
        // Create products table
        `CREATE TABLE IF NOT EXISTS products (
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
        )`,

        // Create appointments table
        `CREATE TABLE IF NOT EXISTS appointments (
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
        )`,

        // Create branches table
        `CREATE TABLE IF NOT EXISTS branches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          province VARCHAR(100) NOT NULL,
          address TEXT NOT NULL,
          phone VARCHAR(50),
          email VARCHAR(255),
          hours JSONB,
          coordinates JSONB,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        )`
      ];

      for (let i = 0; i < commands.length; i++) {
        try {
          await client.query(commands[i]);
          console.log(`✅ Table ${i + 1} created successfully`);
        } catch (err) {
          console.log(`⚠️ Table ${i + 1}: ${err.message}`);
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
      AND table_name IN ('products', 'appointments', 'branches')
    `);

    console.log('📋 Tables found:', tableCheck.rows.map(r => r.table_name).join(', '));

    if (tableCheck.rows.length > 0) {
      // Try to insert sample data
      console.log('\n📦 Inserting sample data...');

      // Insert branches
      try {
        await client.query(`
          INSERT INTO branches (name, city, province, address, phone) VALUES
          ('Neumáticos del Valle Catamarca Centro', 'Catamarca', 'Catamarca', 'Av. Belgrano 938', '(0383) 443-0000'),
          ('Neumáticos del Valle La Banda', 'La Banda', 'Santiago del Estero', 'República del Líbano Sur 866', '(0385) 427-0000'),
          ('Neumáticos del Valle San Fernando', 'San Fernando del Valle', 'Catamarca', 'Alem 1118', '(0383) 443-1111'),
          ('Neumáticos del Valle Salta', 'Salta', 'Salta', 'Jujuy 330', '(0387) 431-0000'),
          ('Neumáticos del Valle Santiago', 'Santiago del Estero', 'Santiago del Estero', 'Av. Belgrano Sur 2834', '(0385) 422-0000'),
          ('Neumáticos del Valle Tucumán', 'San Miguel de Tucumán', 'Tucumán', 'Av. Gobernador del Campo 436', '(0381) 424-0000')
          ON CONFLICT DO NOTHING
        `);
        console.log('✅ Branches inserted');
      } catch (err) {
        console.log('⚠️ Branches:', err.message);
      }

      // Insert products
      try {
        await client.query(`
          INSERT INTO products (name, brand, model, category, width, profile, diameter, price, stock, description, size) VALUES
          ('Pirelli Cinturato P7', 'Pirelli', 'Cinturato P7', 'auto', 205, 55, 16, 85000, 20, 'Neumático de alto rendimiento con tecnología Green Performance', '205/55R16'),
          ('Pirelli P400 EVO', 'Pirelli', 'P400 EVO', 'auto', 175, 65, 14, 65000, 15, 'Ideal para uso urbano, excelente durabilidad', '175/65R14'),
          ('Pirelli P1 Cinturato', 'Pirelli', 'P1 Cinturato', 'auto', 195, 60, 15, 72000, 25, 'Perfecto balance entre confort y seguridad', '195/60R15'),
          ('Pirelli P Zero', 'Pirelli', 'P Zero', 'auto', 225, 45, 17, 125000, 10, 'Ultra High Performance para vehículos deportivos', '225/45R17'),
          ('Pirelli Scorpion Verde', 'Pirelli', 'Scorpion Verde', 'camioneta', 235, 65, 17, 115000, 18, 'SUV y Crossover, máxima eficiencia', '235/65R17'),
          ('Pirelli Scorpion ATR', 'Pirelli', 'Scorpion ATR', 'camioneta', 265, 70, 16, 135000, 12, 'All Terrain para aventuras off-road', '265/70R16'),
          ('Pirelli Scorpion Zero', 'Pirelli', 'Scorpion Zero', 'camioneta', 255, 55, 18, 145000, 8, 'Alto rendimiento para SUV deportivos', '255/55R18'),
          ('Pirelli FH88', 'Pirelli', 'FH88', 'camion', 295, 80, 22.5, 285000, 6, 'Para eje delantero, larga distancia', '295/80R22.5'),
          ('Pirelli TR88', 'Pirelli', 'TR88', 'camion', 295, 80, 22.5, 295000, 4, 'Para eje de tracción, máxima tracción', '295/80R22.5'),
          ('Pirelli Formula Driver II', 'Pirelli', 'Formula Driver II', 'camion', 275, 80, 22.5, 265000, 5, 'Versátil para todo tipo de ejes', '275/80R22.5')
          ON CONFLICT DO NOTHING
        `);
        console.log('✅ Products inserted');
      } catch (err) {
        console.log('⚠️ Products:', err.message);
      }

      // Count products
      try {
        const productCount = await client.query('SELECT COUNT(*) FROM products');
        console.log(`\n📦 Products in database: ${productCount.rows[0].count}`);
      } catch (err) {
        console.log('⚠️ Could not count products');
      }

      // Count branches
      try {
        const branchCount = await client.query('SELECT COUNT(*) FROM branches');
        console.log(`🏢 Branches in database: ${branchCount.rows[0].count}`);
      } catch (err) {
        console.log('⚠️ Could not count branches');
      }
    }

    console.log('\n🎉 Database setup process completed!');
    console.log('📱 You can now visit http://localhost:6001/products to see the catalog');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

executeSQLFile();