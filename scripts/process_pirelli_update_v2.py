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
        return int(float(str(stock_value)))
    except:
        return 0

def extract_tire_dimensions(description):
    """Extract width, aspect ratio, and diameter from tire description"""
    # Pattern: 175/70R14, 205/55R16, etc.
    pattern = r'(\d{3})/(\d{2})[Rr](\d{2})'
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
        stock_df = pd.read_excel('/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_31_10_25.xlsx', header=0)
        print(f"Stock file columns: {len(stock_df.columns)}")

        print("Reading prices file...")
        prices_df = pd.read_excel('/Users/gabrielfontenla/Downloads/PRECIOS_PIRELLI_31_10_25.xlsx', header=0)
        print(f"Prices file columns: {len(prices_df.columns)}")

        # Process stock data - use position-based column access
        stock_data = []
        for idx, row in stock_df.iterrows():
            if idx == 0:  # Skip header row with column names
                continue

            stock_item = {
                'codigo_propio': str(row.iloc[0]).replace('[', '').replace(']', '').strip() if pd.notna(row.iloc[0]) else '',
                'codigo_proveedor': str(row.iloc[1]).replace('[', '').replace(']', '').strip() if pd.notna(row.iloc[1]) else '',
                'descripcion': str(row.iloc[2]) if pd.notna(row.iloc[2]) else '',
                'stock': clean_stock(row.iloc[10]) if len(row) > 10 else 0,  # Column 10 is STOCK
                'medida': str(row.iloc[20]) if len(row) > 20 and pd.notna(row.iloc[20]) else '',
                'rubro': str(row.iloc[21]) if len(row) > 21 and pd.notna(row.iloc[21]) else '',
                'subrubro': str(row.iloc[22]) if len(row) > 22 and pd.notna(row.iloc[22]) else '',
                'marca': str(row.iloc[23]) if len(row) > 23 and pd.notna(row.iloc[23]) else ''
            }
            if stock_item['codigo_propio']:  # Only add if has a valid code
                stock_data.append(stock_item)

        print(f"Processed {len(stock_data)} stock items")

        # Process price data
        price_data = []
        for idx, row in prices_df.iterrows():
            if idx == 0:  # Skip header row with column names
                continue

            price_item = {
                'codigo_propio': str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else '',
                'codigo_proveedor': str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else '',
                'descripcion': str(row.iloc[3]) if pd.notna(row.iloc[3]) else '',
                'precio_costo_iva': clean_price(row.iloc[19]) if len(row) > 19 else None,  # Column 19
                'precio_contado': clean_price(row.iloc[21]) if len(row) > 21 else None,  # Column 21
                'precio_lista': clean_price(row.iloc[24]) if len(row) > 24 else None,  # Column 24
                'precio_mayorista': clean_price(row.iloc[38]) if len(row) > 38 else None,  # Column 38
            }
            if price_item['codigo_propio']:  # Only add if has a valid code
                price_data.append(price_item)

        print(f"Processed {len(price_data)} price items")

        # Convert to DataFrames for merging
        stock_df_clean = pd.DataFrame(stock_data)
        prices_df_clean = pd.DataFrame(price_data)

        # Merge dataframes
        print("\nMerging stock and price data...")
        merged_df = pd.merge(
            stock_df_clean,
            prices_df_clean[['codigo_propio', 'precio_costo_iva', 'precio_contado', 'precio_lista', 'precio_mayorista']],
            on='codigo_propio',
            how='inner',
            suffixes=('_stock', '_price')
        )

        print(f"Total products after merge: {len(merged_df)}")

        # Prepare data for database update
        products_to_update = []

        for _, row in merged_df.iterrows():
            # Use stock description preferentially, fall back to price description
            description = row['descripcion_stock'] if 'descripcion_stock' in row else row.get('descripcion', '')

            # Extract tire dimensions from description
            dimensions = extract_tire_dimensions(description)

            # Use precio_contado as the main price (retail price)
            price = row.get('precio_contado')

            # Use precio_lista as the list price (for discount calculation)
            list_price = row.get('precio_lista')

            # Use precio_costo_iva as the cost price
            cost_price = row.get('precio_costo_iva')

            if price and price > 0:  # Only process if we have a valid price
                product = {
                    'sku': str(row['codigo_propio']),
                    'supplier_code': str(row.get('codigo_proveedor', '')),
                    'name': description,
                    'brand': 'PIRELLI',
                    'stock': row.get('stock', 0),
                    'price': price,
                    'list_price': list_price if list_price else price,
                    'cost_price': cost_price,
                    'width': dimensions['width'],
                    'aspect_ratio': dimensions['aspect_ratio'],
                    'rim_diameter': dimensions['rim_diameter'],
                    'category': str(row.get('subrubro', '')).lower() if row.get('subrubro') else '',
                    'medida': str(row.get('medida', '')),
                    'updated_at': datetime.now().isoformat()
                }
                products_to_update.append(product)

        print(f"\nPrepared {len(products_to_update)} products for update")

        # Generate SQL update statements
        sql_statements = []

        # Generate UPDATE statements for existing products
        for product in products_to_update:
            # Escape single quotes in name
            name_escaped = product['name'].replace("'", "''")

            sql = f"""
UPDATE products
SET
    stock = {product['stock']},
    price = {product['price']},
    price_list = {product['list_price']},
    updated_at = NOW()
WHERE
    sku = '{product['sku']}'
    AND brand = 'PIRELLI';"""
            sql_statements.append(sql.strip())

        # Save SQL statements to file
        with open('/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/pirelli_update.sql', 'w', encoding='utf-8') as f:
            f.write('-- Pirelli Products Update\n')
            f.write(f'-- Generated: {datetime.now().isoformat()}\n')
            f.write(f'-- Total products: {len(products_to_update)}\n\n')
            f.write('-- Update existing Pirelli products\n\n')

            for sql in sql_statements:
                f.write(sql + '\n\n')

        # Save JSON data for review
        with open('/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/pirelli_products.json', 'w', encoding='utf-8') as f:
            json.dump(products_to_update, f, indent=2, ensure_ascii=False, default=str)

        print(f"\n✅ SQL statements saved to: pirelli_update.sql")
        print(f"✅ Product data saved to: pirelli_products.json")

        # Print summary
        print("\n=== UPDATE SUMMARY ===")
        print(f"Total products to update: {len(products_to_update)}")
        print(f"Products with stock > 0: {sum(1 for p in products_to_update if p['stock'] > 0)}")
        print(f"Products with dimensions: {sum(1 for p in products_to_update if p['width'])}")

        # Average price statistics
        prices = [p['price'] for p in products_to_update if p['price']]
        if prices:
            print(f"Average price: ${sum(prices)/len(prices):,.0f}")
            print(f"Min price: ${min(prices):,.0f}")
            print(f"Max price: ${max(prices):,.0f}")

        # Sample of products
        print("\n=== SAMPLE PRODUCTS ===")
        for product in products_to_update[:10]:
            dims = f"{product['width']}/{product['aspect_ratio']}R{product['rim_diameter']}" if product['width'] else "N/A"
            print(f"SKU: {product['sku']:6s} | {product['name'][:40]:40s} | Dims: {dims:15s} | Stock: {product['stock']:3d} | Price: ${product['price']:,.0f}")

        return products_to_update

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = process_pirelli_data()
    if result:
        print("\n✅ Processing completed successfully!")
        print(f"Ready to update {len(result)} Pirelli products in the database.")
        print("\nNext steps:")
        print("1. Review the generated SQL file: scripts/pirelli_update.sql")
        print("2. Check the JSON file for details: scripts/pirelli_products.json")
        print("3. Run the SQL statements in your database to update products")
    else:
        print("\n❌ Processing failed. Please check the error messages above.")