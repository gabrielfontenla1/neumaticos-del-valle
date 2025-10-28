#!/usr/bin/env python3
"""
Check status of specific tire models: Winter, Weather X, P6000
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
print("CHECKING WINTER, WEATHER X, AND P6000 PRODUCTS")
print("=" * 80)

# Models to check
models_to_check = ['WINTER', 'WEATHER', 'P6000', 'P 6000']

# Get all products from all brands
response = supabase.table('products').select('*').execute()
all_products = response.data

print(f"\n✓ Total products in database: {len(all_products)}")

# Categorize products
winter_products = []
weather_products = []
p6000_products = []

for product in all_products:
    search_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}".upper()

    if 'WINTER' in search_text:
        winter_products.append(product)
    elif 'WEATHER' in search_text:
        weather_products.append(product)
    elif 'P6000' in search_text or 'P 6000' in search_text:
        p6000_products.append(product)

# Display Winter products
print("\n" + "=" * 80)
print("WINTER PRODUCTS")
print("=" * 80)
if winter_products:
    print(f"Found {len(winter_products)} Winter products:\n")
    for product in winter_products[:10]:  # Show first 10
        brand = product.get('brand', 'N/A')
        name = product.get('name', 'N/A')
        image = product.get('image_url', 'N/A')

        # Check if it has a real image or placeholder
        if image == '/no-image.png' or image == '/mock-tire.png':
            status = "❌ NO IMAGE"
        else:
            status = f"✅ Has image: {image[:40]}"

        print(f"  [{brand}] {name[:50]:50} → {status}")

    if len(winter_products) > 10:
        print(f"  ... and {len(winter_products) - 10} more Winter products")
else:
    print("No Winter products found")

# Display Weather products
print("\n" + "=" * 80)
print("WEATHER X PRODUCTS")
print("=" * 80)
if weather_products:
    print(f"Found {len(weather_products)} Weather products:\n")
    for product in weather_products[:10]:  # Show first 10
        brand = product.get('brand', 'N/A')
        name = product.get('name', 'N/A')
        image = product.get('image_url', 'N/A')

        # Check if it has a real image or placeholder
        if image == '/no-image.png' or image == '/mock-tire.png':
            status = "❌ NO IMAGE"
        else:
            status = f"✅ Has image: {image[:40]}"

        print(f"  [{brand}] {name[:50]:50} → {status}")

    if len(weather_products) > 10:
        print(f"  ... and {len(weather_products) - 10} more Weather products")
else:
    print("No Weather products found")

# Display P6000 products
print("\n" + "=" * 80)
print("P6000 PRODUCTS")
print("=" * 80)
if p6000_products:
    print(f"Found {len(p6000_products)} P6000 products:\n")
    for product in p6000_products[:10]:  # Show first 10
        brand = product.get('brand', 'N/A')
        name = product.get('name', 'N/A')
        image = product.get('image_url', 'N/A')

        # Check if it has a real image or placeholder
        if image == '/no-image.png' or image == '/mock-tire.png':
            status = "❌ NO IMAGE"
        else:
            status = f"✅ Has image: {image[:40]}"

        print(f"  [{brand}] {name[:50]:50} → {status}")

    if len(p6000_products) > 10:
        print(f"  ... and {len(p6000_products) - 10} more P6000 products")
else:
    print("No P6000 products found")

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

def count_with_images(products):
    count = 0
    for p in products:
        img = p.get('image_url', '')
        if img and img != '/no-image.png' and img != '/mock-tire.png':
            count += 1
    return count

winter_with_images = count_with_images(winter_products)
weather_with_images = count_with_images(weather_products)
p6000_with_images = count_with_images(p6000_products)

print(f"\n📊 Winter products: {len(winter_products)} total, {winter_with_images} with images ({winter_with_images}/{len(winter_products) if winter_products else 0})")
print(f"📊 Weather products: {len(weather_products)} total, {weather_with_images} with images ({weather_with_images}/{len(weather_products) if weather_products else 0})")
print(f"📊 P6000 products: {len(p6000_products)} total, {p6000_with_images} with images ({p6000_with_images}/{len(p6000_products) if p6000_products else 0})")

# Check what images are available in public folder
print("\n" + "=" * 80)
print("CHECKING AVAILABLE IMAGES")
print("=" * 80)

import os
public_path = Path(__file__).parent.parent / 'public'

# Look for images that might match these products
potential_images = []
for file in os.listdir(public_path):
    file_lower = file.lower()
    if any(ext in file_lower for ext in ['.jpg', '.webp', '.png']):
        if 'winter' in file_lower or 'weather' in file_lower or 'p6000' in file_lower or 'p-6000' in file_lower:
            potential_images.append(file)
            print(f"  ✓ Found potential image: {file}")

if not potential_images:
    print("  ℹ️  No specific images found for Winter, Weather X, or P6000 in public folder")

# Check if there are specific images we should look for
print("\n" + "=" * 80)
print("EXISTING PIRELLI IMAGES IN USE")
print("=" * 80)

# Get unique images from Pirelli products
response = supabase.table('products').select('image_url').eq('brand', 'PIRELLI').execute()
pirelli_products = response.data

from collections import Counter
image_counter = Counter()
for product in pirelli_products:
    img = product.get('image_url', '')
    if img and img != '/no-image.png' and img != '/mock-tire.png':
        image_counter[img] += 1

print("\nTop Pirelli images that might be relevant:")
for img, count in image_counter.most_common(20):
    img_lower = img.lower()
    if 'winter' in img_lower or 'weather' in img_lower or 'p6000' in img_lower or 'p-6000' in img_lower:
        print(f"  {count:3d} products → {img}")
    elif 'sotto' in img_lower or 'zero' in img_lower and 'winter' in img_lower:
        print(f"  {count:3d} products → {img} (possible Winter tire)")