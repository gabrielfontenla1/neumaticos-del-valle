#!/usr/bin/env python3
"""
Script para comparar precios entre Excel y Supabase
Uso: python3 scripts/compare_prices.py <ruta_al_excel>
"""

import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno no configuradas")
    sys.exit(1)

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def compare_prices(excel_path: str):
    """Compara precios entre Excel y Supabase"""

    print(f"📂 Leyendo archivo: {excel_path}")

    try:
        # Leer Excel (skiprows=1 porque la primera fila es el título)
        df = pd.read_excel(excel_path, skiprows=1)
        print(f"✅ Archivo leído correctamente: {len(df)} filas")
    except Exception as e:
        print(f"❌ Error al leer el archivo: {e}")
        sys.exit(1)

    # Verificar columnas necesarias
    required_cols = ['CODIGO_PROPIO', 'DESCRIPCION']
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        print(f"❌ Faltan columnas necesarias: {missing_cols}")
        print(f"📋 Columnas disponibles: {list(df.columns)}")
        sys.exit(1)

    # Verificar que exista al menos una columna de precio
    price_cols = ['PUBLICO', 'CONTADO', 'PRECIO']
    price_col = None
    for col in price_cols:
        if col in df.columns:
            price_col = col
            break

    if not price_col:
        print(f"❌ No se encontró ninguna columna de precio: {price_cols}")
        print(f"📋 Columnas disponibles: {list(df.columns)}")
        sys.exit(1)

    print(f"✅ Columnas verificadas correctamente")
    print(f"📊 Usando columna de precio: {price_col}")

    # Obtener todos los productos de la base de datos
    print("\n📊 Obteniendo productos de la base de datos...")
    try:
        response = supabase.table('products').select('id, name, price, features').execute()
        products_db = {}
        for p in response.data:
            if p.get('features') and p['features'].get('codigo_propio'):
                codigo = str(p['features'].get('codigo_propio', '')).strip()
                products_db[codigo] = {
                    'id': p['id'],
                    'name': p['name'],
                    'price': p['price'],
                    'features': p['features']
                }
        print(f"✅ {len(products_db)} productos encontrados en la base de datos")
    except Exception as e:
        print(f"❌ Error al obtener productos: {e}")
        sys.exit(1)

    # Comparar precios
    print("\n🔍 COMPARANDO PRECIOS...")
    print("=" * 100)

    matches = 0
    differences = 0
    not_found = 0
    price_differences = []

    for idx, row in df.iterrows():
        # Limpiar codigo_propio
        codigo_propio = str(row['CODIGO_PROPIO']).replace('[', '').replace(']', '').strip()
        descripcion = str(row['DESCRIPCION'])[:50]

        if not codigo_propio or codigo_propio == 'nan':
            continue

        # Obtener precio del Excel
        try:
            excel_price = float(row[price_col])
        except (ValueError, TypeError):
            continue

        # Buscar producto en BD
        product_data = products_db.get(codigo_propio)

        if not product_data:
            not_found += 1
            continue

        db_price = float(product_data['price'])

        # Comparar precios (con tolerancia de 0.01 por redondeo)
        if abs(db_price - excel_price) < 0.01:
            matches += 1
        else:
            differences += 1
            diff_percent = ((excel_price - db_price) / db_price * 100) if db_price > 0 else 0
            price_differences.append({
                'codigo': codigo_propio,
                'descripcion': descripcion,
                'db_price': db_price,
                'excel_price': excel_price,
                'diff': excel_price - db_price,
                'diff_percent': diff_percent
            })

    # Mostrar diferencias
    if price_differences:
        print(f"\n⚠️  DIFERENCIAS ENCONTRADAS ({len(price_differences)}):")
        print("=" * 100)
        print(f"{'Código':<10} {'Descripción':<35} {'DB Price':>12} {'Excel Price':>12} {'Diferencia':>12} {'%':>8}")
        print("-" * 100)

        # Mostrar primeras 20 diferencias
        for item in price_differences[:20]:
            print(f"{item['codigo']:<10} {item['descripcion']:<35} "
                  f"${item['db_price']:>11,.2f} ${item['excel_price']:>11,.2f} "
                  f"${item['diff']:>11,.2f} {item['diff_percent']:>7.2f}%")

        if len(price_differences) > 20:
            print(f"\n... y {len(price_differences) - 20} diferencias más")

    # Resumen
    print("\n" + "=" * 100)
    print("\n📊 RESUMEN DE COMPARACIÓN")
    print(f"{'Total procesados:':<30} {len(df)}")
    print(f"{'✅ Precios coinciden:':<30} {matches}")
    print(f"{'⚠️  Precios diferentes:':<30} {differences}")
    print(f"{'❌ No encontrados en BD:':<30} {not_found}")
    print("=" * 100)

    # Preguntar si actualizar
    if differences > 0:
        print(f"\n⚠️  Se encontraron {differences} productos con precios diferentes")
        response = input("¿Deseas actualizar los precios en Supabase? (si/no): ")

        if response.lower() in ['si', 'sí', 's', 'yes', 'y']:
            update_prices(df, products_db, price_col)
        else:
            print("❌ Actualización cancelada")

def update_prices(df, products_db, price_col):
    """Actualiza los precios en Supabase"""
    print("\n🔄 ACTUALIZANDO PRECIOS...")
    print("=" * 100)

    updated = 0
    errors = 0

    for idx, row in df.iterrows():
        codigo_propio = str(row['CODIGO_PROPIO']).replace('[', '').replace(']', '').strip()

        if not codigo_propio or codigo_propio == 'nan':
            continue

        try:
            excel_price = float(row[price_col])
        except (ValueError, TypeError):
            continue

        product_data = products_db.get(codigo_propio)
        if not product_data:
            continue

        db_price = float(product_data['price'])

        # Solo actualizar si hay diferencia
        if abs(db_price - excel_price) >= 0.01:
            try:
                supabase.table('products').update({
                    'price': excel_price
                }).eq('id', product_data['id']).execute()

                updated += 1
                if updated <= 10:
                    print(f"✅ [{codigo_propio}] ${db_price:,.2f} → ${excel_price:,.2f}")
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"❌ Error actualizando [{codigo_propio}]: {e}")

    print("\n" + "=" * 100)
    print(f"\n✅ Actualización completada:")
    print(f"{'Precios actualizados:':<30} {updated}")
    print(f"{'Errores:':<30} {errors}")
    print("=" * 100)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python3 scripts/compare_prices.py <ruta_al_excel>")
        print("\nEjemplo:")
        print("  python3 scripts/compare_prices.py /Users/gabrielfontenla/Downloads/1411.xlsx")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"❌ El archivo no existe: {excel_path}")
        sys.exit(1)

    compare_prices(excel_path)
