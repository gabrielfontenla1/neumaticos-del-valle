#!/usr/bin/env python3
"""
Script para agregar la columna price_list a la tabla de productos
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

print("="*60)
print("AGREGANDO COLUMNA PRICE_LIST A LA TABLA DE PRODUCTOS")
print("="*60)

# SQL para agregar la columna
sql = """
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_list DECIMAL(12,2);
"""

try:
    # Ejecutar el SQL usando el cliente de administración
    print("\nEjecutando SQL para agregar columna price_list...")

    # NOTA: Supabase Python client no soporta DDL directamente
    # Necesitamos usar el dashboard de Supabase o la API SQL

    print("\n⚠️ IMPORTANTE:")
    print("La biblioteca de Python de Supabase no soporta comandos DDL (ALTER TABLE).")
    print("\nPor favor, ejecuta el siguiente comando SQL en el dashboard de Supabase:")
    print("\n" + "="*60)
    print(sql)
    print("="*60)
    print("\nPasos:")
    print("1. Ve a https://supabase.com/dashboard")
    print("2. Selecciona tu proyecto")
    print("3. Ve a SQL Editor")
    print("4. Pega y ejecuta el comando SQL anterior")
    print("5. Una vez ejecutado, vuelve a ejecutar el script de importación")

    # Alternativamente, podemos usar el precio de lista en la columna features por ahora
    print("\n" + "="*60)
    print("ALTERNATIVA: Usar la columna 'features' para almacenar price_list")
    print("="*60)

    print("\nModificando el script de importación para usar 'features' en lugar de 'price_list'...")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)