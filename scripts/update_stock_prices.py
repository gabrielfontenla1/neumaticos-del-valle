#!/usr/bin/env python3
"""
Script para actualizar stock y precios desde Excel de Pirelli.
Normaliza automaticamente el formato del Excel.

Uso: python3 scripts/update_stock_prices.py <ruta_al_excel>

Normalizaciones:
- Salta la primera fila (titulo)
- Limpia corchetes de CODIGO_PROPIO: [1] -> 1
- CONTADO -> price (precio real)
- PUBLICO -> features.price_list (precio tachado)
- Suma stock de sucursales: CATAMARCA, LA_BANDA, SALTA, SANTIAGO, TUCUMAN, VIRGEN
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

# Sucursales conocidas
SUCURSALES = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN', 'BELGRANO']


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


def safe_int(value, default=0) -> int:
    """Convierte a int de forma segura"""
    if pd.isna(value):
        return default
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return default


def calculate_total_stock(row: pd.Series, columns: list) -> int:
    """Calcula el stock total sumando todas las sucursales"""
    total = 0
    for sucursal in SUCURSALES:
        if sucursal in columns:
            total += safe_int(row.get(sucursal, 0))
    return total


def get_stock_by_branch(row: pd.Series, columns: list) -> dict:
    """Obtiene el stock por sucursal"""
    stock_branches = {}
    for sucursal in SUCURSALES:
        if sucursal in columns:
            stock = safe_int(row.get(sucursal, 0))
            if stock > 0:
                stock_branches[sucursal.lower()] = stock
    return stock_branches


def normalize_excel(excel_path: str) -> pd.DataFrame:
    """Lee y normaliza el Excel de Pirelli"""

    # Leer sin header para detectar estructura
    df_raw = pd.read_excel(excel_path, header=None)

    # Buscar la fila con los headers reales
    header_row = 0
    for i, row in df_raw.iterrows():
        row_str = ' '.join([str(x) for x in row.values if pd.notna(x)])
        if 'CODIGO_PROPIO' in row_str or 'DESCRIPCION' in row_str:
            header_row = i
            break

    # Leer con el header correcto
    df = pd.read_excel(excel_path, header=header_row)

    # Limpiar nombres de columnas
    df.columns = [str(col).strip().upper() for col in df.columns]

    # Renombrar columnas con nombres alternativos
    column_mapping = {
        'CODIGO PROPIO': 'CODIGO_PROPIO',
        'CODIGO PROVEEDOR': 'CODIGO_PROVEEDOR',
        'LA BANDA': 'LA_BANDA',
    }
    df.rename(columns=column_mapping, inplace=True)

    return df


def update_stock_prices(excel_path: str):
    """Actualiza stock y precios desde un archivo Excel"""

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Variables de entorno SUPABASE no configuradas")
        print("Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local")
        sys.exit(1)

    # Inicializar Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Leyendo archivo: {excel_path}")

    try:
        df = normalize_excel(excel_path)
        print(f"Archivo leido: {len(df)} filas")
        print(f"Columnas detectadas: {list(df.columns)}")
    except Exception as e:
        print(f"Error al leer el archivo: {e}")
        sys.exit(1)

    # Verificar columnas minimas
    required = ['CODIGO_PROPIO']
    missing = [col for col in required if col not in df.columns]
    if missing:
        print(f"Error: Faltan columnas requeridas: {missing}")
        sys.exit(1)

    # Detectar columnas de precios
    has_prices = 'CONTADO' in df.columns and 'PUBLICO' in df.columns
    has_stock = any(suc in df.columns for suc in SUCURSALES)

    print(f"\nModo de actualizacion:")
    print(f"  - Precios (CONTADO/PUBLICO): {'Si' if has_prices else 'No'}")
    print(f"  - Stock por sucursales: {'Si' if has_stock else 'No'}")

    # Obtener productos de la BD indexados por codigo_propio
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
                    'stock': p['stock'],
                    'features': p['features'] or {}
                }
        print(f"Productos en BD: {len(products_db)}")
    except Exception as e:
        print(f"Error al obtener productos: {e}")
        sys.exit(1)

    # Procesar actualizaciones
    updated = 0
    not_found = []
    errors = []
    skipped = 0

    print("\nProcesando actualizaciones...")
    print("=" * 80)

    columns = list(df.columns)

    for idx, row in df.iterrows():
        codigo = clean_codigo(row.get('CODIGO_PROPIO', ''))

        if not codigo or codigo == 'nan':
            skipped += 1
            continue

        product = products_db.get(codigo)

        if not product:
            descripcion = str(row.get('DESCRIPCION', ''))[:40] if 'DESCRIPCION' in df.columns else ''
            not_found.append({'codigo': codigo, 'descripcion': descripcion})
            continue

        # Preparar actualizacion
        update_data = {}
        features = product['features'].copy()

        # Actualizar precios si estan disponibles
        if has_prices:
            precio_contado = safe_float(row.get('CONTADO'))
            precio_publico = safe_float(row.get('PUBLICO'))

            if precio_contado > 0:
                update_data['price'] = precio_contado
            if precio_publico > 0:
                features['price_list'] = precio_publico

        # Actualizar stock si hay columnas de sucursales
        if has_stock:
            total_stock = calculate_total_stock(row, columns)
            stock_branches = get_stock_by_branch(row, columns)

            update_data['stock'] = total_stock
            if stock_branches:
                features['stock_by_branch'] = stock_branches

        # Guardar features actualizados
        if features != product['features']:
            update_data['features'] = features

        # Ejecutar actualizacion si hay cambios
        if update_data:
            try:
                supabase.table('products').update(update_data).eq('id', product['id']).execute()
                updated += 1

                if updated <= 5:  # Mostrar primeros 5
                    desc = str(row.get('DESCRIPCION', ''))[:35] if 'DESCRIPCION' in df.columns else product['name'][:35]
                    price_info = f"${update_data.get('price', 0):,.0f}" if 'price' in update_data else '-'
                    stock_info = f"{update_data.get('stock', 0)}" if 'stock' in update_data else '-'
                    print(f"  [{codigo}] {desc:35} | Precio: {price_info:>12} | Stock: {stock_info:>4}")

            except Exception as e:
                errors.append({'codigo': codigo, 'error': str(e)})

    # Resumen
    print("=" * 80)
    print("\nRESUMEN")
    print(f"  Productos actualizados: {updated}")
    print(f"  No encontrados en BD:   {len(not_found)}")
    print(f"  Filas sin codigo:       {skipped}")
    print(f"  Errores:                {len(errors)}")

    if not_found and len(not_found) <= 10:
        print("\nProductos no encontrados:")
        for item in not_found[:10]:
            print(f"  [{item['codigo']}] {item['descripcion']}")
    elif not_found:
        print(f"\nProductos no encontrados: {len(not_found)} (mostrando primeros 10)")
        for item in not_found[:10]:
            print(f"  [{item['codigo']}] {item['descripcion']}")

    if errors:
        print("\nErrores:")
        for err in errors[:5]:
            print(f"  [{err['codigo']}] {err['error']}")

    print("=" * 80)

    return {
        'updated': updated,
        'not_found': len(not_found),
        'errors': len(errors),
        'skipped': skipped
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/update_stock_prices.py <ruta_al_excel>")
        print("\nEjemplo:")
        print("  python3 scripts/update_stock_prices.py /Users/gabrielfontenla/Downloads/stockprecionov.xlsx")
        sys.exit(1)

    excel_path = sys.argv[1]

    if not os.path.exists(excel_path):
        print(f"Error: El archivo no existe: {excel_path}")
        sys.exit(1)

    # Cambiar al directorio del proyecto para cargar .env.local
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_dir)

    update_stock_prices(excel_path)
