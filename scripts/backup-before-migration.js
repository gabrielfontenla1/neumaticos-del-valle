#!/usr/bin/env node

/**
 * Backup Script - Before Migration
 *
 * Creates a backup of critical data before applying NOT NULL constraints
 * and ENUM conversions in the 20260205 migration.
 *
 * Tables backed up:
 * - profiles (phone column)
 * - stores (email column)
 * - appointments (source column)
 * - kommo_conversations (phone column)
 * - products (moto category images)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
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

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  log('❌ Missing required environment variables:', 'red');
  log('   - NEXT_PUBLIC_SUPABASE_URL', 'yellow');
  log('   - SUPABASE_SERVICE_ROLE_KEY', 'yellow');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBackup() {
  log('\n📦 Backup Before Migration - 20260205', 'cyan');
  log('=====================================\n', 'cyan');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'archive', `migration-backup-${timestamp}`);

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {
    timestamp,
    tables: {}
  };

  try {
    // 1. Backup profiles with phone
    log('📋 Backing up profiles.phone...', 'blue');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, phone')
      .order('created_at');

    if (profilesError) throw new Error(`profiles: ${profilesError.message}`);

    const profilesWithNullPhone = profiles?.filter(p => p.phone === null) || [];
    backup.tables.profiles = {
      total: profiles?.length || 0,
      nullPhoneCount: profilesWithNullPhone.length,
      nullPhoneRecords: profilesWithNullPhone
    };
    log(`   ✅ ${profiles?.length || 0} profiles, ${profilesWithNullPhone.length} with NULL phone`, 'green');

    // 2. Backup stores with email
    log('📋 Backing up stores.email...', 'blue');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, email')
      .order('created_at');

    if (storesError) throw new Error(`stores: ${storesError.message}`);

    const storesWithNullEmail = stores?.filter(s => s.email === null) || [];
    backup.tables.stores = {
      total: stores?.length || 0,
      nullEmailCount: storesWithNullEmail.length,
      nullEmailRecords: storesWithNullEmail
    };
    log(`   ✅ ${stores?.length || 0} stores, ${storesWithNullEmail.length} with NULL email`, 'green');

    // 3. Backup appointments with source
    log('📋 Backing up appointments.source...', 'blue');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, customer_name, source, created_at')
      .order('created_at');

    if (appointmentsError) throw new Error(`appointments: ${appointmentsError.message}`);

    const appointmentsWithNullSource = appointments?.filter(a => a.source === null) || [];
    const appointmentsWithInvalidSource = appointments?.filter(a =>
      a.source !== null &&
      !['website', 'whatsapp', 'phone', 'walk_in', 'app', 'admin'].includes(a.source)
    ) || [];

    backup.tables.appointments = {
      total: appointments?.length || 0,
      nullSourceCount: appointmentsWithNullSource.length,
      invalidSourceCount: appointmentsWithInvalidSource.length,
      nullSourceRecords: appointmentsWithNullSource,
      invalidSourceRecords: appointmentsWithInvalidSource
    };
    log(`   ✅ ${appointments?.length || 0} appointments, ${appointmentsWithNullSource.length} NULL source, ${appointmentsWithInvalidSource.length} invalid source`, 'green');

    // 4. Backup kommo_conversations with phone
    log('📋 Backing up kommo_conversations.phone...', 'blue');
    const { data: kommoConversations, error: kommoError } = await supabase
      .from('kommo_conversations')
      .select('id, phone, created_at')
      .order('created_at');

    if (kommoError) {
      // Table might not exist
      log(`   ⚠️ kommo_conversations: ${kommoError.message}`, 'yellow');
      backup.tables.kommo_conversations = {
        error: kommoError.message,
        total: 0,
        nullPhoneCount: 0
      };
    } else {
      const kommoWithNullPhone = kommoConversations?.filter(k => k.phone === null) || [];
      backup.tables.kommo_conversations = {
        total: kommoConversations?.length || 0,
        nullPhoneCount: kommoWithNullPhone.length,
        nullPhoneRecords: kommoWithNullPhone
      };
      log(`   ✅ ${kommoConversations?.length || 0} conversations, ${kommoWithNullPhone.length} with NULL phone`, 'green');
    }

    // 5. Backup moto products images
    log('📋 Backing up moto products images...', 'blue');
    const { data: motoProducts, error: motoError } = await supabase
      .from('products')
      .select('id, name, category, image_url')
      .eq('category', 'moto')
      .order('name');

    if (motoError) throw new Error(`moto products: ${motoError.message}`);

    backup.tables.moto_products = {
      total: motoProducts?.length || 0,
      records: motoProducts
    };
    log(`   ✅ ${motoProducts?.length || 0} moto products`, 'green');

    // Write backup to file
    const backupFile = path.join(backupDir, 'backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    log(`\n📁 Backup saved to: ${backupFile}`, 'cyan');

    // Generate summary
    log('\n📊 Summary:', 'blue');
    log('─────────────────────────────────────────────', 'blue');
    log(`   profiles with NULL phone:      ${backup.tables.profiles.nullPhoneCount}`, 'yellow');
    log(`   stores with NULL email:        ${backup.tables.stores.nullEmailCount}`, 'yellow');
    log(`   appointments with NULL source: ${backup.tables.appointments.nullSourceCount}`, 'yellow');
    log(`   appointments with invalid source: ${backup.tables.appointments.invalidSourceCount}`, 'yellow');
    log(`   kommo_conversations NULL phone: ${backup.tables.kommo_conversations?.nullPhoneCount || 'N/A'}`, 'yellow');
    log(`   moto products:                 ${backup.tables.moto_products.total}`, 'yellow');
    log('─────────────────────────────────────────────', 'blue');

    // Generate rollback SQL
    const rollbackSql = generateRollbackSql(backup);
    const rollbackFile = path.join(backupDir, 'rollback.sql');
    fs.writeFileSync(rollbackFile, rollbackSql);
    log(`📁 Rollback SQL saved to: ${rollbackFile}`, 'cyan');

    log('\n✅ Backup completed successfully!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Review the backup at: ' + backupDir, 'yellow');
    log('2. Run the migration: npm run migrate', 'yellow');
    log('3. If issues occur, use rollback.sql to revert', 'yellow');

    return backup;

  } catch (error) {
    log(`\n❌ Error creating backup: ${error.message}`, 'red');
    process.exit(1);
  }
}

function generateRollbackSql(backup) {
  let sql = `-- Rollback SQL for migration 20260205
-- Generated at: ${backup.timestamp}
-- Use this if the migration fails and you need to revert

BEGIN;

-- Revert NOT NULL constraints
ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE stores ALTER COLUMN email DROP NOT NULL;

-- Revert kommo_conversations if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kommo_conversations') THEN
    ALTER TABLE kommo_conversations ALTER COLUMN phone DROP NOT NULL;
  END IF;
END $$;

-- Revert appointments.source to TEXT (if converted to ENUM)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
      AND column_name = 'source'
      AND udt_name = 'order_source'
  ) THEN
    ALTER TABLE appointments ALTER COLUMN source TYPE TEXT USING source::TEXT;
    RAISE NOTICE 'appointments.source reverted to TEXT';
  END IF;
END $$;

-- Restore NULL values (if needed)
`;

  // Add specific restore statements for records that had NULL
  if (backup.tables.profiles.nullPhoneCount > 0) {
    sql += `\n-- Restore NULL phone values in profiles\n`;
    backup.tables.profiles.nullPhoneRecords.forEach(p => {
      sql += `UPDATE profiles SET phone = NULL WHERE id = '${p.id}';\n`;
    });
  }

  if (backup.tables.stores.nullEmailCount > 0) {
    sql += `\n-- Restore NULL email values in stores\n`;
    backup.tables.stores.nullEmailRecords.forEach(s => {
      sql += `UPDATE stores SET email = NULL WHERE id = '${s.id}';\n`;
    });
  }

  if (backup.tables.appointments.nullSourceCount > 0) {
    sql += `\n-- Restore NULL source values in appointments\n`;
    backup.tables.appointments.nullSourceRecords.forEach(a => {
      sql += `UPDATE appointments SET source = NULL WHERE id = '${a.id}';\n`;
    });
  }

  sql += `\nCOMMIT;

SELECT '✅ Rollback completed!' as message;
`;

  return sql;
}

// Run the backup
createBackup().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
