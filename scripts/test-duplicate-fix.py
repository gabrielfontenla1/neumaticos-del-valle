#!/usr/bin/env python3
"""
Script para verificar que el fix de duplicación funciona correctamente
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
print("SIMULACIÓN DE LA FUNCIÓN getCleanModel() EN EL FRONTEND")
print("=" * 80)

# Obtener algunos productos con dimensiones válidas
response = supabase.table('products').select('*').limit(10).execute()
products = response.data

def simulate_get_clean_model(product):
    """Simula la función getCleanModel del frontend"""
    width = product.get('width', 0) or 0
    profile = product.get('profile', 0) or 0
    diameter = product.get('diameter', 0) or 0

    if width > 0 and profile > 0 and diameter > 0:
        dimension_pattern = f"{width}/{profile}R{diameter}"
        dimension_pattern_lower = f"{width}/{profile}r{diameter}"

        # Get the text to display
        display_text = product.get('model') or product.get('name') or product.get('description') or ''

        # Remove the dimension pattern from the beginning
        if display_text.startswith(dimension_pattern):
            display_text = display_text[len(dimension_pattern):].strip()
        elif display_text.lower().startswith(dimension_pattern_lower.lower()):
            display_text = display_text[len(dimension_pattern_lower):].strip()

        # If after removing dimensions we have empty or very short text
        if not display_text or len(display_text) < 3:
            display_text = product.get('description') or product.get('name') or ''
            # Try removing pattern again from fallback
            if display_text.startswith(dimension_pattern):
                display_text = display_text[len(dimension_pattern):].strip()

        return display_text

    # If no valid dimensions, return the full model/name
    return product.get('model') or product.get('description') or product.get('name')

print("\nProbando con productos reales:\n")

for i, product in enumerate(products[:5], 1):
    width = product.get('width', 0) or 0
    profile = product.get('profile', 0) or 0
    diameter = product.get('diameter', 0) or 0

    if width > 0 and profile > 0 and diameter > 0:
        print(f"{i}. Producto ID: {product['id']}")
        print(f"   Marca: {product.get('brand', '')}")
        print(f"   Dimensiones: {width}/{profile}R{diameter}")
        print(f"   Nombre original: '{product.get('name', '')}'")
        print(f"   Modelo original: '{product.get('model', '')}'")

        clean_text = simulate_get_clean_model(product)
        print(f"   ✅ Texto limpio para mostrar: '{clean_text}'")

        print(f"\n   📋 Así se vería en la card:")
        print(f"      Marca: {product.get('brand', '')}")
        print(f"      Nomenclatura: {width}/{profile}R{diameter}")
        print(f"      Descripción: {clean_text}")
        print("-" * 80)

# Probar con el producto específico 165/70R14
print("\n" + "=" * 80)
print("BUSCANDO PRODUCTO ESPECÍFICO 165/70R14:")
print("=" * 80)

response = supabase.table('products').select('*').eq('width', 165).eq('profile', 70).eq('diameter', 14).limit(1).execute()
if response.data:
    product = response.data[0]
    print(f"\n✓ Producto encontrado:")
    print(f"  ID: {product['id']}")
    print(f"  Nombre: '{product.get('name', '')}'")
    print(f"  Modelo: '{product.get('model', '')}'")

    clean_text = simulate_get_clean_model(product)
    print(f"\n📋 Vista en la card:")
    print(f"  Marca: {product.get('brand', '')}")
    print(f"  Nomenclatura: 165/70R14")
    print(f"  Descripción: '{clean_text}'")

    if '165/70R14' in clean_text:
        print("\n⚠️ ADVERTENCIA: La descripción todavía contiene las dimensiones duplicadas")
    else:
        print("\n✅ CORRECTO: La descripción no contiene las dimensiones duplicadas")