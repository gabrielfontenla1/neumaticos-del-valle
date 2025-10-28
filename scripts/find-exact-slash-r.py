#!/usr/bin/env python3
"""
Script para encontrar productos donde el modelo contiene exactamente /R
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
print("BUSCANDO PRODUCTOS CON /R EN EL MODELO")
print("=" * 70)

# Buscar productos donde el modelo contenga /R
response = supabase.table('products').select('*').execute()
products = response.data

slash_r_products = []

for product in products:
    model = product.get('model', '')

    # Buscar si el modelo es exactamente /R o contiene /R sin números válidos
    if model == '/R' or (model and model.startswith('/R') and not model[2:3].isdigit()):
        slash_r_products.append(product)

print(f"\n✓ Productos donde el modelo es /R o similar: {len(slash_r_products)}")

if slash_r_products:
    for product in slash_r_products:
        print(f"\n  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Descripción: '{product.get('description', '')}'")
        print(f"  Precio: ${product.get('price', 0):,.2f}")

# Buscar productos con dimensiones extrañas
print("\n" + "=" * 70)
print("PRODUCTOS CON DIMENSIONES EXTRAÑAS:")
print("=" * 70)

strange_dimensions = []

for product in products:
    width = product.get('width')
    profile = product.get('profile')
    diameter = product.get('diameter')
    name = product.get('name', '')

    # Casos extraños
    if width == 0 and profile == 0 and diameter in [0, 5]:
        strange_dimensions.append(product)

print(f"\n✓ Productos con dimensiones extrañas (0/0R0 o 0/0R5): {len(strange_dimensions)}")

if strange_dimensions:
    for product in strange_dimensions[:10]:
        print(f"\n  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Dimensiones: {product.get('width')}/{product.get('profile')}R{product.get('diameter')}")

# Buscar productos sin modelo pero con nombre
print("\n" + "=" * 70)
print("PRODUCTOS SIN MODELO PERO CON NOMBRE:")
print("=" * 70)

no_model = []
for product in products:
    model = product.get('model', '').strip()
    name = product.get('name', '').strip()

    if (not model or model == name) and name:
        no_model.append(product)

print(f"\n✓ Productos sin modelo o modelo igual al nombre: {len(no_model)}")

if no_model:
    for product in no_model[:5]:
        print(f"\n  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")

# Buscar productos donde el modelo podría ser simplemente /
print("\n" + "=" * 70)
print("BUSCANDO PRODUCTOS CON CARACTERES ESPECIALES SOLOS:")
print("=" * 70)

special_chars = []
for product in products:
    model = product.get('model', '').strip()

    # Buscar modelos con solo caracteres especiales
    if model and len(model) <= 3 and any(c in model for c in ['/', 'R', '-', '.']):
        special_chars.append(product)

print(f"\n✓ Productos con modelos de caracteres especiales: {len(special_chars)}")

if special_chars:
    for product in special_chars[:10]:
        print(f"\n  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Dimensiones: {product.get('width')}/{product.get('profile')}R{product.get('diameter')}")

print("\n" + "=" * 70)
print("RESUMEN:")
print("=" * 70)
print(f"Total de productos analizados: {len(products)}")
print(f"Productos con modelo /R: {len(slash_r_products)}")
print(f"Productos con dimensiones extrañas: {len(strange_dimensions)}")
print(f"Productos sin modelo diferenciado: {len(no_model)}")
print(f"Productos con caracteres especiales: {len(special_chars)}")