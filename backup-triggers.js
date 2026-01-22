require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

async function backupTriggers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get trigger definitions using pg_get_triggerdef
    const triggers = await pool.query(`
      SELECT
        t.tgname as trigger_name,
        c.relname as table_name,
        pg_get_triggerdef(t.oid) as trigger_def
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND NOT t.tgisinternal
      ORDER BY c.relname, t.tgname
    `);

    let output = '-- ============================================================================\n';
    output += '-- BACKUP DE TRIGGERS - Para recrear después de migración ENUM\n';
    output += '-- ============================================================================\n\n';

    triggers.rows.forEach(t => {
      output += `-- Trigger: ${t.table_name}.${t.trigger_name}\n`;
      output += t.trigger_def + ';\n\n';
    });

    fs.writeFileSync('triggers-backup.sql', output);
    console.log('✅ Backup de triggers guardado en triggers-backup.sql\n');
    console.log(`Total de triggers: ${triggers.rows.length}\n`);

    triggers.rows.forEach(t => {
      console.log(`  - ${t.table_name}.${t.trigger_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

backupTriggers();
