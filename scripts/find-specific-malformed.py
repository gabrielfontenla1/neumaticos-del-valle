#!/usr/bin/env python3
"""
Script para buscar productos específicos con modelos mal formateados
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
print("BUSCANDO PRODUCTOS ESPECÍFICOS CON MODELOS PROBLEMÁTICOS")
print("=" * 70)

# Buscar productos específicos por modelo
problematic_models = ['/R', '0/0R0', '0/0R15', '0/0', '/0']

for model_search in problematic_models:
    # Buscar por modelo
    response = supabase.table('products').select('*').ilike('model', f'%{model_search}%').execute()

    if response.data:
        print(f"\n✓ Encontrados con modelo '{model_search}': {len(response.data)} productos")
        for product in response.data[:3]:
            print(f"  ID: {product['id']}")
            print(f"  Nombre: '{product['name']}'")
            print(f"  Modelo: '{product.get('model', '')}'")
            print(f"  Descripción: '{product.get('description', '')}'")
            print(f"  Dimensiones: {product.get('width')}/{product.get('profile')}R{product.get('diameter')}")
            print()

# Buscar productos con dimensiones problemáticas
print("\n" + "=" * 70)
print("BUSCANDO PRODUCTOS CON DIMENSIONES EN 0:")
print("=" * 70)

# Buscar productos donde width = 0 o profile = 0
response = supabase.table('products').select('*').or_('width.eq.0,profile.eq.0').execute()

if response.data:
    print(f"\n✓ Productos con dimensiones en 0: {len(response.data)}")
    for product in response.data[:5]:
        print(f"\n  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Dimensiones: {product.get('width')}/{product.get('profile')}R{product.get('diameter')}")

# Buscar productos cuyo nombre comience con número pero no tenga modelo legible
print("\n" + "=" * 70)
print("BUSCANDO PRODUCTOS CON NOMBRES INCOMPLETOS:")
print("=" * 70)

response = supabase.table('products').select('*').execute()
incomplete_products = []

for product in response.data:
    name = product.get('name', '')
    model = product.get('model', '')

    # Detectar nombres que parecen estar mal formateados
    # Como "165-380 4T TT TORNADO" sin marca de neumático clara
    if name and '/' not in name and 'R' not in name and len(model) < 5:
        incomplete_products.append(product)

print(f"\n✓ Productos con nombres posiblemente incompletos: {len(incomplete_products)}")
for product in incomplete_products[:5]:
    print(f"\n  ID: {product['id']}")
    print(f"  Nombre: '{product['name']}'")
    print(f"  Modelo: '{product.get('model', '')}'")
    print(f"  Marca: '{product.get('brand', '')}'")

# Mostrar productos como los de las imágenes
print("\n" + "=" * 70)
print("EJEMPLOS DE PRODUCTOS EN LAS IMÁGENES:")
print("=" * 70)

# Buscar el producto "165-380 4T TT TORNADO"
response = supabase.table('products').select('*').ilike('name', '%165-380%TORNADO%').execute()
if response.data:
    print("\n✓ Producto '165-380 4T TT TORNADO':")
    for product in response.data:
        print(f"  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Precio: ${product.get('price', 0):,.2f}")

# Buscar el producto "6.50-16 6T TT AR26"
response = supabase.table('products').select('*').ilike('name', '%6.50-16%AR26%').execute()
if response.data:
    print("\n✓ Producto '6.50-16 6T TT AR26':")
    for product in response.data:
        print(f"  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Precio: ${product.get('price', 0):,.2f}")

# Buscar el producto "31X10.50R15LT 109S SCORPION ATR"
response = supabase.table('products').select('*').ilike('name', '%31X10%SCORPION%').execute()
if response.data:
    print("\n✓ Producto '31X10.50R15LT 109S SCORPION ATR':")
    for product in response.data:
        print(f"  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Precio: ${product.get('price', 0):,.2f}")