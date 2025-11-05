#!/usr/bin/env python3
import pandas as pd
import json
import re
from datetime import datetime

def clean_price(price_value):
    """Clean and convert price values to float"""
    if pd.isna(price_value):
        return None
    try:
        # Convert to string and remove any non-numeric characters except decimal point
        price_str = str(price_value).replace(',', '').replace('$', '').strip()
        return float(price_str)
    except:
        return None

def clean_stock(stock_value):
    """Clean and convert stock values to integer"""
    if pd.isna(stock_value):
        return 0
    try:
        # Remove brackets if present
        stock_str = str(stock_value).replace('[', '').replace(']', '').strip()
        return int(float(stock_str))
    except:
        return 0

def extract_tire_dimensions(description):
    """Extract width, aspect ratio, and diameter from tire description"""
    # Multiple patterns to match different formats
    patterns = [
        r'(\d{3})/(\d{2})[Rr](\d{2})',  # 205/55R16
        r'(\d{3})/(\d{2})\s*-\s*(\d{2})',  # 205/55 - 16
        r'(\d{3})-(\d{3})',  # 165-380 (agricultural)
    ]

    for pattern in patterns[:2]:  # Only use first two patterns for standard tires
        match = re.search(pattern, str(description))
        if match:
            return {
                'width': int(match.group(1)),
                'aspect_ratio': int(match.group(2)),
                'rim_diameter': int(match.group(3))
            }

    return {'width': None, 'aspect_ratio': None, 'rim_diameter': None}

def process_pirelli_data():
    try:
        # Read Excel files
        print("Reading stock file...")
        stock_df = pd.read_excel('/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_31_10_25.xlsx', header=None)

        print("Reading prices file...")
        prices_df = pd.read_excel('/Users/gabrielfontenla/Downloads/PRECIOS_PIRELLI_31_10_25.xlsx', header=None)

        # Process stock data (skip header rows)
        stock_data = []
        for idx in range(2, len(stock_df)):  # Start from row 2 (0-indexed)
            row = stock_df.iloc[idx]

            codigo = str(row.iloc[0]).replace('[', '').replace(']', '').strip() if pd.notna(row.iloc[0]) else ''
            codigo_prov = str(row.iloc[1]).replace('[', '').replace(']', '').strip() if pd.notna(row.iloc[1]) else ''

            if codigo and codigo != 'nan':
                stock_item = {
                    'codigo_propio': codigo,
                    'codigo_proveedor': codigo_prov,
                    'descripcion': str(row.iloc[2]) if pd.notna(row.iloc[2]) else '',
                    'stock': clean_stock(row.iloc[10]) if pd.notna(row.iloc[10]) else 0,
                    'medida': str(row.iloc[20]) if pd.notna(row.iloc[20]) else '',
                    'rubro': str(row.iloc[21]) if pd.notna(row.iloc[21]) else '',
                    'subrubro': str(row.iloc[22]) if pd.notna(row.iloc[22]) else '',
                    'marca': str(row.iloc[23]) if pd.notna(row.iloc[23]) else 'PIRELLI'
                }
                stock_data.append(stock_item)

        print(f"Processed {len(stock_data)} stock items")

        # Process price data (skip header rows)
        price_data = {}
        for idx in range(2, len(prices_df)):  # Start from row 2 (0-indexed)
            row = prices_df.iloc[idx]

            codigo = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''

            if codigo and codigo != 'nan':
                # Get various price points
                precio_lista = clean_price(row.iloc[4])  # Column 4: LISTA
                precio_base = clean_price(row.iloc[20])  # Column 20: Some base price
                precio_mayorista = clean_price(row.iloc[38])  # Column 38: Mayorista price
                precio_reventa = clean_price(row.iloc[50])  # Column 50: Reventa price

                # Use the most appropriate price (prioritize reventa for retail)
                main_price = precio_reventa or precio_mayorista or precio_base

                price_data[codigo] = {
                    'codigo_propio': codigo,
                    'codigo_proveedor': str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else '',
                    'descripcion_precio': str(row.iloc[3]) if pd.notna(row.iloc[3]) else '',
                    'precio_lista': precio_lista,
                    'precio_main': main_price,
                    'precio_mayorista': precio_mayorista
                }

        print(f"Processed {len(price_data)} price items")

        # Combine stock and price data
        products_to_update = []
        matched = 0
        unmatched_stock = []

        for stock_item in stock_data:
            codigo = stock_item['codigo_propio']

            if codigo in price_data:
                price_info = price_data[codigo]
                matched += 1

                # Use stock description, fall back to price description
                description = stock_item['descripcion'] or price_info.get('descripcion_precio', '')

                # Extract dimensions
                dimensions = extract_tire_dimensions(description)

                # Get price
                price = price_info.get('precio_main')
                list_price = price_info.get('precio_lista')

                if price and price > 0:
                    # Determine category
                    category = stock_item.get('subrubro', '').lower()
                    if 'camioneta' in category or 'SUV' in category:
                        category = 'camioneta'
                    elif 'auto' in category:
                        category = 'auto'
                    elif 'moto' in category:
                        category = 'moto'
                    else:
                        category = 'otro'

                    product = {
                        'sku': codigo,
                        'supplier_code': stock_item.get('codigo_proveedor', ''),
                        'name': description,
                        'brand': 'PIRELLI',
                        'stock': stock_item.get('stock', 0),
                        'price': price,
                        'price_list': list_price if list_price and list_price > price else price * 1.2,  # 20% markup if no list price
                        'width': dimensions['width'],
                        'aspect_ratio': dimensions['aspect_ratio'],
                        'rim_diameter': dimensions['rim_diameter'],
                        'category': category,
                        'medida': stock_item.get('medida', ''),
                        'updated_at': datetime.now().isoformat()
                    }
                    products_to_update.append(product)
            else:
                unmatched_stock.append(codigo)

        print(f"\n✅ Matched {matched} products with both stock and price")
        print(f"⚠️  Unmatched stock codes: {len(unmatched_stock)}")

        # Generate SQL statements
        sql_statements = []

        # Header
        sql_statements.append("-- Pirelli Products Update")
        sql_statements.append(f"-- Generated: {datetime.now().isoformat()}")
        sql_statements.append(f"-- Total products: {len(products_to_update)}")
        sql_statements.append("")
        sql_statements.append("-- Update existing Pirelli products in database")
        sql_statements.append("")

        for product in products_to_update:
            # Escape single quotes in name
            name_escaped = product['name'].replace("'", "''")

            # Update statement
            sql = f"""UPDATE products
SET
    name = '{name_escaped}',
    stock = {product['stock']},
    price = {product['price']:.2f},
    price_list = {product['price_list']:.2f},"""

            # Only update dimensions if we have them
            if product['width']:
                sql += f"""
    width = {product['width']},
    aspect_ratio = {product['aspect_ratio']},
    rim_diameter = {product['rim_diameter']},"""

            sql += f"""
    category = '{product['category']}',
    updated_at = NOW()
WHERE
    sku = '{product['sku']}'
    AND brand = 'PIRELLI';"""

            sql_statements.append(sql)

        # Save SQL file
        sql_file_path = '/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/pirelli_update.sql'
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(sql_statements))

        print(f"\n✅ SQL statements saved to: {sql_file_path}")

        # Save JSON for review
        json_file_path = '/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/pirelli_products.json'
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(products_to_update, f, indent=2, ensure_ascii=False, default=str)

        print(f"✅ Product data saved to: {json_file_path}")

        # Print summary
        print("\n" + "="*60)
        print("                   UPDATE SUMMARY")
        print("="*60)
        print(f"Total products to update: {len(products_to_update)}")
        print(f"Products with stock > 0: {sum(1 for p in products_to_update if p['stock'] > 0)}")
        print(f"Products with dimensions: {sum(1 for p in products_to_update if p['width'])}")

        # Categories breakdown
        categories = {}
        for p in products_to_update:
            cat = p.get('category', 'otro')
            categories[cat] = categories.get(cat, 0) + 1

        print("\nProducts by category:")
        for cat, count in sorted(categories.items()):
            print(f"  - {cat}: {count}")

        # Price statistics
        prices = [p['price'] for p in products_to_update if p['price']]
        if prices:
            print(f"\nPrice statistics:")
            print(f"  - Average: ${sum(prices)/len(prices):,.0f}")
            print(f"  - Minimum: ${min(prices):,.0f}")
            print(f"  - Maximum: ${max(prices):,.0f}")

        # Sample products
        print("\n" + "="*60)
        print("                  SAMPLE PRODUCTS")
        print("="*60)
        print(f"{'SKU':<8} {'Description':<45} {'Stock':<6} {'Price':<12}")
        print("-"*71)

        for product in products_to_update[:10]:
            desc = product['name'][:45]
            print(f"{product['sku']:<8} {desc:<45} {product['stock']:>6} ${product['price']:>11,.0f}")

        return products_to_update

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = process_pirelli_data()
    if result:
        print("\n" + "="*60)
        print("✅ PROCESSING COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"\nReady to update {len(result)} Pirelli products in the database.")
        print("\nNext steps:")
        print("1. Review the SQL file: scripts/pirelli_update.sql")
        print("2. Check the JSON file: scripts/pirelli_products.json")
        print("3. Run the SQL in your database to update products")
    else:
        print("\n❌ Processing failed. Please check the error messages above.")