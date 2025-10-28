#!/usr/bin/env python3
"""
Update Winter, Weather X, and P6000 products with their specific images
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
print("UPDATING WINTER, WEATHER X, AND P6000 PRODUCT IMAGES")
print("=" * 80)

# Get all products from database
response = supabase.table('products').select('*').execute()
all_products = response.data

print(f"\n✓ Found {len(all_products)} total products in database")

# Track updates
winter_updated = 0
weather_updated = 0
p6000_updated = 0

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

    # Check for WINTER products
    if 'WINTER' in search_text:
        if current_image != '/winter.jpg':
            update_data = {'image_url': '/winter.jpg'}
            update_type = 'WINTER'
            winter_updated += 1

    # Check for WEATHER X products
    elif ('WEATHER' in search_text and 'X' in search_text) or 'WEATHER X' in search_text or 'CITYNET ALL WEATHER' in search_text:
        if current_image != '/citynetallweatherx.jpg':
            update_data = {'image_url': '/citynetallweatherx.jpg'}
            update_type = 'WEATHER X'
            weather_updated += 1

    # Check for P6000 products
    elif 'P6000' in search_text or 'P 6000' in search_text:
        if current_image != '/p6000.jpg':
            update_data = {'image_url': '/p6000.jpg'}
            update_type = 'P6000'
            p6000_updated += 1

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
print(f"✅ Winter products updated: {winter_updated}")
print(f"✅ Weather X products updated: {weather_updated}")
print(f"✅ P6000 products updated: {p6000_updated}")
print(f"📊 Total updates: {winter_updated + weather_updated + p6000_updated}")

# Verify the final state
print("\n" + "=" * 80)
print("VERIFYING FINAL STATE")
print("=" * 80)

# Check Winter products
response = supabase.table('products').select('id, name, image_url').execute()
winter_check = []
weather_check = []
p6000_check = []

for product in response.data:
    search_text = product.get('name', '').upper()

    if 'WINTER' in search_text:
        winter_check.append(product)
    elif 'WEATHER' in search_text:
        weather_check.append(product)
    elif 'P6000' in search_text:
        p6000_check.append(product)

print(f"\n✓ Winter products with correct image: {len([p for p in winter_check if p.get('image_url') == '/winter.jpg'])}/{len(winter_check)}")
print(f"✓ Weather X products with correct image: {len([p for p in weather_check if p.get('image_url') == '/citynetallweatherx.jpg'])}/{len(weather_check)}")
print(f"✓ P6000 products with correct image: {len([p for p in p6000_check if p.get('image_url') == '/p6000.jpg'])}/{len(p6000_check)}")

# Overall coverage update
response = supabase.table('products').select('image_url').execute()
all_products_final = response.data

no_image_count = sum(1 for p in all_products_final if p.get('image_url') == '/no-image.png')
with_image_count = len(all_products_final) - no_image_count

print(f"\n📊 Overall coverage:")
print(f"  ✓ Products with specific images: {with_image_count} ({(with_image_count / len(all_products_final) * 100):.1f}%)")
print(f"  ✓ Products with 'no image' placeholder: {no_image_count} ({(no_image_count / len(all_products_final) * 100):.1f}%)")