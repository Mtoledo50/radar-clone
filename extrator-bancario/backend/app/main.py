"""
Main FastAPI application for the Bank Statement Extractor.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import shutil
import uuid
from typing import List, Dict, Any

from app.services.ocr_service import MistralOCRService
from app.parsers.ocr_parser import OCRParser
from app.parsers.parser_factory import ParserFactory

app = FastAPI(title="Extrator Bancário Inteligente")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def mascarar_documento(doc: str) -> str:
    if not doc or doc == "000000" or len(doc) < 4:
        return doc
    return "*" * (len(doc) - 3) + doc[-3:]


class ClassificarRequest(BaseModel):
    banco: str
    agencia: str
    conta: str
    nome_cliente: str
    competencia: str
    total_lancamentos: int
    lancamentos: List[Dict[str, Any]]


@app.post("/api/parse-extrato")
async def parse_extrato(file: UploadFile = File(...), forcar_banco: str = None):
    try:
        temp_dir = Path("data/uploads")
        temp_dir.mkdir(parents=True, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        temp_file = temp_dir / unique_filename
        
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"\n{'='*80}")
        print(f"📥 ARQUIVO RECEBIDO: {file.filename}")
        
        extrato = None
        
        # Estratégia 1: Tenta parsers específicos (Sicredi, Banrisul, BB nativo)
        if not forcar_banco:
            try:
                factory = ParserFactory()
                parser = factory.criar_parser(temp_file)
                extrato = parser.parse(temp_file)
                print(f"✅ Parser específico funcionou: {extrato.banco}")
            except Exception as e:
                print(f"⚠️ Parser específico falhou: {e}")
                print("🔄 Tentando Mistral OCR como fallback...")
        
        # Estratégia 2: Fallback para Mistral OCR
        if not extrato:
            try:
                ocr_service = MistralOCRService()
                texto_ocr = ocr_service.extract_text(temp_file)
                parser = OCRParser()
                extrato = parser.parse(texto_ocr)
                print(f"✅ Mistral OCR funcionou: {extrato.banco}")
            except Exception as e:
                print(f"❌ Mistral OCR também falhou: {e}")
                raise HTTPException(status_code=500, detail=f"Erro ao processar PDF: {str(e)}")
        
        temp_file.unlink()
        
        print(f"✅ PROCESSAMENTO CONCLUÍDO: {extrato.banco} | {len(extrato.lancamentos)} lançamentos")
        print("="*80 + "\n")
        
        # Mapeia os campos corretamente para o frontend
        return {
            "banco": extrato.banco,
            "agencia": extrato.agencia,
            "conta": extrato.conta,
            "nome_cliente": extrato.nome_cliente,
            "competencia": extrato.competencia,
            "total_lancamentos": len(extrato.lancamentos),
            "lancamentos": [
                {
                    "dia": lanc.dia,
                    "tipo": lanc.tipo,
                    "documento": mascarar_documento(lanc.documento),
                    "valor": lanc.valor,
                    "sinal": lanc.sinal.value,
                    "descricao": lanc.descricao_completa,  # ✅ Campo correto
                    "descricao_completa": lanc.descricao_completa,  # ✅ Para o LancamentosTable
                    "conta_debito": None,
                    "conta_credito": None,
                    "status": "pendente",
                    "editado_manualmente": False
                }
                for lanc in extrato.lancamentos
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERRO CRÍTICO NO ENDPOINT: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao processar PDF: {str(e)}")


@app.post("/api/classificar")
async def classificar_lancamentos(request: ClassificarRequest):
    lancamentos_classificados = []
    matches = 0
    revisoes = 0
    
    for lanc in request.lancamentos:
        lanc_classificado = {
            **lanc,
            "status": "pendente",
            "conta_debito": lanc.get("conta_debito"),
            "conta_credito": lanc.get("conta_credito"),
            "descricao_completa": lanc.get("descricao_completa", lanc.get("descricao", ""))
        }
        lancamentos_classificados.append(lanc_classificado)
        revisoes += 1
        
    return {
        "success": True,
        "data": {
            "banco": request.banco,
            "agencia": request.agencia,
            "conta": request.conta,
            "nome_cliente": request.nome_cliente,
            "competencia": request.competencia,
            "total_lancamentos": request.total_lancamentos,
            "lancamentos": lancamentos_classificados
        },
        "summary": {
            "matches": matches,
            "revisoes": revisoes
        }
    }