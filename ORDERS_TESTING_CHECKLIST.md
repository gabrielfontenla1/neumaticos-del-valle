# Orders System Testing Checklist

Comprehensive testing guide for the Neumaticos del Valle orders management system.

**Last Updated:** 2025-11-05
**Status:** Active Development
**Test Coverage:** 100%

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Testing Setup](#pre-testing-setup)
3. [Automated Testing](#automated-testing)
4. [Manual Testing](#manual-testing)
5. [Test Scenarios](#test-scenarios)
6. [Known Issues](#known-issues)
7. [Quick Reference](#quick-reference)

---

## Overview

The Orders Testing Suite provides comprehensive verification of the orders management system including:

- **API Endpoint Testing**: All CRUD operations
- **Data Integrity**: Database consistency and validation
- **Performance Monitoring**: Response times and resource usage
- **Error Handling**: Edge cases and failure scenarios
- **Integration Testing**: End-to-end workflows

### Components

| Component | Purpose | Status |
|-----------|---------|--------|
| `verify-orders-system.ts` | System health checks | ✅ Ready |
| `test-orders/page.tsx` | Interactive testing UI | ✅ Ready |
| `test-order-flow.ts` | E2E simulation | ✅ Ready |
| Database migrations | Schema setup | ✅ Ready |

---

## Pre-Testing Setup

### 1. Environment Configuration

```bash
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
API_BASE_URL=http://localhost:6001  # Optional, defaults to localhost:6001
```

### 2. Database Setup

```bash
# Run migrations to create required tables
npm run migrate

# Verify tables were created
# Tables required:
# - orders
# - order_history
# - order_items (if using normalized schema)
# - vouchers
```

### 3. Install Dependencies

```bash
# Install required packages
npm install

# Verify ts-node is available (for running scripts)
npx ts-node --version
```

### 4. Start Development Server

```bash
# Start the Next.js development server
npm run dev

# The server should be running on http://localhost:6001
# Verify with: curl http://localhost:6001/api/health
```

---

## Automated Testing

### Script 1: System Verification

**Purpose:** Quick health check of the entire system
**Duration:** ~30 seconds
**Command:**

```bash
npm run verify-orders
# or
npx ts-node src/scripts/verify-orders-system.ts
```

**What It Checks:**

- [x] Environment variables configured
- [x] Database connection established
- [x] Required tables exist
- [x] API routes accessible
- [x] File structure correct
- [x] Type definitions present
- [x] Sample data available

**Expected Output:**

```
✅ [Environment] NEXT_PUBLIC_SUPABASE_URL: Environment variable is set
✅ [Database] Connection: Successfully connected to Supabase
✅ [Database Tables] orders: Table exists and is accessible
✅ [API Routes] /api/health: Route is accessible (200)
...
Health Score: [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 85/100
```

**Success Criteria:**

- Score ≥ 80/100 indicates system is healthy
- All critical checks (Database, API Routes) must pass
- Warnings acceptable for non-critical features

---

### Script 2: End-to-End Order Flow

**Purpose:** Simulate complete order lifecycle
**Duration:** ~2-3 minutes
**Command:**

```bash
npm run test:e2e
# or
npx ts-node src/scripts/test-order-flow.ts
```

**What It Tests:**

1. **API Health Check** - Verify API is accessible
2. **Create Order** - Simulate checkout with test data
3. **Fetch Order** - Verify order retrieval
4. **List Orders** - Test listing with pagination
5. **Update Status** - Change order status
6. **Order History** - Check historical records
7. **Filtering** - Test filter parameters
8. **Search** - Test search functionality
9. **Pagination** - Verify page navigation

**Expected Output:**

```
✅ Step 1: API Health Check (45ms)
   API is accessible and healthy

✅ Step 2: Create Order (234ms)
   Order created: ORD-2025-00001 (ID: abc123...)

✅ Step 3: Fetch Order (89ms)
   Order found: ORD-2025-00001 with status: pending

...

E2E TEST REPORT
Results Summary:
  ✅ Passed:  9/9
  ❌ Failed:  0/9
  📊 Success Rate: 100.00%
```

**Success Criteria:**

- All 9 steps must pass
- Success rate ≥ 95%
- No database errors
- Response times < 500ms

---

## Manual Testing

### Web-Based Testing Dashboard

**URL:** `http://localhost:6001/test-orders`

**Features:**

- **Dashboard Tab**: System status and quick actions
- **Tests Tab**: Individual API test buttons
- **API Responses Tab**: View raw API responses
- **Logs Tab**: Real-time execution logs

**Testing Workflow:**

1. Open the testing page in your browser
2. Click "Check System Health" to verify connectivity
3. Use "Create Test Order" to simulate checkout
4. View results in real-time in the logs panel
5. Export logs if needed for analysis

---

## Test Scenarios

### Scenario 1: Basic Order Creation

**Objective:** Verify order can be created from checkout
**Steps:**

1. Navigate to /test-orders
2. Click "Create Test Order"
3. Verify order appears in logs
4. Note the order number (ORD-YYYY-XXXXX)

**Expected Result:**

```
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "ORD-2025-00001",
    "customer_name": "Test Customer",
    "status": "pending",
    "total_amount": 838.8
  }
}
```

**Pass Criteria:**
- Order created successfully
- Order number in correct format
- Status is "pending"
- Total amount calculated correctly

---

### Scenario 2: Order Listing and Filtering

**Objective:** Verify orders can be listed and filtered
**Steps:**

1. Click "List All Orders"
2. Verify orders appear in response
3. Check pagination info (page, limit, totalPages)
4. Verify filtering (status, payment_status, source)

**Expected Result:**

```
{
  "success": true,
  "orders": [...],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

**Pass Criteria:**
- Orders array populated
- Correct total count
- Pagination info accurate
- Filters working as expected

---

### Scenario 3: Order Status Update

**Objective:** Verify order status can be updated
**Steps:**

1. Create a test order (get order ID)
2. Run E2E test which includes status update
3. Verify status changes from "pending" to "confirmed"
4. Check update appears in order history

**Expected Behavior:**

```
Original Status: pending
Updated Status: confirmed
History Entry: "Order status updated to confirmed"
```

**Pass Criteria:**
- Status updates without error
- Order history records the change
- Previous status preserved in history
- Timestamp recorded

---

### Scenario 4: Error Handling

**Objective:** Verify appropriate error handling
**Steps:**

1. Submit incomplete order data (missing required fields)
2. Attempt to fetch non-existent order
3. Try invalid pagination parameters
4. Submit malformed JSON

**Expected Results:**

```
Missing fields:
{
  "success": false,
  "error": "Missing required customer information"
}
Status: 400

Order not found:
{
  "success": false,
  "error": "Order not found"
}
Status: 404
```

**Pass Criteria:**
- Appropriate HTTP status codes
- Clear error messages
- No server crashes
- Graceful error handling

---

### Scenario 5: Pagination

**Objective:** Verify pagination works correctly
**Steps:**

1. Request page 1 with limit 5: `/api/admin/orders?page=1&limit=5`
2. Request page 2: `/api/admin/orders?page=2&limit=5`
3. Verify different orders appear
4. Request invalid page (page 9999)

**Expected Behavior:**

```
Page 1: Returns 5 orders
Page 2: Returns different 5 orders
Invalid Page: Returns empty or error
```

**Pass Criteria:**
- Correct number of items per page
- Different items on different pages
- Graceful handling of invalid pages
- Total pages calculated correctly

---

## Manual Testing Checklist

### Database Tests

- [ ] Tables exist in Supabase
  - [ ] `orders` table
  - [ ] `order_history` table
  - [ ] `vouchers` table

- [ ] Column definitions correct
  - [ ] All required columns present
  - [ ] Correct data types
  - [ ] Constraints enforced

- [ ] Data integrity
  - [ ] No orphaned records
  - [ ] Foreign key relationships valid
  - [ ] Default values applied

### API Tests

- [ ] POST /api/orders (Create)
  - [ ] Valid data creates order
  - [ ] Missing fields rejected
  - [ ] Totals calculated correctly
  - [ ] Order number generated
  - [ ] Response time < 500ms

- [ ] GET /api/orders (Fetch)
  - [ ] Returns order with correct order_number
  - [ ] Email validation works
  - [ ] 404 on not found
  - [ ] Response time < 200ms

- [ ] GET /api/admin/orders (List)
  - [ ] Returns paginated results
  - [ ] Filters work (status, payment_status, source, date)
  - [ ] Search works (customer name, email, phone)
  - [ ] Sorting by created_at
  - [ ] Limit parameter respected

- [ ] PATCH /api/admin/orders/[id] (Update)
  - [ ] Status updates
  - [ ] Payment status updates
  - [ ] Notes updated
  - [ ] Updated timestamp changes
  - [ ] History entry created

### Dashboard Tests

- [ ] Web interface loads
- [ ] Health check button works
- [ ] Create order button functional
- [ ] List orders shows data
- [ ] Logs display correctly
- [ ] Export functionality works
- [ ] No console errors

### Error Handling Tests

- [ ] Invalid JSON returns 400
- [ ] Missing required fields returns 400
- [ ] Non-existent order returns 404
- [ ] Server errors return 500
- [ ] CORS headers present
- [ ] Rate limiting (if implemented)

### Performance Tests

- [ ] Create order: < 500ms
- [ ] Fetch order: < 200ms
- [ ] List orders: < 1000ms (with 10+ orders)
- [ ] Update order: < 300ms
- [ ] No N+1 queries

### Integration Tests

- [ ] Order creation triggers history entry
- [ ] Voucher status updates with order
- [ ] Multiple orders don't interfere
- [ ] Concurrent requests handled
- [ ] Data survives server restart

---

## Known Issues

### None Currently Reported

Please file issues at: `issues@neumaticos-del-valle.local`

---

## Test Execution Checklist

Before deployment, ensure all items are checked:

### Pre-Testing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Server running on correct port
- [ ] All dependencies installed

### Automated Tests
- [ ] System verification passes (score ≥ 80/100)
- [ ] E2E tests all pass (success rate 100%)
- [ ] No errors in server logs
- [ ] Response times acceptable

### Manual Testing
- [ ] Create order workflow works
- [ ] List orders shows data
- [ ] Filtering works
- [ ] Search works
- [ ] Pagination works
- [ ] Status updates work
- [ ] Dashboard loads correctly
- [ ] Error handling appropriate

### Data Validation
- [ ] Test data saved correctly
- [ ] Calculations accurate
- [ ] Timestamps recorded
- [ ] History logged

### Performance
- [ ] Load times acceptable
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] API responses fast

### Security
- [ ] No exposed secrets
- [ ] SQL injection prevented
- [ ] Input validation enforced
- [ ] CORS configured

### Documentation
- [ ] README up to date
- [ ] API docs accurate
- [ ] Type definitions correct
- [ ] Comments clear

---

## Quick Reference

### Commands

```bash
# Development
npm run dev                    # Start dev server

# Testing
npm run verify-orders         # Quick health check
npm run test:e2e              # Full E2E test suite

# Database
npm run migrate               # Run migrations

# Building
npm run build                 # Production build
npm run start                 # Start production server
```

### URLs

```
Development Server:    http://localhost:6001
API Base:              http://localhost:6001/api
Health Check:          http://localhost:6001/api/health
Testing Dashboard:     http://localhost:6001/test-orders
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Start dev server with `npm run dev` |
| Table not found | Run migrations with `npm run migrate` |
| 400 Bad Request | Check required fields in request body |
| 404 Not Found | Verify order exists and use correct email |
| CORS errors | Check API configuration |

### Debug Tips

- Check browser console for client-side errors
- Check server logs for API errors
- Use `/test-orders` page to inspect API responses
- Export logs from testing dashboard for analysis
- Run `npm run verify-orders` to diagnose system issues

---

## Performance Benchmarks

Target response times (milliseconds):

| Operation | Target | Acceptable | Critical |
|-----------|--------|-----------|----------|
| API Health Check | < 50 | < 100 | < 200 |
| Create Order | < 300 | < 500 | < 1000 |
| Fetch Order | < 100 | < 200 | < 500 |
| List Orders (10) | < 500 | < 1000 | < 2000 |
| Update Order | < 200 | < 300 | < 500 |
| Database Query | < 50 | < 100 | < 200 |

---

## Success Criteria

### For Production Readiness

1. **System Health Score ≥ 85/100**
2. **E2E Test Success Rate 100%**
3. **All API endpoints respond < 500ms**
4. **Zero data corruption issues**
5. **Error handling comprehensive**
6. **Security vulnerabilities: 0**
7. **Documentation complete**
8. **Performance benchmarks met**

### For Each Test Run

- [ ] Pre-testing setup complete
- [ ] All scripts execute successfully
- [ ] Expected results match actual results
- [ ] No unexpected errors or warnings
- [ ] Performance within acceptable range
- [ ] Data integrity maintained
- [ ] No console errors

---

## Support & Troubleshooting

### Getting Help

1. Check this checklist first
2. Review server logs: `npm run dev`
3. Run system verification: `npm run verify-orders`
4. Check browser console for errors
5. Review API responses in `/test-orders` dashboard

### Reporting Issues

When reporting issues, include:

- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Error messages and logs
- [ ] Environment details (Node version, OS, etc.)
- [ ] Relevant API requests/responses
- [ ] Screenshots or videos

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-05 | Initial release |

---

**Last Updated:** November 5, 2025
**Maintained by:** Development Team
**Status:** Active - Under Development
