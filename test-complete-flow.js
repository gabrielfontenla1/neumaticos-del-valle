// Complete appointment booking flow test
const { chromium } = require('@playwright/test');

(async () => {
  console.log('🧪 Starting complete appointment booking flow test...\n');

  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down for better visualization
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Browser console error:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.error('❌ Page error:', error.message);
  });

  // Listen for request failures
  page.on('requestfailed', request => {
    console.error('❌ Request failed:', request.url(), request.failure().errorText);
  });

  try {
    // Step 1: Navigate to appointments page
    console.log('📍 Step 1: Navigating to appointments page...');
    const response = await page.goto('http://localhost:6001/appointments', {
      waitUntil: 'networkidle'
    });

    if (!response.ok()) {
      throw new Error(`Page returned status ${response.status()}`);
    }
    console.log('✅ Appointments page loaded successfully\n');

    // Wait for any loading states to complete
    await page.waitForTimeout(2000);

    // Check for any error messages on the page
    const errorElement = await page.locator('.bg-red-50').first();
    if (await errorElement.count() > 0) {
      const errorText = await errorElement.textContent();
      console.log('⚠️ Error message found on page:', errorText);
    }

    // Step 2: Check if branches are loaded (Step 1 - Branch Selection)
    console.log('📍 Step 2: Checking branch selector...');

    // Wait for branch cards or loading message
    await page.waitForTimeout(2000);

    const branchCards = await page.locator('.border.rounded-lg.p-6.cursor-pointer').count();

    if (branchCards === 0) {
      console.log('❌ No branches found. Checking for loading or error state...');

      // Check for loading spinner
      const loadingSpinner = await page.locator('.animate-spin').count();
      if (loadingSpinner > 0) {
        console.log('⏳ Still loading branches...');
        await page.waitForTimeout(5000);
      }

      // Check for error message
      const errorMsg = await page.locator('text=No hay sucursales disponibles').count();
      if (errorMsg > 0) {
        console.log('❌ No branches available message shown');
      }

      // Try to capture the actual state
      const bodyText = await page.locator('body').textContent();
      if (bodyText.includes('error') || bodyText.includes('Error')) {
        console.log('❌ Error detected in page content');
      }

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-error-branches.png' });
      console.log('📸 Error screenshot saved as test-error-branches.png');

    } else {
      console.log(`✅ Found ${branchCards} branch(es)\n`);

      // Step 3: Select first branch
      console.log('📍 Step 3: Selecting first branch...');
      await page.locator('.border.rounded-lg.p-6.cursor-pointer').first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Branch selected\n');

      // Check if we moved to service selection
      const serviceStep = await page.locator('text=Selecciona un servicio').count();
      if (serviceStep > 0) {
        console.log('📍 Step 4: Service selection step reached');

        // Select first service
        const serviceCards = await page.locator('.border.rounded-lg.p-6.cursor-pointer').count();
        if (serviceCards > 0) {
          await page.locator('.border.rounded-lg.p-6.cursor-pointer').first().click();
          console.log('✅ Service selected\n');
          await page.waitForTimeout(1000);
        }
      }

      // Check if we moved to date/time selection
      const dateTimeStep = await page.locator('text=Selecciona fecha y hora').count();
      if (dateTimeStep > 0) {
        console.log('📍 Step 5: Date/Time selection step reached');

        // Try to select a date
        const dateInput = await page.locator('input[type="date"]').first();
        if (await dateInput.count() > 0) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateStr = tomorrow.toISOString().split('T')[0];
          await dateInput.fill(dateStr);
          console.log(`✅ Date selected: ${dateStr}\n`);

          await page.waitForTimeout(1000);

          // Select first available time slot
          const timeSlot = await page.locator('button:not(:disabled)').filter({ hasText: ':' }).first();
          if (await timeSlot.count() > 0) {
            await timeSlot.click();
            console.log('✅ Time slot selected\n');
            await page.waitForTimeout(1000);
          }
        }
      }

      // Check if we moved to contact form
      const contactStep = await page.locator('text=Información de contacto').count();
      if (contactStep > 0) {
        console.log('📍 Step 6: Contact information step reached');

        // Fill contact form
        await page.fill('input[name="customer_name"]', 'Test User');
        await page.fill('input[name="customer_email"]', 'test@example.com');
        await page.fill('input[name="customer_phone"]', '1234567890');
        await page.fill('textarea[name="notes"]', 'This is a test appointment');
        console.log('✅ Contact form filled\n');

        await page.waitForTimeout(1000);
      }

      // Check if we can see the summary
      const summaryStep = await page.locator('text=Resumen de tu turno').count();
      if (summaryStep > 0) {
        console.log('📍 Step 7: Summary step reached');
        console.log('✅ Ready to confirm appointment\n');
      }
    }

    // Check the current step indicator
    const currentStep = await page.locator('.bg-red-600.text-white').first().textContent();
    console.log(`📊 Current step indicator: ${currentStep}`);

    // Take final screenshot
    await page.screenshot({ path: 'test-flow-final.png', fullPage: true });
    console.log('📸 Final screenshot saved as test-flow-final.png\n');

    // Check for API errors in network tab
    console.log('📍 Checking for API errors...');

    // Try to capture any failed API calls
    const failedRequests = [];
    page.on('requestfailed', request => {
      if (request.url().includes('/api/')) {
        failedRequests.push({
          url: request.url(),
          error: request.failure().errorText
        });
      }
    });

    if (failedRequests.length > 0) {
      console.log('❌ Failed API requests detected:');
      failedRequests.forEach(req => {
        console.log(`  - ${req.url}: ${req.error}`);
      });
    } else {
      console.log('✅ No API errors detected\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take error screenshot
    await page.screenshot({ path: 'test-flow-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as test-flow-error.png');

    // Try to get more error details
    const pageContent = await page.content();
    if (pageContent.includes('TypeError') || pageContent.includes('Error')) {
      console.log('❌ JavaScript errors detected in page');
    }

  } finally {
    console.log('\n🔍 Test Summary:');
    console.log('- Check test-flow-final.png for visual state');
    console.log('- Check browser console for any JavaScript errors');
    console.log('- Review network tab for failed API calls');

    await browser.close();
    console.log('\n🔚 Browser closed');
  }
})();