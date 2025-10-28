#!/usr/bin/env python3
"""
Update DRAGON and EVO products with their specific images
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
print("UPDATING DRAGON AND EVO PRODUCT IMAGES")
print("=" * 80)

# Get all Pirelli products
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').execute()
products = response.data

print(f"\n✓ Found {len(products)} Pirelli products in database")

# Track updates
dragon_updated = 0
evo_updated = 0
phantom_updated = 0
powergy_updated = 0

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

    # Check for DRAGON products
    if 'DRAGON' in search_text:
        if current_image != '/dragon.jpg':
            update_data = {'image_url': '/dragon.jpg'}
            try:
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                dragon_updated += 1
                print(f"✅ Updated DRAGON: {product_name[:60]}")
            except Exception as e:
                print(f"❌ Error updating product {product_id}: {e}")

    # Check for EVO products (but not P400 EVO which already has its specific image)
    elif 'EVO' in search_text and 'P400' not in search_text:
        if current_image != '/evo.jpg':
            update_data = {'image_url': '/evo.jpg'}
            try:
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                evo_updated += 1
                print(f"✅ Updated EVO: {product_name[:60]}")
            except Exception as e:
                print(f"❌ Error updating product {product_id}: {e}")

    # Also update PHANTOM products if they exist and don't have images
    elif 'PHANTOM' in search_text and current_image == '/mock-tire.png':
        # Use a generic performance tire image or specific Phantom image if available
        update_data = {'image_url': '/Pzero-Nuovo-1505470072726.webp'}  # Use P Zero image for Phantom
        try:
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            phantom_updated += 1
            print(f"✅ Updated PHANTOM: {product_name[:60]}")
        except Exception as e:
            print(f"❌ Error updating product {product_id}: {e}")

    # Update POWERGY products if they don't have images
    elif 'POWERGY' in search_text and current_image == '/mock-tire.png':
        # Use Cinturato P7 image for Powergy (similar eco tire)
        update_data = {'image_url': '/cinturato-p7-4505517104514.webp'}
        try:
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            powergy_updated += 1
            print(f"✅ Updated POWERGY: {product_name[:60]}")
        except Exception as e:
            print(f"❌ Error updating product {product_id}: {e}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ DRAGON products updated: {dragon_updated}")
print(f"✅ EVO products updated: {evo_updated}")
print(f"✅ PHANTOM products updated: {phantom_updated}")
print(f"✅ POWERGY products updated: {powergy_updated}")
print(f"📊 Total updates: {dragon_updated + evo_updated + phantom_updated + powergy_updated}")

# Verify the final state
print("\n" + "=" * 80)
print("VERIFYING FINAL STATE")
print("=" * 80)

response = supabase.table('products').select('image_url').eq('brand', 'PIRELLI').execute()
final_products = response.data

from collections import Counter
image_counter = Counter()
for product in final_products:
    image_url = product.get('image_url', '/mock-tire.png')
    image_counter[image_url] += 1

print("\nTop image distribution:")
for image, count in image_counter.most_common(10):
    percentage = (count / len(final_products)) * 100
    print(f"  {count:3d} products ({percentage:5.1f}%) → {image[:50]}")

mock_count_final = image_counter.get('/mock-tire.png', 0)
specific_count_final = len(final_products) - mock_count_final
print(f"\n✓ Products with mock image: {mock_count_final}")
print(f"✓ Products with specific images: {specific_count_final}")
print(f"✓ Coverage: {(specific_count_final / len(final_products) * 100):.1f}%")