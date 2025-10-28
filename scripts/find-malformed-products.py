#!/usr/bin/env python3
"""
Script para encontrar productos con nombres mal formateados
como /R, 0/0R0, 0/0R15, etc.
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

print("=" * 70)
print("BUSCANDO PRODUCTOS CON NOMBRES MAL FORMATEADOS")
print("=" * 70)

# Obtener todos los productos
response = supabase.table('products').select('*').execute()
products = response.data

print(f"\nTotal de productos: {len(products)}")

# Buscar productos con nombres problemáticos
problematic_products = []
patterns_found = {}

for product in products:
    name = product.get('name', '')
    model = product.get('model', '')

    # Detectar patrones problemáticos
    problematic = False
    pattern = None

    # Casos problemáticos comunes
    if name == '/R' or name.startswith('/R '):
        problematic = True
        pattern = '/R'
    elif name.startswith('0/0R'):
        problematic = True
        pattern = '0/0R'
    elif '0/0' in name:
        problematic = True
        pattern = '0/0'
    elif name.startswith('/') and len(name) < 10:
        problematic = True
        pattern = 'starts_with_slash'
    elif not any(char.isalpha() for char in name):
        problematic = True
        pattern = 'no_letters'

    if problematic:
        problematic_products.append(product)
        if pattern not in patterns_found:
            patterns_found[pattern] = 0
        patterns_found[pattern] += 1

print(f"\n⚠️ Productos con nombres problemáticos: {len(problematic_products)}")

if patterns_found:
    print("\nPatrones encontrados:")
    for pattern, count in patterns_found.items():
        print(f"  • {pattern}: {count} productos")

if problematic_products:
    print(f"\nPrimeros 10 productos problemáticos:")
    for i, product in enumerate(problematic_products[:10], 1):
        print(f"\n{i}. ID: {product['id']}")
        print(f"   Nombre: '{product['name']}'")
        print(f"   Modelo: '{product.get('model', '')}'")
        print(f"   Descripción: '{product.get('description', '')}'")
        print(f"   Dimensiones: {product.get('width')}/{product.get('profile')}R{product.get('diameter')}")
        print(f"   Precio: ${product.get('price', 0):,.2f}")

        # Ver el contenido original si está en features
        features = product.get('features', {})
        if features:
            print(f"   Código propio: {features.get('codigo_propio', 'N/A')}")
            print(f"   Código proveedor: {features.get('codigo_proveedor', 'N/A')}")

# Analizar la causa del problema
print("\n" + "=" * 70)
print("ANÁLISIS DEL PROBLEMA:")
print("=" * 70)

# Buscar productos sin dimensiones válidas
no_dimensions = []
partial_dimensions = []

for product in problematic_products:
    width = product.get('width')
    profile = product.get('profile')
    diameter = product.get('diameter')

    if width == 0 or profile == 0 or diameter == 0:
        partial_dimensions.append(product)
    elif not width and not profile and not diameter:
        no_dimensions.append(product)

if no_dimensions:
    print(f"\n• Productos sin dimensiones: {len(no_dimensions)}")

if partial_dimensions:
    print(f"• Productos con dimensiones en 0: {len(partial_dimensions)}")
    for p in partial_dimensions[:3]:
        print(f"  - {p['name']}: {p.get('width')}/{p.get('profile')}R{p.get('diameter')}")

print("\n" + "=" * 70)
print("RECOMENDACIONES:")
print("=" * 70)
print("\n1. Estos productos tienen nombres mal formateados porque:")
print("   - No se pudieron extraer las dimensiones correctamente")
print("   - El modelo original estaba vacío o mal formateado")
print("   - La lógica de normalización creó un nombre inválido")
print("\n2. Necesitan ser corregidos:")
print(f"   - Total de productos afectados: {len(problematic_products)}")
print("   - Se debe revisar la fuente original de estos datos")
print("   - La función de normalización debe validar antes de crear el nombre")