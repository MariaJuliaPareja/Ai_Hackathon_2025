"""
Read Excel sheets and show their content
"""

import sys
import io
from pathlib import Path

# Set UTF-8 encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import pandas as pd
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl", "--quiet"])
    import pandas as pd

def read_sheet(excel_path, sheet_name):
    """Read and display sheet content"""
    print(f"\n{'='*80}")
    print(f"Sheet: {sheet_name}")
    print(f"{'='*80}")
    
    df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    print(f"Shape: {df.shape}\n")
    
    # Show all rows
    for idx, row in df.iterrows():
        print(f"Row {idx}:")
        for col_idx, val in enumerate(row):
            if pd.notna(val):
                val_str = str(val).strip()
                if len(val_str) > 0:
                    print(f"  Col {col_idx}: {val_str[:100]}")
        print()

def main():
    base_path = Path(__file__).parent.parent
    
    # BURDEN - Check Hoja2 and Hoja3
    burden_file = base_path / "BURDEN CAREGIVER TEST.xlsx"
    if burden_file.exists():
        print("\n" + "="*80)
        print("BURDEN CAREGIVER TEST.xlsx")
        print("="*80)
        read_sheet(burden_file, 'Hoja2')
        read_sheet(burden_file, 'Hoja3')
    
    # EMPATHY - Check Hoja2 and Hoja3
    empathy_file = base_path / "EMPATHY TEST.xlsx"
    if empathy_file.exists():
        print("\n" + "="*80)
        print("EMPATHY TEST.xlsx")
        print("="*80)
        read_sheet(empathy_file, 'Hoja2')
        read_sheet(empathy_file, 'Hoja3')
    
    # BIG5 - Check Hoja2
    big5_file = base_path / "BIG 5 SUB ESCALAS.xlsx"
    if big5_file.exists():
        print("\n" + "="*80)
        print("BIG 5 SUB ESCALAS.xlsx")
        print("="*80)
        read_sheet(big5_file, 'Hoja2')

if __name__ == "__main__":
    main()

