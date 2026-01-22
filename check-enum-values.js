require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkValues() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verificando valores actuales antes de migración ENUM...\n');

    // Check appointments.status
    const appointments = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('📋 appointments.status:');
    console.log(appointments.rows);
    console.log('Expected: pending, confirmed, completed, cancelled, no_show\n');

    // Check orders.status
    const orders = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('📦 orders.status:');
    console.log(orders.rows);
    console.log('Expected: pending, processing, shipped, delivered, cancelled, refunded\n');

    // Check orders.payment_status
    const paymentStatus = await pool.query(`
      SELECT DISTINCT payment_status, COUNT(*) as count
      FROM orders
      GROUP BY payment_status
      ORDER BY count DESC
    `);
    console.log('💳 orders.payment_status:');
    console.log(paymentStatus.rows);
    console.log('Expected: pending, paid, failed, refunded, partially_paid\n');

    // Check orders.payment_method
    const paymentMethod = await pool.query(`
      SELECT DISTINCT payment_method, COUNT(*) as count
      FROM orders
      GROUP BY payment_method
      ORDER BY count DESC
    `);
    console.log('💰 orders.payment_method:');
    console.log(paymentMethod.rows);
    console.log('Expected: cash, credit_card, debit_card, transfer, mercadopago, other\n');

    // Check orders.source
    const source = await pool.query(`
      SELECT DISTINCT source, COUNT(*) as count
      FROM orders
      GROUP BY source
      ORDER BY count DESC
    `);
    console.log('🌐 orders.source:');
    console.log(source.rows);
    console.log('Expected: website, whatsapp, phone, walk_in, app, admin\n');

    // Check whatsapp_conversations.status
    const waStatus = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM whatsapp_conversations
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('💬 whatsapp_conversations.status:');
    console.log(waStatus.rows);
    console.log('Expected: active, resolved, archived, escalated\n');

    // Check whatsapp_conversations.conversation_state
    const waState = await pool.query(`
      SELECT DISTINCT conversation_state, COUNT(*) as count
      FROM whatsapp_conversations
      GROUP BY conversation_state
      ORDER BY count DESC
    `);
    console.log('🔄 whatsapp_conversations.conversation_state:');
    console.log(waState.rows);
    console.log('Expected: idle, waiting_user, processing, waiting_appointment, waiting_product_info, completed\n');

    // Check whatsapp_messages.role
    const waRole = await pool.query(`
      SELECT DISTINCT role, COUNT(*) as count
      FROM whatsapp_messages
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('👤 whatsapp_messages.role:');
    console.log(waRole.rows);
    console.log('Expected: user, assistant, system\n');

    // Check kommo_conversations.status
    const kommoStatus = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM kommo_conversations
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('📞 kommo_conversations.status:');
    console.log(kommoStatus.rows);
    console.log('Expected: active, resolved, archived, escalated\n');

    // Check kommo_conversations.channel
    const kommoChannel = await pool.query(`
      SELECT DISTINCT channel, COUNT(*) as count
      FROM kommo_conversations
      GROUP BY channel
      ORDER BY count DESC
    `);
    console.log('📱 kommo_conversations.channel:');
    console.log(kommoChannel.rows);
    console.log('Expected: whatsapp, telegram, instagram, facebook, email, sms\n');

    // Check kommo_messages.role
    const kommoRole = await pool.query(`
      SELECT DISTINCT role, COUNT(*) as count
      FROM kommo_messages
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('👥 kommo_messages.role:');
    console.log(kommoRole.rows);
    console.log('Expected: user, assistant, system\n');

    // Check kommo_messages.content_type
    const contentType = await pool.query(`
      SELECT DISTINCT content_type, COUNT(*) as count
      FROM kommo_messages
      GROUP BY content_type
      ORDER BY count DESC
    `);
    console.log('📝 kommo_messages.content_type:');
    console.log(contentType.rows);
    console.log('Expected: text, image, video, audio, document, location, sticker\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkValues();
