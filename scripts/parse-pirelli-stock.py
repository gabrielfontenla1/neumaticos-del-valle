#!/usr/bin/env python3
import pandas as pd
import json
import sys

# Read the Excel file
file_path = '/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_23_10_25.xlsx'

try:
    # Read the Excel file with the first row as data (not header)
    df = pd.read_excel(file_path, sheet_name='cexcel_1', header=None)

    print("Raw data shape:", df.shape)
    print("\nFirst 10 rows:")
    print(df.head(10))

    # Try to identify the header row
    print("\n" + "="*80)
    print("Looking for header row...")

    # Check first few rows to identify headers
    for i in range(min(5, len(df))):
        row = df.iloc[i]
        print(f"\nRow {i}:")
        print(row.tolist())

    # It looks like row 0 contains the headers
    # Let's read again with proper header
    df = pd.read_excel(file_path, sheet_name='cexcel_1')

    # Rename columns to something more meaningful
    print("\n" + "="*80)
    print("Column names from first row:")
    print(df.columns.tolist())

    # Now let's look at the actual data
    print("\n" + "="*80)
    print("Data starting from row 1:")
    print(df.iloc[:10])

    # Look for columns that might be branch stock
    print("\n" + "="*80)
    print("Looking for branch/stock columns...")

    # Check all unnamed columns (they might be branch stock)
    unnamed_cols = [col for col in df.columns if 'Unnamed' in str(col)]
    print(f"Found {len(unnamed_cols)} unnamed columns (possibly branches)")

    # Check unique values in each column to understand the data
    for col in df.columns[:10]:  # Check first 10 columns
        unique_count = df[col].nunique()
        print(f"\n{col}: {unique_count} unique values")
        if unique_count < 20:
            print(f"  Sample values: {df[col].dropna().unique()[:10]}")

    # Save a sample to JSON for easier inspection
    sample_data = df.head(20).to_dict('records')
    with open('sample_pirelli_data.json', 'w', encoding='utf-8') as f:
        json.dump(sample_data, f, indent=2, ensure_ascii=False, default=str)

    print("\n" + "="*80)
    print("Sample data saved to sample_pirelli_data.json")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)