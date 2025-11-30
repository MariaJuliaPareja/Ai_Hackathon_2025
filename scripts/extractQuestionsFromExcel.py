"""
Script to extract question texts from Excel files using pandas
Checks all sheets for question texts
"""

import sys
import json
import io
from pathlib import Path

# Set UTF-8 encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import pandas as pd
except ImportError:
    print("Installing pandas...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl", "--quiet"])
    import pandas as pd

def extract_questions_from_excel(excel_path, test_name):
    """Extract questions from all sheets in Excel file"""
    all_questions = {}
    
    try:
        # Read all sheets
        excel_file = pd.ExcelFile(excel_path)
        
        print(f"\n{test_name.upper()} - Sheets found: {excel_file.sheet_names}")
        
        # Check each sheet
        for sheet_idx, sheet_name in enumerate(excel_file.sheet_names):
            print(f"\n--- Checking Sheet {sheet_idx + 1}: {sheet_name} ---")
            try:
                df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
                
                print(f"Shape: {df.shape}")
                
                # Look for rows that contain question texts
                # Questions usually have '?' or '¿' and are longer than 20 characters
                for row_idx, row in df.iterrows():
                    for col_idx, cell_value in enumerate(row):
                        if pd.notna(cell_value):
                            cell_str = str(cell_value).strip()
                            # Check if it looks like a question
                            if len(cell_str) > 20 and ('?' in cell_str or '¿' in cell_str):
                                # Try to find the corresponding DIM column
                                # Check the header row (usually row 0)
                                if row_idx > 0 and len(df) > 0:
                                    header_row = df.iloc[0]
                                    if col_idx < len(header_row):
                                        header_value = str(header_row.iloc[col_idx]).strip()
                                        if header_value.startswith('DIM'):
                                            if header_value not in all_questions:
                                                all_questions[header_value] = cell_str
                                                print(f"  Found: {header_value} -> {cell_str[:60]}...")
                                
                                # Also check if the cell above or below contains a DIM header
                                if row_idx > 0:
                                    prev_row = df.iloc[row_idx - 1]
                                    if col_idx < len(prev_row):
                                        prev_value = str(prev_row.iloc[col_idx]).strip()
                                        if prev_value.startswith('DIM'):
                                            if prev_value not in all_questions:
                                                all_questions[prev_value] = cell_str
                                                print(f"  Found: {prev_value} -> {cell_str[:60]}...")
                
                # Also try a different approach: look for DIM headers in first row
                # and questions in subsequent rows
                if len(df) > 1:
                    header_row = df.iloc[0]
                    for col_idx, header_value in enumerate(header_row):
                        if pd.notna(header_value):
                            header_str = str(header_value).strip()
                            if header_str.startswith('DIM'):
                                # Look for question text in this column
                                for row_idx in range(1, min(len(df), 10)):  # Check first 10 rows
                                    cell_value = df.iloc[row_idx, col_idx]
                                    if pd.notna(cell_value):
                                        cell_str = str(cell_value).strip()
                                        if len(cell_str) > 20 and ('?' in cell_str or '¿' in cell_str):
                                            if header_str not in all_questions:
                                                all_questions[header_str] = cell_str
                                                print(f"  Found: {header_str} -> {cell_str[:60]}...")
                                                break
            except Exception as e:
                print(f"  Error reading sheet {sheet_name}: {e}")
        
    except Exception as e:
        print(f"Error reading {excel_path}: {e}")
        import traceback
        traceback.print_exc()
    
    return all_questions

def main():
    base_path = Path(__file__).parent.parent
    
    # File paths
    burden_file = base_path / "BURDEN CAREGIVER TEST.xlsx"
    empathy_file = base_path / "EMPATHY TEST.xlsx"
    big5_file = base_path / "BIG 5 SUB ESCALAS.xlsx"
    
    all_questions = {
        'burden': {},
        'empathy': {},
        'big5': {}
    }
    
    # Extract from BURDEN
    if burden_file.exists():
        print(f"\n{'='*60}")
        print(f"Processing {burden_file.name}")
        print(f"{'='*60}")
        burden_questions = extract_questions_from_excel(burden_file, 'BURDEN')
        all_questions['burden'] = burden_questions
        print(f"\nFound {len(burden_questions)} questions in BURDEN")
    
    # Extract from EMPATHY
    if empathy_file.exists():
        print(f"\n{'='*60}")
        print(f"Processing {empathy_file.name}")
        print(f"{'='*60}")
        empathy_questions = extract_questions_from_excel(empathy_file, 'EMPATHY')
        all_questions['empathy'] = empathy_questions
        print(f"\nFound {len(empathy_questions)} questions in EMPATHY")
    
    # Extract from BIG5
    if big5_file.exists():
        print(f"\n{'='*60}")
        print(f"Processing {big5_file.name}")
        print(f"{'='*60}")
        big5_questions = extract_questions_from_excel(big5_file, 'BIG5')
        all_questions['big5'] = big5_questions
        print(f"\nFound {len(big5_questions)} questions in BIG5")
    
    # Output results
    output_file = base_path / "scripts" / "extracted_questions.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Results saved to {output_file}")
    print(f"{'='*60}")
    
    # Print summary
    print("\n=== SUMMARY ===")
    for test_type, questions in all_questions.items():
        print(f"\n{test_type.upper()}: {len(questions)} questions")
        if questions:
            for q_id, q_text in list(questions.items())[:5]:
                print(f"  {q_id}: {q_text[:80]}...")

if __name__ == "__main__":
    main()
