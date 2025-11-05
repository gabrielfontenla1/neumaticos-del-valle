#!/usr/bin/env python3
import pandas as pd
import json

def analyze_excel_structure():
    try:
        # Read Excel files without assuming header row
        print("Reading stock file...")
        stock_df = pd.read_excel('/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_31_10_25.xlsx', header=None)

        print("\n=== STOCK FILE STRUCTURE ===")
        print(f"Total rows: {len(stock_df)}")
        print(f"Total columns: {len(stock_df.columns)}")

        # Print first 3 rows to understand structure
        print("\nFirst 3 rows of stock file:")
        for i in range(min(3, len(stock_df))):
            print(f"\nRow {i}:")
            for j in range(min(10, len(stock_df.columns))):  # First 10 columns
                value = stock_df.iloc[i, j]
                if pd.notna(value):
                    print(f"  Col {j}: {value}")

        print("\n" + "="*50)

        # Read prices file
        print("\nReading prices file...")
        prices_df = pd.read_excel('/Users/gabrielfontenla/Downloads/PRECIOS_PIRELLI_31_10_25.xlsx', header=None)

        print("\n=== PRICES FILE STRUCTURE ===")
        print(f"Total rows: {len(prices_df)}")
        print(f"Total columns: {len(prices_df.columns)}")

        # Print first 3 rows to understand structure
        print("\nFirst 3 rows of prices file:")
        for i in range(min(3, len(prices_df))):
            print(f"\nRow {i}:")
            for j in range(min(10, len(prices_df.columns))):  # First 10 columns
                value = prices_df.iloc[i, j]
                if pd.notna(value):
                    print(f"  Col {j}: {value}")

        # Check prices in specific columns
        print("\n=== PRICE VALUES CHECK ===")
        print("Checking rows 1-5 for price columns (18-50):")
        for i in range(1, min(6, len(prices_df))):
            print(f"\nRow {i}:")
            print(f"  Codigo Propio (Col 0): {prices_df.iloc[i, 0]}")
            print(f"  Descripcion (Col 3): {prices_df.iloc[i, 3]}")
            for j in range(18, min(51, len(prices_df.columns))):
                value = prices_df.iloc[i, j]
                if pd.notna(value) and str(value).replace('.', '').replace('-', '').isdigit():
                    print(f"  Col {j}: {value}")

        # Save full analysis to JSON
        analysis = {
            'stock': {
                'rows': len(stock_df),
                'columns': len(stock_df.columns),
                'header_row': stock_df.iloc[0].tolist() if len(stock_df) > 0 else [],
                'sample_data_row_1': stock_df.iloc[1].tolist() if len(stock_df) > 1 else [],
                'sample_data_row_2': stock_df.iloc[2].tolist() if len(stock_df) > 2 else []
            },
            'prices': {
                'rows': len(prices_df),
                'columns': len(prices_df.columns),
                'header_row': prices_df.iloc[0].tolist() if len(prices_df) > 0 else [],
                'sample_data_row_1': prices_df.iloc[1].tolist() if len(prices_df) > 1 else [],
                'sample_data_row_2': prices_df.iloc[2].tolist() if len(prices_df) > 2 else []
            }
        }

        with open('/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/excel_structure_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False, default=str)

        print("\n✅ Full analysis saved to excel_structure_analysis.json")

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_excel_structure()