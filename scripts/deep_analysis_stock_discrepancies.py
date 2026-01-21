#!/usr/bin/env python3
"""
Análisis profundo de discrepancias de stock
Investigación exhaustiva de las 3 diferencias encontradas
"""

import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime
import json

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno no configuradas")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def analyze_product_deeply(sku: str):
    """Análisis exhaustivo de un producto específico"""

    print(f"\n{'='*100}")
    print(f"ANÁLISIS PROFUNDO - SKU: {sku}")
    print(f"{'='*100}")

    # 1. Obtener información completa del producto
    try:
        response = supabase.table('products').select('*').eq('sku', sku).single().execute()
        product = response.data
    except Exception as e:
        print(f"❌ Error al obtener producto: {e}")
        return None

    if not product:
        print(f"❌ Producto no encontrado en BD")
        return None

    # 2. Información básica
    print(f"\n📦 INFORMACIÓN BÁSICA:")
    print(f"{'ID:':<30} {product['id']}")
    print(f"{'SKU:':<30} {product['sku']}")
    print(f"{'Nombre:':<30} {product['name']}")
    print(f"{'Marca:':<30} {product.get('brand', 'N/A')}")
    print(f"{'Categoría:':<30} {product.get('category', 'N/A')}")
    print(f"{'Stock actual en BD:':<30} {product.get('stock', 0)}")

    # 3. Features detallados
    features = product.get('features') or {}
    print(f"\n🔍 FEATURES COMPLETOS:")
    print(f"{'Stock por sucursal:':<30} {features.get('stock_por_sucursal', {})}")

    # Mostrar todos los features
    for key, value in features.items():
        if key != 'stock_por_sucursal':
            print(f"{key:<30} {value}")

    # 4. Precios
    print(f"\n💰 INFORMACIÓN DE PRECIOS:")
    print(f"{'Precio público:':<30} ${product.get('price', 0):,.2f}")
    print(f"{'Precio contado:':<30} ${product.get('sale_price', 0):,.2f}" if product.get('sale_price') else f"{'Precio contado:':<30} No configurado")

    # 5. Timestamps
    print(f"\n📅 HISTORIAL TEMPORAL:")
    created_at = product.get('created_at', 'N/A')
    updated_at = product.get('updated_at', 'N/A')
    print(f"{'Creado:':<30} {created_at}")
    print(f"{'Última actualización:':<30} {updated_at}")

    # Calcular tiempo desde última actualización
    if updated_at != 'N/A':
        try:
            updated_datetime = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            now = datetime.now(updated_datetime.tzinfo)
            time_diff = now - updated_datetime

            if time_diff.days > 0:
                print(f"{'Tiempo desde actualización:':<30} {time_diff.days} días")
            elif time_diff.seconds > 3600:
                print(f"{'Tiempo desde actualización:':<30} {time_diff.seconds // 3600} horas")
            else:
                print(f"{'Tiempo desde actualización:':<30} {time_diff.seconds // 60} minutos")
        except:
            pass

    # 6. Análisis de stock por sucursal
    stock_por_sucursal = features.get('stock_por_sucursal', {})
    if stock_por_sucursal:
        print(f"\n📊 DESGLOSE DE STOCK POR SUCURSAL:")
        total_calculado = 0
        for sucursal, cantidad in sorted(stock_por_sucursal.items()):
            print(f"  {sucursal.upper():<20} {cantidad:>4} unidades")
            total_calculado += cantidad

        print(f"  {'-'*30}")
        print(f"  {'TOTAL CALCULADO':<20} {total_calculado:>4} unidades")
        print(f"  {'STOCK EN BD':<20} {product.get('stock', 0):>4} unidades")

        if total_calculado != product.get('stock', 0):
            print(f"  ⚠️  INCONSISTENCIA: Diferencia de {product.get('stock', 0) - total_calculado} unidades")

    return product

def check_related_tables(sku: str):
    """Verifica si el producto aparece en otras tablas (órdenes, carritos, etc.)"""

    print(f"\n🔗 VERIFICACIÓN EN TABLAS RELACIONADAS:")

    # Verificar en orders (si existe)
    try:
        # Intentar buscar en órdenes
        orders_response = supabase.table('orders').select('*').execute()

        # Buscar si el SKU aparece en alguna orden
        orders_with_product = []
        for order in orders_response.data:
            items = order.get('items', [])
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and item.get('sku') == sku:
                        orders_with_product.append(order)

        if orders_with_product:
            print(f"  ✅ Encontrado en {len(orders_with_product)} órdenes")
            # Mostrar las últimas 3 órdenes
            for order in orders_with_product[-3:]:
                print(f"    - Orden ID: {order.get('id')} | Fecha: {order.get('created_at', 'N/A')[:10]} | Estado: {order.get('status', 'N/A')}")
        else:
            print(f"  ℹ️  No encontrado en órdenes")
    except Exception as e:
        print(f"  ℹ️  No se pudo verificar tabla 'orders': {str(e)[:50]}")

    # Verificar en appointments (citas/presupuestos)
    try:
        appointments_response = supabase.table('appointments').select('*').execute()

        appointments_with_product = []
        for apt in appointments_response.data:
            selected_products = apt.get('selected_products', [])
            if isinstance(selected_products, list):
                for prod in selected_products:
                    if isinstance(prod, dict) and prod.get('sku') == sku:
                        appointments_with_product.append(apt)

        if appointments_with_product:
            print(f"  ✅ Encontrado en {len(appointments_with_product)} citas/presupuestos")
            for apt in appointments_with_product[-3:]:
                print(f"    - Cita ID: {apt.get('id')} | Fecha: {apt.get('created_at', 'N/A')[:10]} | Estado: {apt.get('status', 'N/A')}")
        else:
            print(f"  ℹ️  No encontrado en citas")
    except Exception as e:
        print(f"  ℹ️  No se pudo verificar tabla 'appointments': {str(e)[:50]}")

def analyze_excel_data(excel_path: str, sku: str):
    """Analiza datos del Excel para el SKU específico"""

    print(f"\n📄 ANÁLISIS DE DATOS EN EXCEL:")

    try:
        df = pd.read_excel(excel_path, skiprows=1)

        # Buscar el producto en el Excel
        product_row = df[df['CODIGO_PROPIO'] == sku]

        if product_row.empty:
            print(f"  ⚠️  Producto NO encontrado en Excel")
            return None

        row = product_row.iloc[0]

        print(f"  {'Código Propio:':<25} {row['CODIGO_PROPIO']}")
        print(f"  {'Descripción:':<25} {row['DESCRIPCION']}")
        print(f"  {'Marca:':<25} {row.get('MARCA', 'N/A')}")
        print(f"  {'Proveedor:':<25} {row.get('PROVEEDOR', 'N/A')}")

        print(f"\n  📊 STOCK EN EXCEL:")
        sucursales = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN']
        total_excel = 0

        for suc in sucursales:
            valor = row.get(suc, 0)
            if pd.notna(valor) and valor != '':
                try:
                    stock = int(float(valor))
                    if stock > 0:
                        print(f"    {suc:<20} {stock:>4} unidades")
                        total_excel += stock
                except:
                    pass

        if total_excel == 0:
            print(f"    ⚠️  TODAS LAS SUCURSALES EN CERO")

        print(f"    {'-'*30}")
        print(f"    {'TOTAL EN EXCEL':<20} {total_excel:>4} unidades")

        return row

    except Exception as e:
        print(f"  ❌ Error al analizar Excel: {e}")
        return None

def generate_recommendations(sku: str, product_bd, excel_row):
    """Genera recomendaciones basadas en el análisis"""

    print(f"\n💡 ANÁLISIS Y RECOMENDACIONES:")
    print(f"{'='*100}")

    stock_bd = product_bd.get('stock', 0)
    stock_excel = 0  # Ya sabemos que es 0 del análisis previo

    # Análisis de tiempo
    updated_at = product_bd.get('updated_at', '')
    try:
        updated_datetime = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
        now = datetime.now(updated_datetime.tzinfo)
        days_since_update = (now - updated_datetime).days
    except:
        days_since_update = None

    print(f"\n🔍 DIAGNÓSTICO:")

    # Escenario 1: Stock reciente en BD
    if days_since_update is not None and days_since_update < 7:
        print(f"  ✅ El producto fue actualizado recientemente ({days_since_update} días)")
        print(f"  📊 Stock en BD: {stock_bd} unidades")
        print(f"  📊 Stock en Excel: {stock_excel} unidades")
        print(f"\n  🎯 ESCENARIO PROBABLE:")
        print(f"     - Excel generado ANTES de la última actualización de BD")
        print(f"     - BD contiene información MÁS RECIENTE")
        print(f"     - Posibles ventas o ajustes manuales después del Excel")

    # Escenario 2: Stock antiguo en BD
    elif days_since_update is not None and days_since_update >= 7:
        print(f"  ⚠️  El producto NO fue actualizado recientemente ({days_since_update} días)")
        print(f"  📊 Stock en BD: {stock_bd} unidades")
        print(f"  📊 Stock en Excel: {stock_excel} unidades")
        print(f"\n  🎯 ESCENARIO PROBABLE:")
        print(f"     - Excel contiene información MÁS RECIENTE")
        print(f"     - BD tiene stock desactualizado")
        print(f"     - Se recomienda actualizar BD según Excel")

    # Escenario 3: No se puede determinar
    else:
        print(f"  ⚠️  No se puede determinar antigüedad de actualización")
        print(f"  📊 Stock en BD: {stock_bd} unidades")
        print(f"  📊 Stock en Excel: {stock_excel} unidades")

    print(f"\n📋 RECOMENDACIONES:")

    if stock_bd > 0 and stock_excel == 0:
        print(f"\n  OPCIÓN A - Mantener BD (CONSERVADOR):")
        print(f"    ✅ Mantiene {stock_bd} unidades disponibles para venta")
        print(f"    ✅ No pierde stock potencialmente real")
        print(f"    ⚠️  Riesgo: Vender stock que no existe físicamente")
        print(f"    💡 Recomendado si: Excel es viejo o BD fue actualizada manualmente")

        print(f"\n  OPCIÓN B - Actualizar a Excel (SINCRONIZACIÓN):")
        print(f"    ✅ BD sincronizada 100% con Excel")
        print(f"    ✅ Stock={stock_excel} (cero)")
        print(f"    ⚠️  Riesgo: Perder stock si Excel está desactualizado")
        print(f"    💡 Recomendado si: Excel es la fuente de verdad más reciente")

        print(f"\n  OPCIÓN C - Verificación manual (SEGURO):")
        print(f"    ✅ Verificar físicamente en sucursales")
        print(f"    ✅ Actualizar con stock real confirmado")
        print(f"    ⚠️  Requiere tiempo y esfuerzo manual")
        print(f"    💡 Recomendado para: Productos de alto valor o rotación")

def deep_analysis_all_discrepancies(excel_path: str):
    """Análisis profundo de todas las discrepancias"""

    # SKUs con discrepancias conocidas
    discrepancies = [
        {'sku': '[1587]', 'excel': 0, 'bd': 2},
        {'sku': '[387]', 'excel': 0, 'bd': 1},
        {'sku': '[41232]', 'excel': 0, 'bd': 8}
    ]

    print("="*100)
    print("ANÁLISIS PROFUNDO DE DISCREPANCIAS DE STOCK")
    print("="*100)
    print(f"\nTotal de discrepancias encontradas: {len(discrepancies)}")
    print(f"Archivo Excel: {excel_path}")
    print(f"Fecha de análisis: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    all_products = []

    for i, disc in enumerate(discrepancies, 1):
        sku = disc['sku']

        print(f"\n\n{'#'*100}")
        print(f"DISCREPANCIA {i} DE {len(discrepancies)}")
        print(f"{'#'*100}")

        # Análisis del producto en BD
        product = analyze_product_deeply(sku)

        if product:
            all_products.append(product)

            # Verificar en otras tablas
            check_related_tables(sku)

            # Análisis del Excel
            excel_row = analyze_excel_data(excel_path, sku)

            # Recomendaciones
            generate_recommendations(sku, product, excel_row)

    # Resumen ejecutivo
    print(f"\n\n{'='*100}")
    print("RESUMEN EJECUTIVO")
    print(f"{'='*100}")

    total_stock_bd = sum(p.get('stock', 0) for p in all_products)
    total_stock_excel = 0  # Todos son 0 en Excel
    diferencia_total = total_stock_bd - total_stock_excel

    print(f"\n📊 NÚMEROS TOTALES:")
    print(f"  {'Stock total en BD (3 productos):':<40} {total_stock_bd} unidades")
    print(f"  {'Stock total en Excel (3 productos):':<40} {total_stock_excel} unidades")
    print(f"  {'Diferencia total:':<40} {diferencia_total} unidades")

    print(f"\n🎯 DECISIÓN RECOMENDADA:")
    print(f"\n  Basado en el análisis exhaustivo:")

    # Verificar timestamps
    recent_updates = sum(1 for p in all_products
                        if p.get('updated_at') and
                        (datetime.now(datetime.fromisoformat(p['updated_at'].replace('Z', '+00:00')).tzinfo) -
                         datetime.fromisoformat(p['updated_at'].replace('Z', '+00:00'))).days < 7)

    if recent_updates > len(all_products) / 2:
        print(f"  ✅ MANTENER BD - Mayoría de productos actualizados recientemente")
        print(f"     ({recent_updates}/{len(all_products)} productos actualizados en últimos 7 días)")
    else:
        print(f"  ✅ ACTUALIZAR A EXCEL - BD parece desactualizada")
        print(f"     ({recent_updates}/{len(all_products)} productos actualizados en últimos 7 días)")

    print(f"\n  💡 ACCIÓN SUGERIDA:")
    print(f"     1. Verificar fecha de generación del Excel")
    print(f"     2. Si Excel es reciente (último día): Actualizar BD")
    print(f"     3. Si Excel es antiguo (>1 semana): Mantener BD")
    print(f"     4. Si hay dudas: Verificación física en sucursales")

    print(f"\n{'='*100}\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python3 scripts/deep_analysis_stock_discrepancies.py <ruta_al_excel>")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"❌ El archivo no existe: {excel_path}")
        sys.exit(1)

    deep_analysis_all_discrepancies(excel_path)
