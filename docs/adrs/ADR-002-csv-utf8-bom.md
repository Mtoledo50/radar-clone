# ADR-002: Exportação CSV com UTF-8+BOM

**Data:** 2026-07  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não (requisito de negócio)

---

## 📋 Contexto

O sistema exporta diversos relatórios (DRE, Balancete, Lançamentos, Conciliação) em formato CSV para que os contadores possam abrir no Microsoft Excel. 

**Problema:** Arquivos CSV salvos em UTF-8 padrão (sem BOM) abrem no Excel com caracteres corrompidos (ex: "Caixa" vira "CaixaÃ§a", "Débito" vira "DÃ©bito"). O Excel, por padrão no Windows, espera encoding Windows-1252 ou UTF-8 com BOM (Byte Order Mark) para detectar corretamente a codificação.

---

## 🎯 Decisão

Toda exportação CSV gerada pelo sistema **DEVE** incluir o BOM (Byte Order Mark) `\uFEFF` no início do arquivo e utilizar o encoding `utf-8-sig` (no Python) ou concatenação manual do BOM (no Node.js/TypeScript).

Além disso, o delimitador padrão para o mercado brasileiro deve ser ponto e vírgula (`;`), pois o Excel em pt-BR usa vírgula como separador decimal.

---

## 💡 Implementação

### Backend (NestJS / Node.js)

typescript
// backend/src/utils/csv-export.ts
export function generateCsvWithBom(headers: string[], rows: string[][]): Buffer {
const BOM = '\uFEFF'; // Byte Order Mark para UTF-8
const headerRow = headers.join(';') + '\r\n';
const dataRows = rows.map(row =>
row.map(cell => "${String(cell).replace(/"/g, '""')}").join(';')
).join('\r\n');
const csvContent = BOM + headerRow + dataRows;
return Buffer.from(csvContent, 'utf-8');
}


### Backend (Python / Extrator Bancário)
```python
# extrator-bancario/backend/app/services/csv_export.py
import csv

def export_csv_with_bom(filepath: str, data: list[dict], fieldnames: list[str]):
    # utf-8-sig adiciona automaticamente o BOM no início do arquivo
    with open(filepath, mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        writer.writeheader()
        writer.writerows(data)

Frontend (Download do arquivo)
// frontend/src/lib/download-csv.ts
export function downloadCSV(filename: string, csvContent: string) {
  // Adiciona BOM se não estiver presente
  const contentWithBom = csvContent.startsWith('\uFEFF') 
    ? csvContent 
    : '\uFEFF' + csvContent;
    
  const blob = new Blob([contentWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

✅ Consequências

Positivas

✅ Compatibilidade total com Excel: Abre corretamente em qualquer versão do Excel (Windows/Mac) sem corromper acentos.
✅ Padronização: Todos os módulos (Contábil, Fiscal, Bancário) seguem a mesma regra.

Negativas

❌ Tamanho do arquivo: Aumenta em 3 bytes por arquivo (impacto desprezível).
❌ Leitura em outros softwares: Alguns parsers de CSV muito antigos ou de outros sistemas legados podem ler o BOM como parte do primeiro cabeçalho (ex: ï»¿Conta). Mitigado pelo fato de o foco ser o Excel.

📚 Referências

backend/src/utils/csv-export.ts
extrator-bancario/backend/app/services/csv_export.py
frontend/src/lib/download-csv.ts

🔄 Histórico de Revisões

Data        Autor           Mudança
2026-07     Marcos Toledo   Criação inicial

