#!/usr/bin/env python3
import pandas as pd
import json
import sys

# Read the Excel file
file_path = '/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_23_10_25.xlsx'

try:
    # Try to read all sheets
    excel_file = pd.ExcelFile(file_path)

    print(f"Number of sheets: {len(excel_file.sheet_names)}")
    print(f"Sheet names: {excel_file.sheet_names}")
    print("\n" + "="*80 + "\n")

    # Analyze each sheet
    for sheet_name in excel_file.sheet_names:
        print(f"Sheet: {sheet_name}")
        print("-" * 40)

        df = pd.read_excel(file_path, sheet_name=sheet_name)

        print(f"Shape: {df.shape} (rows: {df.shape[0]}, columns: {df.shape[1]})")
        print(f"Columns: {list(df.columns)}")

        # Show first few rows
        print("\nFirst 5 rows:")
        print(df.head())

        # Show data types
        print("\nData types:")
        print(df.dtypes)

        # Check for null values
        print("\nNull values per column:")
        print(df.isnull().sum())

        # If there are columns that look like branch names, show unique values
        branch_like_columns = [col for col in df.columns if 'sucursal' in col.lower() or 'branch' in col.lower() or any(keyword in col.lower() for keyword in ['stock', 'cantidad', 'qty'])]
        if branch_like_columns:
            print(f"\nPotential branch/stock columns: {branch_like_columns}")
            for col in branch_like_columns[:5]:  # Show first 5 to avoid too much output
                unique_vals = df[col].unique()
                print(f"  {col}: {len(unique_vals)} unique values")
                if len(unique_vals) <= 10:
                    print(f"    Values: {unique_vals}")

        print("\n" + "="*80 + "\n")

except Exception as e:
    print(f"Error reading Excel file: {e}")
    sys.exit(1)