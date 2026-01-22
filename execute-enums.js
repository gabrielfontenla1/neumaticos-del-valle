require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function executeSQL() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('🔗 Conectando a:', process.env.DATABASE_URL?.substring(0, 50) + '...');

  const client = await pool.connect();

  // Capturar todos los NOTICE messages
  client.on('notice', (msg) => {
    console.log('📢', msg.message || msg);
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'database-fixes-ENUMS.sql'), 'utf8');

    console.log('🚀 Ejecutando database-fixes-ENUMS.sql...\n');

    const result = await client.query(sql);

    console.log('\n✅ Migration ejecutada exitosamente');
    console.log('Result:', result.rowCount, 'rows affected');

  } catch (error) {
    console.error('\n❌ Error ejecutando migration:', error.message);
    console.error('Detalle:', error.detail || error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

executeSQL();
