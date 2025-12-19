#!/usr/bin/env python3
"""
Script para verificar que los precios estén correctos en la base de datos
Compara Excel vs Supabase
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

def verify_prices(excel_path: str):
    """Verifica que los precios estén correctos"""

    print(f"📂 Leyendo archivo: {excel_path}")

    try:
        df = pd.read_excel(excel_path, skiprows=1)
        print(f"✅ Archivo leído correctamente: {len(df)} filas\n")
    except Exception as e:
        print(f"❌ Error al leer el archivo: {e}")
        sys.exit(1)

    # Obtener productos de la base de datos
    print("📊 Obteniendo productos de la base de datos...")
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
                    'price_list': p.get('features', {}).get('price_list', 0)
                }
        print(f"✅ {len(products_db)} productos encontrados\n")
    except Exception as e:
        print(f"❌ Error al obtener productos: {e}")
        sys.exit(1)

    # Verificar precios
    print("🔍 VERIFICANDO PRECIOS...")
    print("=" * 100)

    correct_price = 0
    correct_price_list = 0
    incorrect_price = 0
    incorrect_price_list = 0
    missing_price_list = 0

    errors = []

    for idx, row in df.iterrows():
        codigo_propio = str(row['CODIGO_PROPIO']).replace('[', '').replace(']', '').strip()

        if not codigo_propio or codigo_propio == 'nan':
            continue

        try:
            excel_contado = float(row['CONTADO'])
            excel_publico = float(row['PUBLICO'])
        except (ValueError, TypeError):
            continue

        product_data = products_db.get(codigo_propio)
        if not product_data:
            continue

        db_price = float(product_data['price'])
        db_price_list = float(product_data['price_list']) if product_data['price_list'] else 0

        # Verificar precio real (CONTADO)
        if abs(db_price - excel_contado) < 0.01:
            correct_price += 1
        else:
            incorrect_price += 1
            if len(errors) < 10:
                errors.append({
                    'codigo': codigo_propio,
                    'tipo': 'PRECIO REAL',
                    'db': db_price,
                    'excel': excel_contado
                })

        # Verificar precio de lista (PUBLICO)
        if db_price_list == 0:
            missing_price_list += 1
        elif abs(db_price_list - excel_publico) < 0.01:
            correct_price_list += 1
        else:
            incorrect_price_list += 1
            if len(errors) < 10:
                errors.append({
                    'codigo': codigo_propio,
                    'tipo': 'PRECIO TACHADO',
                    'db': db_price_list,
                    'excel': excel_publico
                })

    # Mostrar errores
    if errors:
        print("\n⚠️  ERRORES ENCONTRADOS:")
        print("-" * 100)
        for err in errors[:10]:
            print(f"[{err['codigo']}] {err['tipo']}: DB=${err['db']:,.0f} vs Excel=${err['excel']:,.0f}")
        if len(errors) > 10:
            print(f"... y {len(errors) - 10} errores más")

    # Resumen
    print("\n" + "=" * 100)
    print("\n📊 RESUMEN DE VERIFICACIÓN")
    print(f"\n{'PRECIO REAL (price = CONTADO):':<40}")
    print(f"  {'✅ Correctos:':<35} {correct_price}")
    print(f"  {'❌ Incorrectos:':<35} {incorrect_price}")

    print(f"\n{'PRECIO TACHADO (price_list = PUBLICO):':<40}")
    print(f"  {'✅ Correctos:':<35} {correct_price_list}")
    print(f"  {'❌ Incorrectos:':<35} {incorrect_price_list}")
    print(f"  {'⚠️  Sin price_list:':<35} {missing_price_list}")

    total = correct_price + incorrect_price
    if total > 0:
        success_rate = (correct_price / total) * 100
        print(f"\n{'Tasa de éxito:':<40} {success_rate:.1f}%")

    print("=" * 100)

    if incorrect_price == 0 and incorrect_price_list == 0 and missing_price_list == 0:
        print("\n✅ ¡TODOS LOS PRECIOS ESTÁN CORRECTOS!")
    else:
        print("\n⚠️  Se encontraron diferencias. Revisar arriba.")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python3 scripts/verify_prices.py <ruta_al_excel>")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"❌ El archivo no existe: {excel_path}")
        sys.exit(1)

    verify_prices(excel_path)
