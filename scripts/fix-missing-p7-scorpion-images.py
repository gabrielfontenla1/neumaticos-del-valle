#!/usr/bin/env python3
"""
Fix missing images for P7 and Scorpion products
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
print("FIXING MISSING P7 AND SCORPION PRODUCT IMAGES")
print("=" * 80)

# Get all Pirelli products with mock image
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').eq('image_url', '/mock-tire.png').execute()
products_with_mock = response.data

print(f"\n✓ Found {len(products_with_mock)} Pirelli products with mock image")

# Track updates
p7_updated = 0
p4_updated = 0
scorpion_updated = 0
scorpion_at_updated = 0
scorpion_str_updated = 0

print("\n" + "=" * 80)
print("PROCESSING PRODUCTS")
print("=" * 80)

for product in products_with_mock:
    product_id = product['id']
    product_name = product.get('name', '')
    product_model = product.get('model', '')
    product_description = product.get('description', '')
    current_image = product.get('image_url', '/mock-tire.png')

    # Create search text
    search_text = f"{product_name} {product_model} {product_description}".upper()

    update_data = None
    update_type = None

    # Handle P7/Cinturato products
    if 'P7' in search_text or 'P7000' in search_text:
        # Use Cinturato P7 image for all P7 variants
        update_data = {'image_url': '/cinturato-p7-4505517104514.webp'}
        update_type = 'P7'
        p7_updated += 1
    elif 'P4' in search_text:
        # Use Cinturato P1 image for P4 (as fallback)
        update_data = {'image_url': '/Cinturato-P1-Verde-1505470090255.webp'}
        update_type = 'P4'
        p4_updated += 1
    # Handle Scorpion products
    elif 'SCORPION' in search_text:
        # Check for specific Scorpion variants
        if ('A/T+' in search_text or 'A/T +' in search_text or 'AT+' in search_text or
            'ALL' in search_text and 'TERRAIN' in search_text):
            # Use Scorpion All Terrain Plus image
            update_data = {'image_url': '/Scorpion-All-Terrain-Plus-4505483375619.webp'}
            update_type = 'SCORPION A/T+'
            scorpion_at_updated += 1
        elif 'STR' in search_text:
            # Use generic Scorpion image for STR
            update_data = {'image_url': '/Scorpion-4505525112390.webp'}
            update_type = 'SCORPION STR'
            scorpion_str_updated += 1
        else:
            # Use generic Scorpion image for all other Scorpion variants
            update_data = {'image_url': '/Scorpion-4505525112390.webp'}
            update_type = 'SCORPION'
            scorpion_updated += 1

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
print(f"✅ P7 products updated: {p7_updated}")
print(f"✅ P4 products updated: {p4_updated}")
print(f"✅ Scorpion (generic) products updated: {scorpion_updated}")
print(f"✅ Scorpion A/T+ products updated: {scorpion_at_updated}")
print(f"✅ Scorpion STR products updated: {scorpion_str_updated}")
print(f"📊 Total updates: {p7_updated + p4_updated + scorpion_updated + scorpion_at_updated + scorpion_str_updated}")

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

print("\nTop 10 image distribution for Pirelli:")
for image, count in image_counter.most_common(10):
    percentage = (count / len(final_products)) * 100
    print(f"  {count:3d} products ({percentage:5.1f}%) → {image[:50]}")

mock_count_final = image_counter.get('/mock-tire.png', 0)
specific_count_final = len(final_products) - mock_count_final
print(f"\n✓ Products with mock image: {mock_count_final}")
print(f"✓ Products with specific images: {specific_count_final}")
print(f"✓ Coverage: {(specific_count_final / len(final_products) * 100):.1f}%")