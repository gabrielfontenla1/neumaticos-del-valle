# Cart System Verification Guide

Quick guide for running and interpreting the cart system verification script.

## Quick Start

### Run Verification

```bash
npm run verify-cart
```

This will:
1. Check file structure (8+ files)
2. Verify imports (12+ imports across files)
3. Validate Supabase configuration
4. Test localStorage implementation (8 functions)
5. Verify TypeScript types (5 interfaces)
6. Check React hooks implementation
7. Validate providers
8. Check API files
9. Verify environment setup

### Expected Output

```
============================================================
Cart System Verification Report
============================================================

Timestamp: 2025-11-05T10:30:45.123Z
Overall Status: HEALTHY
Health Score: 90/100

Summary:
  ✓ Passed: 28
  ✗ Failed: 0
  ⚠ Warnings: 3

Detailed Results:

✓ PASSED:
  • File exists: src/features/cart/types.ts
    ✓ src/features/cart/types.ts found

  ... (more passed items)

⚠ WARNINGS:
  • Supabase variables in .env.example
    ⚠ All required variables documented

============================================================
```

## Interpretation

### Health Score Calculation

- **Score = 100 - (failed × 10) - (warnings × 3)**
- **Max Score:** 100 (all pass)
- **Acceptable:** 80+ (development)
- **Production:** 95+ (recommended)

### Status Meanings

#### HEALTHY
- **Score:** 90-100
- **Failures:** 0
- **Warnings:** 0-2
- **Status:** Ready for deployment
- **Action:** None required

#### DEGRADED
- **Score:** 70-89
- **Failures:** 0
- **Warnings:** 3+
- **Status:** Functional but needs attention
- **Action:** Address warnings before production

#### CRITICAL
- **Score:** <70
- **Failures:** 1+
- **Warnings:** Any
- **Status:** System incomplete
- **Action:** Fix failures before use

## Understanding Results

### File Structure Checks

```
✓ File exists: src/features/cart/types.ts
  ✓ src/features/cart/types.ts found
```

**Meaning:** File is present and accessible
**Action if Failed:** Check file path, ensure no typos

### Import Checks

```
✓ Import check: src/features/cart/hooks/useCart.ts
  ✓ All imports found
```

**Meaning:** All required imports are present
**Action if Failed:** Check import statements in file

### Type Checks

```
✓ TypeScript interfaces
  ✓ All 5 types defined
```

**Meaning:** All required interfaces defined
**Action if Failed:** Add missing interface to types.ts

### Function Checks

```
✓ localStorage functions
  ✓ All 8 functions implemented
```

**Meaning:** All API functions are present
**Action if Failed:** Implement missing functions

### Dependency Checks

```
✓ Supabase dependency
  ✓ @supabase/supabase-js installed
```

**Meaning:** Required npm packages installed
**Action if Failed:** Run `npm install`

## Common Issues & Solutions

### Issue: ts-node command not found

```bash
npm run verify-cart
# Error: ts-node not found
```

**Solution:**
```bash
npm install -D ts-node
npm run verify-cart
```

### Issue: Failed - Environment file exists

```
✗ Environment file exists (.env.local)
  ⚠ .env.local not found
```

**Solution:**
```bash
cp .env.example .env.local
# Edit .env.local with your values
npm run verify-cart
```

### Issue: File exists errors

```
✗ File exists: src/features/cart/types.ts
  ✗ src/features/cart/types.ts NOT FOUND
```

**Solution:**
1. Check file path (case-sensitive on Linux/Mac)
2. Ensure all cart system files are present
3. Run from project root directory

### Issue: Import errors

```
✗ Import check: src/features/cart/hooks/useCart.ts
  ✗ Missing imports: 3
    - from '@/features/cart/types'
    - from 'react'
    - from '@/features/cart/api-local'
```

**Solution:**
1. Open the file with errors
2. Check import statements
3. Add any missing imports

## Detailed Report Format

### Report Structure

```
[Status Symbol] [Check Name]
  [Message with details]
  [Optional: list of missing items]
```

### Status Symbols

| Symbol | Meaning | Color | Action |
|--------|---------|-------|--------|
| ✓ | PASS | Green | No action needed |
| ✗ | FAIL | Red | Fix immediately |
| ⚠ | WARN | Yellow | Fix before production |

### Message Format

```
✓ [Check description]
  ✓ Success message

✗ [Check description]
  ✗ Failure message
    - Missing item 1
    - Missing item 2

⚠ [Check description]
  ⚠ Warning message
```

## Running Specific Checks

The current script runs all checks. To focus on specific areas:

### Manual File Checks

```bash
# Check file exists
ls -la src/features/cart/types.ts

# Check file content
cat src/features/cart/types.ts

# Check imports in file
grep "from" src/features/cart/hooks/useCart.ts
```

### Manual Import Checks

```bash
# Find all imports in a file
grep "^import\|^from" src/features/cart/api-local.ts

# Check if string exists
grep "CartItem" src/features/cart/types.ts
```

### Manual Type Checks

```bash
# List all interfaces
grep "export interface" src/features/cart/types.ts

# Count interfaces
grep -c "export interface" src/features/cart/types.ts
```

## Fixing Common Failures

### Missing File

**Error:**
```
✗ File exists: src/features/cart/api-local.ts
  ✗ src/features/cart/api-local.ts NOT FOUND
```

**Fix:**
```bash
# Create the file if it's missing
touch src/features/cart/api-local.ts

# Then copy content from working version or docs
```

### Missing Import

**Error:**
```
✗ Import check: src/features/cart/hooks/useCart.ts
  ✗ Missing imports: 1
    - from '@/features/cart/types'
```

**Fix:**
```typescript
// Add at top of useCart.ts
import { CartItem, CartTotals, CartSession } from '../types'
```

### Missing Function

**Error:**
```
✗ localStorage functions
  ✗ Missing functions: 2
    - addToCart
    - removeFromCart
```

**Fix:**
```typescript
// In api-local.ts
export async function addToCart(sessionId: string, productId: string, quantity: number = 1): Promise<boolean> {
  // implementation
}

export async function removeFromCart(sessionId: string, itemId: string): Promise<boolean> {
  // implementation
}
```

### Missing Type

**Error:**
```
✗ TypeScript interfaces
  ✗ Missing types: 2
    - CartItem
    - CartSession
```

**Fix:**
```typescript
// In types.ts
export interface CartItem {
  id: string
  product_id: string
  // ... more fields
}

export interface CartSession {
  id: string
  session_id: string
  // ... more fields
}
```

## Performance

- **Execution Time:** <1 second
- **File Checks:** ~40
- **Import Validations:** ~12
- **Type Validations:** 5
- **Function Checks:** 20+
- **Environment Checks:** 3

## Exit Codes

```bash
npm run verify-cart
# Exit Code 0: All critical checks passed (can have warnings)
# Exit Code 1: At least one check failed
```

Usage in CI/CD:
```bash
npm run verify-cart
if [ $? -eq 0 ]; then
  echo "Cart system verified successfully"
  npm run build
else
  echo "Cart system verification failed"
  exit 1
fi
```

## Interpreting Each Check

### 1. File Structure Checks (8 checks)

```
File exists: src/features/cart/types.ts ..................... ✓
File exists: src/features/cart/api.ts ....................... ✓
File exists: src/features/cart/api-local.ts ................. ✓
File exists: src/features/cart/hooks/useCart.ts ............. ✓
File exists: src/features/cart/index.ts ..................... ✓
File exists: src/providers/CartProvider.tsx ................. ✓
File exists: src/components/CartButton.tsx .................. ✓
File exists: src/app/checkout/success/page.tsx .............. ✓
```

**What it means:** All required cart files are present in the right locations.

### 2. Import Checks (4 checks)

```
Import check: src/features/cart/hooks/useCart.ts ............ ✓
Import check: src/features/cart/api-local.ts ................ ✓
Import check: src/providers/CartProvider.tsx ................ ✓
Import check: src/components/CartButton.tsx ................. ✓
```

**What it means:** Files import the required dependencies correctly.

### 3. Supabase Checks (3 checks)

```
Environment file exists (.env.local) ....................... ⚠
Supabase variables in .env.example ......................... ✓
Supabase client file ...................................... ✓
```

**What it means:** Supabase is configured but may need local env setup.

### 4. localStorage Checks (3 checks)

```
localStorage implementation ............................. ✓
localStorage functions ................................... ✓
Error handling in localStorage ............................ ✓
Debug logging in localStorage ............................. ✓
```

**What it means:** localStorage API is fully implemented with logging.

### 5. Type Checks (1 check)

```
TypeScript interfaces .................................... ✓
```

**What it means:** All required interfaces are defined.

### 6. Hook Checks (3 checks)

```
useCart hook methods .................................... ✓
React hooks usage ........................................ ✓
Client component marker .................................. ✓
```

**What it means:** React hook properly implements cart functionality.

### 7. Provider Checks (4 checks)

```
Context creation ......................................... ✓
Provider component ....................................... ✓
Context hook export ...................................... ✓
Provider client marker ................................... ✓
```

**What it means:** Context provider is properly configured.

### 8. API Checks (2 checks)

```
API exports: src/features/cart/api.ts ..................... ✓
API exports: src/features/cart/api-local.ts .............. ✓
```

**What it means:** Both API implementations export required functions.

### 9. Environment Checks (3 checks)

```
Supabase dependency ..................................... ✓
Next.js setup ............................................ ✓
React setup ............................................. ✓
```

**What it means:** All required packages are installed.

## Next Steps After Verification

### If Healthy (Score 90+)
```
✓ No action required
✓ Ready for development
✓ Ready for testing
✓ Ready for deployment (with .env.local)
```

### If Degraded (Score 70-89)
```
1. Review warnings
2. Address before production deployment
3. Re-run verification
4. Continue development
```

### If Critical (Score <70)
```
1. STOP - Do not deploy
2. Fix all failures
3. Run verification again
4. Confirm all checks pass
5. Then proceed
```

## Automation in CI/CD

### GitHub Actions Example

```yaml
name: Cart System Verification
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run verify-cart
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
npm run verify-cart || exit 1
```

## Support

For verification failures not covered here:
1. Check `/CART_SYSTEM_STATUS.md` for detailed status
2. Review console output for specific errors
3. Check individual file comments
4. Refer to type definitions for API documentation
