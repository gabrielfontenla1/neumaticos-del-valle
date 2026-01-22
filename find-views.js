require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function findViews() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Find all views
    const views = await pool.query(`
      SELECT
        schemaname,
        viewname,
        definition
      FROM pg_views
      WHERE schemaname = 'public'
      ORDER BY viewname
    `);

    console.log('📊 Views en la base de datos:\n');
    views.rows.forEach(view => {
      console.log(`\n${view.schemaname}.${view.viewname}:`);
      console.log(view.definition.substring(0, 200) + '...\n');
    });

    // Check which views reference our columns
    const columnsToMigrate = [
      'appointments.status',
      'orders.status',
      'orders.payment_status',
      'orders.payment_method',
      'orders.source',
      'whatsapp_conversations.status',
      'whatsapp_conversations.conversation_state',
      'kommo_conversations.status',
      'kommo_conversations.channel',
      'whatsapp_messages.role',
      'kommo_messages.role',
      'kommo_messages.content_type'
    ];

    console.log('\n\n🔍 Views que referencian columnas a migrar:\n');
    views.rows.forEach(view => {
      columnsToMigrate.forEach(col => {
        if (view.definition.includes(col.split('.')[0])) {
          console.log(`⚠️  ${view.viewname} → posiblemente referencia ${col}`);
        }
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findViews();
