#!/usr/bin/env node

/**
 * Fix whatsapp_appointments view for ENUM compatibility
 */

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function fixWhatsappView() {
  console.log('\n🔧 Fixing whatsapp_appointments view\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    // Recreate the view with proper ENUM comparison
    await client.query(`
      CREATE OR REPLACE VIEW whatsapp_appointments AS
      SELECT
        a.id,
        a.customer_name,
        a.customer_phone,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.notes,
        a.created_at,
        s.name AS store_name,
        srv.name AS service_name,
        srv.duration AS service_duration,
        c.contact_name AS whatsapp_contact,
        c.kommo_chat_id
      FROM appointments a
      LEFT JOIN stores s ON a.store_id = s.id
      LEFT JOIN appointment_services srv ON a.service_id = srv.id
      LEFT JOIN kommo_conversations c ON a.kommo_conversation_id = c.id
      WHERE a.source = 'whatsapp'::order_source
      ORDER BY a.appointment_date DESC, a.appointment_time DESC;
    `);

    console.log('✅ whatsapp_appointments view recreated with ENUM cast');

    // Verify
    const result = await client.query(`
      SELECT COUNT(*) as count FROM whatsapp_appointments
    `);
    console.log(`   Records in view: ${result.rows[0].count}`);

    client.release();
    await pool.end();

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

fixWhatsappView();
