#!/usr/bin/env python3
"""
Script para importar nueva lista de precios con descuentos
- Limpia descripciones (NBx, etc.)
- Maneja precio de lista y precio con descuento
- Reemplaza toda la base de datos existente
"""

import pandas as pd
import json
import sys
import os
from supabase import create_client, Client
import re
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

def clean_description(desc):
    """
    Limpia la descripción del producto
    - Elimina (NBx), (K1), y similares
    - Elimina espacios extra
    """
    if pd.isna(desc):
        return ""

    # Convertir a string
    desc = str(desc)

    # Eliminar códigos entre paréntesis como (NB)x, (K1), etc.
    # Primero eliminamos patrones como (NB)x o (K1)
    desc = re.sub(r'\s*\([^)]+\)[x]?\s*', ' ', desc)

    # También eliminar códigos sueltos como wl al final
    desc = re.sub(r'\s+wl\s*$', '', desc)

    # Eliminar múltiples espacios
    desc = ' '.join(desc.split())

    return desc.strip()

def parse_tire_size(description):
    """
    Extrae dimensiones del neumático desde la descripción
    """
    patterns = [
        r'(\d{3})/(\d{2})R(\d{2})',  # 175/65R15
        r'(\d{3})\/(\d{2})\s*R\s*(\d{2})',  # 175/65 R 15
        r'(\d{3})\/(\d{2})[-\s]+R(\d{2})',  # 175/65-R15
        r'(\d{3})\/(\d{2})[A-Z]R(\d{2})',  # 175/65ZR15
    ]

    for pattern in patterns:
        match = re.search(pattern, description)
        if match:
            return {
                'width': int(match.group(1)),
                'profile': int(match.group(2)),
                'diameter': int(match.group(3))
            }

    # Patrones alternativos
    alt_match = re.search(r'(\d+)\.(\d+)[A-Z]*(\d+)', description)
    if alt_match:
        return {'width': 0, 'profile': 0, 'diameter': int(alt_match.group(3))}

    return {'width': None, 'profile': None, 'diameter': None}

def determine_category(description, width):
    """
    Determina la categoría del producto
    """
    desc_upper = description.upper() if description else ""

    # Neumáticos de moto
    if 'M/C' in desc_upper or 'TT ' in desc_upper or 'MT 60' in desc_upper or 'SUPER CITY' in desc_upper:
        return 'moto'

    # Neumáticos de camión
    if 'C ' in desc_upper or 'LT' in desc_upper or desc_upper.endswith('C') or 'CARRIER' in desc_upper or 'CHRONO' in desc_upper:
        return 'camion'

    # Neumáticos de camioneta/SUV
    if (width and width >= 235) or 'SCORPION' in desc_upper or 'SUV' in desc_upper or '4X4' in desc_upper:
        return 'camioneta'

    # Por defecto, auto
    if width and width < 195:
        return 'auto'

    return 'auto'

def process_excel_with_prices(file_path):
    """
    Procesa archivo Excel con precios de lista y descuentos
    """
    print(f"Leyendo archivo: {file_path}")

    # Leer el archivo Excel con headers desde la fila 1
    df = pd.read_excel(file_path, header=1)

    print(f"Encontradas {len(df)} filas")
    print(f"Columnas: {df.columns.tolist()}")

    # Mostrar primeras filas para entender estructura
    print("\nPrimeras 3 filas:")
    print(df.head(3))

    products = []

    for idx, row in df.iterrows():
        # La descripción está en la columna "DESCRIPCION"
        description = row.get('DESCRIPCION')
        if not description or pd.isna(description):
            continue

        # Limpiar descripción
        description_clean = clean_description(str(description))

        # Extraer dimensiones
        tire_size = parse_tire_size(description_clean)

        # Determinar categoría basada en la columna CATEGORIA y características
        categoria_excel = str(row.get('CATEGORIA', '')).upper() if pd.notna(row.get('CATEGORIA')) else ''

        # Mapear categorías del Excel a nuestras categorías
        if 'CON' in categoria_excel or 'CAR' in categoria_excel:
            category = determine_category(description_clean, tire_size['width'])
        elif 'SUV' in categoria_excel or 'CAMIONETA' in categoria_excel:
            category = 'camioneta'
        elif 'CAMION' in categoria_excel:
            category = 'camion'
        elif 'MOTO' in categoria_excel:
            category = 'moto'
        else:
            category = determine_category(description_clean, tire_size['width'])

        # Obtener marca de la columna MARCA
        brand = str(row.get('MARCA', 'PIRELLI')).upper() if pd.notna(row.get('MARCA')) else 'PIRELLI'

        # Obtener precios
        # PUBLICO es el precio de lista
        price_list = None
        if pd.notna(row.get('PUBLICO')):
            try:
                price_list = float(row['PUBLICO'])
            except:
                pass

        # CONTADO es el precio con descuento (25% off según el nombre de columna -0.25)
        price_sale = None
        if pd.notna(row.get('CONTADO')):
            try:
                price_sale = float(row['CONTADO'])
            except:
                pass

        # Si no hay precio de venta, usar precio de lista
        if price_list and not price_sale:
            price_sale = price_list * 0.75  # Aplicar 25% de descuento

        # Si no hay precio de lista pero sí precio de venta, calcular precio de lista
        if price_sale and not price_list:
            price_list = price_sale / 0.75  # Calcular precio original

        # Si no hay ningún precio, saltar
        if not price_sale and not price_list:
            continue

        # Si solo hay precio de lista, establecer precio de venta
        if price_list and not price_sale:
            price_sale = price_list

        # Crear nombre del producto
        if tire_size['width'] and tire_size['profile'] and tire_size['diameter']:
            name = f"{tire_size['width']}/{tire_size['profile']}R{tire_size['diameter']} {description_clean}"
        else:
            name = description_clean

        # Calcular stock total desde las sucursales
        stock = 0
        sucursales = ['BELGRANO', 'CATAMARCA', 'LA_BANDA', 'SALTA', 'TUCUMAN', 'VIRGEN']
        stock_por_sucursal = {}

        for sucursal in sucursales:
            if sucursal in df.columns and pd.notna(row.get(sucursal)):
                try:
                    stock_sucursal = int(float(row[sucursal]))
                    stock_por_sucursal[sucursal.lower()] = stock_sucursal
                    stock += stock_sucursal
                except:
                    stock_por_sucursal[sucursal.lower()] = 0

        product = {
            'name': name[:200],
            'brand': brand,
            'model': description_clean[:100],
            'category': category,
            'width': tire_size['width'],
            'profile': tire_size['profile'],
            'diameter': tire_size['diameter'],
            'price': price_sale,  # Precio con descuento (para mostrar)
            'stock': stock,
            'description': description_clean,
            'features': {
                'codigo_propio': str(row.get('CODIGO_PROPIO', '')).replace('[', '').replace(']', '') if pd.notna(row.get('CODIGO_PROPIO')) else '',
                'codigo_proveedor': str(row.get('CODIGO_PROVEEDOR', '')) if pd.notna(row.get('CODIGO_PROVEEDOR')) else '',
                'proveedor': str(row.get('PROVEEDOR', '')) if pd.notna(row.get('PROVEEDOR')) else '',
                'stock_por_sucursal': stock_por_sucursal,
                'price_list': price_list,  # Guardar precio de lista en features
                'discount_percentage': 25 if price_list and price_sale else 0  # Guardar porcentaje de descuento
            },
            'image_url': '/mock-tire.png'
        }

        products.append(product)

    print(f"\nProcesados {len(products)} productos válidos")

    # Mostrar muestra de productos
    if products:
        print("\nMuestra de productos procesados:")
        for i, p in enumerate(products[:3]):
            print(f"\n{i+1}. {p['name']}")
            print(f"   Marca: {p['brand']}")
            price_list = p['features'].get('price_list', 0)
            if price_list:
                print(f"   Precio Lista: ${price_list:,.0f}")
            print(f"   Precio Oferta: ${p['price']:,.0f}")
            if price_list and price_list > p['price']:
                discount = ((price_list - p['price']) / price_list) * 100
                print(f"   Descuento: {discount:.0f}%")

    return products

def delete_all_products():
    """Elimina todos los productos existentes"""
    print("\nEliminando productos existentes...")
    try:
        # Obtener count
        response = supabase.table('products').select('id', count='exact').execute()
        count = len(response.data) if response.data else 0

        if count > 0:
            # Eliminar todos
            delete_response = supabase.table('products').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            print(f"✓ Eliminados {count} productos existentes")
        else:
            print("No hay productos para eliminar")

        return True
    except Exception as e:
        print(f"Error eliminando productos: {e}")
        return False

def import_to_supabase(products):
    """Importa productos a Supabase"""
    print(f"\nImportando {len(products)} productos a Supabase...")

    batch_size = 50
    successful = 0
    failed = 0

    for i in range(0, len(products), batch_size):
        batch = products[i:i+batch_size]
        batch_num = (i // batch_size) + 1

        try:
            response = supabase.table('products').insert(batch).execute()
            successful += len(batch)
            print(f"  ✓ Batch {batch_num}: {len(batch)} productos importados")
        except Exception as e:
            print(f"  ✗ Error en batch {batch_num}: {e}")
            failed += len(batch)

    print("\n" + "="*60)
    print(f"Importación completada:")
    print(f"  ✓ Exitosos: {successful}")
    print(f"  ✗ Fallidos: {failed}")
    print(f"  Total: {successful + failed}")
    print("="*60)

    return successful > 0

def main():
    """Función principal"""
    print("="*60)
    print("IMPORTADOR DE NUEVA LISTA DE PRECIOS")
    print("="*60)

    # Usar la ruta del archivo stock1.xlsx directamente
    file_path = '/Users/gabrielfontenla/Downloads/stock1.xlsx'

    print(f"\nProcesando archivo: {file_path}")

    # Verificar que el archivo existe
    if not os.path.exists(file_path):
        print(f"Error: No se encuentra el archivo: {file_path}")
        sys.exit(1)

    # Procesar archivo
    products = process_excel_with_prices(file_path)

    if not products:
        print("No se encontraron productos válidos para importar")
        sys.exit(1)

    print(f"\n¿Desea eliminar todos los productos existentes e importar {len(products)} nuevos?")
    print("Auto-confirmando: SI")
    response = 's'  # Auto-confirmar

    if response.lower() != 's':
        print("Cancelado")
        sys.exit(0)

    # Eliminar existentes
    if not delete_all_products():
        print("Error eliminando productos existentes")
        sys.exit(1)

    # Importar nuevos
    success = import_to_supabase(products)

    if success:
        print("\n✅ Importación exitosa!")
    else:
        print("\n❌ Error en la importación")

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()