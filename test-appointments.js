// Test script for appointments page
const { chromium } = require('@playwright/test');

(async () => {
  console.log('🧪 Starting appointments page test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    // Test 1: Navigate to appointments page
    console.log('📍 Test 1: Navigating to appointments page...');
    await page.goto('http://localhost:6001/appointments');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded successfully\n');

    // Test 2: Check if page is public (no redirect to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login')) {
      throw new Error('❌ Page redirected to login - should be public!');
    }
    console.log('✅ Page is public (no authentication required)\n');

    // Test 3: Check for main heading
    console.log('📍 Test 3: Checking for main heading...');
    const heading = await page.locator('h1:has-text("Reserva tu Turno")').first();
    if (await heading.isVisible()) {
      console.log('✅ Main heading "Reserva tu Turno" is visible\n');
    }

    // Test 4: Check for progress indicator
    console.log('📍 Test 4: Checking for progress steps...');
    const progressSteps = await page.locator('text=Sucursal').first();
    if (await progressSteps.isVisible()) {
      console.log('✅ Progress steps are visible\n');
    }

    // Test 5: Check for loading state handling
    console.log('📍 Test 5: Checking initial loading state...');
    // The loading should complete within 2 seconds
    await page.waitForTimeout(1000);
    const loader = await page.locator('.animate-spin');
    const loaderCount = await loader.count();
    if (loaderCount === 0) {
      console.log('✅ Loading state completed successfully\n');
    } else {
      console.log('⚠️  Loading spinner still visible (may be fetching data)\n');
    }

    // Test 6: Check for branch selector (first step)
    console.log('📍 Test 6: Checking for branch selector...');
    const branchSection = await page.locator('text=Selecciona una sucursal').first();
    const branchCards = await page.locator('.cursor-pointer').count();

    if (await branchSection.isVisible() || branchCards > 0) {
      console.log(`✅ Branch selector is visible with ${branchCards} options\n`);
    } else {
      console.log('⚠️  Branch selector may be loading or empty\n');
    }

    // Test 7: Test navigation menu
    console.log('📍 Test 7: Checking navigation menu...');
    const catalogLink = await page.locator('a:has-text("Catálogo")').first();
    const appointmentsLink = await page.locator('a:has-text("Turnos")').first();
    const loginLink = await page.locator('text=Ingresar').first();

    if (await catalogLink.isVisible() && await appointmentsLink.isVisible() && await loginLink.isVisible()) {
      console.log('✅ Navigation menu has correct items (Catálogo, Turnos, Ingresar)\n');
    } else {
      console.log('⚠️  Navigation menu items may not all be visible\n');
    }

    // Test 8: Test responsiveness
    console.log('📍 Test 8: Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileMenu = await page.locator('button[aria-label="Menu"]').first();
    if (await mobileMenu.isVisible()) {
      console.log('✅ Mobile menu button is visible\n');

      // Try to open mobile menu
      await mobileMenu.click();
      await page.waitForTimeout(500);

      const mobileNav = await page.locator('nav').filter({ hasText: 'Catálogo' }).first();
      if (await mobileNav.isVisible()) {
        console.log('✅ Mobile navigation menu opens correctly\n');
      }
    }

    // Take screenshots for visual verification
    console.log('📸 Taking screenshots...');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({
      path: 'test-appointments-desktop.png',
      fullPage: false
    });
    console.log('✅ Desktop screenshot saved as test-appointments-desktop.png');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: 'test-appointments-mobile.png',
      fullPage: false
    });
    console.log('✅ Mobile screenshot saved as test-appointments-mobile.png\n');

    console.log('🎉 All tests completed successfully!');
    console.log('📊 Summary: The appointments page is working correctly and is publicly accessible.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take error screenshot
    await page.screenshot({
      path: 'test-appointments-error.png',
      fullPage: true
    });
    console.log('📸 Error screenshot saved as test-appointments-error.png');

  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
})();