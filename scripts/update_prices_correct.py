#!/usr/bin/env python3
"""
Script para actualizar precios correctamente desde Excel
- CONTADO = precio real (price)
- PUBLICO = precio tachado (features.price_list)
Uso: python3 scripts/update_prices_correct.py <ruta_al_excel>
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

def update_prices_correct(excel_path: str):
    """Actualiza precios correctamente desde un archivo Excel"""

    print(f"📂 Leyendo archivo: {excel_path}")

    try:
        # Leer Excel (skiprows=1 porque la primera fila es el título)
        df = pd.read_excel(excel_path, skiprows=1)
        print(f"✅ Archivo leído correctamente: {len(df)} filas")
    except Exception as e:
        print(f"❌ Error al leer el archivo: {e}")
        sys.exit(1)

    # Verificar columnas necesarias
    required_cols = ['CODIGO_PROPIO', 'DESCRIPCION', 'PUBLICO', 'CONTADO']
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        print(f"❌ Faltan columnas necesarias: {missing_cols}")
        print(f"📋 Columnas disponibles: {list(df.columns)}")
        sys.exit(1)

    print(f"✅ Columnas verificadas correctamente")
    print(f"💰 CONTADO = precio real (actual)")
    print(f"💰 PUBLICO = precio tachado (referencia)")

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

    # Actualizar precios
    updated = 0
    not_found = 0
    no_price = 0
    errors = 0

    print("\n🔄 Procesando actualizaciones de precios...")
    print("=" * 100)

    for idx, row in df.iterrows():
        # Limpiar codigo_propio
        codigo_propio = str(row['CODIGO_PROPIO']).replace('[', '').replace(']', '').strip()
        descripcion = str(row['DESCRIPCION'])[:50]

        if not codigo_propio or codigo_propio == 'nan':
            continue

        # Obtener ambos precios del Excel
        try:
            precio_contado = float(row['CONTADO'])  # Precio real
            precio_publico = float(row['PUBLICO'])  # Precio tachado

            if precio_contado <= 0:
                no_price += 1
                continue
        except (ValueError, TypeError):
            no_price += 1
            continue

        # Buscar producto en BD
        product_data = products_db.get(codigo_propio)

        if not product_data:
            not_found += 1
            if not_found <= 5:
                print(f"⚠️  No encontrado: [{codigo_propio}] - {descripcion}")
            continue

        # Actualizar precio real y precio de lista
        try:
            # Obtener features actuales y agregar price_list
            current_features = product_data['features'] or {}
            current_features['price_list'] = precio_publico

            supabase.table('products').update({
                'price': precio_contado,  # Precio real
                'features': current_features  # price_list dentro de features
            }).eq('id', product_data['id']).execute()

            updated += 1
            if updated <= 10:  # Mostrar solo los primeros 10
                discount = ((precio_publico - precio_contado) / precio_publico * 100) if precio_publico > 0 else 0
                print(f"✅ [{codigo_propio}] {descripcion[:35]:35} → Real: ${precio_contado:>10,.0f} | Tachado: ${precio_publico:>10,.0f} | Desc: {discount:.1f}%")

        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"❌ Error actualizando [{codigo_propio}]: {e}")

    # Resumen
    print("\n" + "=" * 100)
    print("\n📊 RESUMEN DE ACTUALIZACIÓN DE PRECIOS")
    print(f"{'Total procesados:':<30} {len(df)}")
    print(f"{'✅ Precios actualizados:':<30} {updated}")
    print(f"{'⚠️  No encontrados en BD:':<30} {not_found}")
    print(f"{'📦 Sin precio válido:':<30} {no_price}")
    print(f"{'❌ Errores:':<30} {errors}")
    print("=" * 100)
    print("\n💡 IMPORTANTE:")
    print("   - price (DB) = CONTADO (precio real actual)")
    print("   - features.price_list = PUBLICO (precio tachado)")
    print("=" * 100)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python3 scripts/update_prices_correct.py <ruta_al_excel>")
        print("\nEjemplo:")
        print("  python3 scripts/update_prices_correct.py /Users/gabrielfontenla/Downloads/1411.xlsx")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"❌ El archivo no existe: {excel_path}")
        sys.exit(1)

    update_prices_correct(excel_path)
