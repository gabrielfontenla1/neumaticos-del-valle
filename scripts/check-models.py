#!/usr/bin/env python3
"""
Script para verificar qué modelos específicos están en la base de datos
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

# Initialize Supabase client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set")
    sys.exit(1)

supabase: Client = create_client(url, key)

# Modelos a buscar
modelos_buscar = [
    'FORMULA ENERGY',
    'P400 EVO',
    'CINTURATO P1',
    'CINTURATO P7',
    'SCORPION ATR',
    'SCORPION H/T',
    'SCORPION VERDE',
    'POWERGY',
    'SCORPION',  # genérico
    'P ZERO',
    'FORMULA EVO'
]

print("="*70)
print("VERIFICACIÓN DE MODELOS EN LA BASE DE DATOS")
print("="*70)

# Obtener todos los productos
response = supabase.table('products').select('name, model, description, price').execute()
products = response.data

print(f"\nTotal de productos en la base de datos: {len(products)}")

# Diccionario para contar modelos encontrados
modelos_encontrados = {modelo: [] for modelo in modelos_buscar}
otros_modelos = []

# Buscar cada modelo
for product in products:
    description = (product.get('description') or '').upper()
    model = (product.get('model') or '').upper()
    name = (product.get('name') or '').upper()

    # Combinar todos los campos para búsqueda
    full_text = f"{name} {model} {description}"

    modelo_encontrado = False
    for modelo in modelos_buscar:
        if modelo in full_text:
            modelos_encontrados[modelo].append({
                'name': product['name'],
                'price': product['price']
            })
            modelo_encontrado = True
            break

    # Si no coincide con ningún modelo específico, agregarlo a otros
    if not modelo_encontrado and product.get('model'):
        # Extraer el modelo principal del texto
        model_text = product.get('model', '')
        if model_text and model_text not in [p['model'] for p in otros_modelos]:
            otros_modelos.append({
                'model': model_text,
                'count': 1
            })
        elif model_text:
            # Incrementar contador si ya existe
            for om in otros_modelos:
                if om['model'] == model_text:
                    om['count'] += 1
                    break

print("\n" + "="*70)
print("MODELOS BUSCADOS Y ENCONTRADOS:")
print("="*70)

total_encontrados = 0
for modelo, productos in modelos_encontrados.items():
    if productos:
        print(f"\n✅ {modelo}: {len(productos)} productos")
        # Mostrar algunos ejemplos
        for i, p in enumerate(productos[:3]):
            print(f"   - {p['name'][:60]}... ${p['price']:,.0f}")
        if len(productos) > 3:
            print(f"   ... y {len(productos) - 3} más")
        total_encontrados += len(productos)
    else:
        print(f"\n❌ {modelo}: NO ENCONTRADO")

print("\n" + "="*70)
print("OTROS MODELOS ENCONTRADOS EN LA BASE:")
print("="*70)

# Ordenar otros modelos por cantidad
otros_modelos_sorted = sorted(otros_modelos, key=lambda x: x['count'], reverse=True)

# Mostrar los primeros 20 otros modelos
for om in otros_modelos_sorted[:20]:
    if om['count'] > 1:
        print(f"• {om['model'][:50]} ({om['count']} productos)")

if len(otros_modelos_sorted) > 20:
    print(f"\n... y {len(otros_modelos_sorted) - 20} modelos más")

print("\n" + "="*70)
print("RESUMEN:")
print("="*70)
print(f"Total de productos: {len(products)}")
print(f"Productos con modelos buscados: {total_encontrados}")
print(f"Productos con otros modelos: {len(products) - total_encontrados}")
print("="*70)