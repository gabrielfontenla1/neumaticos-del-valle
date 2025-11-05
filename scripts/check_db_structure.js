const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  console.log('📋 Checking database structure...\n');

  try {
    // Get a sample product to see the columns
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching sample:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Available columns in products table:');
      console.log('=====================================');
      Object.keys(data[0]).forEach(key => {
        const value = data[0][key];
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${key}: ${type}`);
      });
      console.log('\nSample product:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No products found in the database');
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkDatabaseStructure();