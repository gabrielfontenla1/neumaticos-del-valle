require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkDefaults() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(`
      SELECT
        table_name,
        column_name,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('appointments', 'orders', 'whatsapp_conversations', 'kommo_conversations', 'whatsapp_messages', 'kommo_messages')
        AND column_name IN ('status', 'payment_status', 'payment_method', 'source', 'conversation_state', 'role', 'content_type', 'channel')
        AND column_default IS NOT NULL
      ORDER BY table_name, column_name
    `);

    console.log('📋 Columnas con DEFAULT values:\n');
    result.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name}: ${row.column_default}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDefaults();
