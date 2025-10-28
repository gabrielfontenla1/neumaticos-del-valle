#!/usr/bin/env python3
"""
Script para corregir específicamente los modelos abreviados
"""

import sys
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import re

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

print("="*70)
print("CORRECTOR DE MODELOS ABREVIADOS")
print("="*70)

# Obtener todos los productos
response = supabase.table('products').select('*').execute()
products = response.data

print(f"\nTotal de productos en la base de datos: {len(products)}")

# Mapeo específico de abreviaciones
CORRECCIONES = {
    'PWRGY': 'POWERGY',
    'SCORPN': 'SCORPION',
    'S-A/T+': 'SCORPION ALL TERRAIN PLUS'
}

productos_a_actualizar = []

for product in products:
    id = product['id']
    name_original = product.get('name', '')
    model_original = product.get('model', '')
    description_original = product.get('description', '')

    # Buscar abreviaciones en el modelo y descripción
    cambio_necesario = False
    model_nuevo = model_original
    description_nuevo = description_original

    for abrev, completo in CORRECCIONES.items():
        # Buscar la abreviación como palabra completa o parte del texto
        if re.search(r'\b' + re.escape(abrev) + r'\b', model_original):
            model_nuevo = re.sub(r'\b' + re.escape(abrev) + r'\b', completo, model_original)
            cambio_necesario = True

        if re.search(r'\b' + re.escape(abrev) + r'\b', description_original):
            description_nuevo = re.sub(r'\b' + re.escape(abrev) + r'\b', completo, description_original)
            cambio_necesario = True

    # Si encontramos cambios, actualizar también el nombre
    if cambio_necesario:
        # Reconstruir el nombre con el modelo corregido
        if product.get('width') and product.get('profile') and product.get('diameter'):
            nombre_base = f"{product['width']}/{product['profile']}R{product['diameter']}"
            name_nuevo = f"{nombre_base} {model_nuevo}"
        else:
            name_nuevo = model_nuevo

        productos_a_actualizar.append({
            'id': id,
            'name': name_nuevo,
            'model': model_nuevo,
            'description': description_nuevo,
            'original_model': model_original
        })

print(f"\nProductos con modelos abreviados encontrados: {len(productos_a_actualizar)}")

if productos_a_actualizar:
    print("\n" + "="*70)
    print("CAMBIOS A REALIZAR:")
    print("="*70)

    # Agrupar por tipo de cambio
    pwrgy_count = sum(1 for p in productos_a_actualizar if 'PWRGY' in p['original_model'])
    scorpn_count = sum(1 for p in productos_a_actualizar if 'SCORPN' in p['original_model'])
    sat_count = sum(1 for p in productos_a_actualizar if 'S-A/T+' in p['original_model'])

    if pwrgy_count > 0:
        print(f"\n✓ PWRGY → POWERGY: {pwrgy_count} productos")
        for p in [p for p in productos_a_actualizar if 'PWRGY' in p['original_model']][:2]:
            print(f"  • {p['original_model']} → {p['model']}")

    if scorpn_count > 0:
        print(f"\n✓ SCORPN → SCORPION: {scorpn_count} productos")
        for p in [p for p in productos_a_actualizar if 'SCORPN' in p['original_model']][:2]:
            print(f"  • {p['original_model']} → {p['model']}")

    if sat_count > 0:
        print(f"\n✓ S-A/T+ → SCORPION ALL TERRAIN PLUS: {sat_count} productos")
        for p in [p for p in productos_a_actualizar if 'S-A/T+' in p['original_model']][:2]:
            print(f"  • {p['original_model']} → {p['model']}")

    print("\n" + "="*70)
    print("Aplicando correcciones...")

    exitosos = 0
    fallidos = 0

    for prod in productos_a_actualizar:
        try:
            response = supabase.table('products').update({
                'name': prod['name'],
                'model': prod['model'],
                'description': prod['description']
            }).eq('id', prod['id']).execute()

            exitosos += 1

        except Exception as e:
            print(f"  ✗ Error actualizando producto {prod['id']}: {e}")
            fallidos += 1

    print("\n" + "="*70)
    print("RESUMEN:")
    print("="*70)
    print(f"✓ Productos corregidos exitosamente: {exitosos}")
    if fallidos > 0:
        print(f"✗ Productos con error: {fallidos}")

    print("\nModelos ahora legibles para asociar con fotos:")
    print("• POWERGY (antes PWRGY)")
    print("• SCORPION (antes SCORPN)")
    print("• SCORPION ALL TERRAIN PLUS (antes S-A/T+)")
    print("="*70)
else:
    print("\n✓ No se encontraron modelos abreviados para corregir")
    print("Todos los modelos ya están en formato completo y legible")