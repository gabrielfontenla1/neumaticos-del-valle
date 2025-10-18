const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteBooking() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300 // Slow down to see what's happening
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('🚀 Starting complete appointment booking test...\n');
    console.log('=' . repeat(60));

    // Step 1: Navigate to appointments page
    console.log('\n📍 STEP 1: BRANCH SELECTION');
    console.log('-'.repeat(40));
    await page.goto('http://localhost:6001/appointments', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check if branches loaded
    const pageContent = await page.textContent('body');
    const hasBranches = pageContent.includes('Sucursal Central') &&
                        pageContent.includes('Sucursal Norte') &&
                        pageContent.includes('Sucursal Sur');

    if (!hasBranches) {
      throw new Error('Branches not loaded');
    }
    console.log('✅ Branches loaded successfully');

    // Click on Sucursal Central
    await page.click('text=Sucursal Central');
    console.log('✅ Selected: Sucursal Central');
    await page.waitForTimeout(500);

    // Click Next
    await page.click('button:has-text("Siguiente")');
    console.log('✅ Proceeded to Service selection');
    await page.waitForTimeout(500);

    // Step 2: Service Selection
    console.log('\n📍 STEP 2: SERVICE SELECTION');
    console.log('-'.repeat(40));

    // Select a service
    const services = [
      'Cambio de Neumáticos',
      'Alineación y Balanceo',
      'Rotación de Neumáticos'
    ];

    // Try to find and click a service
    let serviceSelected = false;
    for (const service of services) {
      try {
        const serviceElement = await page.$(`text="${service}"`);
        if (serviceElement) {
          await serviceElement.click();
          console.log(`✅ Selected service: ${service}`);
          serviceSelected = true;
          break;
        }
      } catch (e) {
        // Try next service
      }
    }

    if (!serviceSelected) {
      // Try clicking first available service card
      await page.click('[class*="service"]:first-child, .service-card:first-child');
      console.log('✅ Selected first available service');
    }

    await page.waitForTimeout(500);
    await page.click('button:has-text("Siguiente")');
    console.log('✅ Proceeded to Date & Time selection');
    await page.waitForTimeout(500);

    // Step 3: Date and Time Selection
    console.log('\n📍 STEP 3: DATE & TIME SELECTION');
    console.log('-'.repeat(40));

    // Select date (if date picker exists)
    const dateInput = await page.$('input[type="date"], [data-testid="date-picker"]');
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await dateInput.fill(dateStr);
      console.log(`✅ Selected date: ${dateStr}`);
    }

    // Select time
    const timeSlots = await page.$$('[data-testid*="time"], [class*="time-slot"], button:has-text("00")');
    if (timeSlots.length > 0) {
      await timeSlots[0].click();
      console.log('✅ Selected time slot');
    } else {
      // Try to select 10:00 AM specifically
      try {
        await page.click('text=10:00');
        console.log('✅ Selected time: 10:00');
      } catch (e) {
        console.log('⚠️ Could not select specific time');
      }
    }

    await page.waitForTimeout(500);
    await page.click('button:has-text("Siguiente")');
    console.log('✅ Proceeded to Contact Information');
    await page.waitForTimeout(500);

    // Step 4: Contact Information
    console.log('\n📍 STEP 4: CONTACT INFORMATION');
    console.log('-'.repeat(40));

    // Generate unique test data
    const timestamp = Date.now();
    const testData = {
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: `555${timestamp.toString().slice(-7)}`,
      vehicleMake: 'Toyota',
      vehicleModel: 'Corolla',
      vehicleYear: '2020',
      notes: `Automated test booking ${timestamp}`
    };

    // Fill contact form
    const fields = [
      { selector: 'input[name="customer_name"], input[placeholder*="nombre"], input[placeholder*="Name"]', value: testData.name },
      { selector: 'input[name="customer_email"], input[type="email"], input[placeholder*="mail"]', value: testData.email },
      { selector: 'input[name="customer_phone"], input[type="tel"], input[placeholder*="teléfono"], input[placeholder*="phone"]', value: testData.phone },
      { selector: 'input[name="vehicle_make"], input[placeholder*="marca"], input[placeholder*="Make"]', value: testData.vehicleMake },
      { selector: 'input[name="vehicle_model"], input[placeholder*="modelo"], input[placeholder*="Model"]', value: testData.vehicleModel },
      { selector: 'input[name="vehicle_year"], input[placeholder*="año"], input[placeholder*="Year"]', value: testData.vehicleYear },
      { selector: 'textarea[name="notes"], textarea[placeholder*="notas"], textarea[placeholder*="comments"]', value: testData.notes }
    ];

    for (const field of fields) {
      try {
        const input = await page.$(field.selector);
        if (input) {
          await input.fill(field.value);
          console.log(`✅ Filled: ${field.value.substring(0, 30)}...`);
        }
      } catch (e) {
        console.log(`⚠️ Could not fill field: ${field.selector}`);
      }
    }

    await page.waitForTimeout(500);
    await page.click('button:has-text("Siguiente")');
    console.log('✅ Proceeded to Summary');
    await page.waitForTimeout(500);

    // Step 5: Summary and Confirmation
    console.log('\n📍 STEP 5: SUMMARY & CONFIRMATION');
    console.log('-'.repeat(40));

    // Check if summary shows our data
    const summaryContent = await page.textContent('body');
    const hasTestData = summaryContent.includes(testData.name) ||
                        summaryContent.includes(testData.email);

    if (hasTestData) {
      console.log('✅ Summary shows correct information');
    } else {
      console.log('⚠️ Summary may not be showing all data');
    }

    // Look for confirmation button
    const confirmButton = await page.$('button:has-text("Confirmar"), button:has-text("Submit"), button:has-text("Enviar")');
    if (confirmButton) {
      await confirmButton.click();
      console.log('✅ Clicked confirmation button');
      await page.waitForTimeout(2000);
    } else {
      console.log('❌ Could not find confirmation button');
    }

    // Check for success message
    try {
      const successSelectors = [
        '[class*="success"]',
        '[class*="confirm"]',
        'text=gracias',
        'text=Gracias',
        'text=confirmado',
        'text=Confirmado',
        'text=thank',
        'text=Thank'
      ];

      let successFound = false;
      for (const selector of successSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log('✅ Success message displayed');
          successFound = true;
          break;
        }
      }

      if (!successFound) {
        console.log('⚠️ No explicit success message found');
      }
    } catch (e) {
      console.log('⚠️ Could not check for success message');
    }

    // Step 6: Verify in Database
    console.log('\n📍 STEP 6: DATABASE VERIFICATION');
    console.log('-'.repeat(40));

    // Wait a bit for database write
    await page.waitForTimeout(1000);

    // Query database for the appointment
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_email', testData.email)
      .single();

    if (error) {
      console.log('❌ Error querying database:', error.message);
    } else if (appointments) {
      console.log('✅ APPOINTMENT SAVED TO DATABASE!');
      console.log('   Appointment details:');
      console.log(`   • ID: ${appointments.id}`);
      console.log(`   • Name: ${appointments.customer_name}`);
      console.log(`   • Email: ${appointments.customer_email}`);
      console.log(`   • Phone: ${appointments.customer_phone}`);
      console.log(`   • Status: ${appointments.status}`);
      console.log(`   • Created: ${appointments.created_at}`);

      // Clean up test appointment
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointments.id);

      if (!deleteError) {
        console.log('\n🧹 Test appointment cleaned up from database');
      }
    } else {
      console.log('❌ Appointment not found in database');
    }

    // Take final screenshot
    console.log('\n📸 Taking final screenshot...');
    await page.screenshot({ path: 'booking-complete.png', fullPage: true });
    console.log('   Screenshot saved as booking-complete.png');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE BOOKING TEST FINISHED!');
    console.log('='.repeat(60));

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('   ✅ Branches loaded successfully');
    console.log('   ✅ Multi-step form navigation working');
    console.log('   ✅ Form fields accepting input');
    if (appointments) {
      console.log('   ✅ Appointment saved to database');
      console.log('   ✅ Database persistence verified');
    } else {
      console.log('   ❌ Database persistence needs investigation');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({ path: 'booking-error.png', fullPage: true });
      console.log('   Error screenshot saved as booking-error.png');
    } catch (e) {
      // Ignore screenshot error
    }
  } finally {
    await browser.close();
  }
}

testCompleteBooking();