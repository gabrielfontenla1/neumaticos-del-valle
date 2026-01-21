#!/bin/bash

# Apply Migrations via Supabase REST API
# This script applies all critical migrations for the branch system

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing environment variables"
  echo "   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🚀 APPLYING MIGRATIONS - BRANCH SYSTEM               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Migration 1: Add columns
echo "📄 Migration 1: Adding columns to stores table"
echo "────────────────────────────────────────────────────────────────"

SQL1="ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS province VARCHAR(100);"
SQL2="ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS background_image_url TEXT;"
SQL3="UPDATE public.stores SET province = CASE WHEN city ILIKE '%catamarca%' THEN 'Catamarca' WHEN city ILIKE '%santiago%' THEN 'Santiago del Estero' WHEN city ILIKE '%salta%' THEN 'Salta' WHEN city ILIKE '%tucum%' THEN 'Tucumán' ELSE NULL END WHERE province IS NULL;"

# Note: Supabase doesn't allow DDL via REST API, we need to use SQL Editor
echo "⚠️  DDL statements (ALTER TABLE) cannot be executed via REST API"
echo "   Migrations must be applied manually in Supabase Dashboard"
echo ""
echo "✅ Created consolidated SQL file: scripts/APPLY_THIS.sql"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   📋 MANUAL STEPS REQUIRED                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Open Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Go to: SQL Editor"
echo "3. Copy content from: scripts/APPLY_THIS.sql"
echo "4. Paste and click 'Run'"
echo ""
echo "Then run: npx tsx scripts/cleanup-branch-data.ts"
echo ""
