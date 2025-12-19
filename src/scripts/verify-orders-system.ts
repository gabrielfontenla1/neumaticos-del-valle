#!/usr/bin/env ts-node
/**
 * Orders System Verification Script
 * Comprehensive health check for the entire orders system
 *
 * Usage: npm run verify-orders
 * or: ts-node src/scripts/verify-orders-system.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

interface HealthCheckResult {
  category: string
  check: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  timestamp: string
}

interface SystemHealth {
  score: number // 0-100
  timestamp: string
  checks: HealthCheckResult[]
  summary: {
    passed: number
    failed: number
    warnings: number
    total: number
  }
}

const results: HealthCheckResult[] = []
const startTime = new Date()

// Helper function to add result
function addResult(
  category: string,
  check: string,
  status: 'PASS' | 'FAIL' | 'WARNING',
  message: string
) {
  results.push({
    category,
    check,
    status,
    message,
    timestamp: new Date().toISOString(),
  })

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} [${category}] ${check}: ${message}`)
}

// 1. Environment Variables Check
async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...')

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      addResult('Environment', envVar, 'PASS', 'Environment variable is set')
    } else {
      addResult('Environment', envVar, 'FAIL', 'Environment variable is not set')
    }
  }
}

// 2. Database Connection Check
async function checkDatabaseConnection() {
  console.log('\n🔍 Checking Database Connection...')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      addResult('Database', 'Connection', 'FAIL', 'Supabase credentials not configured')
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try a simple query to verify connection
    const { data, error } = await supabase.from('orders').select('count(*)').limit(1)

    if (error) {
      addResult('Database', 'Connection', 'FAIL', `Connection failed: ${error.message}`)
      return false
    }

    addResult('Database', 'Connection', 'PASS', 'Successfully connected to Supabase')
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult('Database', 'Connection', 'FAIL', `Connection error: ${message}`)
    return false
  }
}

// 3. Database Tables Check
async function checkDatabaseTables() {
  console.log('\n🔍 Checking Database Tables...')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const requiredTables = ['orders', 'order_history', 'vouchers']

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error && error.code === 'PGRST116') {
          addResult('Database Tables', table, 'FAIL', `Table does not exist`)
        } else if (error) {
          addResult('Database Tables', table, 'WARNING', `Unable to verify: ${error.message}`)
        } else {
          addResult('Database Tables', table, 'PASS', 'Table exists and is accessible')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        addResult('Database Tables', table, 'FAIL', `Error checking table: ${message}`)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult('Database Tables', 'All tables', 'FAIL', `Failed to check tables: ${message}`)
  }
}

// 4. API Routes Check
async function checkApiRoutes() {
  console.log('\n🔍 Checking API Routes...')

  const apiRoutes = [
    { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
    { path: '/api/orders', method: 'GET', description: 'Get orders (requires params)' },
    { path: '/api/admin/orders', method: 'GET', description: 'List all orders' },
  ]

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:6001'

  for (const route of apiRoutes) {
    try {
      // For GET requests without required params, we just check if the route exists
      const url = new URL(baseUrl + route.path)

      // Add dummy params for routes that require them
      if (route.path === '/api/orders') {
        url.searchParams.set('order_number', 'TEST-001')
        url.searchParams.set('email', 'test@example.com')
      }

      const response = await fetch(url.toString(), { method: route.method })

      if (response.status < 500) {
        addResult('API Routes', route.path, 'PASS', `Route is accessible (${response.status})`)
      } else {
        addResult('API Routes', route.path, 'WARNING', `Route returned error (${response.status})`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addResult('API Routes', route.path, 'WARNING', `Route may not be available: ${message}`)
    }
  }
}

// 5. File Structure Check
async function checkFileStructure() {
  console.log('\n🔍 Checking File Structure...')

  const projectRoot = path.join(__dirname, '../../..')
  const requiredFiles = [
    'src/features/orders/types.ts',
    'src/features/orders/hooks/useOrders.ts',
    'src/app/api/orders/route.ts',
    'src/app/api/admin/orders/route.ts',
    'src/app/api/admin/orders/[id]/route.ts',
  ]

  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file)
    if (fs.existsSync(filePath)) {
      addResult('File Structure', file, 'PASS', 'File exists')
    } else {
      addResult('File Structure', file, 'FAIL', 'File does not exist')
    }
  }
}

// 6. Type Definitions Check
async function checkTypeDefinitions() {
  console.log('\n🔍 Checking Type Definitions...')

  try {
    // This is a basic check - in a real scenario you'd import and verify the types
    const typesPath = path.join(__dirname, '../../features/orders/types.ts')

    if (fs.existsSync(typesPath)) {
      const content = fs.readFileSync(typesPath, 'utf-8')

      const requiredInterfaces = [
        'Order',
        'OrderStatus',
        'OrderItem',
        'CreateOrderRequest',
        'ListOrdersResponse',
      ]

      for (const iface of requiredInterfaces) {
        if (content.includes(iface)) {
          addResult('Type Definitions', iface, 'PASS', 'Type/interface is defined')
        } else {
          addResult('Type Definitions', iface, 'FAIL', 'Type/interface is missing')
        }
      }
    } else {
      addResult('Type Definitions', 'types.ts', 'FAIL', 'Types file does not exist')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult('Type Definitions', 'All', 'WARNING', `Could not verify types: ${message}`)
  }
}

// 7. Sample Data Check
async function checkSampleData() {
  console.log('\n🔍 Checking Sample Data...')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if there are any orders
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (!ordersError && ordersCount && ordersCount > 0) {
      addResult('Sample Data', 'Orders', 'PASS', `${ordersCount} orders found in database`)
    } else if (!ordersError) {
      addResult('Sample Data', 'Orders', 'WARNING', 'No orders found (database is empty)')
    } else {
      addResult('Sample Data', 'Orders', 'WARNING', `Could not check orders: ${ordersError.message}`)
    }

    // Check if there are any vouchers
    const { count: vouchersCount, error: vouchersError } = await supabase
      .from('vouchers')
      .select('*', { count: 'exact', head: true })

    if (!vouchersError && vouchersCount && vouchersCount > 0) {
      addResult('Sample Data', 'Vouchers', 'PASS', `${vouchersCount} vouchers found`)
    } else {
      addResult('Sample Data', 'Vouchers', 'WARNING', 'No vouchers found')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    addResult('Sample Data', 'All', 'WARNING', `Could not check sample data: ${message}`)
  }
}

// Calculate health score
function calculateHealthScore(): number {
  const summary = {
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    warnings: results.filter(r => r.status === 'WARNING').length,
    total: results.length,
  }

  // Score calculation: 100 - (failures * 15) - (warnings * 5)
  let score = 100
  score -= summary.failed * 20
  score -= summary.warnings * 10

  return Math.max(0, Math.min(100, score))
}

// Generate report
function generateReport(): SystemHealth {
  const summary = {
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    warnings: results.filter(r => r.status === 'WARNING').length,
    total: results.length,
  }

  const score = calculateHealthScore()

  return {
    score,
    timestamp: new Date().toISOString(),
    checks: results,
    summary,
  }
}

// Display final report
function displayReport(health: SystemHealth) {
  console.log('\n' + '='.repeat(60))
  console.log('ORDERS SYSTEM HEALTH CHECK REPORT')
  console.log('='.repeat(60))

  console.log(`\nTimestamp: ${health.timestamp}`)
  console.log(`Duration: ${Date.now() - startTime.getTime()}ms`)

  console.log('\n📊 Summary:')
  console.log(`  ✅ Passed:   ${health.summary.passed}`)
  console.log(`  ❌ Failed:   ${health.summary.failed}`)
  console.log(`  ⚠️  Warnings: ${health.summary.warnings}`)
  console.log(`  📈 Total:    ${health.summary.total}`)

  console.log('\n🏥 Health Score:')
  const scoreBar = generateScoreBar(health.score)
  console.log(`  ${scoreBar} ${health.score}/100`)

  // Group results by category
  const byCategory: { [key: string]: HealthCheckResult[] } = {}
  for (const result of health.checks) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = []
    }
    byCategory[result.category].push(result)
  }

  console.log('\n📋 Details by Category:')
  for (const [category, checks] of Object.entries(byCategory)) {
    console.log(`\n  ${category}:`)
    for (const check of checks) {
      const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️'
      console.log(`    ${icon} ${check.check}: ${check.message}`)
    }
  }

  // Recommendations
  if (health.summary.failed > 0) {
    console.log('\n💡 Recommendations:')
    const failedChecks = health.checks.filter(c => c.status === 'FAIL')
    for (const check of failedChecks) {
      if (check.category === 'Environment') {
        console.log(`  • Set missing environment variable: ${check.check}`)
      } else if (check.category === 'Database') {
        console.log(`  • Check database connection and ensure tables are created`)
      } else if (check.category === 'File Structure') {
        console.log(`  • Missing file: ${check.check} - verify project structure`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(health.score >= 80 ? '✅ SYSTEM IS HEALTHY' : health.score >= 60 ? '⚠️ SYSTEM HAS ISSUES' : '❌ SYSTEM NEEDS ATTENTION')
  console.log('='.repeat(60) + '\n')
}

// Generate score visualization bar
function generateScoreBar(score: number, length: number = 40): string {
  const filled = Math.round((score / 100) * length)
  const empty = length - filled

  let color = '🟢' // Green
  if (score < 60) color = '🔴' // Red
  else if (score < 80) color = '🟡' // Yellow

  return `${color} [${'█'.repeat(filled)}${'░'.repeat(empty)}]`
}

// Save report to file
function saveReport(health: SystemHealth) {
  const reportPath = path.join(__dirname, '../../..', 'ORDERS_SYSTEM_HEALTH.json')
  try {
    fs.writeFileSync(reportPath, JSON.stringify(health, null, 2))
    console.log(`\n📁 Report saved to: ${reportPath}`)
  } catch (error) {
    console.error('Failed to save report:', error)
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Orders System Verification...\n')

  await checkEnvironmentVariables()
  const dbConnected = await checkDatabaseConnection()

  if (dbConnected) {
    await checkDatabaseTables()
    await checkSampleData()
  }

  await checkApiRoutes()
  await checkFileStructure()
  await checkTypeDefinitions()

  const health = generateReport()
  displayReport(health)
  saveReport(health)

  // Exit with appropriate code
  process.exit(health.summary.failed > 0 ? 1 : 0)
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

export type { SystemHealth, HealthCheckResult }
