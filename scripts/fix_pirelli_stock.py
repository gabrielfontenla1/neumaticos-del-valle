#!/usr/bin/env python3
"""
Fix Pirelli stock by summing all branch locations from Excel
"""
import pandas as pd
import json
import re
from datetime import datetime

def extract_tire_dimensions(description):
    """Extract width, aspect ratio, and rim diameter from tire description"""
    # Try multiple patterns
    patterns = [
        r'(\d{2,3})[\/\-](\d{2})[R\/]?(\d{2})',  # 205/55R16 or 205-55R16
        r'(\d{2,3})\s*[\/\-]\s*(\d{2})\s*[R\/]?\s*(\d{2})',  # With spaces
    ]

    for pattern in patterns:
        match = re.search(pattern, description)
        if match:
            return {
                'width': int(match.group(1)),
                'aspect_ratio': int(match.group(2)),
                'rim_diameter': int(match.group(3))
            }

    return {'width': None, 'aspect_ratio': None, 'rim_diameter': None}

def map_category(category_value):
    """Map category values to valid database categories"""
    if not category_value or pd.isna(category_value):
        return 'auto'

    cat = str(category_value).upper()
    if 'SUV' in cat or 'CAMIONETA' in cat:
        return 'camioneta'
    elif 'CAMION' in cat or 'TRUCK' in cat:
        return 'camion'
    else:
        return 'auto'

def clean_numeric_value(value):
    """Clean and convert numeric values"""
    if pd.isna(value):
        return 0

    if isinstance(value, (int, float)):
        return float(value) if not pd.isna(value) else 0

    # Remove any non-numeric characters except dots and commas
    cleaned = str(value).replace(',', '.').replace('$', '').strip()
    cleaned = re.sub(r'[^\d.]', '', cleaned)

    try:
        return float(cleaned) if cleaned else 0
    except:
        return 0

def process_pirelli_stock():
    """Process Pirelli Excel files and generate JSON with correct stock"""
    print('🔧 Processing Pirelli Excel files with branch stock...\n')

    # Read Excel files - skip first 2 rows (headers)
    stock_df = pd.read_excel('/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_31_10_25.xlsx', header=None, skiprows=2)
    prices_df = pd.read_excel('/Users/gabrielfontenla/Downloads/PRECIOS_PIRELLI_31_10_25.xlsx', header=None, skiprows=2)

    print(f'Stock file: {len(stock_df)} rows')
    print(f'Prices file: {len(prices_df)} rows\n')

    # Stock columns (from analysis):
    # 0: CODIGO_PROPIO
    # 1: CODIGO_PROVEEDOR
    # 2: DESCRIPCION
    # 13: BELGRANO
    # 14: CATAMARCA
    # 15: LA_BANDA
    # 16: SALTA
    # 17: TUCUMAN
    # 18: VIRGEN
    # 20: CATEGORIA
    # 23: MARCA

    # Prices columns:
    # 0: CODIGO_PROPIO
    # 1: CODIGO_PROVEEDOR
    # 2: DESCRIPCION
    # 7: PRECIO (price)
    # 8: PRECIO_LISTA (list price)

    products = []

    for idx, row in stock_df.iterrows():
        try:
            # Extract data from stock file
            codigo_propio = str(row[0]).strip('[]').strip() if pd.notna(row[0]) else str(idx + 1)
            codigo_proveedor = str(row[1]).strip('[]').strip() if pd.notna(row[1]) else codigo_propio
            description = str(row[2]).strip() if pd.notna(row[2]) else ''
            categoria = row[20] if pd.notna(row[20]) else 'auto'

            # Sum stock from all branches
            branches = [13, 14, 15, 16, 17, 18]  # BELGRANO, CATAMARCA, LA_BANDA, SALTA, TUCUMAN, VIRGEN
            total_stock = 0
            for branch_col in branches:
                branch_stock = clean_numeric_value(row[branch_col])
                total_stock += int(branch_stock)

            # Find matching price row
            price_row = prices_df[prices_df[0].astype(str).str.strip('[]').str.strip() == codigo_propio]

            if not price_row.empty:
                price = clean_numeric_value(price_row.iloc[0][7])
                price_list = clean_numeric_value(price_row.iloc[0][8])
            else:
                price = 0
                price_list = 0

            # Extract dimensions
            dimensions = extract_tire_dimensions(description)

            # Map category
            category = map_category(categoria)

            product = {
                'sku': codigo_propio,
                'supplier_code': codigo_proveedor,
                'name': description,
                'brand': 'PIRELLI',
                'stock': total_stock,
                'price': round(price, 2),
                'price_list': round(price_list, 2),
                'width': dimensions['width'],
                'aspect_ratio': dimensions['aspect_ratio'],
                'rim_diameter': dimensions['rim_diameter'],
                'category': category,
                'medida': str(categoria).upper() if pd.notna(categoria) else 'AUTO',
                'updated_at': datetime.now().isoformat()
            }

            products.append(product)

        except Exception as e:
            print(f'Error processing row {idx}: {e}')
            continue

    # Save to JSON
    output_file = 'scripts/pirelli_products_fixed.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    # Print statistics
    total_products = len(products)
    with_stock = len([p for p in products if p['stock'] > 0])
    without_stock = total_products - with_stock
    total_stock_units = sum(p['stock'] for p in products)
    with_price = len([p for p in products if p['price'] > 0])

    print('=' * 60)
    print('                PROCESSING SUMMARY')
    print('=' * 60)
    print(f'✅ Total products processed: {total_products}')
    print(f'📦 Products with stock: {with_stock}')
    print(f'❌ Products without stock: {without_stock}')
    print(f'📊 Total stock units: {total_stock_units}')
    print(f'💰 Products with price: {with_price}')
    print('=' * 60)
    print(f'\n✨ JSON file saved: {output_file}')

    # Show sample products with stock
    print('\n📋 Sample products with stock:')
    products_with_stock = [p for p in products if p['stock'] > 0][:5]
    for p in products_with_stock:
        print(f"  - SKU {p['sku']}: {p['name'][:50]}... Stock: {p['stock']}")

if __name__ == '__main__':
    process_pirelli_stock()
