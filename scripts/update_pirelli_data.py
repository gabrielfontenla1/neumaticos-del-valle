#!/usr/bin/env python3
import pandas as pd
import json
import sys
from datetime import datetime

def process_pirelli_data():
    try:
        # Read the Excel files
        print("Reading stock file...")
        stock_df = pd.read_excel('/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_31_10_25.xlsx')

        print("Reading prices file...")
        prices_df = pd.read_excel('/Users/gabrielfontenla/Downloads/PRECIOS_PIRELLI_31_10_25.xlsx')

        # Print column names to understand structure
        print("\n=== STOCK FILE COLUMNS ===")
        print(stock_df.columns.tolist())
        print(f"Total rows in stock file: {len(stock_df)}")
        print("\nFirst 5 rows of stock data:")
        print(stock_df.head())

        print("\n=== PRICES FILE COLUMNS ===")
        print(prices_df.columns.tolist())
        print(f"Total rows in prices file: {len(prices_df)}")
        print("\nFirst 5 rows of prices data:")
        print(prices_df.head())

        # Check data types
        print("\n=== STOCK DATA TYPES ===")
        print(stock_df.dtypes)

        print("\n=== PRICES DATA TYPES ===")
        print(prices_df.dtypes)

        # Check for null values
        print("\n=== NULL VALUES IN STOCK ===")
        print(stock_df.isnull().sum())

        print("\n=== NULL VALUES IN PRICES ===")
        print(prices_df.isnull().sum())

        # Save sample data for analysis
        stock_sample = stock_df.head(10).to_dict('records')
        prices_sample = prices_df.head(10).to_dict('records')

        output = {
            'stock_columns': stock_df.columns.tolist(),
            'prices_columns': prices_df.columns.tolist(),
            'stock_total_rows': len(stock_df),
            'prices_total_rows': len(prices_df),
            'stock_sample': stock_sample,
            'prices_sample': prices_sample
        }

        # Save to JSON for better analysis
        with open('/Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/pirelli_data_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False, default=str)

        print("\n=== Analysis saved to pirelli_data_analysis.json ===")

        return output

    except Exception as e:
        print(f"Error processing files: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = process_pirelli_data()
    if result:
        print("\nAnalysis completed successfully!")