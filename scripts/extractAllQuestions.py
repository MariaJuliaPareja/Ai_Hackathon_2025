"""
Extract all questions from Excel files
"""

import sys
import json
import io
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import pandas as pd
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "openpyxl", "--quiet"])
    import pandas as pd

def extract_burden_questions(excel_path):
    """Extract questions from BURDEN Excel - Hoja3"""
    questions = {}
    try:
        df = pd.read_excel(excel_path, sheet_name='Hoja3', header=None)
        # Questions are in column 3 (index 3), DIM IDs in column 1 (index 1)
        for idx, row in df.iterrows():
            if idx == 0:  # Skip header
                continue
            if len(row) > 3:
                dim_id = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else None
                question_text = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else None
                if dim_id and dim_id.startswith('DIM') and question_text and len(question_text) > 10:
                    questions[dim_id] = question_text
    except Exception as e:
        print(f"Error: {e}")
    return questions

def extract_empathy_questions(excel_path):
    """Extract questions from EMPATHY Excel"""
    questions = {}
    try:
        # Try Hoja3 first
        df = pd.read_excel(excel_path, sheet_name='Hoja3', header=None)
        # Questions might be in different columns
        for idx, row in df.iterrows():
            if idx == 0:
                continue
            # Look for DIM IDs and questions
            for col_idx in range(len(row)):
                cell = row.iloc[col_idx]
                if pd.notna(cell):
                    cell_str = str(cell).strip()
                    if cell_str.startswith('DIM'):
                        # Check next column for question
                        if col_idx + 1 < len(row):
                            question = str(row.iloc[col_idx + 1]).strip() if pd.notna(row.iloc[col_idx + 1]) else None
                            if question and len(question) > 10:
                                questions[cell_str] = question
    except Exception as e:
        print(f"Error: {e}")
    return questions

def extract_big5_questions(excel_path):
    """Extract questions from BIG5 Excel - Hoja2"""
    questions = {}
    try:
        df = pd.read_excel(excel_path, sheet_name='Hoja2', header=None)
        # DIM IDs are in column 3 (index 3), questions in column 5 (index 5)
        for idx, row in df.iterrows():
            if len(row) > 5:
                dim_id = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else None
                question_text = str(row.iloc[5]).strip() if pd.notna(row.iloc[5]) else None
                if dim_id and dim_id.startswith('DIM') and question_text and len(question_text) > 5:
                    questions[dim_id] = question_text
    except Exception as e:
        print(f"Error: {e}")
    return questions

def main():
    base_path = Path(__file__).parent.parent
    
    all_questions = {
        'burden': {},
        'empathy': {},
        'big5': {}
    }
    
    # BURDEN
    burden_file = base_path / "BURDEN CAREGIVER TEST.xlsx"
    if burden_file.exists():
        print("Extracting BURDEN questions...")
        all_questions['burden'] = extract_burden_questions(burden_file)
        print(f"Found {len(all_questions['burden'])} BURDEN questions")
    
    # EMPATHY
    empathy_file = base_path / "EMPATHY TEST.xlsx"
    if empathy_file.exists():
        print("Extracting EMPATHY questions...")
        all_questions['empathy'] = extract_empathy_questions(empathy_file)
        print(f"Found {len(all_questions['empathy'])} EMPATHY questions")
    
    # BIG5
    big5_file = base_path / "BIG 5 SUB ESCALAS.xlsx"
    if big5_file.exists():
        print("Extracting BIG5 questions...")
        all_questions['big5'] = extract_big5_questions(big5_file)
        print(f"Found {len(all_questions['big5'])} BIG5 questions")
    
    # Save
    output_file = base_path / "scripts" / "extracted_questions.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved to {output_file}")
    
    # Print sample
    for test_type, questions in all_questions.items():
        print(f"\n{test_type.upper()} ({len(questions)} questions):")
        for q_id, q_text in list(questions.items())[:3]:
            print(f"  {q_id}: {q_text[:70]}...")

if __name__ == "__main__":
    main()

