#!/usr/bin/env python3
"""
Update FORMULA brand products with their specific images
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
print("UPDATING FORMULA BRAND PRODUCT IMAGES")
print("=" * 80)

# Get all FORMULA brand products
response = supabase.table('products').select('*').eq('brand', 'FORMULA').execute()
products = response.data

print(f"\n✓ Found {len(products)} Formula products in database")

# Track updates
energy_updated = 0
dragon_updated = 0
spider_updated = 0
evo_updated = 0

print("\n" + "=" * 80)
print("PROCESSING PRODUCTS")
print("=" * 80)

for product in products:
    product_id = product['id']
    product_name = product.get('name', '')
    product_model = product.get('model', '')
    product_description = product.get('description', '')
    current_image = product.get('image_url', '/mock-tire.png')

    # Create search text
    search_text = f"{product_name} {product_model} {product_description}".upper()

    # Check for FORMULA ENERGY products
    if 'ENERGY' in search_text:
        if current_image != '/energy.jpg':
            update_data = {'image_url': '/energy.jpg'}
            try:
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                energy_updated += 1
                print(f"✅ Updated FORMULA ENERGY: {product_name[:60]}")
            except Exception as e:
                print(f"❌ Error updating product {product_id}: {e}")

    # Check for FORMULA DRAGON products (if any)
    elif 'DRAGON' in search_text:
        if current_image != '/dragon.jpg':
            update_data = {'image_url': '/dragon.jpg'}
            try:
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                dragon_updated += 1
                print(f"✅ Updated FORMULA DRAGON: {product_name[:60]}")
            except Exception as e:
                print(f"❌ Error updating product {product_id}: {e}")

    # Check for FORMULA SPIDER products
    elif 'SPIDER' in search_text:
        # Use a generic performance tire image for Spider
        if current_image == '/mock-tire.png':
            update_data = {'image_url': '/Pzero-Nuovo-1505470072726.webp'}  # Use P Zero as performance tire
            try:
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                spider_updated += 1
                print(f"✅ Updated FORMULA SPIDER: {product_name[:60]}")
            except Exception as e:
                print(f"❌ Error updating product {product_id}: {e}")

    # Check for FORMULA EVO products
    elif 'EVO' in search_text:
        if current_image != '/evo.jpg':
            update_data = {'image_url': '/evo.jpg'}
            try:
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                evo_updated += 1
                print(f"✅ Updated FORMULA EVO: {product_name[:60]}")
            except Exception as e:
                print(f"❌ Error updating product {product_id}: {e}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ FORMULA ENERGY products updated: {energy_updated}")
print(f"✅ FORMULA DRAGON products updated: {dragon_updated}")
print(f"✅ FORMULA SPIDER products updated: {spider_updated}")
print(f"✅ FORMULA EVO products updated: {evo_updated}")
print(f"📊 Total updates: {energy_updated + dragon_updated + spider_updated + evo_updated}")

# Verify the final state
print("\n" + "=" * 80)
print("VERIFYING FINAL STATE")
print("=" * 80)

response = supabase.table('products').select('image_url').eq('brand', 'FORMULA').execute()
final_products = response.data

from collections import Counter
image_counter = Counter()
for product in final_products:
    image_url = product.get('image_url', '/mock-tire.png')
    image_counter[image_url] += 1

print("\nFormula brand image distribution:")
for image, count in image_counter.most_common():
    percentage = (count / len(final_products)) * 100
    print(f"  {count:3d} products ({percentage:5.1f}%) → {image[:50]}")

mock_count_final = image_counter.get('/mock-tire.png', 0)
specific_count_final = len(final_products) - mock_count_final
print(f"\n✓ Products with mock image: {mock_count_final}")
print(f"✓ Products with specific images: {specific_count_final}")
print(f"✓ Coverage: {(specific_count_final / len(final_products) * 100):.1f}%")