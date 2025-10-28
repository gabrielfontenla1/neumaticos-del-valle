#!/usr/bin/env python3
"""
Update all products with mock-tire.png to use the new no-image.png placeholder
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
print("UPDATING PRODUCTS WITHOUT IMAGES TO USE PLACEHOLDER")
print("=" * 80)

# Get all products with mock-tire.png
response = supabase.table('products').select('id, name, brand, image_url').eq('image_url', '/mock-tire.png').execute()
products_with_mock = response.data

print(f"\n✓ Found {len(products_with_mock)} products with mock-tire.png")

if products_with_mock:
    print("\nProducts to update (by brand):")

    # Group by brand for summary
    brands = {}
    for product in products_with_mock:
        brand = product.get('brand', 'Unknown')
        if brand not in brands:
            brands[brand] = 0
        brands[brand] += 1

    for brand, count in sorted(brands.items(), key=lambda x: x[1], reverse=True):
        print(f"  {brand}: {count} products")

print("\n" + "=" * 80)
print("UPDATING PRODUCTS")
print("=" * 80)

# Update all products at once using the new placeholder
update_data = {'image_url': '/no-image.png'}

# Update all products with mock-tire.png to no-image.png
try:
    response = supabase.table('products').update(update_data).eq('image_url', '/mock-tire.png').execute()
    updated_count = len(response.data) if response.data else 0
    print(f"\n✅ Successfully updated {updated_count} products to use '/no-image.png'")
except Exception as e:
    print(f"\n❌ Error updating products: {e}")
    sys.exit(1)

# Verify the update
print("\n" + "=" * 80)
print("VERIFYING UPDATE")
print("=" * 80)

# Check if any products still have mock-tire.png
response = supabase.table('products').select('id').eq('image_url', '/mock-tire.png').execute()
remaining_mock = len(response.data) if response.data else 0

# Check how many now have no-image.png
response = supabase.table('products').select('id').eq('image_url', '/no-image.png').execute()
no_image_count = len(response.data) if response.data else 0

print(f"\n📊 Final Status:")
print(f"  ✓ Products with 'Imagen no disponible': {no_image_count}")
print(f"  ✓ Remaining products with mock-tire.png: {remaining_mock}")

if remaining_mock == 0:
    print("\n✅ All products successfully updated!")
else:
    print(f"\n⚠️ Warning: {remaining_mock} products still have mock-tire.png")

# Show overall image coverage
print("\n" + "=" * 80)
print("OVERALL IMAGE COVERAGE")
print("=" * 80)

response = supabase.table('products').select('image_url').execute()
all_products = response.data

from collections import Counter
image_counter = Counter()
for product in all_products:
    image_url = product.get('image_url', '/no-image.png')
    # Simplify the path for counting
    if 'no-image' in image_url or 'mock' in image_url:
        image_key = 'Sin imagen'
    else:
        image_key = 'Con imagen específica'
    image_counter[image_key] += 1

total_products = len(all_products)
for category, count in image_counter.most_common():
    percentage = (count / total_products) * 100
    print(f"  {category}: {count} productos ({percentage:.1f}%)")