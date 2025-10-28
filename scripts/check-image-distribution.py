#!/usr/bin/env python3
"""
Check the distribution of images across Pirelli products
"""

import sys
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
from collections import Counter

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

# Get all Pirelli products and count image distribution
response = supabase.table('products').select('image_url').eq('brand', 'PIRELLI').execute()
products = response.data

image_counter = Counter()
for product in products:
    image_url = product.get('image_url', '/mock-tire.png')
    image_counter[image_url] += 1

print("=" * 80)
print("PIRELLI PRODUCTS IMAGE DISTRIBUTION")
print("=" * 80)
print(f"Total products: {len(products)}")
print()

# Sort by count descending
for image, count in image_counter.most_common():
    percentage = (count / len(products)) * 100
    print(f"{count:4d} products ({percentage:5.1f}%) → {image}")
    
print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total unique images: {len(image_counter)}")
print(f"Products with mock-tire: {image_counter.get('/mock-tire.png', 0)}")
print(f"Products with specific images: {len(products) - image_counter.get('/mock-tire.png', 0)}")
