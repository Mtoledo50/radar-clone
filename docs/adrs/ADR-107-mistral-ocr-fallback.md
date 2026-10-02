
---

## 📂 `docs/adrs/ADR-107-mistral-ocr-fallback.md`

```markdown
# ADR-107: Mistral OCR como Fallback Universal

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O Extrator Bancário (Python/FastAPI) precisa processar PDFs de extratos bancários de múltiplos bancos (Banrisul, Sicredi, BB, Itaú). Cada banco tem layouts diferentes, e parsers nativos (`pdfplumber`, `PyMuPDF`) falham em alguns casos:

- **PDFs escaneados** (imagem, não texto)
- **OCR ruim** do banco (caracteres errados, quebras de linha)
- **Layouts complexos** (tabelas com células mescladas, colunas sobrepostas)

### Problema:
Como garantir que o sistema funcione para qualquer banco sem desenvolver parsers customizados para cada um?

### Requisitos:
1. Fallback universal que funcione para qualquer PDF
2. Custo controlado e previsível
3. Não depender de SDKs instáveis
4. Integração simples com o pipeline existente

---

## 🎯 Decisão

Usar **Mistral OCR API** como fallback universal via HTTP direto (sem SDK oficial), acionado apenas quando parsers nativos falham ou retornam texto vazio.

### Estratégia Híbrida:

Tentar parser nativo (pdfplumber)
↓
Se falhar OU retornar <100 caracteres
↓
Acionar Mistral OCR (HTTP direto)
↓
Normalizar saída (remover caracteres full-width, pipes, espaços extras)
↓
Aplicar parser específico do banco (regex)


### Por que HTTP direto (sem SDK)?

1. **SDKs oficiais frequentemente quebram** com mudanças de versão
2. **HTTP direto é mais estável** e versionável
3. **Evita dependências pesadas** no ambiente Python
4. **Mais fácil de debugar** (basta inspecionar a requisição HTTP)

---

## 💡 Implementação

### Backend: Serviço OCR

```python
# extrator-bancario/backend/app/services/ocr_service.py

import requests
import os
from fastapi import HTTPException

class MistralOCRService:
    """
    Serviço de OCR usando Mistral API via HTTP direto.
    
    Por que HTTP direto?
    - SDK oficial frequentemente quebra com mudanças de versão
    - HTTP é mais estável e versionável
    - Evita dependências pesadas
    """
    
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        self.endpoint = "https://api.mistral.ai/v1/ocr"
        
        if not self.api_key:
            raise ValueError("MISTRAL_API_KEY não configurada no .env")
    
    def extract(self, pdf_path: str) -> str:
        """
        Extrai texto de um PDF usando Mistral OCR.
        
        Args:
            pdf_path: Caminho absoluto do arquivo PDF
            
        Returns:
            Texto extraído do PDF
            
        Raises:
            HTTPException: Se a API retornar erro
        """
        try:
            with open(pdf_path, "rb") as f:
                response = requests.post(
                    self.endpoint,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    files={"file": f},
                    timeout=60,  # 60 segundos de timeout
                )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Mistral OCR falhou: {response.status_code} - {response.text}"
                )
            
            result = response.json()
            return result.get("text", "")
        
        except requests.exceptions.Timeout:
            raise HTTPException(status_code=504, detail="Timeout na requisição OCR")
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Erro de rede: {str(e)}")


class OCRFallbackService:
    """
    Serviço com fallback: tenta parser nativo primeiro, depois Mistral OCR.
    """
    
    def __init__(self):
        self.mistral = MistralOCRService()
    
    def extract(self, pdf_path: str, bank: str) -> str:
        """
        Extrai texto com fallback automático.
        
        Args:
            pdf_path: Caminho do PDF
            bank: Nome do banco (para aplicar parser específico depois)
            
        Returns:
            Texto extraído
        """
        # 1. Tentar parser nativo
        try:
            import pdfplumber
            
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
            
            # Se extraiu texto suficiente, retorna
            if len(text.strip()) > 100:
                return text
        
        except Exception as e:
            print(f"Parser nativo falhou: {e}")
        
        # 2. Fallback para Mistral OCR
        print("Usando Mistral OCR como fallback...")
        return self.mistral.extract(pdf_path)

Backend: Pipeline de Extração

# extrator-bancario/backend/app/main.py

from fastapi import FastAPI, UploadFile, File
from app.services.ocr_service import OCRFallbackService
from app.parsers.parser_factory import ParserFactory

app = FastAPI()
ocr_service = OCRFallbackService()
parser_factory = ParserFactory()

@app.post("/api/parse-extrato")
async def parse_extrato(file: UploadFile = File(...), bank: str = "auto"):
    # 1. Salvar arquivo temporário
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    try:
        # 2. Extrair texto (com fallback)
        text = ocr_service.extract(temp_path, bank)
        
        # 3. Normalizar (remover caracteres full-width, pipes, etc)
        text = normalize_text(text)
        
        # 4. Detectar banco (se auto)
        if bank == "auto":
            bank = detect_bank(text)
        
        # 5. Aplicar parser específico do banco
        parser = parser_factory.get_parser(bank)
        extrato = parser.parse(text)
        
        return extrato
    
    finally:
        # 6. Limpar arquivo temporário
        if os.path.exists(temp_path):
            os.remove(temp_path)


def normalize_text(text: str) -> str:
    """
    Normaliza texto extraído de PDFs.
    
    Remove:
    - Caracteres full-width (：, ，, √)
    - Pipes de markdown (|)
    - Espaços extras
    """
    # Substituir caracteres full-width
    text = text.replace("：", ":").replace("，", ",").replace("√", "")
    
    # Remover pipes
    text = text.replace("|", " ")
    
    # Normalizar espaços
    text = " ".join(text.split())
    
    return text


def detect_bank(text: str) -> str:
    """
    Detecta o banco pelo conteúdo do texto.
    """
    if "BANRISUL" in text.upper():
        return "banrisul"
    elif "SICREDI" in text.upper():
        return "sicredi"
    elif "BANCO DO BRASIL" in text.upper():
        return "bb"
    elif "ITAU" in text.upper():
        return "itau"
    else:
        return "generic"

💰 Custos

Item        Valor                     Estimativa Mensal
Mistral OCR  ~$4 por 1000 páginas     500 extratos × 5 páginas = 2500 páginas = ~$10/mês


✅ Consequências

Positivas

✅ Fallback universal: Funciona para qualquer banco (mesmo sem parser específico)
✅ Não depende de SDKs instáveis: HTTP direto é mais estável
✅ Custo controlado: ~$10/mês para 500 extratos
✅ Integração simples: Basta adicionar ao pipeline existente

Negativas

❌ Dependência externa: Se Mistral cair, fallback quebra
❌ Custo por página: Pode ficar caro se volume aumentar muito
❌ Latência: OCR é mais lento que parser nativo (5-10s vs 1s)

🚨 Incidente de Segurança (2026-09-09)

Problema:

Chave API da Mistral vazou em chat durante desenvolvimento.

Ação Imediata:

Chave rotacionada (revogada) no console da Mistral
Nova chave gerada
.env removido de TODO o histórico Git via git filter-repo

Prevenção:

.env adicionado ao .gitignore
Regra ADR-032 reforçada: nunca commitar .env, nunca enviar em chat
GitHub Push Protection funcionou corretamente, bloqueando o push inicial

📚 Referências

Arquivos que usam esta ADR:

extrator-bancario/backend/app/services/ocr_service.py
extrator-bancario/backend/app/main.py

ADRs relacionadas:

ADR-032 (cofres de credenciais AES-256-GCM)
ADR-108 (parser stateful para Banrisul)
ADR-109 (persistência de regras em JSON)

🔄 Histórico de Revisões

Data        Autor                   Mudança
2026-09     Marcos Toledo           Criação inicial
2026-09     Marcos Toledo           Adicionado incidente de segurança
