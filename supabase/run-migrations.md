# Database Migrations - Hardcoded Data to Database

## Overview
These migrations move hardcoded business data from code into database tables, allowing runtime updates without code changes.

## Migration Files
1. `20250128_create_appointment_services.sql` - Appointment services table
2. `20250128_create_quotation_services.sql` - Quotation services table
3. `20250128_create_vehicle_tables.sql` - Vehicle brands and models tables

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the content of each migration file in order:
   - First: `20250128_create_appointment_services.sql`
   - Second: `20250128_create_quotation_services.sql`
   - Third: `20250128_create_vehicle_tables.sql`
5. Click **Run** for each query
6. Verify data was inserted by going to **Table Editor** and checking the new tables

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 3: Manual SQL Execution
If using a different PostgreSQL client:
```bash
psql -h YOUR_DB_HOST -U YOUR_USER -d YOUR_DATABASE -f supabase/migrations/20250128_create_appointment_services.sql
psql -h YOUR_DB_HOST -U YOUR_USER -d YOUR_DATABASE -f supabase/migrations/20250128_create_quotation_services.sql
psql -h YOUR_DB_HOST -U YOUR_USER -d YOUR_DATABASE -f supabase/migrations/20250128_create_vehicle_tables.sql
```

## Verification

After running migrations, verify the tables and data:

```sql
-- Check appointment_services table
SELECT * FROM appointment_services;
-- Expected: 8 services

-- Check quotation_services table
SELECT * FROM quotation_services;
-- Expected: 3 services

-- Check vehicle_brands table
SELECT * FROM vehicle_brands;
-- Expected: 7 brands

-- Check vehicle_models table
SELECT COUNT(*) as model_count, b.name as brand_name
FROM vehicle_models m
JOIN vehicle_brands b ON m.brand_id = b.id
GROUP BY b.name
ORDER BY b.name;
-- Expected: 42 models across 7 brands
```

## What Changed

### Before (Hardcoded)
```typescript
// src/features/appointments/types.ts
export const SERVICES: Service[] = [ /* 8 hardcoded services */ ]

// src/features/quotation/api.ts
export const vehicleBrands = ['Volkswagen', 'Ford', ...]
export const vehicleModels = { 'Volkswagen': ['Golf', ...], ... }
export const availableServices: Service[] = [ /* 3 hardcoded services */ ]
```

### After (Database)
```typescript
// Fetch from database
import { getAppointmentServices } from '@/features/appointments/api'
import { getQuotationServices, getVehicleBrands, getVehicleModels } from '@/features/quotation/api'

const services = await getAppointmentServices()
const quotationServices = await getQuotationServices()
const brands = await getVehicleBrands()
const models = await getVehicleModels(selectedBrand)
```

## Benefits
✅ Update services/vehicles without code deployments
✅ Add/remove/modify data through admin interface
✅ Centralized data management
✅ Better data consistency across features
✅ Automatic fallback to hardcoded data if database fails

## Next Steps
After migrations are complete:
1. Update components to use new API functions
2. Test appointment flow
3. Test quotation flow
4. Consider removing hardcoded data once fully migrated
