#!/usr/bin/env python3
"""
Script para encontrar y corregir productos que muestran /R o nombres mal formateados
"""

import sys
import os
import re
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
print("BUSCANDO PRODUCTOS CON /R O NOMBRES MAL FORMATEADOS")
print("=" * 70)

# Obtener todos los productos
response = supabase.table('products').select('*').execute()
products = response.data

print(f"\nTotal de productos: {len(products)}")

# Buscar productos problemáticos
problematic = []

for product in products:
    name = product.get('name', '')
    model = product.get('model', '')
    description = product.get('description', '')
    width = product.get('width')
    profile = product.get('profile')
    diameter = product.get('diameter')

    # Casos problemáticos
    is_problematic = False
    issue = None

    # Caso 1: Nombre es exactamente /R o empieza con /R
    if name == '/R' or name.startswith('/R '):
        is_problematic = True
        issue = 'Nombre es /R'

    # Caso 2: Nombre empieza con 0/0R
    elif name.startswith('0/0R'):
        is_problematic = True
        issue = 'Nombre empieza con 0/0R'

    # Caso 3: Nombre contiene solo dimensiones sin modelo
    elif re.match(r'^(\d+)/(\d+)R(\d+)$', name):
        is_problematic = True
        issue = 'Solo dimensiones sin modelo'

    # Caso 4: Dimensiones son 0 pero el nombre intenta mostrar formato estándar
    elif (width == 0 or profile == 0) and '/' in name and 'R' in name:
        is_problematic = True
        issue = 'Dimensiones en 0 con formato estándar'

    # Caso 5: Nombre muy corto (menos de 5 caracteres) sin ser abreviación válida
    elif len(name) < 5 and not name in ['AUTO', 'SUV', 'MOTO']:
        is_problematic = True
        issue = 'Nombre muy corto'

    if is_problematic:
        problematic.append({
            'product': product,
            'issue': issue
        })

print(f"\n⚠️ Productos problemáticos encontrados: {len(problematic)}")

if problematic:
    print("\nPrimeros 10 productos problemáticos:")
    for i, item in enumerate(problematic[:10], 1):
        product = item['product']
        issue = item['issue']
        print(f"\n{i}. {issue}")
        print(f"   ID: {product['id']}")
        print(f"   Nombre: '{product['name']}'")
        print(f"   Modelo: '{product.get('model', '')}'")
        print(f"   Descripción: '{product.get('description', '')}'")
        print(f"   Dimensiones: {product.get('width')}/{product.get('profile')}R{product.get('diameter')}")
        print(f"   Precio: ${product.get('price', 0):,.2f}")

    print("\n" + "=" * 70)
    print("ANÁLISIS DE PROBLEMAS:")
    print("=" * 70)

    # Agrupar por tipo de problema
    issues_count = {}
    for item in problematic:
        issue = item['issue']
        if issue not in issues_count:
            issues_count[issue] = 0
        issues_count[issue] += 1

    print("\nProblemas por categoría:")
    for issue, count in issues_count.items():
        print(f"  • {issue}: {count} productos")

# Buscar específicamente productos con modelo vacío o muy corto
print("\n" + "=" * 70)
print("PRODUCTOS CON MODELO VACÍO O MUY CORTO:")
print("=" * 70)

empty_model = []
for product in products:
    model = product.get('model', '')
    if not model or len(model) < 3:
        empty_model.append(product)

print(f"\n✓ Productos con modelo vacío o muy corto: {len(empty_model)}")
if empty_model:
    for product in empty_model[:5]:
        print(f"\n  ID: {product['id']}")
        print(f"  Nombre: '{product['name']}'")
        print(f"  Modelo: '{product.get('model', '')}'")
        print(f"  Descripción: '{product.get('description', '')}'")

print("\n" + "=" * 70)
print("RECOMENDACIONES:")
print("=" * 70)
print("\n1. Los productos con /R necesitan:")
print("   - Revisar el modelo original")
print("   - Reconstruir el nombre usando el modelo")
print("   - Actualizar en la base de datos")
print("\n2. Los productos con dimensiones 0/0 necesitan:")
print("   - Usar el modelo como nombre")
print("   - No intentar generar formato estándar")
print("\n3. Los productos sin modelo necesitan:")
print("   - Usar la descripción como fallback")
print("   - Limpiar y normalizar el nombre")