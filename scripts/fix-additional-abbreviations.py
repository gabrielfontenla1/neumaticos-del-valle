#!/usr/bin/env python3
"""
Script para corregir abreviaciones adicionales encontradas en los productos:
- P1cint → CINTURATO P1
- P7cint → CINTURATO P7
- P7-CNT → CINTURATO P7
- Eliminar códigos como -@ XX, (*, as+2
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

def clean_description(desc):
    """Limpia la descripción eliminando códigos extraños"""
    if not desc:
        return ''

    cleaned = str(desc)

    # Eliminar códigos entre paréntesis como (NBx), (K1), (* etc.
    cleaned = re.sub(r'\s*\([^)]*\)[x]?\s*', ' ', cleaned)

    # Eliminar códigos extraños como -@ XX, (* , as+2, etc.
    cleaned = re.sub(r'-@\s*[A-Z]{2}\s*', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\(\*', ' ', cleaned)
    cleaned = re.sub(r'\bas\+\d+\s*', ' ', cleaned, flags=re.IGNORECASE)

    # También eliminar códigos sueltos como wl al final
    cleaned = re.sub(r'\s+wl\s*$', '', cleaned, flags=re.IGNORECASE)

    # Eliminar múltiples espacios
    cleaned = ' '.join(cleaned.split())

    return cleaned.strip()

def normalize_model_name(model):
    """Normaliza el nombre del modelo expandiendo abreviaciones"""
    if not model:
        return ''

    normalized = str(model)

    # Primero, manejar casos especiales de Cinturato
    normalized = re.sub(r'\bP1\s*cint\b', 'CINTURATO P1', normalized, flags=re.IGNORECASE)
    normalized = re.sub(r'\bP7\s*cint\b', 'CINTURATO P7', normalized, flags=re.IGNORECASE)
    normalized = re.sub(r'\bP7-CNT\b', 'CINTURATO P7', normalized, flags=re.IGNORECASE)
    normalized = re.sub(r'\bcint\s*P1\b', 'CINTURATO P1', normalized, flags=re.IGNORECASE)
    normalized = re.sub(r'\bcint\s*P7\b', 'CINTURATO P7', normalized, flags=re.IGNORECASE)

    # Mapeo de abreviaciones a nombres completos
    abbreviations = {
        'PWRGY': 'POWERGY',
        'SCORPN': 'SCORPION',
        'S-A/T+': 'SCORPION ALL TERRAIN PLUS',
        'CINT ': 'CINTURATO ',
        'CINTUR ': 'CINTURATO ',
        'PZERO': 'P ZERO',
        'P-ZERO': 'P ZERO',
        'P0': 'P ZERO',
        'FORM ': 'FORMULA ',
    }

    # Expandir abreviaciones
    for abbrev, full in abbreviations.items():
        pattern = r'\b' + re.escape(abbrev) + r'\b'
        normalized = re.sub(pattern, full, normalized, flags=re.IGNORECASE)

    # Eliminar indicadores técnicos (no son parte del modelo)
    technical_indicators = [
        r'\s*R-F\s*',    # Run-flat
        r'\s*s-i\s*',    # Seal inside
        r'\s*XL\s*',     # Extra load
        r'\s*wl\s*',     # White lettering
        r'\s*M\+S\s*',   # Mud + Snow
        r'\s*as\s*$',    # All season (al final)
    ]

    for indicator in technical_indicators:
        normalized = re.sub(indicator, ' ', normalized, flags=re.IGNORECASE)

    # Limpiar espacios múltiples
    normalized = ' '.join(normalized.split())

    return normalized.strip()

print("=" * 70)
print("CORRECTOR DE ABREVIACIONES ADICIONALES")
print("=" * 70)

# Obtener todos los productos
response = supabase.table('products').select('*').execute()
products = response.data

print(f"\nTotal de productos en la base de datos: {len(products)}")
print("\nBuscando productos con abreviaciones adicionales...")

# Buscar productos que necesitan corrección
products_to_fix = []

for product in products:
    full_text = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}"

    # Buscar patrones que necesitan corrección
    needs_fix = False

    if any(pattern in full_text.upper() for pattern in ['P1CINT', 'P7CINT', 'P7-CNT', 'CINTP', '-@', '(*', 'AS+']):
        needs_fix = True

    if needs_fix:
        products_to_fix.append(product)

print(f"\n✓ Productos que necesitan corrección: {len(products_to_fix)}")

if products_to_fix:
    # Mostrar algunos ejemplos
    print("\nEjemplos de productos a corregir:")
    for p in products_to_fix[:5]:
        print(f"  • {p['model']} - {p['name']}")

    print("\n" + "=" * 70)
    print("APLICANDO CORRECCIONES...")
    print("=" * 70)

    exitosos = 0
    errores = []

    for product in products_to_fix:
        id = product['id']
        original_name = product.get('name', '')
        original_model = product.get('model', '')
        original_description = product.get('description', '')

        # Aplicar normalizaciones
        cleaned_desc = clean_description(original_description)
        normalized_model = normalize_model_name(original_model)

        # Si el modelo cambió, actualizar también el nombre
        updated_name = original_name
        if normalized_model != original_model and original_model in original_name:
            updated_name = original_name.replace(original_model, normalized_model)

        # Limpiar el nombre también
        updated_name = clean_description(updated_name)

        try:
            # Solo actualizar si algo cambió
            if updated_name != original_name or normalized_model != original_model or cleaned_desc != original_description:
                response = supabase.table('products').update({
                    'name': updated_name[:200],
                    'model': normalized_model[:100],
                    'description': cleaned_desc
                }).eq('id', id).execute()
                exitosos += 1

                if exitosos <= 3:
                    print(f"  ✓ Actualizado: {original_model} → {normalized_model}")
        except Exception as e:
            errores.append(f"{id}: {str(e)}")

    print(f"\n✓ {exitosos} productos actualizados correctamente")

    if errores:
        print(f"\n✗ {len(errores)} errores encontrados:")
        for error in errores[:5]:
            print(f"  • {error}")
else:
    print("\n✓ No se encontraron productos con las abreviaciones mencionadas")

# Verificar resultados
print("\n" + "=" * 70)
print("VERIFICACIÓN FINAL:")
print("=" * 70)

# Buscar productos que aún podrían tener problemas
response = supabase.table('products').select('model, name').execute()
productos_verificar = []

for p in response.data:
    model = p.get('model', '').upper()
    name = p.get('name', '').upper()
    full = f"{model} {name}"

    # Verificar si quedan abreviaciones sin corregir
    if any(pattern in full for pattern in ['P1CINT', 'P7CINT', 'P7-CNT', '-@', '(*', 'AS+']):
        productos_verificar.append(p)

if productos_verificar:
    print(f"\n⚠️ Aún quedan {len(productos_verificar)} productos con posibles abreviaciones:")
    for p in productos_verificar[:5]:
        print(f"  • {p['model']}")
else:
    print("\n✅ Todos los productos tienen modelos normalizados correctamente")

print("\n" + "=" * 70)
print("RESUMEN DE MODELOS PRINCIPALES:")
print("=" * 70)

# Mostrar los modelos principales más comunes
response = supabase.table('products').select('model').execute()
modelos_principales = {}

for p in response.data:
    model = p.get('model', '').upper()
    # Extraer el modelo principal (sin medidas)
    partes = model.split()
    modelo_limpio = []
    for parte in partes:
        if not any(char.isdigit() for char in parte):
            modelo_limpio.append(parte)

    if modelo_limpio:
        modelo_key = ' '.join(modelo_limpio)
        if modelo_key not in modelos_principales:
            modelos_principales[modelo_key] = 0
        modelos_principales[modelo_key] += 1

# Mostrar top 15
print("\nModelos más comunes (normalizados):")
for modelo, count in sorted(modelos_principales.items(), key=lambda x: x[1], reverse=True)[:15]:
    if modelo and count > 1:
        print(f"  • {modelo}: {count} productos")

print("\n✅ Script de corrección completado")