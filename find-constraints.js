require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function findConstraints() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const constraints = await pool.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        cc.check_clause,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name IN ('whatsapp_conversations', 'kommo_conversations', 'whatsapp_messages', 'kommo_messages')
        AND tc.constraint_type = 'CHECK'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    console.log('🔒 CHECK Constraints en tablas de conversaciones:\n');
    constraints.rows.forEach(c => {
      console.log(`\n📌 ${c.table_name}.${c.constraint_name}`);
      console.log(`   Column: ${c.column_name || 'N/A'}`);
      console.log(`   Check: ${c.check_clause}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findConstraints();
