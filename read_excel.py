import openpyxl
import json

path = r"c:\Users\Luis Velásquez\Desktop\FORMATO DE VIVIENDA\2.- FORMATO ESTATUS PAAV _ abril2026.xlsx"
try:
    wb = openpyxl.load_workbook(path, data_only=True)
    sheet = wb.active
    print("Sheet name:", sheet.title)
    
    # Let's inspect the first 10 rows and all columns
    rows = []
    for r in range(1, 15):
        row_vals = [cell.value for cell in sheet[r]]
        # Clean row if it is all None
        if any(v is not None for v in row_vals):
            rows.append((r, row_vals))
            
    for r, vals in rows:
        print(f"Row {r}: {vals[:15]}")
except Exception as e:
    print("Error reading excel:", e)
