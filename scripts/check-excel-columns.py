#!/usr/bin/env python3
"""
Script para verificar qué columnas tiene el archivo Excel de Pirelli
"""

import pandas as pd
import sys
import os

file_path = '/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_23_10_25.xlsx'

# Check if file exists
if not os.path.exists(file_path):
    print(f"Error: File not found: {file_path}")
    sys.exit(1)

print("="*60)
print("ANÁLISIS DEL ARCHIVO EXCEL")
print("="*60)

# Read the Excel file with headers from row 1
df = pd.read_excel(file_path, sheet_name='cexcel_1', header=1)

print(f"\nArchivo: {file_path}")
print(f"Total de filas: {len(df)}")
print(f"Total de columnas: {len(df.columns)}")

print("\n" + "="*60)
print("COLUMNAS ENCONTRADAS:")
print("="*60)

for i, col in enumerate(df.columns, 1):
    print(f"{i:3}. {col}")

print("\n" + "="*60)
print("PRIMERAS 3 FILAS DE DATOS:")
print("="*60)

# Show first 3 rows
for idx in range(min(3, len(df))):
    row = df.iloc[idx]
    print(f"\nFila {idx + 1}:")
    for col in df.columns:
        value = row[col]
        if pd.notna(value):
            print(f"  {col}: {value}")

# Check for price-related columns
print("\n" + "="*60)
print("BÚSQUEDA DE COLUMNAS DE PRECIO:")
print("="*60)

price_keywords = ['PRECIO', 'PRICE', 'VALOR', 'IMPORTE', 'COSTO', 'PVP', 'MONTO']
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
        print(f"\n  Muestra de valores en '{col}':")
        for val in sample:
            print(f"    {val}")
else:
    print("✗ No se encontraron columnas de precio")
    print("  Las columnas disponibles NO incluyen información de precios")

print("\n" + "="*60)