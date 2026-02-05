#!/usr/bin/env node

/**
 * Fix Migration Issues - Handle existing constraints
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

async function fixMigrationIssues() {
  log('\n🔧 Fixing Migration Issues', 'cyan');
  log('===========================\n', 'cyan');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // Issue 1: Drop existing check constraint on appointments.source
    log('1️⃣  Dropping existing appointments.source check constraint...', 'blue');
    try {
      await client.query(`
        ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_source_check;
      `);
      log('   ✅ Check constraint dropped', 'green');
    } catch (err) {
      log(`   ⚠️  ${err.message}`, 'yellow');
    }

    // Issue 2: Drop default on appointments.source before ENUM conversion
    log('2️⃣  Dropping default on appointments.source...', 'blue');
    try {
      await client.query(`
        ALTER TABLE appointments ALTER COLUMN source DROP DEFAULT;
      `);
      log('   ✅ Default dropped', 'green');
    } catch (err) {
      log(`   ⚠️  ${err.message}`, 'yellow');
    }

    // Issue 3: Clean appointments.source values
    log('3️⃣  Cleaning appointments.source values...', 'blue');
    try {
      const result = await client.query(`
        UPDATE appointments
        SET source = 'website'
        WHERE source IS NULL
           OR source NOT IN ('website', 'whatsapp', 'phone', 'walk_in', 'app', 'admin');
      `);
      log(`   ✅ Updated ${result.rowCount} appointments`, 'green');
    } catch (err) {
      log(`   ❌ ${err.message}`, 'red');
    }

    // Issue 4: Convert appointments.source to ENUM
    log('4️⃣  Converting appointments.source to ENUM...', 'blue');
    try {
      // Check if already ENUM
      const checkResult = await client.query(`
        SELECT udt_name FROM information_schema.columns
        WHERE table_name = 'appointments' AND column_name = 'source'
      `);

      if (checkResult.rows[0]?.udt_name === 'order_source') {
        log('   ⏭️  Already ENUM, skipping', 'yellow');
      } else {
        await client.query(`
          ALTER TABLE appointments
            ALTER COLUMN source TYPE order_source
            USING source::order_source;
        `);
        log('   ✅ Converted to ENUM', 'green');
      }
    } catch (err) {
      log(`   ❌ ${err.message}`, 'red');
    }

    // Issue 5: Set new default on appointments.source
    log('5️⃣  Setting new default on appointments.source...', 'blue');
    try {
      await client.query(`
        ALTER TABLE appointments
          ALTER COLUMN source SET DEFAULT 'website'::order_source;
      `);
      log('   ✅ Default set to website', 'green');
    } catch (err) {
      log(`   ⚠️  ${err.message}`, 'yellow');
    }

    // Issue 6: Clean profiles.phone NULLs
    log('6️⃣  Cleaning profiles.phone NULLs...', 'blue');
    try {
      const result = await client.query(`
        UPDATE profiles SET phone = '' WHERE phone IS NULL;
      `);
      log(`   ✅ Updated ${result.rowCount} profiles`, 'green');
    } catch (err) {
      log(`   ❌ ${err.message}`, 'red');
    }

    // Issue 7: Add NOT NULL to profiles.phone
    log('7️⃣  Adding NOT NULL to profiles.phone...', 'blue');
    try {
      await client.query(`
        ALTER TABLE profiles ALTER COLUMN phone SET NOT NULL;
      `);
      log('   ✅ NOT NULL constraint added', 'green');
    } catch (err) {
      log(`   ⚠️  ${err.message}`, 'yellow');
    }

    // Verification
    log('\n📊 Final Verification:', 'blue');
    log('─────────────────────────────────────────────', 'blue');

    const verification = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM profiles WHERE phone IS NULL) as profiles_null_phone,
        (SELECT COUNT(*) FROM stores WHERE email IS NULL) as stores_null_email,
        (SELECT udt_name FROM information_schema.columns
         WHERE table_name = 'appointments' AND column_name = 'source') as source_type
    `);

    const v = verification.rows[0];
    log(`   profiles.phone NULLs: ${v.profiles_null_phone}`, v.profiles_null_phone === '0' ? 'green' : 'yellow');
    log(`   stores.email NULLs: ${v.stores_null_email}`, v.stores_null_email === '0' ? 'green' : 'yellow');
    log(`   appointments.source type: ${v.source_type}`, v.source_type === 'order_source' ? 'green' : 'yellow');

    client.release();
    await pool.end();

    log('\n✅ All fixes applied!', 'green');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    client.release();
    await pool.end();
    process.exit(1);
  }
}

fixMigrationIssues();
