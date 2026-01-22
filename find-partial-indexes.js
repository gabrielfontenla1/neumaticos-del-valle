require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function findPartialIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const indexes = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('whatsapp_conversations', 'kommo_conversations', 'whatsapp_messages', 'kommo_messages', 'appointments', 'orders')
        AND indexdef LIKE '%WHERE%'
      ORDER BY tablename, indexname
    `);

    console.log('🔍 Partial Indexes (with WHERE clauses):\n');
    indexes.rows.forEach(idx => {
      console.log(`\n📌 ${idx.tablename}.${idx.indexname}`);
      console.log(`   ${idx.indexdef}`);
    });

    if (indexes.rows.length === 0) {
      console.log('No partial indexes found.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findPartialIndexes();
