require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

async function backupViews() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const views = await pool.query(`
      SELECT
        schemaname,
        viewname,
        definition
      FROM pg_views
      WHERE schemaname = 'public'
      ORDER BY viewname
    `);

    let output = '-- ============================================================================\n';
    output += '-- BACKUP DE VIEWS - Para recrear después de migración ENUM\n';
    output += '-- ============================================================================\n\n';

    views.rows.forEach(view => {
      output += `-- View: ${view.viewname}\n`;
      output += `CREATE OR REPLACE VIEW ${view.schemaname}.${view.viewname} AS\n`;
      output += view.definition;
      output += '\n\n';
    });

    fs.writeFileSync('views-backup.sql', output);
    console.log('✅ Backup de views guardado en views-backup.sql\n');
    console.log(`Total de views: ${views.rows.length}\n`);

    views.rows.forEach(view => {
      console.log(`  - ${view.viewname}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

backupViews();
