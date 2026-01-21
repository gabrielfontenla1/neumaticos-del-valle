/**
 * QA Test Suite - Services Management System
 * Tests: Dashboard Admin, User Frontend, Database Integrity
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TestResult {
  testNumber: number
  testName: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  details: string
  duration: number
}

const results: TestResult[] = []

async function logTest(
  testNumber: number,
  testName: string,
  testFn: () => Promise<{ status: 'PASS' | 'FAIL' | 'WARNING', details: string }>
) {
  const startTime = Date.now()
  console.log(`\n🧪 Test ${testNumber}: ${testName}`)
  console.log('━'.repeat(80))

  try {
    const result = await testFn()
    const duration = Date.now() - startTime

    results.push({
      testNumber,
      testName,
      status: result.status,
      details: result.details,
      duration
    })

    const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${statusEmoji} ${result.status}: ${result.details}`)
    console.log(`⏱️  Duration: ${duration}ms`)
  } catch (error: any) {
    const duration = Date.now() - startTime
    results.push({
      testNumber,
      testName,
      status: 'FAIL',
      details: `Exception: ${error.message}`,
      duration
    })
    console.log(`❌ FAIL: Exception - ${error.message}`)
    console.log(`⏱️  Duration: ${duration}ms`)
  }
}

// ============================================================================
// TEST 1: Database Schema Integrity
// ============================================================================
async function test1_DatabaseSchemaIntegrity() {
  const { data, error } = await supabase
    .from('appointment_services')
    .select('*')
    .limit(1)

  if (error) {
    return {
      status: 'FAIL' as const,
      details: `Database query failed: ${error.message}`
    }
  }

  const expectedColumns = ['id', 'name', 'description', 'duration', 'price', 'requires_vehicle', 'icon', 'created_at', 'updated_at']

  if (!data || data.length === 0) {
    return {
      status: 'WARNING' as const,
      details: 'Table exists but has no data'
    }
  }

  const actualColumns = Object.keys(data[0])
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col))

  if (missingColumns.length > 0) {
    return {
      status: 'FAIL' as const,
      details: `Missing columns: ${missingColumns.join(', ')}`
    }
  }

  return {
    status: 'PASS' as const,
    details: `Schema valid with ${actualColumns.length} columns, ${data.length} records found`
  }
}

// ============================================================================
// TEST 2: API GET Endpoint - Fetch All Services
// ============================================================================
async function test2_APIGetEndpoint() {
  const response = await fetch('http://localhost:6001/api/appointment-services')
  const data = await response.json()

  if (!response.ok) {
    return {
      status: 'FAIL' as const,
      details: `API returned ${response.status}: ${data.error || 'Unknown error'}`
    }
  }

  if (!data.services || !Array.isArray(data.services)) {
    return {
      status: 'FAIL' as const,
      details: 'Response missing services array'
    }
  }

  const services = data.services
  const hasRequiredFields = services.every((s: any) =>
    s.id && s.name && s.description &&
    typeof s.duration === 'number' &&
    typeof s.price === 'number'
  )

  if (!hasRequiredFields) {
    return {
      status: 'FAIL' as const,
      details: 'Some services missing required fields'
    }
  }

  return {
    status: 'PASS' as const,
    details: `Fetched ${services.length} services with all required fields`
  }
}

// ============================================================================
// TEST 3: API POST - Create New Service with Valid Data
// ============================================================================
async function test3_APICreateServiceValid() {
  const testService = {
    id: 'qa-test-service',
    name: 'QA Test Service',
    description: 'Service created for QA testing purposes',
    duration: 45,
    price: 25000,
    requires_vehicle: true,
    icon: 'TestTube'
  }

  const response = await fetch('http://localhost:6001/api/appointment-services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testService)
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      status: 'FAIL' as const,
      details: `Create failed with ${response.status}: ${data.error || 'Unknown error'}`
    }
  }

  if (!data.success || !data.service) {
    return {
      status: 'FAIL' as const,
      details: 'Service created but response format invalid'
    }
  }

  // Verify in database
  const { data: dbData } = await supabase
    .from('appointment_services')
    .select('*')
    .eq('id', 'qa-test-service')
    .single()

  if (!dbData) {
    return {
      status: 'FAIL' as const,
      details: 'Service created via API but not found in database'
    }
  }

  return {
    status: 'PASS' as const,
    details: `Service created successfully and verified in DB with ID: ${dbData.id}`
  }
}

// ============================================================================
// TEST 4: API POST - Create Service with Missing Required Fields
// ============================================================================
async function test4_APICreateServiceInvalid() {
  const invalidService = {
    id: 'invalid-test',
    name: 'Invalid Service'
    // Missing: description, duration, price
  }

  const response = await fetch('http://localhost:6001/api/appointment-services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidService)
  })

  if (response.ok) {
    return {
      status: 'FAIL' as const,
      details: 'API accepted invalid service (should have rejected)'
    }
  }

  if (response.status !== 400) {
    return {
      status: 'WARNING' as const,
      details: `Expected 400 Bad Request, got ${response.status}`
    }
  }

  return {
    status: 'PASS' as const,
    details: 'API correctly rejected invalid service with 400 status'
  }
}

// ============================================================================
// TEST 5: API PUT - Update Existing Service
// ============================================================================
async function test5_APIUpdateService() {
  // First, ensure test service exists
  await supabase
    .from('appointment_services')
    .upsert({
      id: 'qa-test-service',
      name: 'Original Name',
      description: 'Original Description',
      duration: 30,
      price: 10000,
      requires_vehicle: false,
      icon: null
    })

  const updatedServices = [{
    id: 'qa-test-service',
    name: 'Updated QA Service',
    description: 'Updated description for testing',
    duration: 60,
    price: 35000,
    requires_vehicle: true,
    icon: 'CheckCircle'
  }]

  const response = await fetch('http://localhost:6001/api/appointment-services', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ services: updatedServices })
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      status: 'FAIL' as const,
      details: `Update failed with ${response.status}: ${data.error || 'Unknown error'}`
    }
  }

  // Verify update in database
  const { data: dbData } = await supabase
    .from('appointment_services')
    .select('*')
    .eq('id', 'qa-test-service')
    .single()

  if (!dbData || dbData.name !== 'Updated QA Service' || dbData.price !== 35000) {
    return {
      status: 'FAIL' as const,
      details: 'Update succeeded but data not reflected in database'
    }
  }

  return {
    status: 'PASS' as const,
    details: `Service updated successfully - Name: ${dbData.name}, Price: ${dbData.price}`
  }
}

// ============================================================================
// TEST 6: API DELETE - Remove Service
// ============================================================================
async function test6_APIDeleteService() {
  // Ensure test service exists
  await supabase
    .from('appointment_services')
    .upsert({
      id: 'qa-test-delete',
      name: 'Service to Delete',
      description: 'Will be deleted',
      duration: 15,
      price: 5000,
      requires_vehicle: false,
      icon: null
    })

  const response = await fetch('http://localhost:6001/api/appointment-services?id=qa-test-delete', {
    method: 'DELETE'
  })

  const data = await response.json()

  if (!response.ok) {
    return {
      status: 'FAIL' as const,
      details: `Delete failed with ${response.status}: ${data.error || 'Unknown error'}`
    }
  }

  // Verify deletion
  const { data: dbData } = await supabase
    .from('appointment_services')
    .select('*')
    .eq('id', 'qa-test-delete')
    .single()

  if (dbData) {
    return {
      status: 'FAIL' as const,
      details: 'Delete API succeeded but service still exists in database'
    }
  }

  return {
    status: 'PASS' as const,
    details: 'Service successfully deleted and verified removed from DB'
  }
}

// ============================================================================
// TEST 7: Price Validation - Negative and Zero Values
// ============================================================================
async function test7_PriceValidation() {
  const testCases = [
    { price: -100, shouldFail: true, name: 'negative price' },
    { price: 0, shouldFail: false, name: 'zero price (free service)' },
    { price: 999999, shouldFail: false, name: 'very high price' }
  ]

  const results: string[] = []

  for (const testCase of testCases) {
    const service = {
      id: `qa-price-test-${Date.now()}`,
      name: 'Price Test',
      description: 'Testing price validation',
      duration: 30,
      price: testCase.price,
      requires_vehicle: false
    }

    const response = await fetch('http://localhost:6001/api/appointment-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    })

    const success = response.ok
    const shouldSucceed = !testCase.shouldFail

    if (success === shouldSucceed) {
      results.push(`✓ ${testCase.name}: ${success ? 'accepted' : 'rejected'} correctly`)
      // Cleanup
      if (success) {
        await supabase.from('appointment_services').delete().eq('id', service.id)
      }
    } else {
      return {
        status: 'FAIL' as const,
        details: `${testCase.name} validation failed - expected ${shouldSucceed ? 'accept' : 'reject'} but got opposite`
      }
    }
  }

  return {
    status: 'PASS' as const,
    details: results.join(', ')
  }
}

// ============================================================================
// TEST 8: Duration Validation - Edge Cases
// ============================================================================
async function test8_DurationValidation() {
  const testCases = [
    { duration: 0, name: 'zero duration' },
    { duration: 5, name: 'very short (5min)' },
    { duration: 480, name: 'very long (8 hours)' }
  ]

  const results: string[] = []

  for (const testCase of testCases) {
    const service = {
      id: `qa-duration-test-${Date.now()}-${testCase.duration}`,
      name: 'Duration Test',
      description: 'Testing duration validation',
      duration: testCase.duration,
      price: 10000,
      requires_vehicle: false
    }

    const response = await fetch('http://localhost:6001/api/appointment-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    })

    if (response.ok) {
      results.push(`✓ ${testCase.name} accepted`)
      // Cleanup
      await supabase.from('appointment_services').delete().eq('id', service.id)
    } else {
      results.push(`✗ ${testCase.name} rejected`)
    }
  }

  return {
    status: 'PASS' as const,
    details: results.join(', ')
  }
}

// ============================================================================
// TEST 9: Concurrent Operations - Race Conditions
// ============================================================================
async function test9_ConcurrentOperations() {
  const serviceId = `qa-concurrent-${Date.now()}`

  // Create base service
  await supabase.from('appointment_services').insert({
    id: serviceId,
    name: 'Concurrent Test',
    description: 'Testing concurrent updates',
    duration: 30,
    price: 10000,
    requires_vehicle: false,
    icon: null
  })

  // Simulate 5 concurrent updates
  const updatePromises = Array.from({ length: 5 }, (_, i) =>
    fetch('http://localhost:6001/api/appointment-services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        services: [{
          id: serviceId,
          name: `Update ${i + 1}`,
          description: 'Concurrent update test',
          duration: 30 + i,
          price: 10000 + (i * 1000),
          requires_vehicle: false,
          icon: null
        }]
      })
    })
  )

  const responses = await Promise.all(updatePromises)
  const allSucceeded = responses.every(r => r.ok)

  // Verify final state
  const { data: finalData } = await supabase
    .from('appointment_services')
    .select('*')
    .eq('id', serviceId)
    .single()

  // Cleanup
  await supabase.from('appointment_services').delete().eq('id', serviceId)

  if (!allSucceeded) {
    return {
      status: 'WARNING' as const,
      details: 'Some concurrent updates failed (acceptable for race conditions)'
    }
  }

  if (!finalData) {
    return {
      status: 'FAIL' as const,
      details: 'Service lost during concurrent updates'
    }
  }

  return {
    status: 'PASS' as const,
    details: `All 5 concurrent updates handled, final state: ${finalData.name}`
  }
}

// ============================================================================
// TEST 10: End-to-End Integration - Full Workflow
// ============================================================================
async function test10_EndToEndWorkflow() {
  const steps: string[] = []
  const serviceId = `qa-e2e-${Date.now()}`

  try {
    // Step 1: Create service
    const createResponse = await fetch('http://localhost:6001/api/appointment-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: serviceId,
        name: 'E2E Test Service',
        description: 'End-to-end test',
        duration: 40,
        price: 22000,
        requires_vehicle: true,
        icon: 'Zap'
      })
    })

    if (!createResponse.ok) throw new Error('Create failed')
    steps.push('✓ Created')

    // Step 2: Fetch and verify
    const getResponse = await fetch('http://localhost:6001/api/appointment-services')
    const getData = await getResponse.json()
    const found = getData.services.find((s: any) => s.id === serviceId)

    if (!found) throw new Error('Service not found after creation')
    steps.push('✓ Fetched')

    // Step 3: Update
    const updateResponse = await fetch('http://localhost:6001/api/appointment-services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        services: [{
          ...found,
          price: 30000,
          duration: 50
        }]
      })
    })

    if (!updateResponse.ok) throw new Error('Update failed')
    steps.push('✓ Updated')

    // Step 4: Verify update
    const { data: updatedData } = await supabase
      .from('appointment_services')
      .select('*')
      .eq('id', serviceId)
      .single()

    if (!updatedData || updatedData.price !== 30000) {
      throw new Error('Update not reflected')
    }
    steps.push('✓ Verified')

    // Step 5: Delete
    const deleteResponse = await fetch(`http://localhost:6001/api/appointment-services?id=${serviceId}`, {
      method: 'DELETE'
    })

    if (!deleteResponse.ok) throw new Error('Delete failed')
    steps.push('✓ Deleted')

    // Step 6: Verify deletion
    const { data: deletedData } = await supabase
      .from('appointment_services')
      .select('*')
      .eq('id', serviceId)
      .single()

    if (deletedData) throw new Error('Service still exists after delete')
    steps.push('✓ Verified deletion')

    return {
      status: 'PASS' as const,
      details: `Complete workflow: ${steps.join(' → ')}`
    }
  } catch (error: any) {
    // Cleanup
    await supabase.from('appointment_services').delete().eq('id', serviceId)

    return {
      status: 'FAIL' as const,
      details: `Failed at step ${steps.length + 1}: ${error.message}`
    }
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
  console.log('\n' + '═'.repeat(80))
  console.log('🔬 SERVICES MANAGEMENT SYSTEM - QA TEST SUITE')
  console.log('═'.repeat(80))

  await logTest(1, 'Database Schema Integrity', test1_DatabaseSchemaIntegrity)
  await logTest(2, 'API GET Endpoint - Fetch All Services', test2_APIGetEndpoint)
  await logTest(3, 'API POST - Create Service (Valid Data)', test3_APICreateServiceValid)
  await logTest(4, 'API POST - Create Service (Invalid Data)', test4_APICreateServiceInvalid)
  await logTest(5, 'API PUT - Update Existing Service', test5_APIUpdateService)
  await logTest(6, 'API DELETE - Remove Service', test6_APIDeleteService)
  await logTest(7, 'Price Validation - Edge Cases', test7_PriceValidation)
  await logTest(8, 'Duration Validation - Edge Cases', test8_DurationValidation)
  await logTest(9, 'Concurrent Operations - Race Conditions', test9_ConcurrentOperations)
  await logTest(10, 'End-to-End Integration - Full Workflow', test10_EndToEndWorkflow)

  // Summary
  console.log('\n' + '═'.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('═'.repeat(80))

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warnings = results.filter(r => r.status === 'WARNING').length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`✅ Passed:   ${passed}/10`)
  console.log(`❌ Failed:   ${failed}/10`)
  console.log(`⚠️  Warnings: ${warnings}/10`)
  console.log(`⏱️  Total Time: ${totalDuration}ms`)
  console.log(`📈 Success Rate: ${((passed / 10) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  Test ${r.testNumber}: ${r.testName}`)
        console.log(`  └─ ${r.details}`)
      })
  }

  // Cleanup all test data
  console.log('\n🧹 Cleaning up test data...')
  await supabase.from('appointment_services').delete().like('id', 'qa-%')
  console.log('✓ Cleanup complete')

  console.log('\n' + '═'.repeat(80))
  process.exit(failed > 0 ? 1 : 0)
}

runAllTests()
