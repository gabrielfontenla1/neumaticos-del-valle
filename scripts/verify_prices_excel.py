#!/usr/bin/env python3
"""
Script para verificar precios y/o stock entre Excel y ecommerce (base de datos).
Detecta automaticamente el origen (Pirelli/Corven) y si el Excel tiene precios, stock, o ambos.

Origenes:
- Pirelli: Neumaticos de autos (categorias: CON, SUV, CAR, VAN, MOT)
- Corven: Neumaticos agro/camiones (categorias: AGR, CMO, VI, OTR)

Modos:
- Precios: Compara CONTADO/PUBLICO del Excel con price/features.price_list de la BD
- Stock: Compara suma de sucursales del Excel con stock de la BD

Uso:
  python3 scripts/verify_prices_excel.py <ruta_al_excel>
  python3 scripts/verify_prices_excel.py <ruta_al_excel> --pirelli
  python3 scripts/verify_prices_excel.py <ruta_al_excel> --corven
"""

import sys
import os
import argparse
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Tolerancia para diferencias (por redondeo)
TOLERANCIA_PRECIO = 1.0  # $1 de tolerancia
TOLERANCIA_STOCK = 0  # Stock debe coincidir exacto

# Sucursales conocidas
SUCURSALES = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN', 'BELGRANO']

# Categorias por origen
PIRELLI_CATEGORIES = ['CON', 'SUV', 'CAR', 'VAN', 'MOT']
CORVEN_CATEGORIES = ['AGR', 'CMO', 'VI', 'OTR']


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


def normalize_excel(excel_path: str) -> pd.DataFrame:
    """Lee y normaliza el Excel"""
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


def detect_source(df: pd.DataFrame) -> tuple[str, list[str]]:
    """
    Detecta el origen del Excel basado en los valores de la columna CATEGORIA.
    Retorna (source, indicators) donde source es 'pirelli' o 'corven'.
    """
    columns = list(df.columns)

    if 'CATEGORIA' not in columns:
        return 'pirelli', []  # Default si no hay columna CATEGORIA

    # Obtener valores unicos de CATEGORIA (primeras 50 filas)
    categoria_values = set()
    for i, row in df.head(50).iterrows():
        cat = row.get('CATEGORIA')
        if pd.notna(cat) and isinstance(cat, str):
            categoria_values.add(cat.upper().strip())

    # Detectar por valores
    found_corven = [c for c in CORVEN_CATEGORIES if c in categoria_values]
    found_pirelli = [c for c in PIRELLI_CATEGORIES if c in categoria_values]

    if found_corven:
        return 'corven', found_corven
    elif found_pirelli:
        return 'pirelli', found_pirelli
    else:
        return 'pirelli', []  # Default


def calculate_total_stock(row: pd.Series, columns: list) -> int:
    """Calcula el stock total sumando todas las sucursales"""
    total = 0
    for sucursal in SUCURSALES:
        if sucursal in columns:
            total += safe_int(row.get(sucursal, 0))
    return total


def verify_data(excel_path: str, user_source: str = None):
    """Verifica precios y/o stock entre Excel y base de datos"""

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

    # Detectar origen
    detected_source, indicators = detect_source(df)
    source = user_source or detected_source

    print(f"\n{'=' * 60}")
    print(f"ORIGEN DETECTADO: {detected_source.upper()}")
    if indicators:
        print(f"  Categorias encontradas: {', '.join(indicators)}")
    if user_source and user_source != detected_source:
        print(f"\n⚠️  ADVERTENCIA: Especificaste {user_source.upper()} pero se detecto {detected_source.upper()}")
        print(f"   Continuando con: {source.upper()}")
    print(f"{'=' * 60}")

    # Detectar columnas disponibles
    columns = list(df.columns)
    has_prices = 'CONTADO' in columns and 'PUBLICO' in columns
    has_stock = any(suc in columns for suc in SUCURSALES)

    if not has_prices and not has_stock:
        print("Error: El Excel debe tener columnas de precio (CONTADO/PUBLICO) o stock (sucursales)")
        sys.exit(1)

    print(f"\nModo de verificacion detectado:")
    print(f"  - Precios (CONTADO/PUBLICO): {'Si' if has_prices else 'No'}")
    print(f"  - Stock (sucursales): {'Si' if has_stock else 'No'}")

    # Obtener productos de la BD
    print("\nObteniendo productos de la base de datos...")
    try:
        response = supabase.table('products').select('id, name, price, stock, category, features').execute()
        products_db = {}
        legacy_field_count = 0
        for p in response.data:
            codigo = None
            features = p.get('features') or {}
            if features.get('codigo_propio'):
                codigo = str(features.get('codigo_propio', '')).strip()
            if codigo:
                # Check for legacy field
                has_legacy = 'stock_por_sucursal' in features
                if has_legacy:
                    legacy_field_count += 1

                products_db[codigo] = {
                    'id': p['id'],
                    'name': p['name'],
                    'price': p['price'],
                    'stock': p['stock'] or 0,
                    'category': p.get('category', ''),
                    'price_list': features.get('price_list', 0),
                    'stock_by_branch': features.get('stock_by_branch', {}),
                    'has_legacy_field': has_legacy
                }
        print(f"Productos en BD: {len(products_db)}")
        if legacy_field_count > 0:
            print(f"⚠️  Productos con campo legacy 'stock_por_sucursal': {legacy_field_count}")
    except Exception as e:
        print(f"Error al obtener productos: {e}")
        sys.exit(1)

    # Comparar datos
    correctos = []
    diferencias_precio = []
    diferencias_stock = []
    no_encontrados = []
    sin_codigo = 0

    for idx, row in df.iterrows():
        codigo = clean_codigo(row.get('CODIGO_PROPIO', ''))

        if not codigo or codigo == 'nan':
            sin_codigo += 1
            continue

        descripcion = str(row.get('DESCRIPCION', ''))[:50]
        product = products_db.get(codigo)

        if not product:
            item_not_found = {'codigo': codigo, 'descripcion': descripcion}
            if has_prices:
                item_not_found['excel_contado'] = safe_float(row.get('CONTADO'))
            if has_stock:
                item_not_found['excel_stock'] = calculate_total_stock(row, columns)
            no_encontrados.append(item_not_found)
            continue

        precio_ok = True
        stock_ok = True
        diff_data = {
            'codigo': codigo,
            'descripcion': descripcion,
            'bd_stock': product['stock'],
            'category': product['category']
        }

        # Verificar precios si hay columnas
        if has_prices:
            excel_contado = safe_float(row.get('CONTADO'))
            excel_publico = safe_float(row.get('PUBLICO'))

            if excel_contado > 0:
                bd_price = product['price']
                bd_price_list = product['price_list']

                diff_contado = abs(excel_contado - bd_price)
                diff_publico = abs(excel_publico - bd_price_list) if bd_price_list else 0

                if diff_contado > TOLERANCIA_PRECIO or diff_publico > TOLERANCIA_PRECIO:
                    precio_ok = False
                    diff_data.update({
                        'excel_contado': excel_contado,
                        'bd_contado': bd_price,
                        'diff_contado': excel_contado - bd_price,
                        'excel_publico': excel_publico,
                        'bd_publico': bd_price_list,
                        'diff_publico': excel_publico - bd_price_list if bd_price_list else excel_publico,
                    })

        # Verificar stock si hay columnas
        if has_stock:
            excel_stock = calculate_total_stock(row, columns)
            bd_stock = product['stock']

            if abs(excel_stock - bd_stock) > TOLERANCIA_STOCK:
                stock_ok = False
                diff_data.update({
                    'excel_stock': excel_stock,
                    'bd_stock': bd_stock,
                    'diff_stock': excel_stock - bd_stock,
                })

        # Clasificar resultado
        if precio_ok and stock_ok:
            correctos.append({
                'codigo': codigo,
                'descripcion': descripcion,
                'stock': product['stock']
            })
        else:
            if not precio_ok:
                diferencias_precio.append(diff_data.copy())
            if not stock_ok:
                diferencias_stock.append(diff_data.copy())

    # Resumen
    total_comparados = len(correctos) + len(set(
        [d['codigo'] for d in diferencias_precio] + [d['codigo'] for d in diferencias_stock]
    ))
    pct_correctos = (len(correctos) / total_comparados * 100) if total_comparados > 0 else 0

    print("\n" + "=" * 80)
    source_label = "PIRELLI 🚗" if source == 'pirelli' else "CORVEN 🚜"
    if has_prices and has_stock:
        print(f"VERIFICACION {source_label} - PRECIOS Y STOCK: EXCEL vs ECOMMERCE")
    elif has_prices:
        print(f"VERIFICACION {source_label} - PRECIOS: EXCEL vs ECOMMERCE")
    else:
        print(f"VERIFICACION {source_label} - STOCK: EXCEL vs ECOMMERCE")
    print("=" * 80)
    print(f"Total productos en Excel:     {len(df)}")
    print(f"Sin codigo valido:            {sin_codigo}")
    print(f"Encontrados en BD:            {total_comparados}")
    print(f"Todo correcto:                {len(correctos)} ({pct_correctos:.1f}%)")
    if has_prices:
        print(f"Con diferencias de precio:   {len(diferencias_precio)}")
    if has_stock:
        print(f"Con diferencias de stock:    {len(diferencias_stock)}")
    print(f"No encontrados en BD:         {len(no_encontrados)}")
    print("=" * 80)

    # Mostrar diferencias de precio
    if diferencias_precio:
        print("\nPRODUCTOS CON DIFERENCIAS DE PRECIO:")
        print("-" * 80)
        diferencias_precio.sort(key=lambda x: abs(x.get('diff_contado', 0)), reverse=True)

        for item in diferencias_precio[:20]:
            stock_label = f"Stock: {item['bd_stock']}" if item['bd_stock'] > 0 else "Sin stock"
            cat_label = f"[{item.get('category', '')}]" if item.get('category') else ""
            print(f"\n[{item['codigo']}] {item['descripcion']} ({stock_label}) {cat_label}")
            print(f"  Contado: Excel ${item['excel_contado']:>12,.0f} | BD ${item['bd_contado']:>12,.0f} | Dif: ${item['diff_contado']:>+10,.0f}")
            if item.get('bd_publico'):
                print(f"  Publico: Excel ${item['excel_publico']:>12,.0f} | BD ${item['bd_publico']:>12,.0f} | Dif: ${item['diff_publico']:>+10,.0f}")

        if len(diferencias_precio) > 20:
            print(f"\n... y {len(diferencias_precio) - 20} productos mas con diferencias de precio")

    # Mostrar diferencias de stock
    if diferencias_stock:
        print("\nPRODUCTOS CON DIFERENCIAS DE STOCK:")
        print("-" * 80)
        diferencias_stock.sort(key=lambda x: abs(x.get('diff_stock', 0)), reverse=True)

        for item in diferencias_stock[:20]:
            cat_label = f"[{item.get('category', '')}]" if item.get('category') else ""
            print(f"[{item['codigo']}] {item['descripcion'][:40]} {cat_label}")
            print(f"  Stock: Excel {item['excel_stock']:>4} | BD {item['bd_stock']:>4} | Dif: {item['diff_stock']:>+4}")

        if len(diferencias_stock) > 20:
            print(f"\n... y {len(diferencias_stock) - 20} productos mas con diferencias de stock")

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

    # Resumen final
    print("\n" + "=" * 80)
    total_diferencias = len(diferencias_precio) + len(diferencias_stock)
    if total_diferencias == 0:
        if has_prices and has_stock:
            print(f"✅ TODOS LOS PRECIOS Y STOCK DE {source_label} COINCIDEN CORRECTAMENTE")
        elif has_prices:
            print(f"✅ TODOS LOS PRECIOS DE {source_label} COINCIDEN CORRECTAMENTE")
        else:
            print(f"✅ TODO EL STOCK DE {source_label} COINCIDE CORRECTAMENTE")
    else:
        if diferencias_precio:
            print(f"⚠️  HAY {len(diferencias_precio)} PRODUCTOS CON DIFERENCIAS DE PRECIO")
        if diferencias_stock:
            print(f"⚠️  HAY {len(diferencias_stock)} PRODUCTOS CON DIFERENCIAS DE STOCK")
    print("=" * 80)

    return {
        'source': source,
        'detected_source': detected_source,
        'total_excel': len(df),
        'encontrados': total_comparados,
        'correctos': len(correctos),
        'diferencias_precio': len(diferencias_precio),
        'diferencias_stock': len(diferencias_stock),
        'no_encontrados': len(no_encontrados)
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Verificar precios y/o stock entre Excel y ecommerce',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python3 scripts/verify_prices_excel.py /Downloads/stockprecionov.xlsx
  python3 scripts/verify_prices_excel.py /Downloads/corven2.xlsx --corven
  python3 scripts/verify_prices_excel.py /Downloads/lista_pirelli.xlsx --pirelli

El script detecta automaticamente:
  - Origen: Pirelli (CON, SUV, CAR, VAN, MOT) o Corven (AGR, CMO, VI, OTR)
  - Modo: Precios (CONTADO/PUBLICO), Stock (sucursales), o ambos
        """
    )

    parser.add_argument('excel_path', help='Ruta al archivo Excel')
    parser.add_argument('--pirelli', action='store_true', help='Forzar origen Pirelli')
    parser.add_argument('--corven', action='store_true', help='Forzar origen Corven')

    args = parser.parse_args()

    # Determinar source
    user_source = None
    if args.pirelli:
        user_source = 'pirelli'
    elif args.corven:
        user_source = 'corven'

    if not os.path.exists(args.excel_path):
        print(f"Error: El archivo no existe: {args.excel_path}")
        sys.exit(1)

    # Cambiar al directorio del proyecto
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_dir)

    verify_data(args.excel_path, user_source)
