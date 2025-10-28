#!/usr/bin/env python3
"""
Script para analizar la estructura del archivo stock1.xlsx
"""

import pandas as pd
import sys
import os

file_path = '/Users/gabrielfontenla/Downloads/stock1.xlsx'

# Check if file exists
if not os.path.exists(file_path):
    print(f"Error: File not found: {file_path}")
    sys.exit(1)

print("="*80)
print("ANÁLISIS DEL ARCHIVO STOCK1.XLSX")
print("="*80)

# Read the Excel file
df = pd.read_excel(file_path)

print(f"\nArchivo: {file_path}")
print(f"Total de filas: {len(df)}")
print(f"Total de columnas: {len(df.columns)}")

print("\n" + "="*80)
print("COLUMNAS ENCONTRADAS:")
print("="*80)

for i, col in enumerate(df.columns, 1):
    print(f"{i:3}. {col}")

print("\n" + "="*80)
print("PRIMERAS 5 FILAS DE DATOS:")
print("="*80)

# Show first 5 rows
for idx in range(min(5, len(df))):
    row = df.iloc[idx]
    print(f"\n--- Fila {idx + 1} ---")
    for col in df.columns:
        value = row[col]
        if pd.notna(value):
            # Truncate long values
            value_str = str(value)
            if len(value_str) > 50:
                value_str = value_str[:47] + "..."
            print(f"  {col}: {value_str}")

# Check for price-related columns
print("\n" + "="*80)
print("ANÁLISIS DE COLUMNAS DE PRECIO:")
print("="*80)

price_keywords = ['PRECIO', 'PRICE', 'VALOR', 'IMPORTE', 'COSTO', 'PVP', 'MONTO', 'LISTA', 'OFERTA', 'DESCUENTO']
found_price_cols = []

for col in df.columns:
    col_upper = str(col).upper()
    for keyword in price_keywords:
        if keyword in col_upper:
            found_price_cols.append(col)
            break

if found_price_cols:
    print(f"✓ Columnas de precio encontradas: {found_price_cols}")
    for col in found_price_cols:
        # Show sample values
        sample = df[col].dropna().head(5)
        print(f"\n  Valores en '{col}':")
        for val in sample:
            print(f"    {val}")
else:
    print("✗ No se encontraron columnas de precio obvias")

# Check for description columns
print("\n" + "="*80)
print("ANÁLISIS DE COLUMNAS DE DESCRIPCIÓN:")
print("="*80)

desc_keywords = ['DESCRIPCION', 'DESCRIPTION', 'PRODUCTO', 'PRODUCT', 'NOMBRE', 'NAME', 'ARTICULO']
found_desc_cols = []

for col in df.columns:
    col_upper = str(col).upper()
    for keyword in desc_keywords:
        if keyword in col_upper:
            found_desc_cols.append(col)
            break

if found_desc_cols:
    print(f"✓ Columnas de descripción encontradas: {found_desc_cols}")
    for col in found_desc_cols:
        # Show sample values
        sample = df[col].dropna().head(3)
        print(f"\n  Valores en '{col}':")
        for val in sample:
            val_str = str(val)
            if len(val_str) > 60:
                val_str = val_str[:57] + "..."
            print(f"    {val_str}")

print("\n" + "="*80)