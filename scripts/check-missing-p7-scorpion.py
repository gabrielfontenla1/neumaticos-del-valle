#!/usr/bin/env python3
"""
Check P7 and Scorpion products that still have mock images
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
print("CHECKING P7 AND SCORPION PRODUCTS WITHOUT IMAGES")
print("=" * 80)

# Get all Pirelli products with mock image
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').eq('image_url', '/mock-tire.png').execute()
products_with_mock = response.data

print(f"\n✓ Found {len(products_with_mock)} Pirelli products with mock image")

# Categorize products
p7_products = []
scorpion_products = []
other_products = []

for product in products_with_mock:
    search_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}".upper()

    if 'P7' in search_text or 'CINTURATO' in search_text:
        p7_products.append(product)
    elif 'SCORPION' in search_text:
        scorpion_products.append(product)
    else:
        other_products.append(product)

print("\n" + "=" * 80)
print("PRODUCTS WITH MOCK IMAGES - BREAKDOWN")
print("=" * 80)

print(f"\n📊 P7/CINTURATO products without images: {len(p7_products)}")
if p7_products:
    print("\nSample P7/Cinturato products:")
    for product in p7_products[:10]:  # Show first 10
        print(f"  - {product.get('name', 'N/A')[:80]}")
    if len(p7_products) > 10:
        print(f"  ... and {len(p7_products) - 10} more")

print(f"\n📊 SCORPION products without images: {len(scorpion_products)}")
if scorpion_products:
    print("\nSample Scorpion products:")
    for product in scorpion_products[:10]:  # Show first 10
        print(f"  - {product.get('name', 'N/A')[:80]}")
    if len(scorpion_products) > 10:
        print(f"  ... and {len(scorpion_products) - 10} more")

print(f"\n📊 Other products without images: {len(other_products)}")

# Check what Scorpion variants we have
if scorpion_products:
    print("\n" + "=" * 80)
    print("SCORPION VARIANT ANALYSIS")
    print("=" * 80)

    scorpion_variants = {}
    for product in scorpion_products:
        search_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}".upper()

        # Identify Scorpion variant
        if 'VERDE' in search_text and 'ALL' in search_text and 'SEASON' in search_text:
            variant = 'SCORPION VERDE ALL SEASON'
        elif 'VERDE' in search_text:
            variant = 'SCORPION VERDE'
        elif 'ZERO' in search_text and 'ALL' in search_text and 'SEASON' in search_text:
            variant = 'SCORPION ZERO ALL SEASON'
        elif 'ZERO' in search_text and 'ASIMMETRICO' in search_text:
            variant = 'SCORPION ZERO ASIMMETRICO'
        elif 'ZERO' in search_text:
            variant = 'SCORPION ZERO'
        elif 'ATR' in search_text:
            variant = 'SCORPION ATR'
        elif 'MTR' in search_text:
            variant = 'SCORPION MTR'
        elif 'HT' in search_text:
            variant = 'SCORPION HT'
        elif 'ALL' in search_text and 'TERRAIN' in search_text:
            variant = 'SCORPION ALL TERRAIN PLUS'
        else:
            variant = 'SCORPION (GENERIC)'

        if variant not in scorpion_variants:
            scorpion_variants[variant] = []
        scorpion_variants[variant].append(product)

    for variant, products in scorpion_variants.items():
        print(f"\n{variant}: {len(products)} products")
        for product in products[:3]:  # Show first 3 of each variant
            print(f"  - {product.get('name', 'N/A')[:60]}")

# Check what P7 variants we have
if p7_products:
    print("\n" + "=" * 80)
    print("P7/CINTURATO VARIANT ANALYSIS")
    print("=" * 80)

    p7_variants = {}
    for product in p7_products:
        search_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}".upper()

        # Identify P7 variant
        if 'P1' in search_text:
            variant = 'CINTURATO P1'
        elif 'P7' in search_text:
            variant = 'CINTURATO P7'
        elif 'CINTURATO' in search_text:
            variant = 'CINTURATO (OTHER)'
        else:
            variant = 'P7 (NO CINTURATO)'

        if variant not in p7_variants:
            p7_variants[variant] = []
        p7_variants[variant].append(product)

    for variant, products in p7_variants.items():
        print(f"\n{variant}: {len(products)} products")
        for product in products[:3]:  # Show first 3 of each variant
            print(f"  - {product.get('name', 'N/A')[:60]}")