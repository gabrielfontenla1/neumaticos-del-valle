/**
 * Manual UI Check - Take screenshots and verify dashboard
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkDashboard() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  try {
    console.log('\n📸 Manual UI Check - Services Dashboard\n')
    console.log('═'.repeat(80))

    // Navigate to dashboard
    console.log('1. Navigating to /admin/servicios...')
    await page.goto('http://localhost:6001/admin/servicios', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true })
    console.log('   ✅ Screenshot saved: dashboard-screenshot.png')

    // Get page content
    const content = await page.content()
    console.log(`   ℹ️  Page length: ${content.length} characters`)

    // Check for button
    const buttonExists = await page.locator('text=Agregar').count()
    console.log(`   ℹ️  "Agregar" buttons found: ${buttonExists}`)

    // Get all buttons
    const allButtons = await page.locator('button').allTextContents()
    console.log(`   ℹ️  All button texts: ${allButtons.slice(0, 10).join(', ')}`)

    // Check current services in DB
    console.log('\n2. Checking database...')
    const { data: services } = await supabase
      .from('appointment_services')
      .select('id, name, price')
      .order('name')

    console.log(`   ℹ️  Services in DB: ${services?.length || 0}`)
    services?.forEach((s: any) => {
      console.log(`      - ${s.name}: $${s.price}`)
    })

    // Keep browser open for manual inspection
    console.log('\n3. Browser will stay open for 30 seconds for manual inspection...')
    console.log('   👀 Check the browser window to see the dashboard')
    console.log('')

    await page.waitForTimeout(30000)

    console.log('═'.repeat(80))
    console.log('✅ Manual check complete')
    console.log('')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    await page.screenshot({ path: 'error-screenshot.png' })
    console.log('   📸 Error screenshot saved: error-screenshot.png')
  } finally {
    await browser.close()
  }
}

checkDashboard()
