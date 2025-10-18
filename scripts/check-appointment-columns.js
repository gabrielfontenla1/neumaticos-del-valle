const { Client } = require('pg');

// Configuración CORRECTA de conexión
const connectionString = 'postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

console.log('🔍 Checking appointments table structure...\n');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!\n');

    // Get all columns from appointments table
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'appointments'
      ORDER BY ordinal_position
    `);

    console.log('📋 Appointments table columns:');
    console.log('='.repeat(60));

    result.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`• ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
    });

    console.log('\n🎯 Looking for service-related columns...');
    const serviceColumns = result.rows.filter(col =>
      col.column_name.includes('service') ||
      col.column_name === 'service' ||
      col.column_name === 'service_type'
    );

    if (serviceColumns.length > 0) {
      console.log('Found service columns:');
      serviceColumns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('   ❌ No service-related columns found!');
      console.log('   This is the issue - we need to add a service column');
    }

    console.log('\n📊 Required columns check:');
    const requiredColumns = [
      'customer_name',
      'customer_email',
      'customer_phone',
      'vehicle_make',
      'vehicle_model',
      'vehicle_year',
      'service', // or service_type
      'store_id',
      'preferred_date',
      'preferred_time',
      'status',
      'notes'
    ];

    for (const reqCol of requiredColumns) {
      const exists = result.rows.some(col => col.column_name === reqCol);
      console.log(`   ${exists ? '✅' : '❌'} ${reqCol}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('\n🔚 Database connection closed');
  }
}

checkColumns();