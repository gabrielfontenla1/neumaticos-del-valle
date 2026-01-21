#!/usr/bin/env python3
"""
Script para actualizar stock desde Excel
Uso: python3 scripts/update_stock_from_excel.py <ruta_al_excel>
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
    print("   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas")
    sys.exit(1)

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_total_stock(row):
    """Calcula el stock total sumando todas las sucursales"""
    stock_total = 0
    sucursales = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN']

    for sucursal in sucursales:
        value = row.get(sucursal, 0)
        if pd.notna(value) and value != '':
            try:
                stock_total += float(value)
            except (ValueError, TypeError):
                pass

    return int(stock_total)

def get_stock_por_sucursal(row):
    """Obtiene el stock desglosado por sucursal"""
    stock_por_sucursal = {}
    sucursales = {
        'CATAMARCA': 'catamarca',
        'LA_BANDA': 'la_banda',
        'SALTA': 'salta',
        'SANTIAGO': 'santiago',
        'TUCUMAN': 'tucuman',
        'VIRGEN': 'virgen'
    }

    for excel_name, db_name in sucursales.items():
        value = row.get(excel_name, 0)
        if pd.notna(value) and value != '':
            try:
                stock_value = float(value)
                if stock_value != 0:
                    stock_por_sucursal[db_name] = int(stock_value)
            except (ValueError, TypeError):
                pass

    return stock_por_sucursal

def update_stock_from_excel(excel_path: str):
    """Actualiza el stock desde un archivo Excel"""

    print(f"📂 Leyendo archivo: {excel_path}")

    try:
        # Leer Excel (skiprows=1 porque la primera fila es el título)
        df = pd.read_excel(excel_path, skiprows=1)
        print(f"✅ Archivo leído correctamente: {len(df)} filas")
    except Exception as e:
        print(f"❌ Error al leer el archivo: {e}")
        sys.exit(1)

    # Verificar columnas necesarias
    required_cols = ['CODIGO_PROPIO', 'DESCRIPCION', 'CATAMARCA',
                     'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN']
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        print(f"❌ Faltan columnas necesarias: {missing_cols}")
        sys.exit(1)

    print(f"✅ Columnas verificadas correctamente")

    # Obtener todos los productos de la base de datos
    print("\n📊 Obteniendo productos de la base de datos...")
    try:
        response = supabase.table('products').select('id, sku, features').execute()
        products_db = {
            str(p['sku']).strip(): {
                'id': p['id'],
                'features': p.get('features') or {}
            }
            for p in response.data
            if p.get('sku')
        }
        print(f"✅ {len(products_db)} productos encontrados en la base de datos")
    except Exception as e:
        print(f"❌ Error al obtener productos: {e}")
        sys.exit(1)

    # Procesar actualizaciones
    updated = 0
    not_found = 0
    no_stock = 0
    errors = 0

    print("\n🔄 Procesando actualizaciones...")
    print("=" * 80)

    for idx, row in df.iterrows():
        # Mantener codigo_propio CON corchetes para buscar por SKU
        codigo_propio = str(row['CODIGO_PROPIO']).strip()
        descripcion = str(row['DESCRIPCION'])[:50]

        if not codigo_propio or codigo_propio == 'nan':
            continue

        # Calcular stock total y por sucursal
        stock_total = calculate_total_stock(row)
        stock_por_sucursal = get_stock_por_sucursal(row)

        # Obtener código de proveedor y proveedor
        codigo_proveedor = str(row.get('CODIGO_PROVEEDOR', '')).strip() if pd.notna(row.get('CODIGO_PROVEEDOR')) else None
        proveedor = str(row.get('PROVEEDOR', '')).strip() if pd.notna(row.get('PROVEEDOR')) else None

        # Buscar producto en BD por SKU (que incluye los corchetes)
        product_data = products_db.get(codigo_propio)

        if not product_data:
            not_found += 1
            if not_found <= 5:  # Mostrar solo los primeros 5
                print(f"⚠️  No encontrado: [{codigo_propio}] - {descripcion}")
            continue

        # Actualizar stock y features (tanto con stock como sin stock)
        try:
            # Obtener features actuales y agregar stock_por_sucursal, codigo_proveedor y proveedor
            current_features = product_data['features'] or {}
            current_features['stock_por_sucursal'] = stock_por_sucursal

            # Agregar código de proveedor si existe
            if codigo_proveedor and codigo_proveedor != 'nan':
                current_features['codigo_proveedor'] = codigo_proveedor

            # Agregar proveedor si existe
            if proveedor and proveedor != 'nan':
                current_features['proveedor'] = proveedor

            supabase.table('products').update({
                'stock': stock_total,
                'features': current_features
            }).eq('id', product_data['id']).execute()

            updated += 1
            if stock_total == 0:
                no_stock += 1
            if updated <= 10:  # Mostrar solo los primeros 10
                sucursales_str = ', '.join([f"{k}: {v}" for k, v in stock_por_sucursal.items()]) if stock_por_sucursal else 'Sin stock'
                proveedor_str = f" | Cód.Prov: {codigo_proveedor}" if codigo_proveedor else ""
                print(f"✅ [{codigo_propio}] {descripcion[:30]:30} → Total: {stock_total} ({sucursales_str}){proveedor_str}")

        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"❌ Error actualizando [{codigo_propio}]: {e}")

    # Resumen
    print("\n" + "=" * 80)
    print("\n📊 RESUMEN DE ACTUALIZACIÓN")
    print(f"{'Total procesados:':<25} {len(df)}")
    print(f"{'✅ Actualizados:':<25} {updated}")
    print(f"{'⚠️  No encontrados en BD:':<25} {not_found}")
    print(f"{'📦 Sin stock:':<25} {no_stock}")
    print(f"{'❌ Errores:':<25} {errors}")
    print("=" * 80)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python3 scripts/update_stock_from_excel.py <ruta_al_excel>")
        print("\nEjemplo:")
        print("  python3 scripts/update_stock_from_excel.py /Users/gabrielfontenla/Downloads/1111.xlsx")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"❌ El archivo no existe: {excel_path}")
        sys.exit(1)

    update_stock_from_excel(excel_path)
