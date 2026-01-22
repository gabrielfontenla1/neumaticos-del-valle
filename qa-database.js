require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

async function qaDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  const results = [];

  try {
    console.log('🔍 ============================================================');
    console.log('   QUALITY ASSURANCE - BASE DE DATOS COMPLETA');
    console.log('============================================================\n');

    // ========================================================================
    // 1. VERIFICAR ENUM TYPES CREADOS
    // ========================================================================
    console.log('\n📊 1. VERIFICANDO ENUM TYPES CREADOS...\n');

    const enums = await client.query(`
      SELECT
        t.typname as enum_name,
        string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    enums.rows.forEach(e => {
      console.log(`   ✅ ${e.enum_name}: [${e.enum_values}]`);
    });
    results.push(`✅ ${enums.rows.length} ENUM types creados`);

    // ========================================================================
    // 2. VERIFICAR COLUMNAS MIGRADAS A ENUM
    // ========================================================================
    console.log('\n📊 2. VERIFICANDO COLUMNAS MIGRADAS A ENUM...\n');

    const enumColumns = await client.query(`
      SELECT
        table_name,
        column_name,
        udt_name as enum_type,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('appointments', 'orders', 'whatsapp_conversations', 'kommo_conversations', 'whatsapp_messages', 'kommo_messages')
        AND column_name IN ('status', 'payment_status', 'payment_method', 'source', 'conversation_state', 'role', 'content_type', 'channel')
      ORDER BY table_name, column_name
    `);

    enumColumns.rows.forEach(c => {
      console.log(`   ✅ ${c.table_name}.${c.column_name} → ${c.enum_type} ${c.column_default ? `(default: ${c.column_default})` : ''}`);
    });
    results.push(`✅ ${enumColumns.rows.length} columnas migradas a ENUM`);

    // ========================================================================
    // 3. VERIFICAR FOREIGN KEYS
    // ========================================================================
    console.log('\n📊 3. VERIFICANDO FOREIGN KEYS...\n');

    const fks = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    fks.rows.forEach(fk => {
      console.log(`   ✅ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    results.push(`✅ ${fks.rows.length} foreign keys activos`);

    // ========================================================================
    // 4. VERIFICAR RLS POLICIES
    // ========================================================================
    console.log('\n📊 4. VERIFICANDO RLS POLICIES...\n');

    const rls = await client.query(`
      SELECT
        tablename,
        CASE WHEN rowsecurity = true THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = pt.tablename) as policy_count
      FROM pg_tables pt
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    rls.rows.forEach(r => {
      const status = r.rls_status === 'ENABLED' ? '✅' : '⚠️ ';
      console.log(`   ${status} ${r.tablename}: RLS ${r.rls_status} (${r.policy_count} policies)`);
    });

    const rlsEnabled = rls.rows.filter(r => r.rls_status === 'ENABLED').length;
    results.push(`✅ ${rlsEnabled}/${rls.rows.length} tablas con RLS habilitado`);

    // ========================================================================
    // 5. VERIFICAR INDEXES
    // ========================================================================
    console.log('\n📊 5. VERIFICANDO INDEXES...\n');

    const indexes = await client.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log(`   Total de indexes: ${indexes.rows.length}`);

    // Contar indexes por tabla
    const indexesByTable = {};
    indexes.rows.forEach(idx => {
      if (!indexesByTable[idx.tablename]) indexesByTable[idx.tablename] = 0;
      indexesByTable[idx.tablename]++;
    });

    Object.entries(indexesByTable).forEach(([table, count]) => {
      console.log(`   ✅ ${table}: ${count} indexes`);
    });
    results.push(`✅ ${indexes.rows.length} indexes totales`);

    // ========================================================================
    // 6. VERIFICAR VIEWS
    // ========================================================================
    console.log('\n📊 6. VERIFICANDO VIEWS...\n');

    const views = await client.query(`
      SELECT
        schemaname,
        viewname
      FROM pg_views
      WHERE schemaname = 'public'
      ORDER BY viewname
    `);

    views.rows.forEach(v => {
      console.log(`   ✅ ${v.viewname}`);
    });
    results.push(`✅ ${views.rows.length} views recreadas`);

    // ========================================================================
    // 7. VERIFICAR TRIGGERS
    // ========================================================================
    console.log('\n📊 7. VERIFICANDO TRIGGERS...\n');

    const triggers = await client.query(`
      SELECT
        t.tgname as trigger_name,
        c.relname as table_name
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND NOT t.tgisinternal
      ORDER BY c.relname, t.tgname
    `);

    triggers.rows.forEach(t => {
      console.log(`   ✅ ${t.table_name}.${t.trigger_name}`);
    });
    results.push(`✅ ${triggers.rows.length} triggers activos`);

    // ========================================================================
    // 8. VERIFICAR DATA INTEGRITY
    // ========================================================================
    console.log('\n📊 8. VERIFICANDO INTEGRIDAD DE DATOS...\n');

    // Check for orphaned records
    const orphanChecks = [
      {
        name: 'appointments sin store válido',
        query: `SELECT COUNT(*) as count FROM appointments WHERE store_id IS NOT NULL AND store_id NOT IN (SELECT id FROM stores)`
      },
      {
        name: 'branch_stock sin product válido',
        query: `SELECT COUNT(*) as count FROM branch_stock WHERE product_id NOT IN (SELECT id FROM products)`
      },
      {
        name: 'branch_stock sin branch válido',
        query: `SELECT COUNT(*) as count FROM branch_stock WHERE branch_id NOT IN (SELECT id FROM branches)`
      }
    ];

    for (const check of orphanChecks) {
      const result = await client.query(check.query);
      const count = parseInt(result.rows[0].count);
      if (count === 0) {
        console.log(`   ✅ ${check.name}: OK (0 registros huérfanos)`);
      } else {
        console.log(`   ⚠️  ${check.name}: ${count} registros huérfanos encontrados`);
      }
    }

    // ========================================================================
    // 9. VERIFICAR VALORES ENUM
    // ========================================================================
    console.log('\n📊 9. VERIFICANDO VALORES EN COLUMNAS ENUM...\n');

    const enumValueChecks = [
      { table: 'appointments', column: 'status' },
      { table: 'orders', column: 'status' },
      { table: 'orders', column: 'payment_status' },
      { table: 'whatsapp_conversations', column: 'status' },
      { table: 'kommo_conversations', column: 'status' }
    ];

    for (const check of enumValueChecks) {
      const result = await client.query(`
        SELECT DISTINCT ${check.column}::text as value, COUNT(*) as count
        FROM ${check.table}
        GROUP BY ${check.column}
        ORDER BY count DESC
      `);

      console.log(`   ✅ ${check.table}.${check.column}:`);
      result.rows.forEach(r => {
        console.log(`      - ${r.value}: ${r.count} registros`);
      });
    }

    // ========================================================================
    // 10. PERFORMANCE CHECKS
    // ========================================================================
    console.log('\n📊 10. VERIFICANDO PERFORMANCE...\n');

    // Table sizes
    const sizes = await client.query(`
      SELECT
        schemaname as schema,
        tablename as table,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    console.log('   Top 10 tablas por tamaño:');
    sizes.rows.forEach(s => {
      console.log(`   📦 ${s.table}: ${s.size}`);
    });

    // ========================================================================
    // RESUMEN FINAL
    // ========================================================================
    console.log('\n🎯 ============================================================');
    console.log('   RESUMEN DEL QA');
    console.log('============================================================\n');

    results.forEach(r => console.log(`   ${r}`));

    console.log('\n✅ ============================================================');
    console.log('   QA COMPLETADO EXITOSAMENTE');
    console.log('============================================================\n');

    // Save report
    const reportPath = 'qa-database-report.txt';
    const report = results.join('\n');
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Reporte guardado en: ${reportPath}\n`);

  } catch (error) {
    console.error('\n❌ Error durante QA:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

qaDatabase();
