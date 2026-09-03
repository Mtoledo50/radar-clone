"""
Script de debug para ver o texto bruto extraído do PDF
"""
import pdfplumber
from pathlib import Path

pdf_path = Path("data/uploads/extrato Sicredi 052026.pdf")

print("=" * 100)
print("DEBUG: TEXTO BRUTO EXTRAÍDO DO PDF")
print("=" * 100)

with pdfplumber.open(pdf_path) as pdf:
    for i, pagina in enumerate(pdf.pages, 1):
        print(f"\n{'='*100}")
        print(f"PÁGINA {i}")
        print(f"{'='*100}")
        texto = pagina.extract_text()
        print(texto)
        
        print(f"\n{'='*100}")
        print(f"PÁGINA {i} - LINHAS SEPARADAS")
        print(f"{'='*100}")
        linhas = texto.split("\n")
        for j, linha in enumerate(linhas, 1):
            print(f"{j:3d} | {repr(linha)}")