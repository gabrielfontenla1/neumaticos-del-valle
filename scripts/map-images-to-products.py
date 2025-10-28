#!/usr/bin/env python3
"""
Script to map Pirelli tire images in the public folder to products in the database
"""

import sys
import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import json

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
print("MAPPING PIRELLI TIRE IMAGES TO PRODUCTS")
print("=" * 80)

# Get all Pirelli product images from public folder
public_path = Path(__file__).parent.parent / 'public'
image_extensions = ['.webp', '.jpg', '.jpeg', '.png']
pirelli_images = []

for ext in image_extensions:
    for img_file in public_path.glob(f'*{ext}'):
        # Skip logo and generic images
        if any(skip in img_file.name.lower() for skip in ['logo', 'mock-tire', 'tire.webp', 'ndv']):
            continue
        pirelli_images.append(img_file.name)

print(f"\n✓ Found {len(pirelli_images)} Pirelli tire images in public folder")

# Create image mappings based on model names
image_mappings = {
    'Cinturato P1': ['Cinturato-P1-Verde-1505470090255.webp'],
    'Cinturato P7': ['cinturato-p7-4505517104514.webp', 'Cinturato-P7-1505470083092.webp'],
    'Scorpion HT': ['Scorpion-HT-4505525112686.webp'],
    'Scorpion Verde All Season': ['Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp'],
    'Scorpion Verde': ['Scorpion-Verde-1505470074533 (1).webp', 'Scorpion-Verde-1505470074533.webp'],
    'Scorpion Zero All Season': ['Scorpion-Zero-All-Season-1505470086399.webp'],
    'Scorpion Zero': ['Scorpion-Zero-1505470088294.webp'],
    'Scorpion Zero Asimmetrico': ['Scorpion-Zero-Asimmetrico-1505470076172.webp'],
    'Scorpion': ['Scorpion-4505525112390.webp'],
    'Scorpion ATR': ['Scorpion-Atr-1505470067539.webp'],
    'Scorpion MTR': ['Scorpion-MTR-1505470071047.webp'],
    'Scorpion All Terrain Plus': ['Scorpion-All-Terrain-Plus-4505483375619.webp'],
    'P Zero Corsa System': ['Pzero-Corsa-System-Direzionale-1505470088408.webp'],
    'P Zero Corsa': ['Pzero-Corsa-PZC4-1505470090635.webp'],
    'P Zero': ['Pzero-Nuovo-1505470072726.webp', 'Pzero-vecchio-1505470066413.webp'],
    'P400 Evo': ['P400Evo_review_3-4.webp'],
    'Chrono': ['Chrono-1505470062195.webp']
}

print("\n" + "=" * 80)
print("PROCESSING IMAGE MAPPINGS")
print("=" * 80)

# Get all Pirelli products from database
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').execute()
products = response.data

print(f"\n✓ Found {len(products)} Pirelli products in database")

# Track updates
updates_made = []
no_match = []

for product in products:
    product_id = product['id']
    product_name = product.get('name', '')
    product_model = product.get('model', '')
    product_description = product.get('description', '')
    current_image_url = product.get('image_url', '')

    # Clean the text to match against mappings
    search_text = f"{product_name} {product_model} {product_description}".upper()

    # Try to find matching image
    matched_image = None
    matched_model = None

    for model_key, image_files in image_mappings.items():
        # Create various search patterns
        model_patterns = [
            model_key.upper(),
            model_key.upper().replace(' ', '-'),
            model_key.upper().replace(' ', ''),
            model_key.upper().replace('P ZERO', 'PZERO'),
            model_key.upper().replace('P ZERO', 'P-ZERO')
        ]

        for pattern in model_patterns:
            if pattern in search_text:
                matched_image = f"/{image_files[0]}"  # Use first matching image
                matched_model = model_key
                break

        if matched_image:
            break

    if matched_image:
        # Check if image needs to be updated
        if not current_image_url or current_image_url == '/mock-tire.png' or current_image_url != matched_image:
            # Update product with new image
            update_data = {
                'image_url': matched_image
            }

            try:
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                updates_made.append({
                    'id': product_id,
                    'name': product_name,
                    'model': matched_model,
                    'image': matched_image
                })
                print(f"✅ Updated product {product_id}: {product_name[:50]} → {matched_image}")
            except Exception as e:
                print(f"❌ Error updating product {product_id}: {e}")
    else:
        no_match.append({
            'id': product_id,
            'name': product_name,
            'model': product_model
        })

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Products updated: {len(updates_made)}")
print(f"⚠️  Products without matching images: {len(no_match)}")

if updates_made:
    print("\nProducts updated with images:")
    for update in updates_made[:10]:
        print(f"  - {update['name'][:50]} → {update['image']}")
    if len(updates_made) > 10:
        print(f"  ... and {len(updates_made) - 10} more")

if no_match:
    print("\nProducts without matching images (first 10):")
    for product in no_match[:10]:
        print(f"  - {product['name'][:50]} (Model: {product['model'][:30] if product['model'] else 'N/A'})")
    if len(no_match) > 10:
        print(f"  ... and {len(no_match) - 10} more")

# Save mapping configuration for dashboard importer
mapping_config = {
    'image_mappings': image_mappings,
    'default_image': '/placeholder-tire.png',
    'matching_rules': [
        'Check for exact model name match',
        'Check for partial model name match',
        'Check for model variations (spaces, hyphens)',
        'Use default image if no match found'
    ]
}

config_path = Path(__file__).parent / 'image-mapping-config.json'
with open(config_path, 'w') as f:
    json.dump(mapping_config, f, indent=2)

print(f"\n✅ Image mapping configuration saved to: {config_path}")
print("   This can be used by the dashboard importer to apply the same logic")