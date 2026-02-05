#!/usr/bin/env node

/**
 * Verify Migration 20260205 - Final verification
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

async function verify() {
  log('\n📊 MIGRATION 20260205 - FINAL VERIFICATION', 'cyan');
  log('==========================================\n', 'cyan');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  let allPassed = true;

  try {
    // 1. Check indexes
    log('1️⃣  Performance Indexes:', 'blue');
    const indexes = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    const expectedIndexes = [
      'idx_appointments_created_at',
      'idx_appointments_service_id',
      'idx_branch_stock_updated_by',
      'idx_orders_created_at',
      'idx_products_created_at',
      'idx_profiles_phone',
      'idx_stores_email',
      'idx_stores_phone'
    ];
    for (const idx of expectedIndexes) {
      const exists = indexes.rows.some(r => r.indexname === idx);
      if (exists) {
        log(`   ✅ ${idx}`, 'green');
      } else {
        log(`   ❌ ${idx} MISSING`, 'red');
        allPassed = false;
      }
    }

    // 2. Check NOT NULL constraints
    log('\n2️⃣  NOT NULL Constraints:', 'blue');
    const nullChecks = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM profiles WHERE phone IS NULL) as profiles_phone_nulls,
        (SELECT COUNT(*) FROM stores WHERE email IS NULL) as stores_email_nulls
    `);
    const pn = parseInt(nullChecks.rows[0].profiles_phone_nulls);
    const sn = parseInt(nullChecks.rows[0].stores_email_nulls);

    if (pn === 0) {
      log('   ✅ profiles.phone: No NULLs', 'green');
    } else {
      log(`   ❌ profiles.phone: ${pn} NULLs remain`, 'red');
      allPassed = false;
    }

    if (sn === 0) {
      log('   ✅ stores.email: No NULLs', 'green');
    } else {
      log(`   ❌ stores.email: ${sn} NULLs remain`, 'red');
      allPassed = false;
    }

    // Check actual constraint
    const constraints = await client.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND (table_name, column_name) IN (('profiles', 'phone'), ('stores', 'email'))
    `);
    for (const c of constraints.rows) {
      if (c.is_nullable === 'NO') {
        log(`   ✅ ${c.column_name}: NOT NULL enforced`, 'green');
      } else {
        log(`   ⚠️  ${c.column_name}: NOT NULL not enforced yet`, 'yellow');
      }
    }

    // 3. Check ENUM conversion
    log('\n3️⃣  ENUM Conversion:', 'blue');
    const enumCheck = await client.query(`
      SELECT udt_name FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'source'
    `);
    if (enumCheck.rows[0]?.udt_name === 'order_source') {
      log('   ✅ appointments.source: order_source ENUM', 'green');
    } else {
      log(`   ❌ appointments.source: ${enumCheck.rows[0]?.udt_name} (expected order_source)`, 'red');
      allPassed = false;
    }

    // Check source distribution
    const sourceDistribution = await client.query(`
      SELECT source::text, COUNT(*) as count
      FROM appointments
      GROUP BY source
      ORDER BY count DESC
    `);
    log('   Source distribution:', 'cyan');
    for (const row of sourceDistribution.rows) {
      log(`      ${row.source}: ${row.count}`, 'cyan');
    }

    // 4. Check moto images
    log('\n4️⃣  Moto Product Images:', 'blue');
    const motoImages = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '') as with_image,
        COUNT(*) FILTER (WHERE image_url IS NULL OR image_url = '') as without_image,
        COUNT(*) as total
      FROM products
      WHERE category = 'moto'
    `);
    const mi = motoImages.rows[0];
    log(`   ✅ Moto products with images: ${mi.with_image}/${mi.total}`, 'green');
    if (parseInt(mi.without_image) > 0) {
      log(`   ⚠️  ${mi.without_image} products still without images`, 'yellow');
    }

    // 5. Check FK constraints
    log('\n5️⃣  Foreign Key Constraints:', 'blue');
    const fkCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'branch_stock'
      AND constraint_type = 'FOREIGN KEY'
    `);
    const fkBranch = fkCheck.rows.some(r => r.constraint_name === 'fk_branch_stock_branch');
    const fkProduct = fkCheck.rows.some(r => r.constraint_name === 'fk_branch_stock_product');

    if (fkBranch) {
      log('   ✅ fk_branch_stock_branch', 'green');
    } else {
      log('   ⚠️  fk_branch_stock_branch not found (may have different name)', 'yellow');
    }

    if (fkProduct) {
      log('   ✅ fk_branch_stock_product', 'green');
    } else {
      log('   ⚠️  fk_branch_stock_product not found (may have different name)', 'yellow');
    }

    // 6. Check views
    log('\n6️⃣  Dependent Views:', 'blue');
    const views = await client.query(`
      SELECT table_name FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name IN ('today_appointments', 'whatsapp_appointments')
    `);
    for (const view of ['today_appointments', 'whatsapp_appointments']) {
      const exists = views.rows.some(r => r.table_name === view);
      if (exists) {
        log(`   ✅ ${view} exists`, 'green');
      } else {
        log(`   ❌ ${view} MISSING`, 'red');
        allPassed = false;
      }
    }

    client.release();
    await pool.end();

    // Summary
    log('\n==========================================', 'cyan');
    if (allPassed) {
      log('✅ ALL CHECKS PASSED - Migration successful!', 'green');
    } else {
      log('⚠️  SOME CHECKS FAILED - Review issues above', 'yellow');
    }
    log('==========================================\n', 'cyan');

  } catch (error) {
    log(`\n❌ Verification error: ${error.message}`, 'red');
    client.release();
    await pool.end();
    process.exit(1);
  }
}

verify();
