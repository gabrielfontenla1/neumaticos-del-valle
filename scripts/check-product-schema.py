#!/usr/bin/env python3
"""
Check the actual schema of the products table
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

# Get one product to see its structure
response = supabase.table('products').select('*').limit(1).execute()

if response.data:
    product = response.data[0]
    print("Product table columns:")
    for key in product.keys():
        value = product[key]
        value_type = type(value).__name__
        value_preview = str(value)[:50] if value else "None"
        print(f"  - {key}: {value_type} = {value_preview}")
else:
    print("No products found in database")