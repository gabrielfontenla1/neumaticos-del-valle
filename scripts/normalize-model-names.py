#!/usr/bin/env python3
"""
Script para normalizar los nombres de modelos en la base de datos
Convierte abreviaciones a nombres completos para mejor legibilidad
"""

import sys
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / '.env.local'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'

load_dotenv(env_path)

# Initialize Supabase client with service role key
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not service_key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    sys.exit(1)

supabase: Client = create_client(url, service_key)

# Mapeo de abreviaciones a nombres completos
NORMALIZACIONES = {
    # Powergy
    'PWRGY': 'POWERGY',

    # Scorpion
    'SCORPN': 'SCORPION',
    'SCORP ': 'SCORPION ',

    # Cinturato
    'CINT ': 'CINTURATO ',
    'CINTUR ': 'CINTURATO ',

    # P Zero
    'PZERO': 'P ZERO',
    'P-ZERO': 'P ZERO',
    'P0': 'P ZERO',

    # Otros modelos comunes
    'FORM ': 'FORMULA ',
    'S-A/T+': 'SCORPION ALL TERRAIN PLUS',
    's-i ': '',  # Eliminar s-i (run-flat indicator)
    'R-F ': '',  # Eliminar R-F (run-flat)
    'XL ': '',   # Eliminar XL (extra load) de los modelos

    # Palabras clave para mejorar
    ' as ': ' ALL SEASON ',
    ' wl': '',   # White lettering
    ' M+S': '',  # Mud + Snow
}

print("="*70)
print("NORMALIZADOR DE NOMBRES DE MODELOS")
print("="*70)

# Obtener todos los productos
response = supabase.table('products').select('*').execute()
products = response.data

print(f"\nTotal de productos en la base de datos: {len(products)}")

# Contador de cambios
cambios_totales = 0
productos_actualizados = []

for product in products:
    id = product['id']
    name_original = product.get('name', '')
    model_original = product.get('model', '')
    description_original = product.get('description', '')

    # Trabajar con copias para modificar
    name_nuevo = name_original
    model_nuevo = model_original
    description_nuevo = description_original

    cambio_realizado = False

    # Aplicar normalizaciones al modelo y descripción
    for abrev, completo in NORMALIZACIONES.items():
        if abrev in model_nuevo:
            model_nuevo = model_nuevo.replace(abrev, completo)
            cambio_realizado = True

        if abrev in description_nuevo:
            description_nuevo = description_nuevo.replace(abrev, completo)
            cambio_realizado = True

    # Limpiar espacios múltiples
    model_nuevo = ' '.join(model_nuevo.split())
    description_nuevo = ' '.join(description_nuevo.split())

    # Actualizar el nombre del producto si es necesario
    # El nombre debe ser: ancho/perfil/Rin + modelo completo
    if product.get('width') and product.get('profile') and product.get('diameter'):
        nombre_base = f"{product['width']}/{product['profile']}R{product['diameter']}"

        # Reconstruir el nombre con el modelo limpio
        if model_nuevo:
            name_nuevo = f"{nombre_base} {model_nuevo}"
        else:
            name_nuevo = f"{nombre_base} {description_nuevo}"

        name_nuevo = ' '.join(name_nuevo.split())  # Limpiar espacios múltiples

        if name_nuevo != name_original:
            cambio_realizado = True

    if cambio_realizado:
        productos_actualizados.append({
            'id': id,
            'name': name_nuevo,
            'model': model_nuevo,
            'description': description_nuevo,
            'original_name': name_original,
            'original_model': model_original
        })
        cambios_totales += 1

print(f"\nProductos que necesitan actualización: {cambios_totales}")

if productos_actualizados:
    print("\n" + "="*70)
    print("EJEMPLOS DE CAMBIOS A REALIZAR:")
    print("="*70)

    for i, prod in enumerate(productos_actualizados[:10]):
        print(f"\n{i+1}. ID: {prod['id']}")
        print(f"   Modelo original: {prod['original_model']}")
        print(f"   Modelo nuevo:    {prod['model']}")
        print(f"   Nombre original: {prod['original_name'][:60]}...")
        print(f"   Nombre nuevo:    {prod['name'][:60]}...")

    if len(productos_actualizados) > 10:
        print(f"\n... y {len(productos_actualizados) - 10} cambios más")

    print("\n" + "="*70)
    print("¿Desea aplicar estos cambios? (s/n)")
    print("Auto-confirmando: SI")

    # Aplicar los cambios
    print("\nAplicando cambios...")

    exitosos = 0
    fallidos = 0

    for prod in productos_actualizados:
        try:
            response = supabase.table('products').update({
                'name': prod['name'],
                'model': prod['model'],
                'description': prod['description']
            }).eq('id', prod['id']).execute()

            exitosos += 1

            if exitosos % 50 == 0:
                print(f"  ✓ {exitosos} productos actualizados...")

        except Exception as e:
            print(f"  ✗ Error actualizando producto {prod['id']}: {e}")
            fallidos += 1

    print("\n" + "="*70)
    print("RESUMEN DE ACTUALIZACIÓN:")
    print("="*70)
    print(f"✓ Productos actualizados exitosamente: {exitosos}")
    if fallidos > 0:
        print(f"✗ Productos con error: {fallidos}")
    print(f"Total procesados: {exitosos + fallidos}")
    print("="*70)
else:
    print("\n✓ No se encontraron productos que necesiten normalización")
    print("Todos los nombres ya están en formato legible")