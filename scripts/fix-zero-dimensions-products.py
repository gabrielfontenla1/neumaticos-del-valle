#!/usr/bin/env python3
"""
Script para corregir productos con dimensiones 0/0 o nombres mal formateados
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

def parse_tire_size(description):
    """Parsea las dimensiones del neumático desde la descripción"""
    if not description:
        return None, None, None

    # Patrones comunes de medidas de neumáticos
    patterns = [
        (r'(\d{3})/(\d{2})R(\d{2})', lambda m: (int(m.group(1)), int(m.group(2)), int(m.group(3)))),  # 175/65R15
        (r'(\d{3})/(\d{2})\s*R\s*(\d{2})', lambda m: (int(m.group(1)), int(m.group(2)), int(m.group(3)))),  # 175/65 R 15
        (r'(\d{3})/(\d{2})[-\s]+R(\d{2})', lambda m: (int(m.group(1)), int(m.group(2)), int(m.group(3)))),  # 175/65-R15
        (r'(\d{3})/(\d{2})[A-Z]R(\d{2})', lambda m: (int(m.group(1)), int(m.group(2)), int(m.group(3)))),  # 175/65ZR15
    ]

    for pattern, extractor in patterns:
        match = re.search(pattern, description)
        if match:
            return extractor(match)

    # Patrón para formatos como "31X10.50R15" (usando X en lugar de /)
    x_format = re.search(r'(\d{2,3})X(\d{1,2}\.?\d*)R(\d{2})', description, re.IGNORECASE)
    if x_format:
        # Aproximación de conversión
        width = int(int(x_format.group(1)) * 25.4)  # Convertir de pulgadas a mm
        profile = int(float(x_format.group(2)) * 3.5)  # Aproximación
        diameter = int(x_format.group(3))
        return width, profile, diameter

    # Patrón para formatos como "6.00-16" o "6.50-16"
    dash_format = re.search(r'(\d+)\.(\d+)-(\d{2})', description)
    if dash_format:
        # Para estos formatos, no podemos determinar width/profile estándar
        diameter = int(dash_format.group(3))
        return None, None, diameter

    # Patrones alternativos (ej: "5.20S12")
    alt_format = re.search(r'(\d+)\.(\d+)[A-Z]*(\d+)', description)
    if alt_format:
        diameter = int(alt_format.group(3))
        return None, None, diameter

    return None, None, None

def clean_description(desc):
    """Limpia la descripción eliminando códigos extraños"""
    if not desc:
        return ''

    cleaned = str(desc)

    # Eliminar códigos entre paréntesis
    cleaned = re.sub(r'\s*\([^)]*\)[x]?\s*', ' ', cleaned)

    # Eliminar códigos extraños
    cleaned = re.sub(r'-@\s*[A-Z]{2}\s*', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bEUFO-@\s*[A-Z]{2}\s*', 'EUFO', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\(\*', ' ', cleaned)
    cleaned = re.sub(r'\bas\+\d+\s*', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bS-AS\+\d+\s*', ' ', cleaned, flags=re.IGNORECASE)

    # Eliminar códigos al final
    cleaned = re.sub(r'\s+wl\s*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+as\s*$', '', cleaned, flags=re.IGNORECASE)

    # Limpiar espacios
    cleaned = ' '.join(cleaned.split())

    return cleaned.strip()

print("=" * 70)
print("CORRECTOR DE PRODUCTOS CON DIMENSIONES 0/0")
print("=" * 70)

# Buscar productos con dimensiones en 0
response = supabase.table('products').select('*').or_('width.eq.0,profile.eq.0').execute()
products_to_fix = response.data

print(f"\n✓ Productos con dimensiones en 0: {len(products_to_fix)}")

if products_to_fix:
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

        print(f"\nProcesando: {original_name}")

        # Limpiar la descripción y modelo
        cleaned_desc = clean_description(original_description)
        cleaned_model = clean_description(original_model)

        # Intentar parsear las dimensiones del nombre o modelo
        width, profile, diameter = parse_tire_size(original_name)
        if not width and not profile and not diameter:
            width, profile, diameter = parse_tire_size(original_model)
        if not width and not profile and not diameter:
            width, profile, diameter = parse_tire_size(original_description)

        # Si no se pueden obtener dimensiones válidas, mantener el nombre limpio
        if width and profile and diameter and width > 0 and profile > 0 and diameter > 0:
            new_name = f"{width}/{profile}R{diameter} {cleaned_model}"
            print(f"  ✓ Nuevo nombre con dimensiones: {new_name}")
        else:
            # Usar el modelo limpio como nombre
            new_name = cleaned_model if cleaned_model and len(cleaned_model) > 3 else original_name
            # Si el nombre tiene formato extraño como "/R" o "0/0R", usar el modelo
            if '0/0' in new_name or new_name.startswith('/R') or len(new_name) < 5:
                new_name = cleaned_model or cleaned_desc or original_name.split()[-1] if ' ' in original_name else original_name
            print(f"  ✓ Nuevo nombre sin dimensiones: {new_name}")

        # Actualizar el producto
        updates = {
            'name': new_name[:200],
            'model': cleaned_model[:100] if cleaned_model else original_model,
            'description': cleaned_desc if cleaned_desc else original_description
        }

        # Si se encontraron dimensiones válidas, actualizarlas
        if width and width > 0:
            updates['width'] = width
        if profile and profile > 0:
            updates['profile'] = profile
        if diameter and diameter > 0:
            updates['diameter'] = diameter

        try:
            response = supabase.table('products').update(updates).eq('id', id).execute()
            exitosos += 1
            print(f"  ✓ Actualizado exitosamente")
        except Exception as e:
            errores.append(f"{id}: {str(e)}")
            print(f"  ✗ Error: {str(e)}")

    print(f"\n" + "=" * 70)
    print("RESUMEN:")
    print("=" * 70)
    print(f"✓ {exitosos} productos actualizados correctamente")

    if errores:
        print(f"✗ {len(errores)} errores encontrados")
        for error in errores[:5]:
            print(f"  • {error}")
else:
    print("\n✅ No hay productos con dimensiones en 0 para corregir")

# Verificar si quedan productos problemáticos
print("\n" + "=" * 70)
print("VERIFICACIÓN FINAL:")
print("=" * 70)

response = supabase.table('products').select('*').or_('width.eq.0,profile.eq.0').execute()
remaining = response.data

if remaining:
    print(f"\n⚠️ Aún quedan {len(remaining)} productos con dimensiones en 0")
    for p in remaining[:3]:
        print(f"  • {p['name']} - {p['model']}")
else:
    print("\n✅ Todos los productos tienen dimensiones correctas o nombres válidos")