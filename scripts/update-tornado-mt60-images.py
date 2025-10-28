#!/usr/bin/env python3
"""
Update Tornado and MT60 products with their specific images
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
print("UPDATING TORNADO AND MT60 PRODUCT IMAGES")
print("=" * 80)

# Get all products from database
response = supabase.table('products').select('*').execute()
all_products = response.data

print(f"\n✓ Found {len(all_products)} total products in database")

# Track updates
tornado_updated = 0
mt60_updated = 0

print("\n" + "=" * 80)
print("PROCESSING PRODUCTS")
print("=" * 80)

for product in all_products:
    product_id = product['id']
    product_name = product.get('name', '')
    product_model = product.get('model', '')
    product_description = product.get('description', '')
    current_image = product.get('image_url', '/no-image.png')

    # Create search text
    search_text = f"{product_name} {product_model} {product_description}".upper()

    update_data = None
    update_type = None

    # Check for TORNADO products
    if 'TORNADO' in search_text:
        if current_image != '/tornado.jpg':
            update_data = {'image_url': '/tornado.jpg'}
            update_type = 'TORNADO'
            tornado_updated += 1

    # Check for MT60 products
    elif 'MT60' in search_text or 'MT 60' in search_text or 'MT-60' in search_text:
        if current_image != '/mt60.jpg':
            update_data = {'image_url': '/mt60.jpg'}
            update_type = 'MT60'
            mt60_updated += 1

    # Apply the update if we found a match
    if update_data:
        try:
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            print(f"✅ Updated {update_type}: {product_name[:60]}")
        except Exception as e:
            print(f"❌ Error updating product {product_id}: {e}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Tornado products updated: {tornado_updated}")
print(f"✅ MT60 products updated: {mt60_updated}")
print(f"📊 Total updates: {tornado_updated + mt60_updated}")

# Verify the final state
print("\n" + "=" * 80)
print("VERIFYING FINAL STATE")
print("=" * 80)

# Overall coverage update
response = supabase.table('products').select('image_url').execute()
all_products_final = response.data

no_image_count = sum(1 for p in all_products_final if p.get('image_url') == '/no-image.png')
with_image_count = len(all_products_final) - no_image_count

print(f"\n📊 Overall coverage:")
print(f"  ✓ Products with specific images: {with_image_count} ({(with_image_count / len(all_products_final) * 100):.1f}%)")
print(f"  ✓ Products with 'no image' placeholder: {no_image_count} ({(no_image_count / len(all_products_final) * 100):.1f}%)")