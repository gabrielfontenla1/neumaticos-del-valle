#!/usr/bin/env python3
"""
Check for Formula products in database
"""

import sys
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / '.env.local'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'

load_dotenv(env_path)

# Initialize Supabase client with service role key
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not service_key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    sys.exit(1)

supabase: Client = create_client(url, service_key)

print("=" * 80)
print("CHECKING FORMULA PRODUCTS")
print("=" * 80)

# Get all Pirelli products with FORMULA in name/model/description
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').execute()
products = response.data

formula_products = []
formula_energy_products = []
formula_evo_products = []
formula_st_products = []
formula_at_products = []

for product in products:
    search_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}".upper()
    
    if 'FORMULA' in search_text:
        formula_products.append(product)
        
        if 'ENERGY' in search_text:
            formula_energy_products.append(product)
        elif 'EVO' in search_text and 'FORMULA' in search_text:
            formula_evo_products.append(product)
        elif 'S/T' in search_text or 'S/T' in search_text:
            formula_st_products.append(product)
        elif 'AT' in search_text:
            formula_at_products.append(product)

print(f"\n✓ Found {len(formula_products)} total FORMULA products")
print(f"  - Formula Energy: {len(formula_energy_products)}")
print(f"  - Formula EVO: {len(formula_evo_products)}")
print(f"  - Formula S/T: {len(formula_st_products)}")
print(f"  - Formula AT: {len(formula_at_products)}")

if formula_energy_products:
    print("\n" + "=" * 80)
    print("FORMULA ENERGY PRODUCTS:")
    print("=" * 80)
    for product in formula_energy_products:
        print(f"  - {product['name'][:60]:60} | Current: {product.get('image_url', 'None')[:30]}")

if formula_evo_products:
    print("\n" + "=" * 80)
    print("FORMULA EVO PRODUCTS:")
    print("=" * 80)
    for product in formula_evo_products:
        print(f"  - {product['name'][:60]:60} | Current: {product.get('image_url', 'None')[:30]}")

if formula_st_products:
    print("\n" + "=" * 80)
    print("FORMULA S/T PRODUCTS (first 10):")
    print("=" * 80)
    for product in formula_st_products[:10]:
        print(f"  - {product['name'][:60]:60} | Current: {product.get('image_url', 'None')[:30]}")

