require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function findTriggers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Find all triggers
    const triggers = await pool.query(`
      SELECT
        trigger_schema,
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);

    console.log('🔔 Triggers en la base de datos:\n');
    triggers.rows.forEach(t => {
      console.log(`\n📌 ${t.event_object_table}.${t.trigger_name}`);
      console.log(`   Timing: ${t.action_timing} ${t.event_manipulation}`);
      console.log(`   Action: ${t.action_statement.substring(0, 100)}...`);
    });

    // Also get trigger functions
    console.log('\n\n📦 Funciones de trigger:\n');
    const functions = await pool.query(`
      SELECT
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND data_type = 'trigger'
      ORDER BY routine_name
    `);

    functions.rows.forEach(f => {
      console.log(`\n🔧 ${f.routine_name}:`);
      if (f.routine_definition) {
        console.log(f.routine_definition.substring(0, 200) + '...');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findTriggers();
