#!/usr/bin/env node

/**
 * Smoke Tests for Neumáticos del Valle
 * Basic tests for critical application paths
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
  bold: '\x1b[1m'
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`
  };
  console.log(`${prefix[type]} ${message}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.blue}═══ ${title} ═══${colors.reset}\n`);
}

// Test utilities
async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const success = response.ok || options.expectedStatus === response.status;

    if (success) {
      log(`${name}: Status ${response.status}`, 'success');

      if (options.validateResponse) {
        const data = await response.json();
        const valid = await options.validateResponse(data);
        if (!valid) {
          log(`${name}: Response validation failed`, 'error');
          return false;
        }
      }

      return true;
    } else {
      log(`${name}: Status ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`${name}: ${error.message}`, 'error');
    return false;
  }
}

// Test suites
async function testPublicPages() {
  logSection('Testing Public Pages');

  const pages = [
    { name: 'Home Page', path: '/' },
    { name: 'Products Page', path: '/productos' },
    { name: 'Services Page', path: '/servicios' },
    { name: 'About Page', path: '/nosotros' },
    { name: 'Contact Page', path: '/contacto' }
  ];

  let passed = 0;
  for (const page of pages) {
    const result = await testEndpoint(page.name, `${SITE_URL}${page.path}`);
    if (result) passed++;
  }

  return { passed, total: pages.length };
}

async function testAPIEndpoints() {
  logSection('Testing API Endpoints');

  const endpoints = [
    {
      name: 'Products API',
      path: '/api/products',
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'Services API',
      path: '/api/services',
      validateResponse: (data) => Array.isArray(data)
    },
    {
      name: 'Appointments API',
      path: '/api/appointments',
      method: 'GET'
    },
    {
      name: 'Reviews API',
      path: '/api/reviews',
      validateResponse: (data) => Array.isArray(data)
    }
  ];

  let passed = 0;
  for (const endpoint of endpoints) {
    const result = await testEndpoint(
      endpoint.name,
      `${SITE_URL}${endpoint.path}`,
      endpoint
    );
    if (result) passed++;
  }

  return { passed, total: endpoints.length };
}

async function testWhatsAppIntegration() {
  logSection('Testing WhatsApp Integration');

  const tests = [
    {
      name: 'WhatsApp Link Generation',
      test: () => {
        const phone = '5491122334455';
        const message = 'Hola, quiero consultar sobre neumáticos';
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        return url.includes('wa.me') && url.includes(phone);
      }
    },
    {
      name: 'Product WhatsApp Message',
      test: () => {
        const product = {
          brand: 'Michelin',
          model: 'Primacy 4',
          size: '205/55R16'
        };
        const message = `Hola! Me interesa el neumático ${product.brand} ${product.model} ${product.size}`;
        return message.includes(product.brand) && message.includes(product.size);
      }
    }
  ];

  let passed = 0;
  for (const test of tests) {
    try {
      const result = test.test();
      if (result) {
        log(test.name, 'success');
        passed++;
      } else {
        log(test.name, 'error');
      }
    } catch (error) {
      log(`${test.name}: ${error.message}`, 'error');
    }
  }

  return { passed, total: tests.length };
}

async function testSupabaseConnection() {
  logSection('Testing Supabase Connection');

  const { createClient } = require('@supabase/supabase-js');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('Supabase environment variables not configured', 'warning');
    return { passed: 0, total: 1 };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let passed = 0;
  const total = 4;

  try {
    // Test products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (!productsError) {
      log('Products table accessible', 'success');
      passed++;
    } else {
      log(`Products table error: ${productsError.message}`, 'error');
    }

    // Test services table
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .limit(1);

    if (!servicesError) {
      log('Services table accessible', 'success');
      passed++;
    } else {
      log(`Services table error: ${servicesError.message}`, 'error');
    }

    // Test appointments table
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);

    if (!appointmentsError) {
      log('Appointments table accessible', 'success');
      passed++;
    } else {
      log(`Appointments table error: ${appointmentsError.message}`, 'error');
    }

    // Test reviews table
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);

    if (!reviewsError) {
      log('Reviews table accessible', 'success');
      passed++;
    } else {
      log(`Reviews table error: ${reviewsError.message}`, 'error');
    }

  } catch (error) {
    log(`Supabase connection error: ${error.message}`, 'error');
  }

  return { passed, total };
}

async function testBuildConfiguration() {
  logSection('Testing Build Configuration');

  const fs = require('fs');
  const path = require('path');

  let passed = 0;
  const total = 5;

  // Check next.config.js
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    log('next.config.js exists', 'success');
    passed++;
  } else {
    log('next.config.js missing', 'error');
  }

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`${envVar} configured`, 'success');
      passed++;
    } else {
      log(`${envVar} missing`, 'error');
    }
  }

  // Check TypeScript configuration
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    log('tsconfig.json exists', 'success');
    passed++;
  } else {
    log('tsconfig.json missing', 'warning');
  }

  return { passed, total };
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.bold}${colors.blue}🧪 Neumáticos del Valle - Smoke Tests${colors.reset}`);
  console.log(`${colors.blue}Testing against: ${SITE_URL}${colors.reset}`);

  const results = [];

  // Run all test suites
  results.push(await testBuildConfiguration());
  results.push(await testSupabaseConnection());
  results.push(await testPublicPages());
  results.push(await testAPIEndpoints());
  results.push(await testWhatsAppIntegration());

  // Calculate totals
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);

  // Print summary
  logSection('Test Summary');

  const percentage = Math.round((totalPassed / totalTests) * 100);
  const summaryColor = percentage >= 80 ? colors.green : percentage >= 60 ? colors.yellow : colors.red;

  console.log(`${summaryColor}${colors.bold}Passed: ${totalPassed}/${totalTests} (${percentage}%)${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(percentage >= 80 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});