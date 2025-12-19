#!/usr/bin/env python3
"""
Script para verificar precios entre Excel y ecommerce (base de datos).
Compara CONTADO/PUBLICO del Excel con price/features.price_list de la BD.

Uso: python3 scripts/verify_prices_excel.py <ruta_al_excel>
"""

import sys
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Tolerancia para diferencias de precio (por redondeo)
TOLERANCIA = 1.0  # $1 de tolerancia


def clean_codigo(codigo: str) -> str:
    """Limpia el codigo propio: [1] -> 1"""
    if pd.isna(codigo):
        return ''
    return str(codigo).replace('[', '').replace(']', '').strip()


def safe_float(value, default=0.0) -> float:
    """Convierte a float de forma segura"""
    if pd.isna(value):
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def normalize_excel(excel_path: str) -> pd.DataFrame:
    """Lee y normaliza el Excel de Pirelli"""
    df_raw = pd.read_excel(excel_path, header=None)

    # Buscar la fila con los headers reales
    header_row = 0
    for i, row in df_raw.iterrows():
        row_str = ' '.join([str(x) for x in row.values if pd.notna(x)])
        if 'CODIGO_PROPIO' in row_str or 'DESCRIPCION' in row_str:
            header_row = i
            break

    df = pd.read_excel(excel_path, header=header_row)
    df.columns = [str(col).strip().upper() for col in df.columns]

    column_mapping = {
        'CODIGO PROPIO': 'CODIGO_PROPIO',
        'CODIGO PROVEEDOR': 'CODIGO_PROVEEDOR',
        'LA BANDA': 'LA_BANDA',
    }
    df.rename(columns=column_mapping, inplace=True)

    return df


def verify_prices(excel_path: str):
    """Verifica precios entre Excel y base de datos"""

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Variables de entorno SUPABASE no configuradas")
        sys.exit(1)

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Leyendo archivo: {excel_path}")

    try:
        df = normalize_excel(excel_path)
        print(f"Archivo leido: {len(df)} filas")
    except Exception as e:
        print(f"Error al leer el archivo: {e}")
        sys.exit(1)

    # Verificar columnas
    has_prices = 'CONTADO' in df.columns and 'PUBLICO' in df.columns
    if not has_prices:
        print("Error: El Excel debe tener columnas CONTADO y PUBLICO")
        sys.exit(1)

    # Obtener productos de la BD
    print("\nObteniendo productos de la base de datos...")
    try:
        response = supabase.table('products').select('id, name, price, stock, features').execute()
        products_db = {}
        for p in response.data:
            codigo = None
            if p.get('features') and p['features'].get('codigo_propio'):
                codigo = str(p['features'].get('codigo_propio', '')).strip()
            if codigo:
                products_db[codigo] = {
                    'id': p['id'],
                    'name': p['name'],
                    'price': p['price'],
                    'stock': p['stock'] or 0,
                    'price_list': p.get('features', {}).get('price_list', 0) if p.get('features') else 0
                }
        print(f"Productos en BD: {len(products_db)}")
    except Exception as e:
        print(f"Error al obtener productos: {e}")
        sys.exit(1)

    # Comparar precios
    correctos = []
    diferencias = []
    no_encontrados = []
    sin_codigo = 0

    for idx, row in df.iterrows():
        codigo = clean_codigo(row.get('CODIGO_PROPIO', ''))

        if not codigo or codigo == 'nan':
            sin_codigo += 1
            continue

        excel_contado = safe_float(row.get('CONTADO'))
        excel_publico = safe_float(row.get('PUBLICO'))
        descripcion = str(row.get('DESCRIPCION', ''))[:50]

        if excel_contado <= 0:
            continue

        product = products_db.get(codigo)

        if not product:
            no_encontrados.append({
                'codigo': codigo,
                'descripcion': descripcion,
                'excel_contado': excel_contado,
                'excel_publico': excel_publico
            })
            continue

        bd_price = product['price']
        bd_price_list = product['price_list']

        # Comparar precios
        diff_contado = abs(excel_contado - bd_price)
        diff_publico = abs(excel_publico - bd_price_list) if bd_price_list else 0

        if diff_contado <= TOLERANCIA and diff_publico <= TOLERANCIA:
            correctos.append({
                'codigo': codigo,
                'descripcion': descripcion,
                'stock': product['stock']
            })
        else:
            diferencias.append({
                'codigo': codigo,
                'descripcion': descripcion,
                'excel_contado': excel_contado,
                'bd_contado': bd_price,
                'diff_contado': excel_contado - bd_price,
                'excel_publico': excel_publico,
                'bd_publico': bd_price_list,
                'diff_publico': excel_publico - bd_price_list if bd_price_list else excel_publico,
                'stock': product['stock']
            })

    # Resumen
    total_comparados = len(correctos) + len(diferencias)
    pct_correctos = (len(correctos) / total_comparados * 100) if total_comparados > 0 else 0

    print("\n" + "=" * 80)
    print("VERIFICACION DE PRECIOS: EXCEL vs ECOMMERCE")
    print("=" * 80)
    print(f"Total productos en Excel:     {len(df)}")
    print(f"Sin codigo valido:            {sin_codigo}")
    print(f"Encontrados en BD:            {total_comparados}")
    print(f"Con precios correctos:        {len(correctos)} ({pct_correctos:.1f}%)")
    print(f"Con diferencias:              {len(diferencias)} ({100-pct_correctos:.1f}%)")
    print(f"No encontrados en BD:         {len(no_encontrados)}")
    print("=" * 80)

    # Mostrar diferencias
    if diferencias:
        print("\nPRODUCTOS CON DIFERENCIAS DE PRECIO:")
        print("-" * 80)

        # Ordenar por diferencia absoluta
        diferencias.sort(key=lambda x: abs(x['diff_contado']), reverse=True)

        for item in diferencias[:20]:  # Mostrar top 20
            stock_label = f"Stock: {item['stock']}" if item['stock'] > 0 else "Sin stock"
            print(f"\n[{item['codigo']}] {item['descripcion']} ({stock_label})")
            print(f"  Contado: Excel ${item['excel_contado']:>12,.0f} | BD ${item['bd_contado']:>12,.0f} | Dif: ${item['diff_contado']:>+10,.0f}")
            if item['bd_publico']:
                print(f"  Publico: Excel ${item['excel_publico']:>12,.0f} | BD ${item['bd_publico']:>12,.0f} | Dif: ${item['diff_publico']:>+10,.0f}")
            else:
                print(f"  Publico: Excel ${item['excel_publico']:>12,.0f} | BD: Sin precio de lista")

        if len(diferencias) > 20:
            print(f"\n... y {len(diferencias) - 20} productos mas con diferencias")

    # Mostrar no encontrados
    if no_encontrados and len(no_encontrados) <= 10:
        print("\nPRODUCTOS NO ENCONTRADOS EN BD:")
        print("-" * 80)
        for item in no_encontrados:
            print(f"  [{item['codigo']}] {item['descripcion']}")
    elif no_encontrados:
        print(f"\nProductos no encontrados en BD: {len(no_encontrados)} (primeros 10):")
        for item in no_encontrados[:10]:
            print(f"  [{item['codigo']}] {item['descripcion']}")

    # Verificar productos con stock
    productos_stock = [p for p in correctos if p['stock'] > 0]
    productos_stock_diff = [p for p in diferencias if p['stock'] > 0]

    print("\n" + "=" * 80)
    print("RESUMEN PRODUCTOS CON STOCK:")
    print(f"  Con precios correctos:  {len(productos_stock)}")
    print(f"  Con diferencias:        {len(productos_stock_diff)}")
    print("=" * 80)

    if len(diferencias) == 0:
        print("\n✅ TODOS LOS PRECIOS COINCIDEN CORRECTAMENTE")
    else:
        print(f"\n⚠️  HAY {len(diferencias)} PRODUCTOS CON DIFERENCIAS DE PRECIO")

    return {
        'total_excel': len(df),
        'encontrados': total_comparados,
        'correctos': len(correctos),
        'diferencias': len(diferencias),
        'no_encontrados': len(no_encontrados)
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/verify_prices_excel.py <ruta_al_excel>")
        print("\nEjemplo:")
        print("  python3 scripts/verify_prices_excel.py /Users/gabrielfontenla/Downloads/stockprecionov.xlsx")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"Error: El archivo no existe: {excel_path}")
        sys.exit(1)

    # Cambiar al directorio del proyecto
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_dir)

    verify_prices(excel_path)
