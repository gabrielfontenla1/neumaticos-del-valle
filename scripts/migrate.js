#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const SEED_FILE = path.join(__dirname, '..', 'supabase', 'seed.sql');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function runMigrations() {
  log('\n🚀 Neumáticos del Valle - Database Migration Tool', 'cyan');
  log('================================================\n', 'cyan');

  // Check environment variables
  if (!process.env.DATABASE_URL) {
    log('❌ ERROR: DATABASE_URL environment variable is not set', 'red');
    log('Please set it in your .env.local file or environment', 'yellow');
    log('Format: postgresql://[user]:[password]@[host]:[port]/[database]', 'yellow');
    process.exit(1);
  }

  // List migration files
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    log('No migration files found in ' + MIGRATIONS_DIR, 'yellow');
    process.exit(0);
  }

  log('Found migration files:', 'blue');
  migrationFiles.forEach(file => {
    log(`  - ${file}`, 'cyan');
  });

  const answer = await question('\nDo you want to run these migrations? (y/n): ');

  if (answer.toLowerCase() !== 'y') {
    log('Migration cancelled', 'yellow');
    process.exit(0);
  }

  // Run migrations
  log('\nRunning migrations...', 'blue');

  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    log(`\nExecuting ${file}...`, 'cyan');

    try {
      execSync(`psql ${process.env.DATABASE_URL} -f ${filePath}`, {
        stdio: 'inherit'
      });
      log(`✅ ${file} executed successfully`, 'green');
    } catch (error) {
      log(`❌ Error executing ${file}:`, 'red');
      console.error(error.message);
      process.exit(1);
    }
  }

  // Ask about seed data
  const seedAnswer = await question('\nDo you want to load seed data? (y/n): ');

  if (seedAnswer.toLowerCase() === 'y') {
    log('\nLoading seed data...', 'blue');

    try {
      execSync(`psql ${process.env.DATABASE_URL} -f ${SEED_FILE}`, {
        stdio: 'inherit'
      });
      log('✅ Seed data loaded successfully', 'green');
    } catch (error) {
      log('❌ Error loading seed data:', 'red');
      console.error(error.message);
      // Don't exit on seed error, as it's not critical
    }
  }

  log('\n✨ Migration completed successfully!', 'green');
  log('\nYour database is now ready for Neumáticos del Valle', 'cyan');

  rl.close();
}

// Handle cleanup
process.on('SIGINT', () => {
  log('\n\nMigration interrupted', 'yellow');
  rl.close();
  process.exit(0);
});

// Run the migration
runMigrations().catch(error => {
  log('Unexpected error:', 'red');
  console.error(error);
  rl.close();
  process.exit(1);
});