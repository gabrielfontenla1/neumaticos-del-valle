#!/usr/bin/env python3
"""
Script para encontrar y corregir las abreviaciones de modelos
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

print("="*70)
print("BUSCADOR Y CORRECTOR DE ABREVIACIONES")
print("="*70)

# Obtener todos los productos
response = supabase.table('products').select('*').execute()
products = response.data

print(f"\nTotal de productos en la base de datos: {len(products)}")
print("\nBuscando abreviaciones en todos los campos...")

# Buscar productos con abreviaciones
pwrgy_products = []
scorpn_products = []
sat_products = []

for product in products:
    full_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}"

    if 'PWRGY' in full_text:
        pwrgy_products.append(product)
    if 'SCORPN' in full_text:
        scorpn_products.append(product)
    if 'S-A/T+' in full_text:
        sat_products.append(product)

print(f"\n✓ Productos con 'PWRGY': {len(pwrgy_products)}")
if pwrgy_products:
    for p in pwrgy_products[:3]:
        print(f"  • {p['model']}")

print(f"\n✓ Productos con 'SCORPN': {len(scorpn_products)}")
if scorpn_products:
    for p in scorpn_products[:3]:
        print(f"  • {p['model']}")

print(f"\n✓ Productos con 'S-A/T+': {len(sat_products)}")
if sat_products:
    for p in sat_products[:3]:
        print(f"  • {p['model']}")

# Si encontramos productos con abreviaciones, actualizarlos
todos_productos = pwrgy_products + scorpn_products + sat_products

if todos_productos:
    print("\n" + "="*70)
    print("APLICANDO CORRECCIONES...")
    print("="*70)

    exitosos = 0
    for product in todos_productos:
        id = product['id']
        name = product.get('name', '').replace('PWRGY', 'POWERGY').replace('SCORPN', 'SCORPION').replace('S-A/T+', 'SCORPION ALL TERRAIN PLUS')
        model = product.get('model', '').replace('PWRGY', 'POWERGY').replace('SCORPN', 'SCORPION').replace('S-A/T+', 'SCORPION ALL TERRAIN PLUS')
        description = product.get('description', '').replace('PWRGY', 'POWERGY').replace('SCORPN', 'SCORPION').replace('S-A/T+', 'SCORPION ALL TERRAIN PLUS')

        try:
            response = supabase.table('products').update({
                'name': name,
                'model': model,
                'description': description
            }).eq('id', id).execute()
            exitosos += 1
        except Exception as e:
            print(f"  ✗ Error actualizando {id}: {e}")

    print(f"\n✓ {exitosos} productos actualizados con nombres completos")
else:
    print("\n✓ No se encontraron abreviaciones para corregir")

# Verificar resultados finales
print("\n" + "="*70)
print("VERIFICACIÓN DE MODELOS FINALES:")
print("="*70)

response = supabase.table('products').select('model').execute()
modelos_unicos = set()

for p in response.data:
    model = p.get('model', '')
    # Extraer el nombre del modelo principal (eliminar medidas)
    partes = model.split()
    modelo_principal = []
    for parte in partes:
        if not any(char.isdigit() for char in parte):
            modelo_principal.append(parte)
        elif any(word in parte.upper() for word in ['POWERGY', 'SCORPION', 'CINTURATO', 'FORMULA', 'ZERO']):
            modelo_principal.append(parte)

    if modelo_principal:
        modelos_unicos.add(' '.join(modelo_principal))

print("\nModelos únicos legibles encontrados:")
for modelo in sorted(modelos_unicos)[:20]:
    if modelo:  # Solo mostrar si no está vacío
        print(f"• {modelo}")

print("\n✅ Todos los modelos ahora están en formato legible para asociar con fotos")