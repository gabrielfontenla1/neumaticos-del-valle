#!/usr/bin/env python3
"""
Script de verificación completa Excel vs BD
Compara el 100% de los datos para asegurar sincronización perfecta
"""

import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from collections import defaultdict

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno no configuradas")
    sys.exit(1)

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_stock_from_row(row):
    """Extrae stock total y por sucursal de una fila del Excel"""
    sucursales = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN']

    stock_total = 0
    stock_por_sucursal = {}

    for sucursal in sucursales:
        value = row.get(sucursal, 0)
        if pd.notna(value) and value != '':
            try:
                stock_value = int(float(value))
                if stock_value > 0:
                    stock_total += stock_value
                    stock_por_sucursal[sucursal.lower()] = stock_value
            except (ValueError, TypeError):
                pass

    return stock_total, stock_por_sucursal

def verify_stock_update(excel_path: str):
    """Verifica que el 100% de los datos del Excel coincidan con la BD"""

    print("=" * 100)
    print("VERIFICACIÓN COMPLETA: EXCEL vs BASE DE DATOS")
    print("=" * 100)

    # 1. Leer Excel
    print(f"\n📂 Leyendo Excel: {excel_path}")
    try:
        df = pd.read_excel(excel_path, skiprows=1)
        print(f"✅ Excel leído: {len(df)} productos")
    except Exception as e:
        print(f"❌ Error al leer Excel: {e}")
        sys.exit(1)

    # 2. Obtener productos de BD
    print(f"\n📊 Obteniendo productos de la base de datos...")
    try:
        response = supabase.table('products').select('id, sku, name, stock, features').execute()
        products_db = {
            str(p['sku']).strip(): p
            for p in response.data
            if p.get('sku')
        }
        print(f"✅ BD consultada: {len(products_db)} productos")
    except Exception as e:
        print(f"❌ Error al consultar BD: {e}")
        sys.exit(1)

    # 3. Inicializar contadores
    total_excel = 0
    perfect_match = 0
    stock_mismatch = 0
    sucursal_mismatch = 0
    missing_in_db = 0

    # Detalles de discrepancias
    stock_differences = []
    sucursal_differences = []
    missing_products = []

    print(f"\n🔍 Verificando {len(df)} productos...")
    print("=" * 100)

    # 4. Comparar cada producto
    for idx, row in df.iterrows():
        total_excel += 1

        codigo = str(row['CODIGO_PROPIO']).strip()
        descripcion = str(row['DESCRIPCION'])[:40]

        if not codigo or codigo == 'nan':
            continue

        # Obtener stock del Excel
        excel_stock_total, excel_stock_sucursales = get_stock_from_row(row)

        # Buscar en BD
        product_db = products_db.get(codigo)

        if not product_db:
            missing_in_db += 1
            missing_products.append({
                'sku': codigo,
                'descripcion': descripcion,
                'stock_excel': excel_stock_total
            })
            continue

        # Obtener stock de BD
        db_stock_total = product_db.get('stock', 0) or 0
        db_features = product_db.get('features') or {}
        db_stock_sucursales = db_features.get('stock_por_sucursal', {})

        # Comparar stock total
        stock_match = (excel_stock_total == db_stock_total)

        # Comparar stock por sucursal
        sucursal_match = True
        sucursal_diff = {}

        # Normalizar nombres de sucursales para comparación
        for suc_excel, cantidad_excel in excel_stock_sucursales.items():
            suc_key = suc_excel.lower()
            cantidad_db = db_stock_sucursales.get(suc_key, 0)

            if cantidad_excel != cantidad_db:
                sucursal_match = False
                sucursal_diff[suc_key] = {
                    'excel': cantidad_excel,
                    'db': cantidad_db
                }

        # Verificar sucursales que están en BD pero no en Excel
        for suc_db, cantidad_db in db_stock_sucursales.items():
            if suc_db not in [s.lower() for s in excel_stock_sucursales.keys()]:
                if cantidad_db > 0:  # Solo si hay stock
                    sucursal_match = False
                    sucursal_diff[suc_db] = {
                        'excel': 0,
                        'db': cantidad_db
                    }

        # Clasificar resultado
        if stock_match and sucursal_match:
            perfect_match += 1
        else:
            if not stock_match:
                stock_mismatch += 1
                stock_differences.append({
                    'sku': codigo,
                    'descripcion': descripcion,
                    'excel_total': excel_stock_total,
                    'db_total': db_stock_total,
                    'diferencia': db_stock_total - excel_stock_total
                })

            if not sucursal_match:
                sucursal_mismatch += 1
                sucursal_differences.append({
                    'sku': codigo,
                    'descripcion': descripcion,
                    'diferencias': sucursal_diff
                })

    # 5. Buscar productos en BD que no están en Excel
    excel_skus = set(str(row['CODIGO_PROPIO']).strip() for _, row in df.iterrows()
                     if str(row['CODIGO_PROPIO']).strip() != 'nan')
    db_skus = set(products_db.keys())
    only_in_db = db_skus - excel_skus

    # 6. Generar reporte
    print("\n" + "=" * 100)
    print("RESULTADOS DE VERIFICACIÓN")
    print("=" * 100)

    print(f"\n📊 ESTADÍSTICAS GENERALES:")
    print(f"{'Total productos en Excel:':<40} {total_excel}")
    print(f"{'Total productos en BD:':<40} {len(products_db)}")
    print(f"{'Solo en BD (no en Excel):':<40} {len(only_in_db)}")

    print(f"\n✅ COINCIDENCIAS:")
    print(f"{'Coincidencia perfecta (100%):':<40} {perfect_match} ({perfect_match/total_excel*100:.1f}%)")

    print(f"\n⚠️  DISCREPANCIAS:")
    print(f"{'Stock total diferente:':<40} {stock_mismatch}")
    print(f"{'Stock por sucursal diferente:':<40} {sucursal_mismatch}")
    print(f"{'No encontrados en BD:':<40} {missing_in_db}")

    # Mostrar detalles de discrepancias
    if stock_differences:
        print(f"\n❌ DIFERENCIAS EN STOCK TOTAL (mostrando primeras 20):")
        print("-" * 100)
        for diff in stock_differences[:20]:
            print(f"SKU: {diff['sku']:<10} | {diff['descripcion']:<40} | Excel: {diff['excel_total']:>4} | BD: {diff['db_total']:>4} | Diff: {diff['diferencia']:>+4}")
        if len(stock_differences) > 20:
            print(f"... y {len(stock_differences) - 20} más")

    if sucursal_differences:
        print(f"\n❌ DIFERENCIAS EN STOCK POR SUCURSAL (mostrando primeras 10):")
        print("-" * 100)
        for diff in sucursal_differences[:10]:
            print(f"\nSKU: {diff['sku']} - {diff['descripcion']}")
            for suc, valores in diff['diferencias'].items():
                print(f"  {suc.upper():<15} Excel: {valores['excel']:>4} | BD: {valores['db']:>4}")
        if len(sucursal_differences) > 10:
            print(f"\n... y {len(sucursal_differences) - 10} más")

    if missing_products:
        print(f"\n⚠️  PRODUCTOS NO ENCONTRADOS EN BD (mostrando primeros 10):")
        print("-" * 100)
        for miss in missing_products[:10]:
            print(f"SKU: {miss['sku']:<10} | {miss['descripcion']:<40} | Stock Excel: {miss['stock_excel']}")
        if len(missing_products) > 10:
            print(f"... y {len(missing_products) - 10} más")

    if only_in_db:
        print(f"\n📋 PRODUCTOS SOLO EN BD (primeros 10):")
        print("-" * 100)
        for sku in list(only_in_db)[:10]:
            product = products_db[sku]
            print(f"SKU: {sku:<10} | {product.get('name', 'N/A')[:40]:<40} | Stock BD: {product.get('stock', 0)}")
        if len(only_in_db) > 10:
            print(f"... y {len(only_in_db) - 10} más")

    # Cálculo de precisión
    print("\n" + "=" * 100)
    print("MÉTRICAS DE CALIDAD")
    print("=" * 100)

    if total_excel > 0:
        precision = (perfect_match / total_excel) * 100
        print(f"Precisión de sincronización: {precision:.2f}%")

        if precision == 100:
            print("🎉 ¡PERFECTO! Todos los datos coinciden al 100%")
        elif precision >= 95:
            print("✅ Excelente sincronización")
        elif precision >= 90:
            print("⚠️  Buena sincronización con algunas diferencias menores")
        else:
            print("❌ Se requiere atención: Diferencias significativas detectadas")

    print("=" * 100)

    # Retornar resumen
    return {
        'total_excel': total_excel,
        'perfect_match': perfect_match,
        'stock_mismatch': stock_mismatch,
        'sucursal_mismatch': sucursal_mismatch,
        'missing_in_db': missing_in_db,
        'precision': (perfect_match / total_excel * 100) if total_excel > 0 else 0
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python3 scripts/verify_stock_update.py <ruta_al_excel>")
        print("\nEjemplo:")
        print("  python3 scripts/verify_stock_update.py /Users/gabrielfontenla/Downloads/stock10.xlsx")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"❌ El archivo no existe: {excel_path}")
        sys.exit(1)

    verify_stock_update(excel_path)
