# Orders System Testing Guide

Quick start guide for testing the orders management system.

---

## Quick Start (5 minutes)

### 1. Setup

```bash
# Install dependencies
npm install

# Ensure Supabase credentials are set
# Check .env.local or environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Start dev server
npm run dev
# Wait for: ✓ Ready in 2.5s
```

### 2. Run Quick Health Check

```bash
# In another terminal
npm run verify-orders
```

Expected output:
```
✅ [Environment] NEXT_PUBLIC_SUPABASE_URL: Environment variable is set
✅ [Database] Connection: Successfully connected to Supabase
✅ [Database Tables] orders: Table exists and is accessible
...
Health Score: 85/100 ✅ SYSTEM IS HEALTHY
```

### 3. Run E2E Tests

```bash
npm run test:e2e
```

Expected output:
```
✅ Step 1: API Health Check (45ms)
✅ Step 2: Create Order (234ms)
✅ Step 3: Fetch Order (89ms)
...
E2E TEST REPORT
Success Rate: 100.00%
```

### 4. Web-Based Testing (Optional)

Visit: **http://localhost:6001/test-orders**

Features:
- Dashboard with system status
- Interactive test buttons
- Real-time logs
- API response inspector
- Log export

---

## Testing Methods

### Method 1: Automated Scripts (Fastest)

**Health Check** (~30 seconds):
```bash
npm run verify-orders
```

**E2E Tests** (~2-3 minutes):
```bash
npm run test:e2e
```

### Method 2: Web Dashboard (Visual)

Navigate to: **http://localhost:6001/test-orders**

**Advantages:**
- Visual feedback
- Real-time logs
- Export logs as JSON
- No command line needed

**Steps:**
1. Click "Check System Health"
2. Click "Create Test Order"
3. Click "List All Orders"
4. Review logs and responses

### Method 3: cURL/API Client (Manual)

**Check Health:**
```bash
curl http://localhost:6001/api/health
```

**Create Order:**
```bash
curl -X POST http://localhost:6001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+58-412-1234567",
    "items": [
      {
        "product_id": "1",
        "product_name": "Test Tire",
        "sku": "TEST-001",
        "quantity": 1,
        "unit_price": 100,
        "total_price": 100
      }
    ],
    "subtotal": 100,
    "tax": 16,
    "shipping": 0,
    "payment_method": "cash"
  }'
```

**List Orders:**
```bash
curl "http://localhost:6001/api/admin/orders?page=1&limit=10"
```

---

## Troubleshooting

### Problem: Connection refused

**Solution:**
```bash
# Make sure dev server is running
npm run dev

# Verify server is on port 6001
lsof -i :6001
```

### Problem: "Table does not exist"

**Solution:**
```bash
# Run database migrations
npm run migrate

# Verify tables with psql or Supabase UI
# Tables needed: orders, order_history, vouchers
```

### Problem: Environment variables missing

**Solution:**
```bash
# Check .env.local exists
ls -la .env.local

# Export variables directly (temporary)
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"

# Then run tests
npm run verify-orders
```

### Problem: "ts-node not found"

**Solution:**
```bash
# Install ts-node globally or use npx
npx ts-node --version

# Or install locally
npm install --save-dev ts-node
npm run verify-orders
```

### Problem: Port 6001 in use

**Solution:**
```bash
# Kill existing process
npm run kill-port

# Or specify different port
next dev --port 3001
```

---

## Test Scenarios

### Test 1: Can I create an order?

```bash
# Step 1: Run E2E tests
npm run test:e2e

# Step 2: Look for "Step 2: Create Order" in output
# Expected: PASS with order number ORD-2025-XXXXX

# Step 3: Verify in database
# Orders table should have 1+ records
```

### Test 2: Are my APIs working?

```bash
# Step 1: Check health
npm run verify-orders

# Step 2: Look for API Routes section
# All endpoints should show PASS

# Step 3: Visit dashboard
# http://localhost:6001/test-orders → Tests tab
# Click "List All Orders"
```

### Test 3: Does filtering work?

**Via Web Dashboard:**

1. Go to http://localhost:6001/test-orders
2. Click "List All Orders"
3. Check API Responses tab
4. Verify `total` count is accurate

**Via Script:**

```bash
npm run test:e2e
# Look for "Step 7: Order Filtering"
# Should find orders matching criteria
```

### Test 4: Is pagination working?

**Via cURL:**

```bash
# Page 1
curl "http://localhost:6001/api/admin/orders?page=1&limit=5"

# Page 2
curl "http://localhost:6001/api/admin/orders?page=2&limit=5"

# Compare results - should be different orders
```

### Test 5: Can I update order status?

**Via Web Dashboard:**

1. Create test order
2. Note the order ID from response
3. Run E2E test which updates status
4. Verify status changed to "confirmed"

---

## Performance Testing

### Check Response Times

Visit **http://localhost:6001/test-orders** → **API Responses** tab

Response shows:
```
Duration: 234ms
```

**Target times:**
- Health check: < 100ms
- Create order: < 500ms
- List orders: < 1000ms
- Update order: < 300ms

### Load Testing

```bash
# Test with 10 concurrent requests
for i in {1..10}; do
  npm run test:e2e &
done
wait

# Results should show:
# - All tests pass
# - No database locks
# - No timeout errors
```

---

## Common Test Results

### Success (Expected)

```
✅ Step 1: API Health Check (45ms)
✅ Step 2: Create Order (234ms)
✅ Step 3: Fetch Order (89ms)
✅ Step 4: List Orders (456ms)
✅ Step 5: Update Order Status (123ms)
✅ Step 6: Order History (200ms)
✅ Step 7: Order Filtering (234ms)
✅ Step 8: Order Search (189ms)
✅ Step 9: Pagination (145ms)

Success Rate: 100.00%
Health Score: 90/100 ✅
```

### Failure (Needs Investigation)

```
❌ Step 2: Create Order
   Failed to create order: "Missing required field: customer_phone"
```

**Action:**
1. Check API payload
2. Review validation rules
3. Check error message
4. Fix and retry

### Warning (Not Critical)

```
⚠️ Step 6: Order History
   Order history accessible but slow (1234ms)
```

**Action:**
1. Check database indexes
2. Optimize query
3. Monitor in production

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test Orders System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Start dev server
        run: npm run dev &

      - name: Wait for server
        run: sleep 5

      - name: Run health check
        run: npm run verify-orders

      - name: Run E2E tests
        run: npm run test:e2e
```

---

## Debugging

### Enable Verbose Logging

**In test-order-flow.ts:**
```typescript
// Uncomment for detailed logging
console.log('Full response:', JSON.stringify(data, null, 2))
```

**In verify-orders-system.ts:**
```typescript
// Already includes detailed logging
// Check results array for all checks
```

### Check Server Logs

```bash
# Terminal where dev server is running
npm run dev

# Shows all API requests and responses
# Look for errors in order operations
```

### Export Logs from Dashboard

1. Go to http://localhost:6001/test-orders
2. Click "Logs" tab
3. Click "Download" button
4. Logs saved as JSON with timestamp

---

## Checklist for QA

Before declaring system ready:

- [ ] Health check passes (score ≥ 80/100)
- [ ] E2E tests pass (100% success rate)
- [ ] Create order works
- [ ] List orders shows data
- [ ] Update status works
- [ ] Search/filter works
- [ ] Pagination works
- [ ] Error handling appropriate
- [ ] Response times acceptable
- [ ] No database errors
- [ ] No console errors
- [ ] Dashboard UI functional

---

## Getting Help

1. **Check logs**: `npm run dev` (see terminal output)
2. **Run health check**: `npm run verify-orders`
3. **View responses**: http://localhost:6001/test-orders → API Responses tab
4. **Review API docs**: Check `/src/app/api/` folder for endpoint code
5. **Check types**: `/src/features/orders/types.ts`

---

## Next Steps

- Deploy to staging for integration testing
- Load test with production-like data
- Security audit of API endpoints
- Performance optimization if needed
- User acceptance testing

---

**Last Updated:** November 5, 2025
**Quick Reference:** 5-10 minutes to complete all tests
