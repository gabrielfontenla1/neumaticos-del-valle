require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function findFunctions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const functions = await pool.query(`
      SELECT
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND (
          routine_definition LIKE '%whatsapp_conversations%'
          OR routine_definition LIKE '%kommo_conversations%'
          OR routine_definition LIKE '%status%'
        )
      ORDER BY routine_name
    `);

    console.log('🔧 Funciones que referencian tablas de conversaciones:\n');
    functions.rows.forEach(f => {
      console.log(`\n📦 ${f.routine_name}:`);
      console.log(f.routine_definition || '(definition not available)');
      console.log('\n---\n');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findFunctions();
