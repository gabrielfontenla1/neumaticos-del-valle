#!/usr/bin/env ts-node
/**
 * End-to-End Order Flow Test Script
 * Simulates complete order lifecycle: Cart -> Checkout -> Order -> Status Updates
 *
 * Usage: npm run test:e2e
 * or: ts-node src/scripts/test-order-flow.ts
 */

import { createClient } from '@supabase/supabase-js'

interface TestResult {
  step: number
  name: string
  status: 'PASS' | 'FAIL'
  duration: number
  message: string
  data?: Record<string, unknown>
}

interface ApiCallResponse {
  status: number
  data: Record<string, unknown>
  duration: number
}

interface OrderData {
  id: string
  order_number: string
  customer_email: string
  status: string
  total_amount?: number
}

const results: TestResult[] = []
const baseUrl = process.env.API_BASE_URL || 'http://localhost:6001'

// Helper to make API calls
async function apiCall(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
  step?: number
): Promise<ApiCallResponse> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    return { status: response.status, data, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    throw { status: 0, data: error, duration }
  }
}

// Helper to add result
function addResult(
  step: number,
  name: string,
  status: 'PASS' | 'FAIL',
  message: string,
  data?: Record<string, unknown>,
  duration: number = 0
) {
  const result: TestResult = { step, name, status, message, data, duration }
  results.push(result)

  const icon = status === 'PASS' ? '✅' : '❌'
  const timing = duration > 0 ? ` (${duration}ms)` : ''
  console.log(`${icon} Step ${step}: ${name}${timing}`)
  console.log(`   ${message}\n`)
}

// ============ TEST STEPS ============

/**
 * Step 1: Verify API is accessible
 */
async function testApiHealth() {
  console.log('🧪 Step 1: Checking API Health...\n')

  try {
    const { status, duration } = await apiCall('GET', '/api/health')

    if (status === 200) {
      addResult(1, 'API Health Check', 'PASS', 'API is accessible and healthy', {}, duration)
      return true
    } else {
      addResult(1, 'API Health Check', 'FAIL', `API returned status ${status}`, {}, duration)
      return false
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(1, 'API Health Check', 'FAIL', `Failed to reach API: ${message}`)
    return false
  }
}

/**
 * Step 2: Create a test order (simulating checkout)
 */
async function testCreateOrder() {
  console.log('🧪 Step 2: Creating Test Order...\n')

  const testOrderData = {
    customer_name: 'Test Customer E2E',
    customer_email: 'test-e2e@neumaticos.com',
    customer_phone: '+58-412-9876543',
    items: [
      {
        product_id: 'prod-001',
        product_name: 'Michelin Pilot Sport 4',
        sku: 'MICH-PS4-215-55-17',
        quantity: 2,
        unit_price: 250.0,
        total_price: 500.0,
        brand: 'Michelin',
        model: 'Pilot Sport 4',
        image_url: 'https://example.com/tires/michelin-ps4.jpg',
      },
      {
        product_id: 'prod-002',
        product_name: 'Bridgestone Turanza T005',
        sku: 'BRID-T005-225-50-18',
        quantity: 1,
        unit_price: 180.0,
        total_price: 180.0,
        brand: 'Bridgestone',
        model: 'Turanza T005',
        image_url: 'https://example.com/tires/bridgestone-t005.jpg',
      },
    ],
    subtotal: 680.0,
    tax: 108.8,
    shipping: 50.0,
    payment_method: 'credit_card',
    source: 'website',
    notes: 'Test order for E2E testing',
  }

  try {
    const { status, data, duration } = await apiCall('POST', '/api/orders', testOrderData)

    if (status === 201 && data.success && data.order) {
      const order = data.order as OrderData
      addResult(
        2,
        'Create Order',
        'PASS',
        `Order created: ${order.order_number} (ID: ${order.id})`,
        { order_number: order.order_number, order_id: order.id },
        duration
      )
      return { success: true, order }
    } else {
      addResult(
        2,
        'Create Order',
        'FAIL',
        `Failed to create order: ${data.error || 'Unknown error'}`,
        data,
        duration
      )
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(2, 'Create Order', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Step 3: Fetch created order to verify it exists
 */
async function testFetchOrder(orderNumber: string, email: string) {
  console.log('🧪 Step 3: Fetching Created Order...\n')

  try {
    const { status, data, duration } = await apiCall(
      'GET',
      `/api/orders?order_number=${orderNumber}&email=${email}`
    )

    if (status === 200 && data.success && data.order) {
      const order = data.order as OrderData
      addResult(
        3,
        'Fetch Order',
        'PASS',
        `Order found: ${order.order_number} with status: ${order.status}`,
        { status: order.status, total: order.total_amount },
        duration
      )
      return { success: true, order }
    } else {
      addResult(
        3,
        'Fetch Order',
        'FAIL',
        `Failed to fetch order: ${data.error || 'Unknown error'}`,
        data,
        duration
      )
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(3, 'Fetch Order', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Step 4: List all orders to verify pagination and filtering
 */
async function testListOrders() {
  console.log('🧪 Step 4: Listing All Orders...\n')

  try {
    const { status, data, duration } = await apiCall('GET', '/api/admin/orders?page=1&limit=10')

    if (status === 200 && data.success) {
      const total = data.total as number
      const orders = data.orders as OrderData[]
      addResult(
        4,
        'List Orders',
        'PASS',
        `Found ${total} orders (showing ${orders.length} per page)`,
        { total, count: orders.length, totalPages: data.totalPages },
        duration
      )
      return { success: true, orders }
    } else {
      addResult(
        4,
        'List Orders',
        'FAIL',
        `Failed to list orders: ${data.error || 'Unknown error'}`,
        data,
        duration
      )
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(4, 'List Orders', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Step 5: Update order status
 */
async function testUpdateOrderStatus(orderId: string) {
  console.log('🧪 Step 5: Updating Order Status...\n')

  try {
    const { status, data, duration } = await apiCall(
      'PATCH',
      `/api/admin/orders/${orderId}`,
      {
        status: 'confirmed',
        notes: 'Status updated during E2E test',
      }
    )

    if (status === 200 && data.success) {
      const order = data.order as OrderData
      addResult(
        5,
        'Update Order Status',
        'PASS',
        `Order status updated to: ${order.status}`,
        { status: order.status },
        duration
      )
      return { success: true, order }
    } else {
      addResult(
        5,
        'Update Order Status',
        'FAIL',
        `Failed to update status: ${data.error || 'Unknown error'}`,
        data,
        duration
      )
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(5, 'Update Order Status', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Step 6: Check order history
 */
async function testOrderHistory(orderId: string) {
  console.log('🧪 Step 6: Checking Order History...\n')

  try {
    // This would typically be a separate endpoint, but we'll check if order exists in list
    const { status, data } = await apiCall('GET', `/api/admin/orders?limit=50`)

    if (status === 200 && data.success) {
      const orders = data.orders as OrderData[]
      const order = orders.find((o: OrderData) => o.id === orderId)

      if (order) {
        addResult(
          6,
          'Order History',
          'PASS',
          `Order history accessible. Current status: ${order.status}`,
          { order_id: orderId, status: order.status }
        )
        return { success: true }
      } else {
        addResult(6, 'Order History', 'FAIL', `Order not found in history`)
        return { success: false }
      }
    } else {
      addResult(6, 'Order History', 'FAIL', `Failed to check history`)
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(6, 'Order History', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Step 7: Test filtering
 */
async function testOrderFiltering() {
  console.log('🧪 Step 7: Testing Order Filtering...\n')

  try {
    const { status, data, duration } = await apiCall(
      'GET',
      '/api/admin/orders?status=pending&payment_status=pending&limit=10'
    )

    if (status === 200 && data.success) {
      const orders = data.orders as OrderData[]
      const matchingOrders = orders.filter((o: OrderData) => o.status === 'pending')
      addResult(
        7,
        'Order Filtering',
        'PASS',
        `Found ${matchingOrders.length} orders with status=pending`,
        { filtered_count: matchingOrders.length },
        duration
      )
      return { success: true }
    } else {
      addResult(
        7,
        'Order Filtering',
        'FAIL',
        `Failed to filter orders: ${data.error || 'Unknown error'}`,
        data,
        duration
      )
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(7, 'Order Filtering', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Step 8: Test search functionality
 */
async function testOrderSearch() {
  console.log('🧪 Step 8: Testing Order Search...\n')

  try {
    const { status, data, duration } = await apiCall(
      'GET',
      '/api/admin/orders?search=test-e2e@neumaticos.com&limit=10'
    )

    if (status === 200 && data.success) {
      const orders = data.orders as OrderData[]
      const results = orders.filter((o: OrderData) => o.customer_email.includes('test-e2e'))
      addResult(
        8,
        'Order Search',
        'PASS',
        `Found ${results.length} orders matching search term`,
        { search_results: results.length },
        duration
      )
      return { success: true }
    } else {
      addResult(
        8,
        'Order Search',
        'FAIL',
        `Failed to search orders: ${data.error || 'Unknown error'}`,
        data,
        duration
      )
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(8, 'Order Search', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Step 9: Test pagination
 */
async function testPagination() {
  console.log('🧪 Step 9: Testing Pagination...\n')

  try {
    const page1 = await apiCall('GET', '/api/admin/orders?page=1&limit=5')
    const page2 = await apiCall('GET', '/api/admin/orders?page=2&limit=5')

    if (page1.status === 200 && page2.status === 200) {
      const orders1 = page1.data.orders as OrderData[]
      const orders2 = page2.data.orders as OrderData[]

      const hasDifferentOrders = !orders1.some((o: OrderData) =>
        orders2.find((p: OrderData) => p.id === o.id)
      )

      if (hasDifferentOrders || orders2.length === 0) {
        addResult(
          9,
          'Pagination',
          'PASS',
          `Pagination works correctly. Page 1: ${orders1.length}, Page 2: ${orders2.length}`,
          { page1_count: orders1.length, page2_count: orders2.length }
        )
        return { success: true }
      } else {
        addResult(9, 'Pagination', 'FAIL', `Pagination may not be working correctly`)
        return { success: false }
      }
    } else {
      addResult(9, 'Pagination', 'FAIL', `Failed to test pagination`)
      return { success: false }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult(9, 'Pagination', 'FAIL', `API call failed: ${message}`)
    return { success: false }
  }
}

/**
 * Generate final report
 */
function generateReport() {
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length
  const successRate = ((passed / total) * 100).toFixed(2)

  console.log('\n' + '='.repeat(70))
  console.log('E2E TEST REPORT')
  console.log('='.repeat(70))
  console.log(`\nTest Suite: Order Flow E2E`)
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(`\nResults Summary:`)
  console.log(`  ✅ Passed:  ${passed}/${total}`)
  console.log(`  ❌ Failed:  ${failed}/${total}`)
  console.log(`  📊 Success Rate: ${successRate}%`)

  if (failed > 0) {
    console.log(`\nFailed Tests:`)
    results
      .filter(r => r.status === 'FAIL')
      .forEach(result => {
        console.log(`  ❌ Step ${result.step}: ${result.name}`)
        console.log(`     ${result.message}`)
      })
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  console.log(`\nTotal Duration: ${totalDuration}ms`)
  console.log('='.repeat(70) + '\n')

  return { passed, failed, total, successRate, duration: totalDuration }
}

/**
 * Main function - Run all tests
 */
async function main() {
  console.log('\n🚀 Starting E2E Order Flow Tests...\n')

  // Step 1: Health check
  const healthOk = await testApiHealth()
  if (!healthOk) {
    console.log('❌ API is not available. Cannot continue with tests.')
    process.exit(1)
  }

  // Step 2: Create order
  const createResult = await testCreateOrder()
  if (!createResult.success) {
    console.log('❌ Failed to create order. Cannot continue with subsequent tests.')
    generateReport()
    process.exit(1)
  }

  const orderId = createResult.order!.id
  const orderNumber = createResult.order!.order_number
  const email = createResult.order!.customer_email

  // Step 3: Fetch order
  await testFetchOrder(orderNumber, email)

  // Step 4: List orders
  await testListOrders()

  // Step 5: Update status
  await testUpdateOrderStatus(orderId)

  // Step 6: Check history
  await testOrderHistory(orderId)

  // Step 7: Test filtering
  await testOrderFiltering()

  // Step 8: Test search
  await testOrderSearch()

  // Step 9: Test pagination
  await testPagination()

  // Generate final report
  const report = generateReport()

  // Exit with appropriate code
  process.exit(report.failed > 0 ? 1 : 0)
}

// Run the tests
main().catch(error => {
  console.error('Fatal error during tests:', error)
  process.exit(1)
})

export { testApiHealth, testCreateOrder, testFetchOrder }
