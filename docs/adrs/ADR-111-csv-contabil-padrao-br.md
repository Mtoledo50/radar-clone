
---

### 📂 `docs/adrs/ADR-111-csv-contabil-padrao-br.md`

```markdown
# ADR-111: CSV Contábil Padrão BR (UTF-8+BOM, Delimitador `;`, Quoting ALL)

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (padrão de mercado)

---

## 📋 Contexto

O Extrator Bancário exporta lançamentos em CSV para importação em sistemas contábeis (Domínio, Questor, Sage). Esses sistemas esperam formato específico.

**Problema:**
- Excel em pt-BR espera delimitador `;` (não `,`)
- Acentos só aparecem corretamente com UTF-8+BOM
- Campos com vírgula ou quebra de linha exigem quoting

## 🎯 Decisão

CSV de exportação segue padrão BR:

1. **Encoding:** UTF-8 com BOM (`\uFEFF`)
2. **Delimitador:** `;` (ponto e vírgula)
3. **Quoting:** `ALL` (todos os campos entre aspas duplas)
4. **Decimal:** Ponto (padrão US, não vírgula BR)
5. **Quebra de Linha:** `\r\n` (CRLF, padrão Windows)

## 💡 Implementação

```python
# extrator-bancario/backend/app/services/csv_export.py

import csv

def export_csv_contabil(filepath: str, data: list[dict]):
    fieldnames = ['data', 'descricao', 'debito', 'credito', 'conta_debito', 'conta_credito']
    
    with open(filepath, mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames,
            delimiter=';',
            quoting=csv.QUOTE_ALL,
            lineterminator='\r\n'
        )
        writer.writeheader()
        
        for row in data:
            # Formatar decimais com ponto
            row['debito'] = f"{row['debito']:.2f}"
            row['credito'] = f"{row['credito']:.2f}"
            writer.writerow(row)

Exemplo de Saída

"data";"descricao";"debito";"credito";"conta_debito";"conta_credito"
"13/08/2026";"PIX - CLARO S.A.";"150.00";"0.00";"3.1.1.01";"1.1.1.01"
"14/08/2026";"TARIFA BANCARIA";"12.50";"0.00";"3.1.2.01";"1.1.1.01"

✅ Consequências
Positivas
✅ Compatibilidade: Abre corretamente no Excel pt-BR
✅ Padrão de Mercado: Aceito por Domínio, Questor, Sage
✅ Seguro: Quoting evita problemas com campos especiais
Negativas
❌ Não Universal: Sistemas de outros países podem esperar formato diferente
📚 Referências
Arquivos que usam esta ADR:
extrator-bancario/backend/app/services/csv_export.py
ADRs relacionadas:
ADR-002 (CSV com UTF-8+BOM)
ADR-073 (SCI reduzido + decimal ponto)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial

