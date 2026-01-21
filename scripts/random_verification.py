#!/usr/bin/env python3
"""
Verificación aleatoria de productos Excel vs BD
Selecciona 5 productos al azar y los compara en detalle
"""

import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import random

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno no configuradas")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_stock_from_excel_row(row):
    """Extrae stock del Excel"""
    sucursales = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN']

    stock_total = 0
    stock_por_sucursal = {}

    for suc in sucursales:
        value = row.get(suc, 0)
        if pd.notna(value) and value != '':
            try:
                stock_value = int(float(value))
                if stock_value > 0:
                    stock_total += stock_value
                    stock_por_sucursal[suc.lower()] = stock_value
            except (ValueError, TypeError):
                pass

    return stock_total, stock_por_sucursal

def compare_product(excel_row, product_db):
    """Compara un producto del Excel con la BD"""

    sku = str(excel_row['CODIGO_PROPIO']).strip()

    print(f"\n{'='*100}")
    print(f"SKU: {sku}")
    print(f"{'='*100}")

    # Datos del Excel
    excel_stock_total, excel_stock_sucursales = get_stock_from_excel_row(excel_row)

    print(f"\n📄 EXCEL:")
    print(f"  Código Propio:        {excel_row['CODIGO_PROPIO']}")
    print(f"  Descripción:          {excel_row['DESCRIPCION']}")
    print(f"  Marca:                {excel_row.get('MARCA', 'N/A')}")
    print(f"  Proveedor:            {excel_row.get('PROVEEDOR', 'N/A')}")
    print(f"  Precio Público:       ${excel_row.get('PUBLICO', 0):,.2f}")
    print(f"  Precio Contado:       ${excel_row.get('CONTADO', 0):,.2f}")
    print(f"  Stock Total:          {excel_stock_total}")

    if excel_stock_sucursales:
        print(f"  Stock por Sucursal:")
        for suc, stock in sorted(excel_stock_sucursales.items()):
            print(f"    - {suc.upper():<15} {stock:>4} unidades")
    else:
        print(f"  Stock por Sucursal:   (sin stock)")

    # Datos de BD
    if product_db:
        db_stock_total = product_db.get('stock', 0) or 0
        db_features = product_db.get('features') or {}
        db_stock_sucursales = db_features.get('stock_por_sucursal', {})

        print(f"\n💾 BASE DE DATOS:")
        print(f"  ID:                   {product_db['id']}")
        print(f"  SKU:                  {product_db['sku']}")
        print(f"  Nombre:               {product_db['name']}")
        print(f"  Marca:                {product_db.get('brand', 'N/A')}")
        print(f"  Categoría:            {product_db.get('category', 'N/A')}")
        print(f"  Precio Público:       ${product_db.get('price', 0):,.2f}")
        print(f"  Precio Contado:       ${product_db.get('sale_price', 0):,.2f}" if product_db.get('sale_price') else f"  Precio Contado:       No configurado")
        print(f"  Stock Total:          {db_stock_total}")

        if db_stock_sucursales:
            print(f"  Stock por Sucursal:")
            for suc, stock in sorted(db_stock_sucursales.items()):
                print(f"    - {suc.upper():<15} {stock:>4} unidades")
        else:
            print(f"  Stock por Sucursal:   (sin stock)")
    else:
        print(f"\n💾 BASE DE DATOS:")
        print(f"  ❌ Producto NO encontrado en BD")
        return False

    # Comparación
    print(f"\n🔍 COMPARACIÓN:")

    # Stock total
    stock_match = (excel_stock_total == db_stock_total)
    print(f"  Stock Total:          {'✅ COINCIDE' if stock_match else f'❌ DIFERENTE (Excel: {excel_stock_total}, BD: {db_stock_total})'}")

    # Stock por sucursal
    sucursal_match = True
    all_sucursales = set(list(excel_stock_sucursales.keys()) + list(db_stock_sucursales.keys()))

    if all_sucursales:
        print(f"  Stock por Sucursal:")
        for suc in sorted(all_sucursales):
            excel_val = excel_stock_sucursales.get(suc, 0)
            db_val = db_stock_sucursales.get(suc, 0)
            match = (excel_val == db_val)
            sucursal_match = sucursal_match and match

            status = '✅' if match else '❌'
            print(f"    {status} {suc.upper():<15} Excel: {excel_val:>4} | BD: {db_val:>4}")
    else:
        sucursal_match = True
        print(f"  Stock por Sucursal:   ✅ Ambos sin stock")

    # Resultado final
    perfect_match = stock_match and sucursal_match
    print(f"\n🎯 RESULTADO:           {'✅ SINCRONIZACIÓN PERFECTA' if perfect_match else '❌ HAY DIFERENCIAS'}")

    return perfect_match

def random_verification(excel_path: str, num_samples: int = 5):
    """Verifica N productos aleatorios"""

    print("="*100)
    print("VERIFICACIÓN ALEATORIA DE PRODUCTOS")
    print("="*100)
    print(f"\nArchivo: {excel_path}")
    print(f"Productos a verificar: {num_samples}")

    # Leer Excel
    try:
        df = pd.read_excel(excel_path, skiprows=1)
        print(f"Total productos en Excel: {len(df)}")
    except Exception as e:
        print(f"❌ Error al leer Excel: {e}")
        sys.exit(1)

    # Obtener productos de BD
    try:
        response = supabase.table('products').select('*').execute()
        products_db = {
            str(p['sku']).strip(): p
            for p in response.data
            if p.get('sku')
        }
        print(f"Total productos en BD: {len(products_db)}")
    except Exception as e:
        print(f"❌ Error al consultar BD: {e}")
        sys.exit(1)

    # Seleccionar productos aleatorios
    random_indices = random.sample(range(len(df)), min(num_samples, len(df)))

    print(f"\n🎲 Productos seleccionados aleatoriamente (índices: {random_indices})")

    # Comparar cada producto
    perfect_matches = 0

    for idx in random_indices:
        excel_row = df.iloc[idx]
        sku = str(excel_row['CODIGO_PROPIO']).strip()

        product_db = products_db.get(sku)

        if compare_product(excel_row, product_db):
            perfect_matches += 1

    # Resumen
    print(f"\n{'='*100}")
    print("RESUMEN DE VERIFICACIÓN ALEATORIA")
    print(f"{'='*100}")
    print(f"Productos verificados:        {num_samples}")
    print(f"✅ Sincronizados perfectamente: {perfect_matches}")
    print(f"❌ Con diferencias:             {num_samples - perfect_matches}")

    if perfect_matches == num_samples:
        print(f"\n🎉 ¡PERFECTO! Todos los productos verificados coinciden al 100%")
    else:
        print(f"\n⚠️  Algunos productos tienen diferencias")

    print(f"{'='*100}\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python3 scripts/random_verification.py <ruta_al_excel> [num_productos]")
        print("\nEjemplo:")
        print("  python3 scripts/random_verification.py /Users/gabrielfontenla/Downloads/stock10.xlsx 5")
        sys.exit(1)

    excel_path = sys.argv[1]
    num_samples = int(sys.argv[2]) if len(sys.argv) > 2 else 5

    if not os.path.exists(excel_path):
        print(f"❌ El archivo no existe: {excel_path}")
        sys.exit(1)

    random_verification(excel_path, num_samples)
