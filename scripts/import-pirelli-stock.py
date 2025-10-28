#!/usr/bin/env python3
"""
Script para importar stock de Pirelli desde Excel a Supabase
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

        # Create the product object for Supabase
        product = {
            'name': name[:200],  # Limit name length
            'brand': str(row.get('marca', 'PIRELLI')).upper(),
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
            'image_url': '/mock-tire.png'  # Default image
        }

        products.append(product)

    print(f"Processed {len(products)} valid products")

    return products


def delete_all_products():
    """Delete all existing products from the database"""
    print("Deleting all existing products...")

    try:
        # Get count of existing products
        count_response = supabase.table('products').select('id', count='exact').execute()
        existing_count = count_response.count if hasattr(count_response, 'count') else 0
        print(f"Found {existing_count} existing products")

        if existing_count > 0:
            # Delete all products
            # Note: Supabase doesn't support delete without a filter, so we use a condition that matches all
            delete_response = supabase.table('products').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"Deleted all products successfully")

        return True

    except Exception as e:
        print(f"Error deleting products: {e}")
        return False


def import_products_to_supabase(products):
    """Import products to Supabase in batches"""
    print(f"Importing {len(products)} products to Supabase...")

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
                    # print(f"    Error: {individual_error}")

    print(f"\n{'='*60}")
    print(f"Import complete!")
    print(f"  Successful: {successful} products")
    print(f"  Failed: {failed} products")
    print(f"  Total: {successful + failed} products")
    print(f"{'='*60}")

    return successful, failed


def main():
    """Main function"""
    file_path = '/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_23_10_25.xlsx'

    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    print("="*60)
    print("PIRELLI Stock Import Script")
    print("="*60)

    # Step 1: Delete existing products
    if not delete_all_products():
        print("Failed to delete existing products. Continue anyway? (y/n): ", end='')
        if input().lower() != 'y':
            sys.exit(1)

    # Step 2: Process Excel file
    products = process_excel_file(file_path)

    if not products:
        print("No valid products found in Excel file")
        sys.exit(1)

    # Show sample of products to be imported
    print("\nSample of products to import:")
    print("-"*60)
    for product in products[:3]:
        print(f"Name: {product['name']}")
        print(f"  Brand: {product['brand']}")
        print(f"  Size: {product['width']}/{product['profile']}R{product['diameter']}")
        print(f"  Total Stock: {product['stock']}")
        print(f"  Stock by branch: {product['features']['stock_por_sucursal']}")
        print()

    # Step 3: Import to Supabase
    successful, failed = import_products_to_supabase(products)

    # Save a report
    report = {
        'total_products': len(products),
        'successful_imports': successful,
        'failed_imports': failed,
        'sample_products': products[:10]
    }

    with open('import_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)

    print("\nImport report saved to import_report.json")

    return successful > 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)