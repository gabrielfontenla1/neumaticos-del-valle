import { test, expect } from '@playwright/test'

test('Admin login should redirect to dashboard', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:6001/auth/login')

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Fill login form
  await page.fill('input[type="email"]', 'admin@neumaticosdelValle.com')
  await page.fill('input[type="password"]', 'Admin123!')

  // Click login button
  await page.click('button[type="submit"]')

  // Wait for navigation to dashboard
  await page.waitForURL('http://localhost:6001/dashboard', { timeout: 15000 })

  // Take screenshot for debugging
  await page.screenshot({ path: 'login-result.png', fullPage: true })

  // Check if redirected to dashboard
  const currentUrl = page.url()
  console.log('✅ Login successful! Current URL:', currentUrl)

  // Verify we're on the dashboard
  expect(currentUrl).toBe('http://localhost:6001/dashboard')

  console.log('✅ Test passed: Admin successfully logged in and redirected to dashboard')
})
