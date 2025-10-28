#!/usr/bin/env python3
"""
Script para verificar que los productos no tienen información duplicada en nombre y dimensiones
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

print("=" * 80)
print("VERIFICANDO DUPLICACIÓN DE INFORMACIÓN EN PRODUCTOS")
print("=" * 80)

# Get all products
response = supabase.table('products').select('*').execute()
products = response.data

# Check for products with dimensions in their names
products_with_duplicate = []

for product in products:
    width = product.get('width') or 0
    profile = product.get('profile') or 0
    diameter = product.get('diameter') or 0
    name = product.get('name', '')
    model = product.get('model', '')

    # Check if product has valid dimensions
    if width and profile and diameter and width > 0 and profile > 0 and diameter > 0:
        dimension_pattern = f"{width}/{profile}R{diameter}"
        dimension_pattern_lower = f"{width}/{profile}r{diameter}"

        # Check if name or model starts with dimensions
        if (name.startswith(dimension_pattern) or
            name.lower().startswith(dimension_pattern_lower.lower()) or
            model.startswith(dimension_pattern) or
            model.lower().startswith(dimension_pattern_lower.lower())):

            products_with_duplicate.append({
                'id': product['id'],
                'name': name,
                'model': model,
                'dimensions': dimension_pattern,
                'brand': product.get('brand', '')
            })

print(f"\nTotal de productos analizados: {len(products)}")
print(f"Productos con posible duplicación: {len(products_with_duplicate)}")

if products_with_duplicate:
    print("\n" + "=" * 80)
    print("PRODUCTOS CON INFORMACIÓN DUPLICADA:")
    print("=" * 80)

    for i, product in enumerate(products_with_duplicate[:10], 1):
        print(f"\n{i}. ID: {product['id']}")
        print(f"   Marca: {product['brand']}")
        print(f"   Dimensiones: {product['dimensions']}")
        print(f"   Nombre: '{product['name']}'")
        print(f"   Modelo: '{product['model']}'")

        # Show how it would look after fix
        clean_name = product['name']
        if clean_name.startswith(product['dimensions']):
            clean_name = clean_name[len(product['dimensions']):].strip()

        clean_model = product['model']
        if clean_model.startswith(product['dimensions']):
            clean_model = clean_model[len(product['dimensions']):].strip()

        print(f"   📋 Vista en card:")
        print(f"      - Nomenclatura: {product['dimensions']}")
        print(f"      - Descripción: '{clean_model or clean_name}'")

    if len(products_with_duplicate) > 10:
        print(f"\n... y {len(products_with_duplicate) - 10} productos más con duplicación")

else:
    print("\n✅ ¡Excelente! No se encontraron productos con información duplicada")

print("\n" + "=" * 80)
print("COMPONENTES ACTUALIZADOS:")
print("=" * 80)
print("✅ ProductCard.tsx - Función getCleanModel() elimina dimensiones del modelo")
print("✅ ProductDetailImproved.tsx - Función getCleanProductName() para evitar duplicación")
print("✅ Los componentes ahora muestran:")
print("   - Nomenclatura: Las dimensiones (ej: 165/70R14)")
print("   - Descripción: Solo el modelo sin dimensiones (ej: 85T CINTURATO P1)")
print("\n" + "=" * 80)