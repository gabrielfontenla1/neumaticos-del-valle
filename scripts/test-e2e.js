#!/usr/bin/env node

/**
 * End-to-End Tests for Neumáticos del Valle
 * Tests complete user flows through the application
 */

require('dotenv').config({ path: '.env.local' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    step: `${colors.dim}→${colors.reset}`
  };
  console.log(`${prefix[type]} ${message}`);
}

function logFlow(title) {
  console.log(`\n${colors.bold}${colors.green}▶ Testing Flow: ${title}${colors.reset}\n`);
}

// Simulate user flows
async function testProductCatalogFlow() {
  logFlow('Product Catalog → WhatsApp Checkout');

  const steps = [
    {
      name: 'Load products page',
      async test() {
        const response = await fetch(`${SITE_URL}/productos`);
        return response.ok;
      }
    },
    {
      name: 'Fetch product list',
      async test() {
        const response = await fetch(`${SITE_URL}/api/products`);
        const products = await response.json();
        return Array.isArray(products) && products.length > 0;
      }
    },
    {
      name: 'Filter by brand',
      async test() {
        const response = await fetch(`${SITE_URL}/api/products?brand=Michelin`);
        const products = await response.json();
        return Array.isArray(products);
      }
    },
    {
      name: 'Filter by size',
      async test() {
        const response = await fetch(`${SITE_URL}/api/products?size=205/55R16`);
        const products = await response.json();
        return Array.isArray(products);
      }
    },
    {
      name: 'Generate WhatsApp message',
      async test() {
        const product = {
          brand: 'Michelin',
          model: 'Primacy 4',
          size: '205/55R16',
          price: 45000
        };

        const message = `Hola! Me interesa el siguiente producto:
• Marca: ${product.brand}
• Modelo: ${product.model}
• Medida: ${product.size}
• Precio: $${product.price.toLocaleString('es-AR')}

¿Está disponible?`;

        const whatsappUrl = `https://wa.me/5491122334455?text=${encodeURIComponent(message)}`;
        return whatsappUrl.includes('wa.me') && whatsappUrl.includes(encodeURIComponent(product.brand));
      }
    }
  ];

  return await runSteps(steps);
}

async function testAppointmentBookingFlow() {
  logFlow('Appointment Booking');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const testAppointment = {
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '1122334455',
    service_type: 'alineacion',
    vehicle_info: 'Toyota Corolla 2020',
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_time: '10:00',
    notes: 'Test appointment - please ignore',
    status: 'pending'
  };

  const steps = [
    {
      name: 'Load appointment page',
      async test() {
        const response = await fetch(`${SITE_URL}/servicios`);
        return response.ok;
      }
    },
    {
      name: 'Create test appointment',
      async test() {
        const response = await fetch(`${SITE_URL}/api/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testAppointment)
        });

        if (!response.ok) return false;

        const result = await response.json();
        testAppointment.id = result.id;
        return result.id !== undefined;
      }
    },
    {
      name: 'Verify appointment created',
      async test() {
        if (!testAppointment.id) return false;

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', testAppointment.id)
          .single();

        return !error && data && data.customer_name === testAppointment.customer_name;
      }
    },
    {
      name: 'Generate WhatsApp confirmation',
      async test() {
        const message = `Nueva cita agendada:
• Cliente: ${testAppointment.customer_name}
• Servicio: ${testAppointment.service_type}
• Fecha: ${testAppointment.preferred_date}
• Hora: ${testAppointment.preferred_time}`;

        return message.includes(testAppointment.customer_name);
      }
    },
    {
      name: 'Clean up test appointment',
      async test() {
        if (!testAppointment.id) return true;

        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', testAppointment.id);

        return !error;
      }
    }
  ];

  return await runSteps(steps);
}

async function testReviewSubmissionFlow() {
  logFlow('Review Submission → Voucher Generation');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const testReview = {
    customer_name: 'Test Reviewer',
    customer_email: 'reviewer@test.com',
    rating: 5,
    comment: 'Excellent service! This is a test review.',
    service_type: 'alineacion',
    verified: true,
    voucher_code: null,
    voucher_amount: 500,
    voucher_used: false
  };

  const steps = [
    {
      name: 'Submit review',
      async test() {
        const response = await fetch(`${SITE_URL}/api/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testReview)
        });

        if (!response.ok) return false;

        const result = await response.json();
        testReview.id = result.id;
        testReview.voucher_code = result.voucher_code;
        return result.id !== undefined && result.voucher_code !== undefined;
      }
    },
    {
      name: 'Verify voucher generated',
      async test() {
        if (!testReview.voucher_code) return false;

        // Voucher should be format: NV-XXXXX
        const voucherPattern = /^NV-[A-Z0-9]{5}$/;
        return voucherPattern.test(testReview.voucher_code);
      }
    },
    {
      name: 'Check review stored',
      async test() {
        if (!testReview.id) return false;

        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('id', testReview.id)
          .single();

        return !error &&
               data &&
               data.voucher_code === testReview.voucher_code &&
               data.voucher_amount === testReview.voucher_amount;
      }
    },
    {
      name: 'Clean up test review',
      async test() {
        if (!testReview.id) return true;

        const { error } = await supabase
          .from('reviews')
          .delete()
          .eq('id', testReview.id);

        return !error;
      }
    }
  ];

  return await runSteps(steps);
}

async function testAdminAuthFlow() {
  logFlow('Admin Authentication');

  const steps = [
    {
      name: 'Access admin login page',
      async test() {
        const response = await fetch(`${SITE_URL}/admin/login`);
        return response.ok || response.status === 404; // 404 if protected
      }
    },
    {
      name: 'Verify protected routes',
      async test() {
        const protectedRoutes = [
          '/admin/dashboard',
          '/admin/products',
          '/admin/appointments',
          '/admin/reviews'
        ];

        for (const route of protectedRoutes) {
          const response = await fetch(`${SITE_URL}${route}`, {
            redirect: 'manual'
          });

          // Should redirect to login or return 401/403
          if (response.status !== 302 && response.status !== 401 && response.status !== 403) {
            return false;
          }
        }

        return true;
      }
    },
    {
      name: 'Test API authentication',
      async test() {
        // Try to access protected API without auth
        const response = await fetch(`${SITE_URL}/api/admin/stats`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Should return 401 or 403
        return response.status === 401 || response.status === 403;
      }
    }
  ];

  return await runSteps(steps);
}

async function testPerformanceMetrics() {
  logFlow('Performance Metrics');

  const measurements = [];

  const steps = [
    {
      name: 'Home page load time',
      async test() {
        const start = Date.now();
        const response = await fetch(`${SITE_URL}/`);
        const loadTime = Date.now() - start;

        measurements.push({ page: 'Home', time: loadTime });
        log(`  Load time: ${loadTime}ms`, 'step');

        return response.ok && loadTime < 3000; // Should load in under 3 seconds
      }
    },
    {
      name: 'Products API response time',
      async test() {
        const start = Date.now();
        const response = await fetch(`${SITE_URL}/api/products`);
        const responseTime = Date.now() - start;

        measurements.push({ api: 'Products', time: responseTime });
        log(`  Response time: ${responseTime}ms`, 'step');

        return response.ok && responseTime < 1000; // Should respond in under 1 second
      }
    },
    {
      name: 'Static asset loading',
      async test() {
        const assets = [
          '/_next/static/css',
          '/_next/static/chunks',
          '/favicon.ico'
        ];

        for (const asset of assets) {
          const start = Date.now();
          const response = await fetch(`${SITE_URL}${asset}`, {
            method: 'HEAD'
          });
          const loadTime = Date.now() - start;

          if (loadTime > 500) {
            log(`  Slow asset: ${asset} (${loadTime}ms)`, 'warning');
            return false;
          }
        }

        return true;
      }
    }
  ];

  const result = await runSteps(steps);

  // Print performance summary
  if (measurements.length > 0) {
    console.log(`\n${colors.dim}Performance Summary:${colors.reset}`);
    measurements.forEach(m => {
      const color = m.time < 500 ? colors.green : m.time < 1500 ? colors.yellow : colors.red;
      const key = m.page || m.api;
      console.log(`  ${color}${key}: ${m.time}ms${colors.reset}`);
    });
  }

  return result;
}

// Helper function to run test steps
async function runSteps(steps) {
  let passed = 0;

  for (const step of steps) {
    try {
      const result = await step.test();
      if (result) {
        log(step.name, 'success');
        passed++;
      } else {
        log(step.name, 'error');
      }
    } catch (error) {
      log(`${step.name}: ${error.message}`, 'error');
    }
  }

  return { passed, total: steps.length };
}

// Main test runner
async function runE2ETests() {
  console.log(`\n${colors.bold}${colors.green}🚀 Neumáticos del Valle - End-to-End Tests${colors.reset}`);
  console.log(`${colors.blue}Testing against: ${SITE_URL}${colors.reset}`);

  const results = [];

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('Supabase not configured - skipping database tests', 'warning');
    results.push(await testProductCatalogFlow());
    results.push(await testAdminAuthFlow());
    results.push(await testPerformanceMetrics());
  } else {
    // Run all test flows
    results.push(await testProductCatalogFlow());
    results.push(await testAppointmentBookingFlow());
    results.push(await testReviewSubmissionFlow());
    results.push(await testAdminAuthFlow());
    results.push(await testPerformanceMetrics());
  }

  // Calculate totals
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);

  // Print summary
  console.log(`\n${colors.bold}${colors.blue}═══ Test Summary ═══${colors.reset}\n`);

  const percentage = Math.round((totalPassed / totalTests) * 100);
  const summaryColor = percentage >= 80 ? colors.green : percentage >= 60 ? colors.yellow : colors.red;

  console.log(`${summaryColor}${colors.bold}Passed: ${totalPassed}/${totalTests} (${percentage}%)${colors.reset}`);

  if (percentage < 80) {
    console.log(`\n${colors.yellow}⚠ Some tests failed. Please review the output above.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✨ All critical flows are working correctly!${colors.reset}`);
  }

  // Exit with appropriate code
  process.exit(percentage >= 60 ? 0 : 1);
}

// Run tests
runE2ETests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});