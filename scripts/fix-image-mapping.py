#!/usr/bin/env python3
"""
Fix image mapping for Pirelli products with more selective matching
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
print("FIXING PIRELLI PRODUCT IMAGE MAPPING")
print("=" * 80)

# More selective image mappings - only map when we're really sure
specific_mappings = {
    # Cinturato models
    'CINTURATO P1': '/Cinturato-P1-Verde-1505470090255.webp',
    'CINTURATO P7': '/cinturato-p7-4505517104514.webp',

    # Specific Scorpion models only
    'SCORPION VERDE ALL SEASON': '/Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp',
    'S-VEAS': '/Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp',  # Abbreviation for Verde All Season
    'SCORPION VERDE': '/Scorpion-Verde-1505470074533.webp',
    'S-VERD': '/Scorpion-Verde-1505470074533.webp',
    'SCORPION ZERO ALL SEASON': '/Scorpion-Zero-All-Season-1505470086399.webp',
    'SZROAS': '/Scorpion-Zero-All-Season-1505470086399.webp',  # Abbreviation for Zero All Season
    'SCORPION ZERO ASIMMETRICO': '/Scorpion-Zero-Asimmetrico-1505470076172.webp',
    'SCORPION ZERO': '/Scorpion-Zero-1505470088294.webp',
    'SCORPION ATR': '/Scorpion-Atr-1505470067539.webp',
    'S-ATR': '/Scorpion-Atr-1505470067539.webp',
    'SCORPION MTR': '/Scorpion-MTR-1505470071047.webp',
    'S-MTR': '/Scorpion-MTR-1505470071047.webp',
    'SCORPION ALL TERRAIN PLUS': '/Scorpion-All-Terrain-Plus-4505483375619.webp',
    'SCORPION HT': '/Scorpion-HT-4505525112686.webp',
    'S-HT': '/Scorpion-HT-4505525112686.webp',

    # P Zero models
    'P ZERO CORSA SYSTEM': '/Pzero-Corsa-System-Direzionale-1505470088408.webp',
    'P ZERO CORSA': '/Pzero-Corsa-PZC4-1505470090635.webp',
    'PZERO CORSA': '/Pzero-Corsa-PZC4-1505470090635.webp',
    'P ZERO': '/Pzero-Nuovo-1505470072726.webp',
    'PZERO': '/Pzero-Nuovo-1505470072726.webp',
    'P-ZERO': '/Pzero-Nuovo-1505470072726.webp',

    # P400 models
    'P400 EVO': '/P400Evo_review_3-4.webp',
    'P400EVO': '/P400Evo_review_3-4.webp',
    'P400EV': '/P400Evo_review_3-4.webp',
    'P 400 EVO': '/P400Evo_review_3-4.webp',

    # Chrono
    'CHRONO': '/Chrono-1505470062195.webp',
}

# Get all Pirelli products
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').execute()
products = response.data

print(f"\n✓ Found {len(products)} Pirelli products in database")

# Track updates
updates_made = 0
reset_to_mock = 0

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

    # Find the best match
    matched_image = None
    matched_model = None

    # Look for specific model matches (most specific first)
    for model_key, image_file in specific_mappings.items():
        # Check if this specific model appears in the product text
        if model_key.upper() in search_text:
            # For abbreviated models (like S-ATR), ensure we're not matching partial words
            if len(model_key) <= 5:  # Short abbreviations
                # Check for word boundaries
                if f" {model_key.upper()} " in f" {search_text} " or search_text.endswith(f" {model_key.upper()}"):
                    matched_image = image_file
                    matched_model = model_key
                    break
            else:
                matched_image = image_file
                matched_model = model_key
                break

    # If we didn't find a specific match and it's currently using a generic image, reset to mock
    if not matched_image and current_image in ['/Scorpion-4505525112390.webp', '/Pzero-Nuovo-1505470072726.webp']:
        # These products were incorrectly assigned generic images, reset them
        update_data = {'image_url': '/mock-tire.png'}
        try:
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            reset_to_mock += 1
            print(f"⟲ Reset to mock: {product_name[:60]}")
        except Exception as e:
            print(f"❌ Error resetting product {product_id}: {e}")

    # If we found a specific match and it's different from current, update it
    elif matched_image and current_image != matched_image:
        update_data = {'image_url': matched_image}
        try:
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            updates_made += 1
            print(f"✅ Updated: {product_name[:40]} → {matched_model}")
        except Exception as e:
            print(f"❌ Error updating product {product_id}: {e}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Products updated with specific images: {updates_made}")
print(f"⟲ Products reset to mock (incorrect generic mapping): {reset_to_mock}")
print(f"📊 Total Pirelli products: {len(products)}")

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

print("\nFinal image distribution:")
for image, count in image_counter.most_common(5):
    percentage = (count / len(final_products)) * 100
    print(f"  {count:3d} products ({percentage:5.1f}%) → {image[:50]}")

mock_count_final = image_counter.get('/mock-tire.png', 0)
specific_count_final = len(final_products) - mock_count_final
print(f"\n✓ Products with mock image: {mock_count_final}")
print(f"✓ Products with specific images: {specific_count_final}")