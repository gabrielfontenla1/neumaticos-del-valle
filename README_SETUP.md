# Neumáticos del Valle - Setup Guide

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL client (psql) for running migrations
- Supabase account (free tier works)
- Railway account for deployment (optional)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone [your-repo-url]
cd neumaticos-del-valle
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for the project to be ready
3. Go to Settings → API to get your keys:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Configure Environment Variables

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

### 4. Run Database Migrations

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each migration file from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_functions.sql`
   - `004_storage_buckets.sql`
3. Run each script
4. Optionally run `supabase/seed.sql` for sample data

#### Option B: Using Migration Script

1. Install PostgreSQL client if not installed
2. Run the migration script:
```bash
npm run migrate
```
3. Follow the prompts

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
neumaticos-del-valle/
├── src/
│   ├── app/               # Next.js 15 app directory
│   ├── components/        # React components
│   ├── lib/              # Utilities and configurations
│   │   ├── supabase.ts   # Supabase client
│   │   └── supabase-admin.ts # Admin client
│   └── types/            # TypeScript types
│       └── database.ts   # Database types
├── supabase/
│   ├── migrations/       # SQL migration files
│   └── seed.sql         # Sample data
├── scripts/
│   └── migrate.js       # Migration runner
└── railway.toml        # Railway deployment config
```

## 🗄️ Database Schema

### Main Tables

- **profiles**: User profiles extending Supabase auth
- **stores**: Physical store locations
- **categories**: Product categories
- **brands**: Tire brands
- **products**: Main product catalog
- **product_images**: Product images
- **vouchers**: Customer vouchers/quotes
- **appointments**: Service appointments
- **reviews**: Product reviews
- **cart_sessions**: Shopping cart persistence
- **cart_items**: Cart items

### Security

- Row Level Security (RLS) enabled on all tables
- Public read access for products, categories, brands
- Authenticated access for user-specific data
- Admin-only access for management operations

## 🚀 Deployment

### Deploy to Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add environment variables in Railway dashboard

4. Deploy:
```bash
railway up
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## 📝 Common Tasks

### Add Admin User

1. Create user in Supabase Auth dashboard
2. Update profile to set `is_admin = true`:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';
```

### Clean Expired Carts

Run periodically:
```sql
SELECT clean_expired_carts();
```

### Generate Analytics Report

```sql
SELECT * FROM get_analytics('2024-01-01', '2024-12-31');
```

## 🔧 Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check if database is accessible from your IP
- Ensure SSL is enabled in connection string

### Missing Types

Regenerate types:
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

### Storage Issues

Ensure buckets are created:
```sql
SELECT * FROM storage.buckets;
```

Should show: products, reviews, vouchers

## 📚 API Documentation

### Supabase Functions

- `search_products()`: Full-text product search
- `get_product_details()`: Get complete product info
- `generate_voucher_code()`: Generate unique voucher codes
- `calculate_cart_total()`: Calculate cart totals with tax
- `get_store_availability()`: Check appointment slots
- `get_analytics()`: Admin dashboard analytics

### Client Usage Example

```typescript
import { supabase } from '@/lib/supabase'

// Search products
const { data, error } = await supabase.rpc('search_products', {
  search_query: 'michelin',
  category_filter: null,
  min_price: 50000,
  max_price: 100000,
  limit_results: 20
})

// Get product details
const { data, error } = await supabase.rpc('get_product_details', {
  product_slug: 'michelin-primacy-4-205-55-r16'
})
```

## 🤝 Support

For issues or questions, please open an issue on GitHub or contact support.

## 📄 License

Copyright © 2024 Neumáticos del Valle. All rights reserved.