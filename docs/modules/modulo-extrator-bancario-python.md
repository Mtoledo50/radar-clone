# 🏦 Módulo Extrator Bancário (App Irmã)

**Status:** ✅ Operacional (Sprints F11-F12 homologadas)  
**Stack:** Python 3.11+ / FastAPI / pdfplumber / PyMuPDF / Mistral OCR

## 🎯 Propósito
Transformar PDFs brutos de extratos bancários em dados estruturados (JSON/CSV) prontos para conciliação, eliminando a digitação manual e a dependência de CSVs fornecidos pelos bancos.

## 🔄 Fluxo de Processamento
1. **Upload:** Frontend envia PDF via `POST /api/parse-extrato`.
2. **Extração Híbrida:** Tenta parsers nativos (`pdfplumber`). Se falhar ou retornar vazio, aciona **Mistral OCR** via HTTP direto (fallback universal, ADR-107).
3. **Normalização:** Remove caracteres full-width, pipes de markdown e normaliza espaços.
4. **Parsing Stateful:** Aplica regex específicas por banco. O parser do Banrisul é *stateful* para lidar com quebras de linha do OCR.
5. **LGPD:** Mascara documentos sensíveis (ex: `10.601` → `**.601`) antes de retornar ao frontend.
6. **Human-in-the-Loop:** Dados chegam como "pendente". O usuário edita e clica em "Salvar Regras Aprendidas".

## 🏦 Parsers Suportados
| Banco | Estratégia | Status |
|---|---|---|
| Banco do Brasil | Regex em tabela markdown + detecção flexível | ✅ |
| Sicredi | Regex em linha única (PIX_CRED/PIX_DEB) | ✅ |
| Banrisul | Parser Stateful (associa dia/tipo em linhas separadas) | ✅ |
| Itaú PJ | Regex adaptada para layout de PDF nativo | ✅ |

## 📂 Localização do Código
- **Raiz:** `extrator-bancario/`
- **Backend:** `extrator-bancario/backend/app/` (`main.py`, `parsers/`, `services/ocr_service.py`)
- **Frontend:** `extrator-bancario/frontend/` (Vite + React)
- **Regras:** `extrator-bancario/backend/data/regras/regras_aprendidas.json` (migração para Postgres pendente na F15)