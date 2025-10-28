#!/usr/bin/env python3
"""
Script mejorado para importar stock de Pirelli desde Excel a Supabase con mapeo automático de imágenes
"""

import pandas as pd
import json
import sys
import os
from supabase import create_client, Client
import re
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from the project root .env file
env_path = Path(__file__).parent.parent / '.env.local'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'

load_dotenv(env_path)

# Initialize Supabase client with service role key to bypass RLS
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Try to use service role key first, fallback to anon key
key = service_key or anon_key

if not url or not key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set")
    sys.exit(1)

if service_key:
    print("Using service role key to bypass RLS policies")
else:
    print("Warning: Using anon key - may encounter RLS policy restrictions")

supabase: Client = create_client(url, key)

# =============================================================================
# IMAGE MAPPING CONFIGURATION
# =============================================================================

IMAGE_MAPPINGS = {
    # Cinturato models
    'CINTURATO P1': '/Cinturato-P1-Verde-1505470090255.webp',
    'CINTURATO P7': '/cinturato-p7-4505517104514.webp',
    'CINTURATO P4': '/Cinturato-P1-Verde-1505470090255.webp',  # Use P1 for P4

    # Scorpion models - specific ones first
    'SCORPION VERDE ALL SEASON': '/Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp',
    'S-VEAS': '/Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp',
    'SCORPION VERDE': '/Scorpion-Verde-1505470074533.webp',
    'S-VERD': '/Scorpion-Verde-1505470074533.webp',
    'SCORPION ZERO ALL SEASON': '/Scorpion-Zero-All-Season-1505470086399.webp',
    'SZROAS': '/Scorpion-Zero-All-Season-1505470086399.webp',
    'SCORPION ZERO ASIMMETRICO': '/Scorpion-Zero-Asimmetrico-1505470076172.webp',
    'SCORPION ZERO': '/Scorpion-Zero-1505470088294.webp',
    'SCORPION ATR': '/Scorpion-Atr-1505470067539.webp',
    'S-ATR': '/Scorpion-Atr-1505470067539.webp',
    'SCORPION MTR': '/Scorpion-MTR-1505470071047.webp',
    'S-MTR': '/Scorpion-MTR-1505470071047.webp',
    'SCORPION ALL TERRAIN PLUS': '/Scorpion-All-Terrain-Plus-4505483375619.webp',
    'SCORPION HT': '/Scorpion-HT-4505525112686.webp',
    'S-HT': '/Scorpion-HT-4505525112686.webp',
    'SCORPION STR': '/Scorpion-4505525112390.webp',
    'SCORPION A/T+': '/Scorpion-All-Terrain-Plus-4505483375619.webp',
    'SCORPION': '/Scorpion-4505525112390.webp',  # Generic Scorpion

    # P Zero models
    'P ZERO CORSA SYSTEM': '/Pzero-Corsa-System-Direzionale-1505470088408.webp',
    'P ZERO CORSA': '/Pzero-Corsa-PZC4-1505470090635.webp',
    'PZERO CORSA': '/Pzero-Corsa-PZC4-1505470090635.webp',
    'P ZERO NERO GT': '/nerogt.jpg',
    'NERO GT': '/nerogt.jpg',
    'NEROGT': '/nerogt.jpg',
    'P ZERO': '/Pzero-Nuovo-1505470072726.webp',
    'PZERO': '/Pzero-Nuovo-1505470072726.webp',
    'P-ZERO': '/Pzero-Nuovo-1505470072726.webp',

    # P400 models
    'P400 EVO': '/P400Evo_review_3-4.webp',
    'P400EVO': '/P400Evo_review_3-4.webp',
    'P400EV': '/P400Evo_review_3-4.webp',
    'P 400 EVO': '/P400Evo_review_3-4.webp',

    # P6000
    'P6000': '/p6000.jpg',
    'P 6000': '/p6000.jpg',

    # P7
    'P7000': '/cinturato-p7-4505517104514.webp',
    'P7': '/cinturato-p7-4505517104514.webp',

    # Chrono
    'CHRONO': '/Chrono-1505470062195.webp',

    # Winter
    'WINTER': '/winter.jpg',

    # Weather
    'CITYNET ALL WEATHER': '/citynetallweatherx.jpg',
    'WEATHER X': '/citynetallweatherx.jpg',
    'WEATHER': '/citynetallweatherx.jpg',

    # Dragon
    'DRAGON': '/dragon.jpg',

    # EVO (generic)
    'EVO': '/evo.jpg',

    # Formula brand models
    'FORMULA ENERGY': '/energy.jpg',
    'FORMULA EVO': '/evo.jpg',
    'FORMULA DRAGON': '/dragon.jpg',
    'FORMULA SPIDER': '/spider.jpg',
    'FORMULA S/T': '/Scorpion-4505525112390.webp',  # Use generic tire for S/T

    # Super City (motorcycle)
    'SUPER CITY': '/supercity.jpg',
    'SUPERCITY': '/supercity.jpg',

    # Tornado (agricultural/special tires)
    'TORNADO': '/tornado.jpg',

    # MT60 (motorcycle)
    'MT60': '/mt60.jpg',
    'MT 60': '/mt60.jpg',
    'MT-60': '/mt60.jpg',
}


def get_product_image(description, brand='PIRELLI'):
    """
    Determine the appropriate image for a product based on its description and brand

    Args:
        description: Product description/model string
        brand: Product brand (default: PIRELLI)

    Returns:
        str: Path to the appropriate image file
    """
    # Convert to uppercase for matching
    search_text = f"{brand} {description}".upper()

    # Try exact matches first (most specific)
    for pattern, image_path in IMAGE_MAPPINGS.items():
        # For short patterns (abbreviations), check for word boundaries
        if len(pattern) <= 5:
            # Check if pattern appears as a separate word
            if f" {pattern} " in f" {search_text} " or search_text.endswith(f" {pattern}"):
                print(f"  → Matched '{pattern}' → {image_path}")
                return image_path
        else:
            # For longer patterns, simple substring match
            if pattern in search_text:
                print(f"  → Matched '{pattern}' → {image_path}")
                return image_path

    # Special handling for some complex patterns

    # Scorpion with A/T+ variations
    if 'SCORPION' in search_text and ('A/T+' in search_text or 'A/T +' in search_text or 'AT+' in search_text):
        print(f"  → Matched Scorpion A/T+ variant → /Scorpion-All-Terrain-Plus-4505483375619.webp")
        return '/Scorpion-All-Terrain-Plus-4505483375619.webp'

    # If no specific match found, return placeholder
    print(f"  → No match found, using placeholder")
    return '/no-image.png'


def parse_tire_size(description):
    """
    Extract tire dimensions from description string
    Examples:
    - 175/65R15 -> width: 175, profile: 65, diameter: 15
    - 205/75R15 -> width: 205, profile: 75, diameter: 15
    """
    # Try to match common tire size patterns
    patterns = [
        r'(\d{3})/(\d{2})R(\d{2})',  # 175/65R15
        r'(\d{3})/(\d{2})\s*R\s*(\d{2})',  # 175/65 R 15
        r'(\d{3})/(\d{2})[-\s]+R(\d{2})',  # 175/65-R15
        r'(\d{3})/(\d{2})[A-Z]R(\d{2})',  # 175/65ZR15
    ]

    for pattern in patterns:
        match = re.search(pattern, description)
        if match:
            return {
                'width': int(match.group(1)),
                'profile': int(match.group(2)),
                'diameter': int(match.group(3))
            }

    # Try alternative patterns for different formats
    # Match patterns like "5.20S12" or similar
    alt_match = re.search(r'(\d+)\.(\d+)[A-Z]*(\d+)', description)
    if alt_match:
        # These are probably special sizes, we'll set them as 0 for now
        return {'width': 0, 'profile': 0, 'diameter': int(alt_match.group(3))}

    return {'width': None, 'profile': None, 'diameter': None}


def clean_description(desc):
    """Clean up product description"""
    if pd.isna(desc):
        return ""

    # Remove extra whitespace
    desc = ' '.join(desc.split())

    # Remove trailing codes in parentheses like (NB)x, (K1), etc.
    desc = re.sub(r'\s*\([^)]+\)[x]?$', '', desc)

    return desc.strip()


def process_excel_file(file_path):
    """Process the Pirelli stock Excel file"""

    print("Reading Excel file...")

    # Read the Excel file, skip the first row which seems to be a title
    df = pd.read_excel(file_path, sheet_name='cexcel_1', skiprows=1)

    # The actual headers are in what pandas thinks is the first data row
    # So let's read again with proper headers
    df = pd.read_excel(file_path, sheet_name='cexcel_1', header=1)

    print(f"Found {len(df)} products")

    # Map the columns to meaningful names
    column_mapping = {
        'CODIGO_PROPIO': 'codigo_propio',
        'CODIGO_PROVEEDOR': 'codigo_proveedor',
        'DESCRIPCION': 'descripcion',
        'GRUPO': 'grupo',
        'BELGRANO': 'stock_belgrano',
        'CATAMARCA': 'stock_catamarca',
        'LA_BANDA': 'stock_la_banda',
        'SALTA': 'stock_salta',
        'TUCUMAN': 'stock_tucuman',
        'VIRGEN': 'stock_virgen',
        'PROVEEDOR': 'proveedor',
        'CATEGORIA': 'categoria',
        'RUBRO': 'rubro',
        'SUBRUBRO': 'subrubro',
        'MARCA': 'marca'
    }

    df.rename(columns=column_mapping, inplace=True)

    # Clean and process the data
    products = []
    image_stats = {'mapped': 0, 'placeholder': 0}

    print("\n" + "="*80)
    print("PROCESSING PRODUCTS WITH IMAGE MAPPING")
    print("="*80)

    for index, row in df.iterrows():
        # Skip rows with no description
        if pd.isna(row.get('descripcion')):
            continue

        # Clean the description
        description = clean_description(row['descripcion'])

        # Parse tire size from description
        tire_size = parse_tire_size(description)

        # Clean codigo fields
        codigo_propio = str(row.get('codigo_propio', '')).replace('[', '').replace(']', '').strip()
        codigo_proveedor = str(row.get('codigo_proveedor', '')).replace('[', '').replace(']', '').strip()

        # Calculate total stock across all branches
        stock_fields = ['stock_belgrano', 'stock_catamarca', 'stock_la_banda', 'stock_salta', 'stock_tucuman', 'stock_virgen']
        total_stock = 0
        branch_stocks = {}

        for field in stock_fields:
            branch_name = field.replace('stock_', '')
            stock_value = row.get(field, 0)
            if pd.notna(stock_value):
                try:
                    stock_value = int(float(stock_value))
                    branch_stocks[branch_name] = stock_value
                    total_stock += stock_value
                except (ValueError, TypeError):
                    branch_stocks[branch_name] = 0
            else:
                branch_stocks[branch_name] = 0

        # Create product name
        name = description
        if tire_size['width'] and tire_size['profile'] and tire_size['diameter']:
            name = f"{tire_size['width']}/{tire_size['profile']}R{tire_size['diameter']} {description}"

        # Determine category based on tire dimensions and description
        category = 'auto'  # Default category

        # Check if it's a motorcycle tire (small diameters or specific patterns)
        if 'M/C' in description or 'TT ' in description or 'MT 60' in description or 'SUPER CITY' in description:
            category = 'moto'
        # Check if it's a truck tire (C suffix, LT prefix, or large sizes)
        elif 'C ' in description or 'LT' in description or description.endswith('C') or 'CARRIER' in description or 'CHRONO' in description:
            category = 'camion'
        # Check if it's an SUV/pickup tire (based on width and common models)
        elif (tire_size['width'] and tire_size['width'] >= 235) or 'SCORPION' in description.upper() or 'SUV' in description.upper() or '4X4' in description.upper():
            category = 'camioneta'
        elif tire_size['width'] and tire_size['width'] < 195:
            category = 'auto'
        else:
            # Default to auto for standard passenger car tires
            category = 'auto'

        # Get brand
        brand = str(row.get('marca', 'PIRELLI')).upper()

        # Determine appropriate image using the mapping function
        if index < 10:  # Show mapping details for first 10 products
            print(f"\n{index+1}. {name[:60]}")

        image_url = get_product_image(description, brand)

        # Track image mapping statistics
        if image_url == '/no-image.png':
            image_stats['placeholder'] += 1
        else:
            image_stats['mapped'] += 1

        # Create the product object for Supabase
        product = {
            'name': name[:200],  # Limit name length
            'brand': brand,
            'model': description[:100],  # Use description as model
            'category': category,  # Use the determined category
            'width': tire_size['width'],
            'profile': tire_size['profile'],
            'diameter': tire_size['diameter'],
            'price': 100000.0,  # Default price, will need to be updated
            'stock': total_stock,  # Total stock across all branches
            'description': description,
            'features': {
                'codigo_propio': codigo_propio,
                'codigo_proveedor': codigo_proveedor,
                'proveedor': row.get('proveedor', ''),
                'rubro': row.get('rubro', ''),
                'subrubro': row.get('subrubro', ''),
                'stock_por_sucursal': branch_stocks
            },
            'image_url': image_url  # Use the mapped image
        }

        products.append(product)

    print("\n" + "="*80)
    print("IMAGE MAPPING SUMMARY")
    print("="*80)
    print(f"✓ Products with specific images: {image_stats['mapped']} ({image_stats['mapped']/len(products)*100:.1f}%)")
    print(f"✓ Products with placeholder: {image_stats['placeholder']} ({image_stats['placeholder']/len(products)*100:.1f}%)")
    print(f"✓ Total products processed: {len(products)}")

    return products


def delete_all_products():
    """Delete all existing products from the database"""
    print("\n" + "="*80)
    print("DELETING EXISTING PRODUCTS")
    print("="*80)

    try:
        # Get count of existing products
        count_response = supabase.table('products').select('id', count='exact').execute()
        existing_count = count_response.count if hasattr(count_response, 'count') else 0
        print(f"Found {existing_count} existing products")

        if existing_count > 0:
            # Delete all products
            # Note: Supabase doesn't support delete without a filter, so we use a condition that matches all
            delete_response = supabase.table('products').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"✓ Deleted all products successfully")

        return True

    except Exception as e:
        print(f"❌ Error deleting products: {e}")
        return False


def import_products_to_supabase(products):
    """Import products to Supabase in batches"""
    print("\n" + "="*80)
    print("IMPORTING TO SUPABASE")
    print("="*80)
    print(f"Importing {len(products)} products...")

    batch_size = 50  # Smaller batch size for better error handling
    successful = 0
    failed = 0

    for i in range(0, len(products), batch_size):
        batch = products[i:i+batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(products) + batch_size - 1) // batch_size

        try:
            print(f"Importing batch {batch_num}/{total_batches} ({len(batch)} products)...")
            response = supabase.table('products').insert(batch).execute()
            successful += len(batch)
            print(f"  ✓ Batch {batch_num} imported successfully")
        except Exception as e:
            print(f"  ✗ Error importing batch {batch_num}: {e}")
            failed += len(batch)

            # Try to import individually to identify problematic products
            for product in batch:
                try:
                    supabase.table('products').insert(product).execute()
                    successful += 1
                    failed -= 1
                except Exception as individual_error:
                    print(f"    Failed product: {product.get('name', 'Unknown')[:50]}")

    print("\n" + "="*80)
    print("IMPORT COMPLETE")
    print("="*80)
    print(f"✓ Successful: {successful} products")
    print(f"✗ Failed: {failed} products")
    print(f"📊 Total: {successful + failed} products")

    return successful, failed


def main():
    """Main function"""
    file_path = '/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_23_10_25.xlsx'

    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    print("="*80)
    print("PIRELLI STOCK IMPORT WITH AUTOMATIC IMAGE MAPPING")
    print("="*80)
    print("Version: 2.0 - Enhanced with intelligent image mapping")
    print("="*80)

    # Step 1: Delete existing products
    if not delete_all_products():
        print("Failed to delete existing products. Continue anyway? (y/n): ", end='')
        if input().lower() != 'y':
            sys.exit(1)

    # Step 2: Process Excel file with image mapping
    products = process_excel_file(file_path)

    if not products:
        print("No valid products found in Excel file")
        sys.exit(1)

    # Show sample of products to be imported
    print("\n" + "="*80)
    print("SAMPLE OF PRODUCTS TO IMPORT")
    print("="*80)
    for product in products[:3]:
        print(f"\nName: {product['name']}")
        print(f"  Brand: {product['brand']}")
        print(f"  Size: {product['width']}/{product['profile']}R{product['diameter']}")
        print(f"  Total Stock: {product['stock']}")
        print(f"  Image: {product['image_url']}")
        print(f"  Stock by branch: {product['features']['stock_por_sucursal']}")

    # Step 3: Import to Supabase
    successful, failed = import_products_to_supabase(products)

    # Save a report
    report = {
        'total_products': len(products),
        'successful_imports': successful,
        'failed_imports': failed,
        'image_mapping_stats': {
            'products_with_images': sum(1 for p in products if p['image_url'] != '/no-image.png'),
            'products_without_images': sum(1 for p in products if p['image_url'] == '/no-image.png')
        },
        'sample_products': products[:10]
    }

    with open('import_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)

    print("\n✓ Import report saved to import_report.json")

    return successful > 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)