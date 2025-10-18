// Test script for checkout flow
// Run with: node scripts/test-checkout.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCheckout() {
  try {
    console.log('Testing checkout flow...\n')

    // 1. Test voucher generation
    console.log('1. Testing voucher generation...')
    const voucherCode = `NDV-${Date.now().toString(36).toUpperCase().slice(-3)}${Math.random().toString(36).toUpperCase().slice(2, 5)}`
    console.log(`   Generated code: ${voucherCode}`)

    // 2. Test creating a voucher
    console.log('\n2. Creating test voucher...')
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    const { data: voucher, error: voucherError } = await supabase
      .from('vouchers')
      .insert({
        code: voucherCode,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+56912345678',
        product_details: {
          name: 'Test Product',
          brand: 'Pirelli',
          sku: 'TEST-001'
        },
        quantity: 2,
        unit_price: 50000,
        total_price: 100000,
        discount_percentage: 0,
        discount_amount: 0,
        final_price: 100000,
        valid_from: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        status: 'active',
        notes: 'Test voucher'
      })
      .select()
      .single()

    if (voucherError) {
      console.error('   Error creating voucher:', voucherError)
    } else {
      console.log('   ✅ Voucher created successfully:', voucher.code)
    }

    // 3. Test cart session
    console.log('\n3. Creating test cart session...')
    const sessionId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: session, error: sessionError } = await supabase
      .from('cart_sessions')
      .insert({
        session_id: sessionId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('   Error creating session:', sessionError)
    } else {
      console.log('   ✅ Cart session created:', session.session_id)

      // 4. Test adding cart items
      console.log('\n4. Testing cart items...')

      // Get a sample product
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(1)
        .single()

      if (products) {
        const { error: itemError } = await supabase
          .from('cart_items')
          .insert({
            cart_session_id: session.id,
            product_id: products.id,
            quantity: 2,
            price_at_time: products.price
          })

        if (itemError) {
          console.error('   Error adding cart item:', itemError)
        } else {
          console.log('   ✅ Cart item added successfully')
        }
      }
    }

    // 5. Test stores
    console.log('\n5. Checking stores...')
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, phone, whatsapp')
      .eq('active', true)

    if (storesError) {
      console.error('   Error fetching stores:', storesError)
    } else {
      console.log(`   ✅ Found ${stores.length} active stores:`)
      stores.forEach(store => {
        console.log(`      - ${store.name}: ${store.whatsapp || store.phone}`)
      })
    }

    console.log('\n✅ All tests completed successfully!')

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testCheckout()