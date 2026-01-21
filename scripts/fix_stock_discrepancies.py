#!/usr/bin/env python3
"""
Script para corregir las 3 discrepancias de stock detectadas
Actualiza los productos a stock = 0 según Excel
"""

from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno no configuradas")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fix_stock_discrepancies():
    """Actualiza los 3 productos con discrepancias a stock = 0"""

    # SKUs a actualizar
    products_to_fix = [
        {'sku': '[1587]', 'name': '235/55R18 100V P-ZERO(VOL)', 'current_stock': 2},
        {'sku': '[387]', 'name': '195/55R16 87H P7cint', 'current_stock': 1},
        {'sku': '[41232]', 'name': '175/65R14 82T CINTURATO P1', 'current_stock': 8}
    ]

    print("=" * 100)
    print("CORRECCIÓN DE DISCREPANCIAS DE STOCK")
    print("=" * 100)
    print(f"\nFecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Productos a actualizar: {len(products_to_fix)}")
    print(f"Acción: Actualizar stock a 0 y limpiar stock_por_sucursal")
    print("\n" + "-" * 100)

    updated = 0
    errors = 0

    for product in products_to_fix:
        sku = product['sku']
        name = product['name']
        current_stock = product['current_stock']

        print(f"\n🔄 Procesando: {sku}")
        print(f"   Nombre: {name}")
        print(f"   Stock actual: {current_stock} → Nuevo: 0")

        try:
            # Primero obtener el producto para conservar otros features
            response = supabase.table('products').select('id, features').eq('sku', sku).single().execute()

            if not response.data:
                print(f"   ❌ Producto no encontrado en BD")
                errors += 1
                continue

            product_id = response.data['id']
            current_features = response.data.get('features') or {}

            # Actualizar stock_por_sucursal a vacío
            current_features['stock_por_sucursal'] = {}

            # Actualizar el producto
            update_response = supabase.table('products').update({
                'stock': 0,
                'features': current_features,
                'updated_at': datetime.now().isoformat()
            }).eq('id', product_id).execute()

            if update_response.data:
                print(f"   ✅ Actualizado correctamente")
                updated += 1
            else:
                print(f"   ❌ Error en actualización")
                errors += 1

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            errors += 1

    # Resumen
    print("\n" + "=" * 100)
    print("RESUMEN DE CORRECCIÓN")
    print("=" * 100)
    print(f"{'✅ Productos actualizados:':<30} {updated}")
    print(f"{'❌ Errores:':<30} {errors}")
    print(f"{'📊 Total procesados:':<30} {len(products_to_fix)}")

    if updated == len(products_to_fix):
        print("\n🎉 ¡Corrección completada exitosamente!")
        print("   Todos los productos sincronizados con Excel")
    elif updated > 0:
        print(f"\n⚠️  Corrección parcial: {updated}/{len(products_to_fix)} productos actualizados")
    else:
        print("\n❌ No se pudo actualizar ningún producto")

    print("=" * 100)

    # Verificación post-actualización
    print("\n🔍 Verificación post-actualización:")
    print("-" * 100)

    for product in products_to_fix:
        try:
            response = supabase.table('products').select('sku, stock, features').eq('sku', product['sku']).single().execute()

            if response.data:
                stock = response.data.get('stock', 0)
                stock_por_sucursal = response.data.get('features', {}).get('stock_por_sucursal', {})

                status = "✅" if stock == 0 and stock_por_sucursal == {} else "❌"
                print(f"{status} {product['sku']:<10} Stock: {stock}, Sucursales: {stock_por_sucursal}")
        except Exception as e:
            print(f"❌ {product['sku']:<10} Error en verificación: {str(e)}")

    print("=" * 100 + "\n")

if __name__ == '__main__':
    print("\n⚠️  ADVERTENCIA:")
    print("   Este script actualizará 3 productos a stock = 0")
    print("   SKUs: [1587], [387], [41232]")
    print("   Esta acción es irreversible sin backup\n")

    confirmation = input("¿Desea continuar? (si/no): ").strip().lower()

    if confirmation in ['si', 'sí', 's', 'y', 'yes']:
        fix_stock_discrepancies()
    else:
        print("\n❌ Operación cancelada por el usuario")
