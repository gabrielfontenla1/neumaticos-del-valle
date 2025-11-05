#!/usr/bin/env node

/**
 * Cart System Verification Script
 * Verifies the complete cart system integrity and health
 * Usage: npm run verify-cart
 */

import fs from 'fs'
import path from 'path'

interface VerificationResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: string[]
}

interface CartSystemHealth {
  timestamp: string
  overall_status: 'healthy' | 'degraded' | 'critical'
  score: number // 0-100
  results: VerificationResult[]
  summary: {
    passed: number
    failed: number
    warnings: number
  }
}

class CartSystemVerifier {
  private results: VerificationResult[] = []
  private projectRoot: string

  constructor() {
    this.projectRoot = path.resolve(process.cwd())
  }

  /**
   * Run all verifications
   */
  async runAll(): Promise<CartSystemHealth> {
    console.log('\n🔍 Starting Cart System Verification...\n')

    // Run all checks
    await this.checkFileStructure()
    await this.checkImports()
    await this.checkSupabaseConfig()
    await this.checkLocalStorage()
    await this.checkTypes()
    await this.checkHooks()
    await this.checkProviders()
    await this.checkAPI()
    await this.checkEnvironment()

    // Calculate health
    return this.calculateHealth()
  }

  /**
   * Check if all required files exist
   */
  private async checkFileStructure(): Promise<void> {
    console.log('📁 Checking file structure...')

    const requiredFiles = [
      'src/features/cart/types.ts',
      'src/features/cart/api.ts',
      'src/features/cart/api-local.ts',
      'src/features/cart/hooks/useCart.ts',
      'src/features/cart/index.ts',
      'src/providers/CartProvider.tsx',
      'src/components/CartButton.tsx',
      'src/app/checkout/success/page.tsx'
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file)
      const exists = fs.existsSync(filePath)

      this.results.push({
        name: `File exists: ${file}`,
        status: exists ? 'pass' : 'fail',
        message: exists
          ? `✓ ${file} found`
          : `✗ ${file} NOT FOUND`
      })
    }
  }

  /**
   * Check if imports are correct
   */
  private async checkImports(): Promise<void> {
    console.log('📦 Checking imports...')

    const filesToCheck = {
      'src/features/cart/hooks/useCart.ts': [
        "from '@/features/cart/types'",
        "from '@/features/cart/api-local'",
        "from 'react'"
      ],
      'src/features/cart/api-local.ts': [
        "from '@/features/products/api'",
        "from './types'"
      ],
      'src/providers/CartProvider.tsx': [
        "from '@/features/cart/hooks/useCart'",
        "from 'react'"
      ],
      'src/components/CartButton.tsx': [
        "from '@/providers/CartProvider'",
        "from 'react'"
      ]
    }

    for (const [file, imports] of Object.entries(filesToCheck)) {
      const filePath = path.join(this.projectRoot, file)

      if (!fs.existsSync(filePath)) {
        this.results.push({
          name: `Import check: ${file}`,
          status: 'fail',
          message: `File does not exist: ${file}`
        })
        continue
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      const missingImports: string[] = []

      for (const importStr of imports) {
        if (!content.includes(importStr)) {
          missingImports.push(importStr)
        }
      }

      this.results.push({
        name: `Import check: ${file}`,
        status: missingImports.length === 0 ? 'pass' : 'fail',
        message: missingImports.length === 0
          ? `✓ All imports found`
          : `✗ Missing imports: ${missingImports.length}`,
        details: missingImports
      })
    }
  }

  /**
   * Verify Supabase configuration
   */
  private async checkSupabaseConfig(): Promise<void> {
    console.log('🔐 Checking Supabase configuration...')

    const envFile = path.join(this.projectRoot, '.env.local')
    const envExampleFile = path.join(this.projectRoot, '.env.example')

    // Check if .env.local exists
    const envExists = fs.existsSync(envFile)
    this.results.push({
      name: 'Environment file exists (.env.local)',
      status: envExists ? 'pass' : 'warn',
      message: envExists
        ? '✓ .env.local found'
        : '⚠ .env.local not found (check .env.example for reference)'
    })

    // Check .env.example for required variables
    if (fs.existsSync(envExampleFile)) {
      const envContent = fs.readFileSync(envExampleFile, 'utf-8')
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL'
      ]

      const missingVars = requiredVars.filter(v => !envContent.includes(v))

      this.results.push({
        name: 'Supabase variables in .env.example',
        status: missingVars.length === 0 ? 'pass' : 'warn',
        message: missingVars.length === 0
          ? '✓ All required variables documented'
          : `⚠ Missing variables: ${missingVars.length}`,
        details: missingVars
      })
    }

    // Check Supabase client file
    const supabaseFile = path.join(this.projectRoot, 'src/lib/supabase.ts')
    const supabaseExists = fs.existsSync(supabaseFile)

    this.results.push({
      name: 'Supabase client file',
      status: supabaseExists ? 'pass' : 'fail',
      message: supabaseExists
        ? '✓ src/lib/supabase.ts found'
        : '✗ src/lib/supabase.ts NOT FOUND'
    })
  }

  /**
   * Verify localStorage implementation
   */
  private async checkLocalStorage(): Promise<void> {
    console.log('💾 Checking localStorage implementation...')

    const apiLocalFile = path.join(this.projectRoot, 'src/features/cart/api-local.ts')

    if (!fs.existsSync(apiLocalFile)) {
      this.results.push({
        name: 'localStorage implementation',
        status: 'fail',
        message: 'api-local.ts not found'
      })
      return
    }

    const content = fs.readFileSync(apiLocalFile, 'utf-8')
    const requiredFunctions = [
      'getLocalCart',
      'saveLocalCart',
      'getOrCreateCartSession',
      'addToCart',
      'updateCartItemQuantity',
      'removeFromCart',
      'clearCart',
      'calculateCartTotals'
    ]

    const missingFunctions: string[] = []

    for (const fn of requiredFunctions) {
      if (!content.includes(`export async function ${fn}`) && !content.includes(`function ${fn}`)) {
        missingFunctions.push(fn)
      }
    }

    this.results.push({
      name: 'localStorage functions',
      status: missingFunctions.length === 0 ? 'pass' : 'fail',
      message: missingFunctions.length === 0
        ? `✓ All ${requiredFunctions.length} functions implemented`
        : `✗ Missing functions: ${missingFunctions.length}`,
      details: missingFunctions
    })

    // Check for proper error handling
    const hasErrorHandling = content.includes('try') && content.includes('catch')
    this.results.push({
      name: 'Error handling in localStorage',
      status: hasErrorHandling ? 'pass' : 'warn',
      message: hasErrorHandling
        ? '✓ Error handling implemented'
        : '⚠ No error handling found'
    })

    // Check for console logging
    const hasLogging = content.includes('console.log')
    this.results.push({
      name: 'Debug logging in localStorage',
      status: hasLogging ? 'pass' : 'warn',
      message: hasLogging
        ? '✓ Debug logging implemented'
        : '⚠ No debug logging found'
    })
  }

  /**
   * Check TypeScript types
   */
  private async checkTypes(): Promise<void> {
    console.log('📘 Checking TypeScript types...')

    const typesFile = path.join(this.projectRoot, 'src/features/cart/types.ts')

    if (!fs.existsSync(typesFile)) {
      this.results.push({
        name: 'Cart types file',
        status: 'fail',
        message: 'types.ts not found'
      })
      return
    }

    const content = fs.readFileSync(typesFile, 'utf-8')
    const requiredTypes = [
      'CartItem',
      'CartSession',
      'CartTotals',
      'CustomerData',
      'VoucherData'
    ]

    const missingTypes: string[] = []

    for (const type of requiredTypes) {
      if (!content.includes(`export interface ${type}`)) {
        missingTypes.push(type)
      }
    }

    this.results.push({
      name: 'TypeScript interfaces',
      status: missingTypes.length === 0 ? 'pass' : 'fail',
      message: missingTypes.length === 0
        ? `✓ All ${requiredTypes.length} types defined`
        : `✗ Missing types: ${missingTypes.length}`,
      details: missingTypes
    })
  }

  /**
   * Check hooks implementation
   */
  private async checkHooks(): Promise<void> {
    console.log('🎣 Checking hooks...')

    const hookFile = path.join(this.projectRoot, 'src/features/cart/hooks/useCart.ts')

    if (!fs.existsSync(hookFile)) {
      this.results.push({
        name: 'useCart hook',
        status: 'fail',
        message: 'useCart.ts not found'
      })
      return
    }

    const content = fs.readFileSync(hookFile, 'utf-8')
    const requiredMethods = [
      'addItem',
      'updateQuantity',
      'removeItem',
      'clearAll',
      'refreshCart'
    ]

    const missingMethods: string[] = []

    for (const method of requiredMethods) {
      if (!content.includes(method)) {
        missingMethods.push(method)
      }
    }

    this.results.push({
      name: 'useCart hook methods',
      status: missingMethods.length === 0 ? 'pass' : 'fail',
      message: missingMethods.length === 0
        ? `✓ All ${requiredMethods.length} methods implemented`
        : `✗ Missing methods: ${missingMethods.length}`,
      details: missingMethods
    })

    // Check for useState and useEffect
    const hasHooks = content.includes('useState') && content.includes('useEffect')
    this.results.push({
      name: 'React hooks usage',
      status: hasHooks ? 'pass' : 'fail',
      message: hasHooks
        ? '✓ useState and useEffect properly used'
        : '✗ Missing React hooks'
    })

    // Check for client component
    const isClientComponent = content.includes("'use client'")
    this.results.push({
      name: 'Client component marker',
      status: isClientComponent ? 'pass' : 'warn',
      message: isClientComponent
        ? "✓ 'use client' directive present"
        : "⚠ 'use client' directive missing"
    })
  }

  /**
   * Check provider implementation
   */
  private async checkProviders(): Promise<void> {
    console.log('🔌 Checking providers...')

    const providerFile = path.join(this.projectRoot, 'src/providers/CartProvider.tsx')

    if (!fs.existsSync(providerFile)) {
      this.results.push({
        name: 'CartProvider component',
        status: 'fail',
        message: 'CartProvider.tsx not found'
      })
      return
    }

    const content = fs.readFileSync(providerFile, 'utf-8')

    // Check for context creation
    const hasContext = content.includes('createContext')
    this.results.push({
      name: 'Context creation',
      status: hasContext ? 'pass' : 'fail',
      message: hasContext
        ? '✓ React Context properly created'
        : '✗ Context not found'
    })

    // Check for provider component
    const hasProvider = content.includes('CartContext.Provider')
    this.results.push({
      name: 'Provider component',
      status: hasProvider ? 'pass' : 'fail',
      message: hasProvider
        ? '✓ Context provider component found'
        : '✗ Provider component missing'
    })

    // Check for hook export
    const hasHookExport = content.includes('useCartContext')
    this.results.push({
      name: 'Context hook export',
      status: hasHookExport ? 'pass' : 'fail',
      message: hasHookExport
        ? '✓ useCartContext hook exported'
        : '✗ Context hook not exported'
    })

    // Check for client marker
    const isClientComponent = content.includes("'use client'")
    this.results.push({
      name: 'Provider client marker',
      status: isClientComponent ? 'pass' : 'warn',
      message: isClientComponent
        ? "✓ 'use client' directive present"
        : "⚠ 'use client' directive missing"
    })
  }

  /**
   * Check API files
   */
  private async checkAPI(): Promise<void> {
    console.log('🔗 Checking API files...')

    const apiFiles = {
      'src/features/cart/api.ts': ['getOrCreateCartSession', 'addToCart', 'calculateCartTotals'],
      'src/features/cart/api-local.ts': ['getOrCreateCartSession', 'addToCart', 'calculateCartTotals']
    }

    for (const [file, functions] of Object.entries(apiFiles)) {
      const filePath = path.join(this.projectRoot, file)

      if (!fs.existsSync(filePath)) {
        this.results.push({
          name: `API file: ${file}`,
          status: 'fail',
          message: `${file} not found`
        })
        continue
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      const missingFunctions: string[] = []

      for (const fn of functions) {
        if (!content.includes(`export async function ${fn}`) && !content.includes(`export function ${fn}`)) {
          missingFunctions.push(fn)
        }
      }

      this.results.push({
        name: `API exports: ${file}`,
        status: missingFunctions.length === 0 ? 'pass' : 'fail',
        message: missingFunctions.length === 0
          ? `✓ All functions exported`
          : `✗ Missing exports: ${missingFunctions.length}`,
        details: missingFunctions
      })
    }
  }

  /**
   * Check environment setup
   */
  private async checkEnvironment(): Promise<void> {
    console.log('🌍 Checking environment setup...')

    const packageJsonFile = path.join(this.projectRoot, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'))

    // Check for Supabase dependency
    const hasSupabase = packageJson.dependencies['@supabase/supabase-js'] !== undefined
    this.results.push({
      name: 'Supabase dependency',
      status: hasSupabase ? 'pass' : 'fail',
      message: hasSupabase
        ? '✓ @supabase/supabase-js installed'
        : '✗ Supabase not installed'
    })

    // Check for Next.js
    const hasNextJs = packageJson.dependencies['next'] !== undefined
    this.results.push({
      name: 'Next.js setup',
      status: hasNextJs ? 'pass' : 'fail',
      message: hasNextJs
        ? `✓ Next.js ${packageJson.dependencies['next']} installed`
        : '✗ Next.js not installed'
    })

    // Check for React
    const hasReact = packageJson.dependencies['react'] !== undefined
    this.results.push({
      name: 'React setup',
      status: hasReact ? 'pass' : 'fail',
      message: hasReact
        ? `✓ React ${packageJson.dependencies['react']} installed`
        : '✗ React not installed'
    })

    // Check for verify-cart script
    const hasScript = packageJson.scripts['verify-cart'] !== undefined
    this.results.push({
      name: 'Verify script in package.json',
      status: hasScript ? 'pass' : 'warn',
      message: hasScript
        ? '✓ verify-cart script configured'
        : '⚠ verify-cart script not found'
    })
  }

  /**
   * Calculate overall health
   */
  private calculateHealth(): CartSystemHealth {
    const summary = {
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      warnings: this.results.filter(r => r.status === 'warn').length
    }

    const score = Math.max(0, Math.min(100,
      100 - (summary.failed * 10) - (summary.warnings * 3)
    ))

    let overall_status: 'healthy' | 'degraded' | 'critical'
    if (summary.failed > 0) {
      overall_status = 'critical'
    } else if (summary.warnings > 2) {
      overall_status = 'degraded'
    } else {
      overall_status = 'healthy'
    }

    return {
      timestamp: new Date().toISOString(),
      overall_status,
      score,
      results: this.results,
      summary
    }
  }

  /**
   * Print results in a formatted way
   */
  printResults(health: CartSystemHealth): void {
    console.log('\n' + '='.repeat(60))
    console.log('Cart System Verification Report')
    console.log('='.repeat(60))

    console.log(`\nTimestamp: ${health.timestamp}`)
    console.log(`Overall Status: ${health.overall_status.toUpperCase()}`)
    console.log(`Health Score: ${health.score}/100`)

    console.log(`\nSummary:`)
    console.log(`  ✓ Passed: ${health.summary.passed}`)
    console.log(`  ✗ Failed: ${health.summary.failed}`)
    console.log(`  ⚠ Warnings: ${health.summary.warnings}`)

    console.log(`\nDetailed Results:\n`)

    const grouped = {
      pass: health.results.filter(r => r.status === 'pass'),
      warn: health.results.filter(r => r.status === 'warn'),
      fail: health.results.filter(r => r.status === 'fail')
    }

    // Print passed
    if (grouped.pass.length > 0) {
      console.log('✓ PASSED:')
      grouped.pass.forEach(r => {
        console.log(`  • ${r.name}`)
        console.log(`    ${r.message}`)
      })
    }

    // Print warnings
    if (grouped.warn.length > 0) {
      console.log('\n⚠ WARNINGS:')
      grouped.warn.forEach(r => {
        console.log(`  • ${r.name}`)
        console.log(`    ${r.message}`)
        if (r.details && r.details.length > 0) {
          r.details.forEach(d => console.log(`      - ${d}`))
        }
      })
    }

    // Print failures
    if (grouped.fail.length > 0) {
      console.log('\n✗ FAILURES:')
      grouped.fail.forEach(r => {
        console.log(`  • ${r.name}`)
        console.log(`    ${r.message}`)
        if (r.details && r.details.length > 0) {
          r.details.forEach(d => console.log(`      - ${d}`))
        }
      })
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // Exit with appropriate code
    process.exit(health.summary.failed > 0 ? 1 : 0)
  }
}

// Run verification
const verifier = new CartSystemVerifier()
verifier.runAll().then(health => {
  verifier.printResults(health)
})
