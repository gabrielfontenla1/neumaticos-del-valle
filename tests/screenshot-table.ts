import { chromium } from 'playwright'

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  try {
    console.log('📸 Taking screenshot of new table design...')

    // Navigate to login
    await page.goto('http://localhost:6001/admin/servicios')
    await page.waitForTimeout(2000)

    // Login
    await page.fill('input[type="email"]', 'admin@neumaticosdelvalleocr.cl')
    await page.fill('input[type="password"]', 'admin2024')
    await page.click('button:has-text("Iniciar sesión")')
    await page.waitForTimeout(5000)

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({
      path: 'table-design-screenshot.png',
      fullPage: true
    })

    console.log('✅ Screenshot saved: table-design-screenshot.png')
    console.log('   Browser will stay open for 20 seconds for inspection...')

    await page.waitForTimeout(20000)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await browser.close()
  }
}

takeScreenshot()
