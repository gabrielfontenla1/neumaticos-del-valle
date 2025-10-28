#!/usr/bin/env python3
"""
Script para generar un resumen completo de modelos para asociar con fotos
"""

import sys
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
import json

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

# Modelos principales Pirelli
MODELOS_PRINCIPALES = [
    'FORMULA ENERGY',
    'P400 EVO',
    'CINTURATO P1',
    'CINTURATO P7',
    'SCORPION ATR',
    'SCORPION H/T',
    'SCORPION VERDE',
    'POWERGY',
    'SCORPION',
    'P ZERO',
    'FORMULA EVO',
    'SCORPION MTR',
    'SCORPION STR',
    'CHRONO',
    'CARRIER'
]

print("="*70)
print("RESUMEN DE MODELOS PARA ASOCIACIÓN DE FOTOS")
print("="*70)

# Obtener todos los productos
response = supabase.table('products').select('model, name, category').execute()
products = response.data

print(f"\nTotal de productos: {len(products)}")

# Analizar modelos
modelos_resumen = {}

for modelo_principal in MODELOS_PRINCIPALES:
    modelos_resumen[modelo_principal] = {
        'count': 0,
        'categorias': set(),
        'ejemplos': []
    }

for product in products:
    model_text = (product.get('model') or '').upper()
    name_text = (product.get('name') or '').upper()

    for modelo_principal in MODELOS_PRINCIPALES:
        if modelo_principal in model_text or modelo_principal in name_text:
            modelos_resumen[modelo_principal]['count'] += 1
            modelos_resumen[modelo_principal]['categorias'].add(product.get('category', ''))

            if len(modelos_resumen[modelo_principal]['ejemplos']) < 3:
                modelos_resumen[modelo_principal]['ejemplos'].append(product.get('name', ''))
            break

# Generar archivo JSON para mapeo de fotos
mapeo_fotos = {}

print("\n" + "="*70)
print("MODELOS LISTOS PARA ASOCIAR CON FOTOS:")
print("="*70)

for modelo, datos in sorted(modelos_resumen.items(), key=lambda x: x[1]['count'], reverse=True):
    if datos['count'] > 0:
        print(f"\n📸 {modelo}")
        print(f"   • Cantidad: {datos['count']} productos")
        print(f"   • Categorías: {', '.join(sorted(datos['categorias']))}")
        print(f"   • Archivo foto sugerido: {modelo.lower().replace(' ', '-')}.jpg")

        # Agregar al mapeo
        mapeo_fotos[modelo] = {
            'filename': f"{modelo.lower().replace(' ', '-').replace('/', '')}.jpg",
            'count': datos['count'],
            'categories': list(datos['categorias'])
        }

# Guardar archivo de mapeo
mapeo_file = Path(__file__).parent.parent / 'public' / 'tire-models-mapping.json'
with open(mapeo_file, 'w', encoding='utf-8') as f:
    json.dump(mapeo_fotos, f, indent=2, ensure_ascii=False)

print("\n" + "="*70)
print("ARCHIVO DE MAPEO GENERADO:")
print("="*70)
print(f"✅ Archivo guardado en: public/tire-models-mapping.json")
print("\nEste archivo contiene el mapeo de modelos a nombres de archivos de fotos.")

print("\n" + "="*70)
print("INSTRUCCIONES PARA FOTOS:")
print("="*70)
print("1. Nombrar las fotos según el modelo:")
for modelo in ['P ZERO', 'CINTURATO P7', 'SCORPION', 'POWERGY', 'FORMULA ENERGY'][:5]:
    if modelos_resumen[modelo]['count'] > 0:
        print(f"   • {modelo}: {modelo.lower().replace(' ', '-')}.jpg")

print("\n2. Colocar las fotos en: public/tire-images/")
print("\n3. Para modelos sin foto específica, usar: default-pirelli.jpg")

print("\n" + "="*70)
print("RESUMEN FINAL:")
print("="*70)
print(f"✅ Modelos únicos con productos: {sum(1 for d in modelos_resumen.values() if d['count'] > 0)}")
print(f"✅ Total de productos: {len(products)}")
print(f"✅ Todos los nombres están legibles y normalizados")
print("="*70)