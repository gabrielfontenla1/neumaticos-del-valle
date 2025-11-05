#!/usr/bin/env node
/**
 * Create Test Order
 * Run after creating the orders table in Supabase
 * Usage: node src/scripts/create-test-order.mjs
 */

import fetch from 'node-fetch'

const API_URL = 'http://localhost:6001'

async function createTestOrder() {
  console.log('🚀 Creating test order...\n')

  const testOrder = {
    customer_name: 'Carlos González',
    customer_email: 'carlos.gonzalez@example.com',
    customer_phone: '+54 11 2345-6789',
    payment_method: 'efectivo',
    payment_status: 'pending',
    status: 'pending',
    source: 'whatsapp',
    items: [
      {
        product_id: 'test-001',
        name: 'Neumático Bridgestone 195/65R15',
        brand: 'Bridgestone',
        quantity: 4,
        price: 38500,
        total_price: 154000
      },
      {
        product_id: 'test-002',
        name: 'Alineación y Balanceo',
        brand: 'Servicio',
        quantity: 1,
        price: 15000,
        total_price: 15000
      }
    ],
    subtotal: 169000,
    tax: 0,
    shipping: 0,
    notes: 'Cliente necesita los neumáticos para el lunes. Llamar antes de entregar.'
  }

  try {
    console.log('📝 Order details:')
    console.log('  Customer:', testOrder.customer_name)
    console.log('  Items:', testOrder.items.length)
    console.log('  Total:', testOrder.subtotal)
    console.log('')

    console.log('📡 Sending request to API...')
    const response = await fetch(`${API_URL}/api/admin/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      console.log('\n✅ Order created successfully!')
      console.log('  Order Number:', result.order?.order_number)
      console.log('  Order ID:', result.order?.id)
      console.log('  Status:', result.order?.status)
      console.log('  Total:', result.order?.total_amount)
      console.log('\n📋 View in dashboard:')
      console.log('  http://localhost:6001/admin/orders')
    } else {
      console.error('\n❌ Failed to create order')
      console.error('  Status:', response.status)
      console.error('  Error:', result.error || 'Unknown error')

      if (result.error?.includes('orders')) {
        console.log('\n💡 Tip: Make sure you created the orders table in Supabase')
        console.log('  Run the SQL from: src/database/migrations/create_orders_tables_fixed.sql')
      }
    }
  } catch (error) {
    console.error('\n❌ Error creating test order:', error.message)
    console.log('\n💡 Tips:')
    console.log('  1. Make sure the Next.js server is running (npm run dev)')
    console.log('  2. Make sure the orders table exists in Supabase')
    console.log('  3. Check the server logs for more details')
  }
}

// Create multiple test orders
async function createMultipleTestOrders(count = 5) {
  console.log(`🚀 Creating ${count} test orders...\n`)

  const customers = [
    { name: 'María López', email: 'maria.lopez@example.com', phone: '+54 11 3456-7890' },
    { name: 'Juan Martínez', email: 'juan.martinez@example.com', phone: '+54 11 4567-8901' },
    { name: 'Ana Rodríguez', email: 'ana.rodriguez@example.com', phone: '+54 11 5678-9012' },
    { name: 'Pedro Sánchez', email: 'pedro.sanchez@example.com', phone: '+54 11 6789-0123' },
    { name: 'Laura Fernández', email: 'laura.fernandez@example.com', phone: '+54 11 7890-1234' }
  ]

  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
  const paymentMethods = ['efectivo', 'transferencia', 'mercadopago', 'tarjeta']
  const sources = ['website', 'whatsapp', 'phone', 'in_store']

  for (let i = 0; i < Math.min(count, customers.length); i++) {
    const customer = customers[i]
    const orderData = {
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      payment_status: i < 2 ? 'pending' : 'completed',
      status: statuses[i % statuses.length],
      source: sources[Math.floor(Math.random() * sources.length)],
      items: [
        {
          product_id: `prod-${i + 1}`,
          name: `Neumático ${i % 2 === 0 ? 'Michelin' : 'Bridgestone'} ${195 + i * 10}/${55 + i}R${15 + i}`,
          brand: i % 2 === 0 ? 'Michelin' : 'Bridgestone',
          quantity: 2 + (i % 3),
          price: 35000 + (i * 5000),
          total_price: (35000 + (i * 5000)) * (2 + (i % 3))
        }
      ],
      subtotal: (35000 + (i * 5000)) * (2 + (i % 3)),
      tax: 0,
      shipping: 0,
      notes: `Orden de prueba #${i + 1}`
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log(`✅ Order ${i + 1}: ${result.order?.order_number} - ${customer.name}`)
      } else {
        console.log(`❌ Order ${i + 1} failed: ${result.error}`)
      }
    } catch (error) {
      console.log(`❌ Order ${i + 1} error: ${error.message}`)
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n📋 View all orders in dashboard:')
  console.log('  http://localhost:6001/admin/orders')
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'multiple') {
    const count = parseInt(args[1]) || 5
    await createMultipleTestOrders(count)
  } else {
    await createTestOrder()

    console.log('\n💡 Tip: To create multiple test orders, run:')
    console.log('  node src/scripts/create-test-order.mjs multiple 5')
  }
}

main().catch(console.error)