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
    pattern = r'(\d{3})/(\d{2})R(\d{2})'
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
        # Read Excel files with proper header row
        print("Reading stock file...")
        stock_df = pd.read_excel('/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_31_10_25.xlsx', header=0)

        # Skip the header row and use the actual data
        stock_df = stock_df.iloc[1:]
        stock_df.columns = [
            'codigo_propio', 'codigo_proveedor', 'descripcion', 'grupo', 'estanteria',
            'estante', 'ingresos', 'egresos', 'ingresos_ri', 'egresos_ri', 'stock',
            'stock_minimo', 'stock_maximo', 'belgrano', 'catamarca', 'la_banda',
            'lomas', 'san_juan', 'formosa', 'factor', 'medida', 'rubro', 'subrubro', 'marca'
        ]

        print("Reading prices file...")
        prices_df = pd.read_excel('/Users/gabrielfontenla/Downloads/PRECIOS_PIRELLI_31_10_25.xlsx', header=0)

        # Skip the header row and use the actual data
        prices_df = prices_df.iloc[1:]
        prices_df.columns = [
            'codigo_propio', 'codigo_proveedor', 'codigo_barra', 'descripcion', 'marca',
            'precio_lista', 'fecha_actualizado', 'bonificacion1', 'bonificacion2',
            'bonificacion3', 'bonificacion4', 'bonificacion5', 'bonificacion6',
            'bonificacion7', 'bonificacion8', 'bonificacion9', 'bonificacion10',
            'precio_costo', 'iva', 'precio_costo_iva', 'fecha_actualizado2',
            'precio_contado', 'g_contado', 'p_contado', 'precio_lista2', 'g_lista2',
            'p_lista2', 'precio_lista3', 'g_lista3', 'p_lista3', 'precio_lista4',
            'g_lista4', 'p_lista4', 'precio_lista5', 'g_lista5', 'p_lista5',
            'precio_lista_ant', 'fecha_actualizado3', 'precio_mayorista', 'g_mayorista',
            'p_mayorista', 'precio_reventa5', 'g_reventa5', 'p_reventa5',
            'precio_reventa10', 'g_reventa10', 'p_reventa10', 'precio_reventa15',
            'g_reventa15', 'p_reventa15'
        ]

        # Clean codigo_propio - remove brackets
        stock_df['codigo_propio'] = stock_df['codigo_propio'].astype(str).str.replace('[', '').str.replace(']', '').str.strip()
        stock_df['codigo_proveedor'] = stock_df['codigo_proveedor'].astype(str).str.replace('[', '').str.replace(']', '').str.strip()

        prices_df['codigo_propio'] = prices_df['codigo_propio'].astype(str).str.strip()
        prices_df['codigo_proveedor'] = prices_df['codigo_proveedor'].astype(str).str.strip()

        # Merge dataframes on codigo_propio
        print("\nMerging stock and price data...")
        merged_df = pd.merge(
            stock_df,
            prices_df[['codigo_propio', 'precio_costo_iva', 'precio_contado', 'precio_lista',
                      'precio_mayorista', 'precio_reventa5', 'precio_reventa10', 'precio_reventa15']],
            on='codigo_propio',
            how='inner'
        )

        print(f"Total products after merge: {len(merged_df)}")

        # Prepare data for database update
        products_to_update = []

        for _, row in merged_df.iterrows():
            # Extract tire dimensions from description
            dimensions = extract_tire_dimensions(row['descripcion'])

            # Clean stock value
            stock = clean_stock(row['stock'])

            # Use precio_contado as the main price (retail price)
            price = clean_price(row['precio_contado'])

            # Use precio_lista as the list price (for discount calculation)
            list_price = clean_price(row['precio_lista'])

            # Use precio_costo_iva as the cost price
            cost_price = clean_price(row['precio_costo_iva'])

            if price and price > 0:  # Only process if we have a valid price
                product = {
                    'sku': str(row['codigo_propio']),
                    'supplier_code': str(row['codigo_proveedor']),
                    'name': str(row['descripcion']),
                    'brand': 'PIRELLI',
                    'stock': stock,
                    'price': price,
                    'list_price': list_price if list_price else price,
                    'cost_price': cost_price,
                    'width': dimensions['width'],
                    'aspect_ratio': dimensions['aspect_ratio'],
                    'rim_diameter': dimensions['rim_diameter'],
                    'category': str(row.get('subrubro', '')).lower() if pd.notna(row.get('subrubro')) else '',
                    'updated_at': datetime.now().isoformat()
                }
                products_to_update.append(product)

        print(f"\nPrepared {len(products_to_update)} products for update")

        # Generate SQL update statements
        sql_statements = []

        # First, let's generate INSERT ... ON DUPLICATE KEY UPDATE statements
        for product in products_to_update:
            sql = f"""
INSERT INTO products (
    sku, name, brand, stock, price, list_price,
    width, aspect_ratio, rim_diameter, category, updated_at
) VALUES (
    '{product['sku']}',
    '{product['name'].replace("'", "''")}',
    '{product['brand']}',
    {product['stock']},
    {product['price']},
    {product['list_price']},
    {product['width'] if product['width'] else 'NULL'},
    {product['aspect_ratio'] if product['aspect_ratio'] else 'NULL'},
    {product['rim_diameter'] if product['rim_diameter'] else 'NULL'},
    '{product['category']}',
    NOW()
)
ON DUPLICATE KEY UPDATE
    stock = VALUES(stock),
    price = VALUES(price),
    list_price = VALUES(list_price),
    updated_at = NOW();"""
            sql_statements.append(sql.strip())

        # Save SQL statements to file
        with open('/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/pirelli_update.sql', 'w', encoding='utf-8') as f:
            f.write('-- Pirelli Products Update\n')
            f.write(f'-- Generated: {datetime.now().isoformat()}\n')
            f.write(f'-- Total products: {len(products_to_update)}\n\n')

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

        # Sample of products
        print("\n=== SAMPLE PRODUCTS ===")
        for product in products_to_update[:5]:
            print(f"SKU: {product['sku']}, Name: {product['name'][:50]}..., Stock: {product['stock']}, Price: ${product['price']:,.0f}")

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
        print("2. Run the SQL statements in your database to update products")
    else:
        print("\n❌ Processing failed. Please check the error messages above.")