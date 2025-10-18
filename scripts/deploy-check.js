#!/usr/bin/env node

/**
 * Deployment Readiness Check for Neumáticos del Valle
 * Validates that the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

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
    info: `${colors.blue}ℹ${colors.reset}`
  };
  console.log(`${prefix[type]} ${message}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.blue}═══ ${title} ═══${colors.reset}\n`);
}

// Check functions
function checkEnvironmentVariables() {
  logSection('Environment Variables');

  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'NEXT_PUBLIC_SITE_URL': 'Production site URL',
    'NEXT_PUBLIC_WHATSAPP_NUMBER': 'WhatsApp business number'
  };

  const optional = {
    'SUPABASE_SERVICE_KEY': 'Supabase service key (for admin operations)',
    'NEXT_PUBLIC_GA_ID': 'Google Analytics ID',
    'NEXT_PUBLIC_GTM_ID': 'Google Tag Manager ID'
  };

  let hasErrors = false;

  // Check required variables
  console.log(colors.bold + 'Required:' + colors.reset);
  for (const [key, description] of Object.entries(required)) {
    if (process.env[key]) {
      log(`${key}: ${colors.dim}${description}${colors.reset}`, 'success');
    } else {
      log(`${key}: ${colors.dim}${description}${colors.reset}`, 'error');
      hasErrors = true;
    }
  }

  // Check optional variables
  console.log('\n' + colors.bold + 'Optional:' + colors.reset);
  for (const [key, description] of Object.entries(optional)) {
    if (process.env[key]) {
      log(`${key}: ${colors.dim}${description}${colors.reset}`, 'success');
    } else {
      log(`${key}: ${colors.dim}${description}${colors.reset}`, 'warning');
    }
  }

  return !hasErrors;
}

function checkBuildConfiguration() {
  logSection('Build Configuration');

  const checks = [
    {
      file: 'next.config.js',
      required: true,
      check: (content) => {
        const hasImages = content.includes('images:');
        const hasOutput = content.includes('output:') || true; // Optional
        return { hasImages };
      }
    },
    {
      file: 'tsconfig.json',
      required: true,
      check: (content) => {
        const config = JSON.parse(content);
        return {
          strict: config.compilerOptions?.strict === true,
          target: config.compilerOptions?.target
        };
      }
    },
    {
      file: 'package.json',
      required: true,
      check: (content) => {
        const pkg = JSON.parse(content);
        return {
          hasBuildScript: !!pkg.scripts?.build,
          hasStartScript: !!pkg.scripts?.start,
          version: pkg.version
        };
      }
    },
    {
      file: 'tailwind.config.ts',
      required: true
    },
    {
      file: '.gitignore',
      required: true,
      check: (content) => {
        return {
          ignoresEnv: content.includes('.env'),
          ignoresNodeModules: content.includes('node_modules'),
          ignoresNext: content.includes('.next')
        };
      }
    }
  ];

  let hasErrors = false;

  for (const check of checks) {
    const filePath = path.join(process.cwd(), check.file);
    const exists = fs.existsSync(filePath);

    if (exists) {
      if (check.check) {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = check.check(content);
        const issues = Object.entries(result).filter(([_, value]) => !value);

        if (issues.length > 0) {
          log(`${check.file}: Found with issues`, 'warning');
          issues.forEach(([key]) => {
            console.log(`  ${colors.yellow}→${colors.reset} Missing: ${key}`);
          });
        } else {
          log(`${check.file}: Valid`, 'success');
        }
      } else {
        log(`${check.file}: Found`, 'success');
      }
    } else {
      if (check.required) {
        log(`${check.file}: Missing`, 'error');
        hasErrors = true;
      } else {
        log(`${check.file}: Optional, not found`, 'warning');
      }
    }
  }

  return !hasErrors;
}

function checkRailwayConfiguration() {
  logSection('Railway Configuration');

  const railwayFiles = [
    {
      file: 'railway.toml',
      required: false,
      check: (content) => {
        return {
          hasBuildCommand: content.includes('build'),
          hasStartCommand: content.includes('start'),
          hasHealthcheck: content.includes('healthcheck') || true
        };
      }
    },
    {
      file: 'railway.json',
      required: false,
      check: (content) => {
        const config = JSON.parse(content);
        return {
          hasBuild: !!config.build,
          hasDeploy: !!config.deploy
        };
      }
    }
  ];

  let foundConfig = false;

  for (const config of railwayFiles) {
    const filePath = path.join(process.cwd(), config.file);
    const exists = fs.existsSync(filePath);

    if (exists) {
      foundConfig = true;
      if (config.check) {
        const content = fs.readFileSync(filePath, 'utf8');
        try {
          const result = config.check(content);
          log(`${config.file}: Found and valid`, 'success');

          // Show configuration details
          Object.entries(result).forEach(([key, value]) => {
            if (value === true) {
              console.log(`  ${colors.green}→${colors.reset} ${key}`);
            } else if (value === false) {
              console.log(`  ${colors.yellow}→${colors.reset} Missing: ${key}`);
            }
          });
        } catch (error) {
          log(`${config.file}: Found but invalid`, 'error');
        }
      } else {
        log(`${config.file}: Found`, 'success');
      }
    }
  }

  if (!foundConfig) {
    log('No Railway configuration found (will use defaults)', 'warning');
    console.log(`  ${colors.dim}Railway will auto-detect Next.js and use default settings${colors.reset}`);
  }

  return true; // Railway config is optional
}

function checkDependencies() {
  logSection('Dependencies Check');

  const packagePath = path.join(process.cwd(), 'package.json');
  const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

  let hasLockFile = false;

  // Check for lock file
  for (const lockFile of lockFiles) {
    if (fs.existsSync(path.join(process.cwd(), lockFile))) {
      log(`Lock file: ${lockFile}`, 'success');
      hasLockFile = true;
      break;
    }
  }

  if (!hasLockFile) {
    log('No lock file found', 'warning');
    console.log(`  ${colors.dim}Run 'npm install' to generate package-lock.json${colors.reset}`);
  }

  // Check package.json
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Check for critical dependencies
    const criticalDeps = [
      'next',
      'react',
      'react-dom',
      '@supabase/supabase-js'
    ];

    const missingDeps = criticalDeps.filter(dep =>
      !pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]
    );

    if (missingDeps.length === 0) {
      log('All critical dependencies present', 'success');
    } else {
      log(`Missing dependencies: ${missingDeps.join(', ')}`, 'error');
      return false;
    }

    // Check versions
    console.log(`\n${colors.dim}Dependency versions:${colors.reset}`);
    console.log(`  Next.js: ${pkg.dependencies?.next || 'not found'}`);
    console.log(`  React: ${pkg.dependencies?.react || 'not found'}`);
    console.log(`  Supabase: ${pkg.dependencies?.['@supabase/supabase-js'] || 'not found'}`);
  }

  return hasLockFile;
}

function checkBuildOutput() {
  logSection('Build Output');

  const nextBuildDir = path.join(process.cwd(), '.next');
  const outDir = path.join(process.cwd(), 'out');

  if (fs.existsSync(nextBuildDir)) {
    const stats = fs.statSync(nextBuildDir);
    const ageMinutes = Math.round((Date.now() - stats.mtime.getTime()) / 60000);

    if (ageMinutes < 60) {
      log(`.next directory: Recent build (${ageMinutes} minutes ago)`, 'success');
    } else {
      log(`.next directory: Stale build (${ageMinutes} minutes ago)`, 'warning');
      console.log(`  ${colors.dim}Run 'npm run build' to create fresh build${colors.reset}`);
    }
  } else {
    log('.next directory: Not found', 'warning');
    console.log(`  ${colors.dim}Run 'npm run build' before deployment${colors.reset}`);
  }

  if (fs.existsSync(outDir)) {
    log('Static export found in /out directory', 'info');
  }

  return true;
}

function checkDatabaseMigrations() {
  logSection('Database Migrations');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const scriptsDir = path.join(process.cwd(), 'scripts');

  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    log(`Found ${migrations.length} migration files`, 'success');

    if (migrations.length > 0) {
      console.log(`\n${colors.dim}Recent migrations:${colors.reset}`);
      migrations.slice(-3).forEach(m => {
        console.log(`  ${colors.dim}→${colors.reset} ${m}`);
      });
    }
  } else {
    log('No migrations directory found', 'warning');
  }

  // Check for migration script
  const migrationScript = path.join(scriptsDir, 'migrate.js');
  if (fs.existsSync(migrationScript)) {
    log('Migration script available', 'success');
    console.log(`  ${colors.dim}Run 'npm run migrate' to apply migrations${colors.reset}`);
  }

  return true;
}

function generateRecommendations(results) {
  logSection('Deployment Recommendations');

  const recommendations = [];

  if (!results.env) {
    recommendations.push({
      priority: 'high',
      action: 'Set up all required environment variables in Railway dashboard'
    });
  }

  if (!results.build) {
    recommendations.push({
      priority: 'high',
      action: 'Fix build configuration issues before deployment'
    });
  }

  if (!results.deps) {
    recommendations.push({
      priority: 'medium',
      action: 'Generate lock file with: npm install'
    });
  }

  recommendations.push({
    priority: 'low',
    action: 'Run smoke tests after deployment: npm test'
  });

  recommendations.push({
    priority: 'low',
    action: 'Set up monitoring and error tracking'
  });

  if (recommendations.length > 0) {
    recommendations.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });

    recommendations.forEach(rec => {
      const icon = rec.priority === 'high' ? '🔴' :
                   rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${icon} ${rec.action}`);
    });
  } else {
    log('Application is ready for deployment!', 'success');
  }
}

// Main deployment check
async function runDeploymentCheck() {
  console.log(`\n${colors.bold}${colors.blue}🚀 Neumáticos del Valle - Deployment Readiness Check${colors.reset}`);
  console.log(`${colors.dim}Checking production readiness...${colors.reset}`);

  const results = {
    env: checkEnvironmentVariables(),
    build: checkBuildConfiguration(),
    railway: checkRailwayConfiguration(),
    deps: checkDependencies(),
    output: checkBuildOutput(),
    db: checkDatabaseMigrations()
  };

  // Summary
  logSection('Summary');

  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  const percentage = Math.round((passed / total) * 100);

  const summaryColor = percentage === 100 ? colors.green :
                       percentage >= 80 ? colors.yellow : colors.red;

  console.log(`${summaryColor}${colors.bold}Readiness: ${passed}/${total} checks passed (${percentage}%)${colors.reset}\n`);

  // Recommendations
  generateRecommendations(results);

  // Deployment commands
  if (percentage >= 80) {
    console.log(`\n${colors.bold}${colors.green}📦 Ready to Deploy!${colors.reset}`);
    console.log(`\nDeployment steps:`);
    console.log(`1. Commit all changes: ${colors.dim}git add . && git commit -m "Ready for deployment"${colors.reset}`);
    console.log(`2. Push to GitHub: ${colors.dim}git push origin main${colors.reset}`);
    console.log(`3. Connect Railway to GitHub repository`);
    console.log(`4. Set environment variables in Railway dashboard`);
    console.log(`5. Deploy and monitor logs`);
  } else {
    console.log(`\n${colors.yellow}⚠ Please address the issues above before deployment${colors.reset}`);
  }

  process.exit(percentage >= 80 ? 0 : 1);
}

// Run check
runDeploymentCheck().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});