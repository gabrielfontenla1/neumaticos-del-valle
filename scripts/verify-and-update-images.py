#!/usr/bin/env python3
"""
Script para verificar y actualizar las imágenes de productos Pirelli
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
print("VERIFICANDO Y ACTUALIZANDO IMÁGENES DE PRODUCTOS PIRELLI")
print("=" * 80)

# Mapeo de modelos a imágenes
image_mappings = {
    'CINTURATO P1': '/Cinturato-P1-Verde-1505470090255.webp',
    'CINTURATO P7': '/cinturato-p7-4505517104514.webp',
    'SCORPION HT': '/Scorpion-HT-4505525112686.webp',
    'SCORPION VERDE ALL SEASON': '/Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp',
    'SCORPION VERDE': '/Scorpion-Verde-1505470074533.webp',
    'SCORPION ZERO ALL SEASON': '/Scorpion-Zero-All-Season-1505470086399.webp',
    'SCORPION ZERO ASIMMETRICO': '/Scorpion-Zero-Asimmetrico-1505470076172.webp',
    'SCORPION ZERO': '/Scorpion-Zero-1505470088294.webp',
    'SCORPION ATR': '/Scorpion-Atr-1505470067539.webp',
    'SCORPION MTR': '/Scorpion-MTR-1505470071047.webp',
    'SCORPION ALL TERRAIN PLUS': '/Scorpion-All-Terrain-Plus-4505483375619.webp',
    'SCORPION': '/Scorpion-4505525112390.webp',
    'P ZERO CORSA SYSTEM': '/Pzero-Corsa-System-Direzionale-1505470088408.webp',
    'P ZERO CORSA': '/Pzero-Corsa-PZC4-1505470090635.webp',
    'P ZERO': '/Pzero-Nuovo-1505470072726.webp',
    'P400 EVO': '/P400Evo_review_3-4.webp',
    'P400EVO': '/P400Evo_review_3-4.webp',
    'P 400 EVO': '/P400Evo_review_3-4.webp',
    'CHRONO': '/Chrono-1505470062195.webp'
}

# Primero, obtener todos los productos Pirelli
response = supabase.table('products').select('*').eq('brand', 'PIRELLI').execute()
products = response.data

print(f"\n✓ Found {len(products)} Pirelli products in database")

# Verificar cuántos tienen mock-tire.png
mock_count = sum(1 for p in products if p.get('image_url') == '/mock-tire.png')
print(f"✓ Products with mock image: {mock_count}")

# Track updates
updates_made = 0
no_match = 0

print("\n" + "=" * 80)
print("UPDATING PRODUCTS")
print("=" * 80)

for product in products:
    product_id = product['id']
    product_name = product.get('name', '')
    product_model = product.get('model', '')
    product_description = product.get('description', '')
    current_image = product.get('image_url', '/mock-tire.png')

    # Si ya tiene una imagen específica (no mock), skip
    if current_image != '/mock-tire.png' and current_image != '':
        continue

    # Crear texto de búsqueda
    search_text = f"{product_name} {product_model} {product_description}".upper()

    # Buscar imagen correspondiente
    matched_image = None
    matched_model = None

    # Primero buscar coincidencias exactas
    for model_key, image_file in image_mappings.items():
        if model_key.upper() in search_text:
            matched_image = image_file
            matched_model = model_key
            break

    # Si no hay coincidencia exacta, buscar variaciones
    if not matched_image:
        for model_key, image_file in image_mappings.items():
            # Crear variaciones del modelo
            variations = [
                model_key.upper(),
                model_key.upper().replace(' ', '-'),
                model_key.upper().replace(' ', ''),
                model_key.upper().replace('P ZERO', 'PZERO'),
                model_key.upper().replace('P ZERO', 'P-ZERO')
            ]

            for variation in variations:
                if variation in search_text:
                    matched_image = image_file
                    matched_model = model_key
                    break

            if matched_image:
                break

    # Casos especiales
    if not matched_image:
        # Si tiene "SCORPION" pero no coincidió con ningún modelo específico
        if 'SCORPION' in search_text:
            # Revisar modelos más específicos primero
            if 'VERDE' in search_text and 'ALL' in search_text and 'SEASON' in search_text:
                matched_image = '/Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp'
                matched_model = 'SCORPION VERDE ALL SEASON'
            elif 'VERDE' in search_text:
                matched_image = '/Scorpion-Verde-1505470074533.webp'
                matched_model = 'SCORPION VERDE'
            elif 'ZERO' in search_text and 'ALL' in search_text and 'SEASON' in search_text:
                matched_image = '/Scorpion-Zero-All-Season-1505470086399.webp'
                matched_model = 'SCORPION ZERO ALL SEASON'
            elif 'ZERO' in search_text and 'ASIMMETRICO' in search_text:
                matched_image = '/Scorpion-Zero-Asimmetrico-1505470076172.webp'
                matched_model = 'SCORPION ZERO ASIMMETRICO'
            elif 'ZERO' in search_text:
                matched_image = '/Scorpion-Zero-1505470088294.webp'
                matched_model = 'SCORPION ZERO'
            elif 'ATR' in search_text:
                matched_image = '/Scorpion-Atr-1505470067539.webp'
                matched_model = 'SCORPION ATR'
            elif 'MTR' in search_text:
                matched_image = '/Scorpion-MTR-1505470071047.webp'
                matched_model = 'SCORPION MTR'
            elif 'ALL' in search_text and 'TERRAIN' in search_text:
                matched_image = '/Scorpion-All-Terrain-Plus-4505483375619.webp'
                matched_model = 'SCORPION ALL TERRAIN PLUS'
            else:
                matched_image = '/Scorpion-4505525112390.webp'
                matched_model = 'SCORPION'

    if matched_image:
        # Actualizar el producto
        update_data = {
            'image_url': matched_image
        }

        try:
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            updates_made += 1
            print(f"✅ Updated: {product_name[:60]} → {matched_image}")
        except Exception as e:
            print(f"❌ Error updating product {product_id}: {e}")
    else:
        no_match += 1
        print(f"⚠️  No match for: {product_name[:60]}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Products updated: {updates_made}")
print(f"⚠️  Products without match: {no_match}")
print(f"📊 Total Pirelli products: {len(products)}")

# Verificar el estado final
response = supabase.table('products').select('image_url').eq('brand', 'PIRELLI').execute()
final_products = response.data
mock_count_final = sum(1 for p in final_products if p.get('image_url') == '/mock-tire.png')
print(f"\n✓ Final products with mock image: {mock_count_final}")
print(f"✓ Final products with specific image: {len(final_products) - mock_count_final}")