// Setup Branches/Stores Script

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setupBranches() {
  console.log('Setting up branches/stores...');

  // Sample branches data
  const branches = [
    {
      name: 'Neumáticos del Valle - Palermo',
      address: 'Av. Santa Fe 3456',
      city: 'Buenos Aires',
      phone: '(11) 4555-1234',
      whatsapp: '5491155551234',
      email: 'palermo@neumaticosdevalle.com',
      latitude: -34.5880,
      longitude: -58.4099,
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
      name: 'Neumáticos del Valle - Belgrano',
      address: 'Av. Cabildo 2345',
      city: 'Buenos Aires',
      phone: '(11) 4666-5678',
      whatsapp: '5491166665678',
      email: 'belgrano@neumaticosdevalle.com',
      latitude: -34.5626,
      longitude: -58.4546,
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
      name: 'Neumáticos del Valle - San Isidro',
      address: 'Av. Centenario 1234',
      city: 'San Isidro',
      phone: '(11) 4777-9876',
      whatsapp: '5491177779876',
      email: 'sanisidro@neumaticosdevalle.com',
      latitude: -34.4709,
      longitude: -58.5286,
      opening_hours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '14:00' },
        sunday: { closed: true }
      },
      is_main: false,
      active: true
    }
  ];

  try {
    // Check if stores table exists
    const { data: existingStores, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('Stores table does not exist. Please run database migrations first.');
      return;
    }

    // Check if we already have branches
    const { data: currentStores, error: selectError } = await supabase
      .from('stores')
      .select('id');

    if (selectError) {
      console.error('Error checking existing stores:', selectError);
      return;
    }

    if (currentStores && currentStores.length > 0) {
      console.log(`Found ${currentStores.length} existing branches. Skipping setup.`);
      return;
    }

    // Insert branches
    const { data, error } = await supabase
      .from('stores')
      .insert(branches)
      .select();

    if (error) {
      console.error('Error inserting branches:', error);
      return;
    }

    console.log(`Successfully created ${data.length} branches:`);
    data.forEach(branch => {
      console.log(`  - ${branch.name} (${branch.city})`);
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the setup
setupBranches().then(() => {
  console.log('Branch setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});