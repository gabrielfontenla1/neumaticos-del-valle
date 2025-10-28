#!/usr/bin/env python3
"""
Check for EVO and DRAGON products in database
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
print("CHECKING EVO AND DRAGON PRODUCTS")
print("=" * 80)

# Get all Pirelli products with EVO or DRAGON in name/model/description
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').execute()
products = response.data

evo_products = []
dragon_products = []

for product in products:
    search_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}".upper()
    
    if 'EVO' in search_text and 'P400' not in search_text:  # Exclude P400 EVO which we already handle
        evo_products.append(product)
    
    if 'DRAGON' in search_text:
        dragon_products.append(product)

print(f"\n✓ Found {len(evo_products)} products with 'EVO' (excluding P400 EVO)")
print(f"✓ Found {len(dragon_products)} products with 'DRAGON'")

if evo_products:
    print("\n" + "=" * 80)
    print("EVO PRODUCTS (first 10):")
    print("=" * 80)
    for product in evo_products[:10]:
        print(f"  - {product['name'][:60]:60} | {product.get('model', 'No model')[:20]:20} | Current: {product.get('image_url', 'None')[:30]}")

if dragon_products:
    print("\n" + "=" * 80)
    print("DRAGON PRODUCTS (first 10):")
    print("=" * 80)
    for product in dragon_products[:10]:
        print(f"  - {product['name'][:60]:60} | {product.get('model', 'No model')[:20]:20} | Current: {product.get('image_url', 'None')[:30]}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total EVO products (non-P400): {len(evo_products)}")
print(f"Total DRAGON products: {len(dragon_products)}")
