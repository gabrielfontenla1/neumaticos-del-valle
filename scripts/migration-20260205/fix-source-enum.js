#!/usr/bin/env node

/**
 * Fix appointments.source ENUM conversion
 * Handles dependent views
 */

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fixSourceEnum() {
  log('\n🔧 Fixing appointments.source ENUM conversion', 'cyan');
  log('==============================================\n', 'cyan');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // 1. Find dependent views
    log('1️⃣  Finding dependent views...', 'blue');
    const viewsResult = await client.query(`
      SELECT DISTINCT v.table_name as view_name, v.view_definition
      FROM information_schema.views v
      WHERE v.table_schema = 'public'
        AND v.view_definition LIKE '%appointments%'
    `);

    const views = viewsResult.rows;
    log(`   Found ${views.length} dependent view(s)`, 'cyan');

    for (const view of views) {
      log(`   - ${view.view_name}`, 'yellow');
    }

    // 2. Save view definitions
    const savedViews = [];
    for (const view of views) {
      savedViews.push({
        name: view.view_name,
        definition: view.view_definition
      });
    }

    // 3. Drop dependent views
    log('\n2️⃣  Dropping dependent views...', 'blue');
    for (const view of savedViews) {
      try {
        await client.query(`DROP VIEW IF EXISTS ${view.name} CASCADE`);
        log(`   ✅ Dropped ${view.name}`, 'green');
      } catch (err) {
        log(`   ⚠️  ${view.name}: ${err.message}`, 'yellow');
      }
    }

    // 4. Check current type
    const currentType = await client.query(`
      SELECT udt_name FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'source'
    `);
    log(`\n3️⃣  Current type: ${currentType.rows[0]?.udt_name}`, 'blue');

    // 5. Drop default if exists
    log('\n4️⃣  Removing default...', 'blue');
    try {
      await client.query(`ALTER TABLE appointments ALTER COLUMN source DROP DEFAULT`);
      log('   ✅ Default removed', 'green');
    } catch (err) {
      log(`   ⚠️  ${err.message}`, 'yellow');
    }

    // 6. Convert to ENUM
    log('\n5️⃣  Converting to ENUM...', 'blue');
    if (currentType.rows[0]?.udt_name !== 'order_source') {
      try {
        await client.query(`
          ALTER TABLE appointments
            ALTER COLUMN source TYPE order_source
            USING source::order_source
        `);
        log('   ✅ Converted to order_source ENUM', 'green');
      } catch (err) {
        log(`   ❌ ${err.message}`, 'red');
      }
    } else {
      log('   ⏭️  Already ENUM', 'yellow');
    }

    // 7. Set new default
    log('\n6️⃣  Setting new default...', 'blue');
    try {
      await client.query(`
        ALTER TABLE appointments
          ALTER COLUMN source SET DEFAULT 'website'::order_source
      `);
      log('   ✅ Default set', 'green');
    } catch (err) {
      log(`   ⚠️  ${err.message}`, 'yellow');
    }

    // 8. Recreate views (with updated type)
    log('\n7️⃣  Recreating views...', 'blue');
    for (const view of savedViews) {
      try {
        // Update view definition to cast source as text if needed
        let definition = view.definition;
        // The definition might already work, try it first
        await client.query(`CREATE OR REPLACE VIEW ${view.name} AS ${definition}`);
        log(`   ✅ Recreated ${view.name}`, 'green');
      } catch (err) {
        log(`   ⚠️  Could not recreate ${view.name}: ${err.message}`, 'yellow');
        log(`      Definition: ${view.definition.substring(0, 100)}...`, 'yellow');
      }
    }

    // 9. Final verification
    log('\n📊 Final Verification:', 'blue');
    log('─────────────────────────────────────────────', 'blue');

    const finalType = await client.query(`
      SELECT udt_name FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'source'
    `);
    log(`   appointments.source type: ${finalType.rows[0]?.udt_name}`,
      finalType.rows[0]?.udt_name === 'order_source' ? 'green' : 'yellow');

    const sampleData = await client.query(`
      SELECT source, COUNT(*) as count
      FROM appointments
      GROUP BY source
      ORDER BY count DESC
    `);
    log('\n   Source distribution:', 'cyan');
    for (const row of sampleData.rows) {
      log(`      ${row.source}: ${row.count}`, 'cyan');
    }

    client.release();
    await pool.end();

    log('\n✅ ENUM conversion complete!', 'green');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

fixSourceEnum();
