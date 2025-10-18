const { chromium } = require('playwright');

async function testAppointmentFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down to see what's happening
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('🚀 Starting appointment flow test...\n');

    // Step 1: Navigate to appointments page
    console.log('📍 Step 1: Navigating to appointments page...');
    await page.goto('http://localhost:6001/appointments', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if branches loaded
    const branches = await page.$$('[data-testid="branch-card"], .branch-card, [class*="branch"], [class*="store"]');
    console.log(`   Found ${branches.length} branch elements`);

    // Check for any error messages
    const errorElement = await page.$('.error, [class*="error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log(`   ⚠️ Error message found: ${errorText}`);
    }

    // Look for branch names directly
    const hasCentral = await page.textContent('body').then(text => text.includes('Sucursal Central'));
    const hasNorte = await page.textContent('body').then(text => text.includes('Sucursal Norte'));
    const hasSur = await page.textContent('body').then(text => text.includes('Sucursal Sur'));

    if (hasCentral && hasNorte && hasSur) {
      console.log('   ✅ All branches loaded correctly!');
      console.log('   • Sucursal Central');
      console.log('   • Sucursal Norte');
      console.log('   • Sucursal Sur');
    } else {
      console.log('   ❌ Branches not loading properly');
      console.log(`   Central: ${hasCentral}, Norte: ${hasNorte}, Sur: ${hasSur}`);
    }

    // Step 2: Try to select a branch
    console.log('\n📍 Step 2: Selecting a branch...');

    // Try different selectors
    const selectors = [
      'text=Sucursal Central',
      '[data-testid="branch-central"]',
      ':has-text("Sucursal Central")',
      'div:has-text("Sucursal Central")'
    ];

    let branchClicked = false;
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          console.log(`   ✅ Clicked on Sucursal Central using selector: ${selector}`);
          branchClicked = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!branchClicked) {
      console.log('   ⚠️ Could not click on branch - trying to proceed anyway');
    }

    await page.waitForTimeout(1000);

    // Check if we moved to the next step
    const hasServiceStep = await page.textContent('body').then(text =>
      text.includes('Servicio') || text.includes('service')
    );

    if (hasServiceStep) {
      console.log('   ✅ Moved to service selection step');
    } else {
      console.log('   ❌ Still on branch selection step');
    }

    // Step 3: Check Next button
    console.log('\n📍 Step 3: Checking navigation...');
    const nextButton = await page.$('button:has-text("Siguiente"), button:has-text("Next")');
    if (nextButton) {
      const isDisabled = await nextButton.isDisabled();
      console.log(`   Next button found - ${isDisabled ? 'disabled' : 'enabled'}`);

      if (!isDisabled) {
        await nextButton.click();
        console.log('   ✅ Clicked Next button');
        await page.waitForTimeout(1000);
      }
    }

    // Take a screenshot for debugging
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: 'appointment-test-result.png', fullPage: true });
    console.log('   Screenshot saved as appointment-test-result.png');

    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   Console error:', msg.text());
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 APPOINTMENT FLOW TEST COMPLETE!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAppointmentFlow();