#!/usr/bin/env node
/**
 * Diagnose Orders System
 * Run: node src/scripts/diagnose-orders.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('🔍 Starting Orders System Diagnosis...\n')
console.log('Environment:')
console.log('  URL:', supabaseUrl)
console.log('  Has Anon Key:', !!supabaseAnonKey)
console.log('  Has Service Key:', !!supabaseServiceKey)
console.log('')

async function checkTableExists(supabase, tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Table '${tableName}' does not exist`)
        return false
      } else if (error.code === '42501') {
        console.log(`⚠️  Table '${tableName}' exists but no access (RLS policy issue)`)
        return true
      } else {
        console.log(`⚠️  Table '${tableName}' query error:`, error.message)
        return false
      }
    }

    console.log(`✅ Table '${tableName}' exists and is accessible`)
    return true
  } catch (err) {
    console.error(`❌ Error checking table '${tableName}':`, err)
    return false
  }
}

async function checkOrdersTable(supabase) {
  console.log('\n📊 Checking Orders Table...')

  // Check if table exists
  const exists = await checkTableExists(supabase, 'orders')
  if (!exists) {
    console.log('\n🔧 To create the orders table, run the migration:')
    console.log('  1. Go to Supabase Dashboard > SQL Editor')
    console.log('  2. Run the SQL from: src/database/migrations/create_orders_tables.sql')
    return false
  }

  // Try to count orders
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.log('❌ Cannot count orders:', error.message)
    return false
  }

  console.log(`✅ Orders table has ${count || 0} records`)

  // Try to get latest order
  const { data: latestOrder, error: latestError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (latestError && latestError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.log('⚠️  Cannot fetch latest order:', latestError.message)
  } else if (latestOrder) {
    console.log('✅ Latest order:', {
      order_number: latestOrder.order_number,
      created_at: latestOrder.created_at,
      status: latestOrder.status,
    })
  } else {
    console.log('ℹ️  No orders found in the table')
  }

  return true
}

async function checkVouchersTable(supabase) {
  console.log('\n📊 Checking Vouchers Table...')

  const exists = await checkTableExists(supabase, 'vouchers')
  if (!exists) {
    console.log('⚠️  Vouchers table is missing (required for order creation from checkout)')
    return false
  }

  // Count vouchers
  const { count, error } = await supabase
    .from('vouchers')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.log('❌ Cannot count vouchers:', error.message)
    return false
  }

  console.log(`✅ Vouchers table has ${count || 0} records`)
  return true
}

async function testAPIEndpoint() {
  console.log('\n🔌 Testing API Endpoints...')

  const baseUrl = 'http://localhost:6001'

  try {
    // Test orders API
    console.log('Testing /api/admin/orders...')
    const response = await fetch(`${baseUrl}/api/admin/orders?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.log(`❌ API returned status ${response.status}`)
      const text = await response.text()
      console.log('Response:', text.substring(0, 200))
      return false
    }

    const data = await response.json()
    if (data.success) {
      console.log('✅ API is working')
      console.log(`  Found ${data.total} orders`)
    } else {
      console.log('❌ API returned error:', data.error)
    }

    return data.success
  } catch (err) {
    console.log('❌ Cannot connect to API:', err.message)
    console.log('Make sure the Next.js server is running on port 6001')
    return false
  }
}

async function createRLSPolicies(supabase) {
  console.log('\n🔐 Checking/Creating RLS Policies...')

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseServiceKey) {
    console.log('⚠️  No service key found, cannot create RLS policies')
    console.log('  Add SUPABASE_SERVICE_KEY to .env.local to enable this')

    console.log('\n📋 RLS Policy Instructions:')
    console.log('Go to Supabase Dashboard > Authentication > Policies')
    console.log('For the "orders" table, create these policies:\n')

    const policies = [
      {
        name: 'Enable read for all users',
        table: 'orders',
        action: 'SELECT',
        check: 'true',
      },
      {
        name: 'Enable insert for all users',
        table: 'orders',
        action: 'INSERT',
        check: 'true',
      },
      {
        name: 'Enable update for all users',
        table: 'orders',
        action: 'UPDATE',
        check: 'true',
      },
    ]

    policies.forEach((policy, index) => {
      console.log(`${index + 1}. ${policy.name}`)
      console.log(`   - Operation: ${policy.action}`)
      console.log(`   - Policy: ${policy.check}`)
      console.log('')
    })

    console.log('Or run this SQL in the SQL Editor:')
    console.log(`
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON orders FOR UPDATE USING (true);
`)
    return
  }
}

async function main() {
  // Test with anon key (what the app uses)
  console.log('\n🔑 Testing with Anon Key (App Access)...')
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)

  const ordersExist = await checkOrdersTable(anonClient)
  const vouchersExist = await checkVouchersTable(anonClient)

  // Test with service key if available
  if (supabaseServiceKey) {
    console.log('\n🔑 Testing with Service Key (Admin Access)...')
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    await checkOrdersTable(serviceClient)
  }

  // Test API endpoint
  const apiWorks = await testAPIEndpoint()

  // Provide RLS policy instructions
  if (ordersExist && !apiWorks) {
    await createRLSPolicies(anonClient)
  }

  // Summary
  console.log('\n📊 Diagnosis Summary:')
  console.log('─'.repeat(40))

  if (ordersExist && vouchersExist && apiWorks) {
    console.log('✅ Orders system is properly configured!')
  } else {
    console.log('❌ Issues found:')
    if (!ordersExist) {
      console.log('  - Orders table needs to be created')
    }
    if (!vouchersExist) {
      console.log('  - Vouchers table needs to be created')
    }
    if (ordersExist && !apiWorks) {
      console.log('  - RLS policies need to be configured')
    }

    console.log('\n🔧 Next Steps:')
    console.log('1. Create missing tables using migration files')
    console.log('2. Configure RLS policies as shown above')
    console.log('3. Restart the Next.js server')
    console.log('4. Run this script again to verify')
  }
}

main().catch(console.error)