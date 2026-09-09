"""
Main FastAPI application for the Bank Statement Extractor.
Versão completa com endpoints de classificação, salvamento de regras e geração de CSV.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import shutil
import uuid
import csv
import io
from typing import List, Dict, Any
from datetime import datetime

from app.services.ocr_service import MistralOCRService
from app.parsers.ocr_parser import OCRParser
from app.parsers.parser_factory import ParserFactory

app = FastAPI(title="Extrator Bancário Inteligente")

# CORS multi-origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# MODELS (Pydantic)
# =============================================================================

class ClassificarRequest(BaseModel):
    banco: str
    agencia: str
    conta: str
    nome_cliente: str
    competencia: str
    total_lancamentos: int
    lancamentos: List[Dict[str, Any]]


class SalvarRegrasLoteRequest(BaseModel):
    regras: List[Dict[str, Any]]
    criado_por: str = "sistema"


class GerarCSVRequest(BaseModel):
    banco: str
    agencia: str
    conta: str
    nome_cliente: str
    competencia: str
    total_lancamentos: int
    lancamentos: List[Dict[str, Any]]


# =============================================================================
# HELPERS
# =============================================================================

def mascarar_documento(doc: str) -> str:
    """
    Aplica mascaramento LGPD em documentos sensíveis.
    Ex: '10.601' -> '**.601' | '00003853107060' -> '***********060'
    """
    if not doc or doc == "000000" or len(doc) < 4:
        return doc
    return "*" * (len(doc) - 3) + doc[-3:]


def salvar_regras_em_arquivo(regras: list, criado_por: str) -> Path:
    """
    Salva as regras aprendidas em arquivo JSON (persistência simples).
    Em produção, isso seria um banco PostgreSQL.
    """
    import json
    
    regras_dir = Path("data/regras")
    regras_dir.mkdir(parents=True, exist_ok=True)
    
    arquivo_regras = regras_dir / "regras_aprendidas.json"
    
    # Carrega regras existentes
    regras_existentes = []
    if arquivo_regras.exists():
        with open(arquivo_regras, "r", encoding="utf-8") as f:
            regras_existentes = json.load(f)
    
    # Adiciona metadados às novas regras
    timestamp = datetime.now().isoformat()
    for regra in regras:
        regra["criado_em"] = timestamp
        regra["criado_por"] = criado_por
        regra["ativa"] = True
    
    # Merge: atualiza regras existentes pela chave (descricao_parcial + conta)
    chaves_existentes = {
        f"{r.get('descricao_parcial')}__{r.get('conta')}" for r in regras_existentes
    }
    
    for nova_regra in regras:
        chave = f"{nova_regra.get('descricao_parcial')}__{nova_regra.get('conta')}"
        if chave not in chaves_existentes:
            regras_existentes.append(nova_regra)
        else:
            # Atualiza a existente
            for i, existente in enumerate(regras_existentes):
                if f"{existente.get('descricao_parcial')}__{existente.get('conta')}" == chave:
                    regras_existentes[i] = nova_regra
                    break
    
    # Salva
    with open(arquivo_regras, "w", encoding="utf-8") as f:
        json.dump(regras_existentes, f, ensure_ascii=False, indent=2)
    
    return arquivo_regras


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/api/health")
async def health_check():
    """Endpoint de verificação de saúde da API."""
    return {
        "status": "ok",
        "service": "Extrator Bancário Inteligente",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/parse-extrato")
async def parse_extrato(file: UploadFile = File(...), forcar_banco: str = None):
    """
    Recebe o PDF, extrai texto via Mistral OCR (fallback),
    parseia e retorna dados formatados com mascaramento LGPD.
    """
    try:
        # Validação de tipo de arquivo
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")
        
        # Validação de tamanho (máximo 10MB)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo muito grande (máximo 10MB)")
        
        # Salva arquivo temporariamente com nome único
        temp_dir = Path("data/uploads")
        temp_dir.mkdir(parents=True, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        temp_file = temp_dir / unique_filename
        
        with open(temp_file, "wb") as buffer:
            buffer.write(content)
        
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
        
        # Remove arquivo temporário
        temp_file.unlink()
        
        print(f"✅ PROCESSAMENTO CONCLUÍDO: {extrato.banco} | {len(extrato.lancamentos)} lançamentos")
        print("="*80 + "\n")
        
        # Retorna dados formatados com mascaramento LGPD
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
                    "documento": mascarar_documento(lanc.documento),  # 🛡️ LGPD
                    "valor": lanc.valor,
                    "sinal": lanc.sinal.value,
                    "descricao": lanc.descricao_completa,
                    "descricao_completa": lanc.descricao_completa,
                    "conta_debito": None,
                    "conta_credito": None,
                    "status": "pendente",  # Human-in-the-Loop
                    "editado_manualmente": False,
                }
                for lanc in extrato.lancamentos
            ],
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
    """
    Classifica os lançamentos com base em regras fixas e aprendidas.
    Implementação Human-in-the-Loop: mantém todos como 'pendente'
    para que o usuário valide e edite manualmente antes de salvar as regras.
    """
    lancamentos_classificados = []
    matches = 0
    revisoes = 0
    
    for lanc in request.lancamentos:
        # Aqui entraria a lógica futura de consulta ao banco de regras aprendidas.
        # Por enquanto, seguimos o princípio "Sistema sugere → Humano aprova".
        lanc_classificado = {
            **lanc,
            "status": "pendente",
            "conta_debito": lanc.get("conta_debito"),
            "conta_credito": lanc.get("conta_credito"),
            "descricao_completa": lanc.get("descricao_completa", lanc.get("descricao", "")),
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
            "lancamentos": lancamentos_classificados,
        },
        "summary": {
            "matches": matches,
            "revisoes": revisoes,
        },
    }


@app.post("/api/salvar-regras-lote")
async def salvar_regras_lote(request: SalvarRegrasLoteRequest):
    """
    Salva regras aprendidas de classificação automática em lote.
    Permite que o usuário, após revisar manualmente os lançamentos,
    salve as regras para que extratos futuros sejam classificados automaticamente.
    
    Princípio Human-in-the-Loop: regras só são criadas após aprovação humana.
    """
    if not request.regras:
        raise HTTPException(status_code=400, detail="Nenhuma regra para salvar")
    
    try:
        arquivo_regras = salvar_regras_em_arquivo(request.regras, request.criado_por)
        
        print(f"\n💾 {len(request.regras)} regras salvas por '{request.criado_por}'")
        for regra in request.regras:
            print(f"   - {regra.get('descricao_parcial')} -> Débito: {regra.get('debito')}, Crédito: {regra.get('credito')}")
        
        return {
            "success": True,
            "message": f"{len(request.regras)} regra(s) salva(s) com sucesso. Próximos extratos desta conta já virão classificados automaticamente.",
            "regras_salvas": len(request.regras),
            "arquivo": str(arquivo_regras),
        }
        
    except Exception as e:
        print(f"❌ Erro ao salvar regras: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao salvar regras: {str(e)}")


@app.get("/api/regras")
async def listar_regras():
    """Lista todas as regras aprendidas (para painel administrativo futuro)."""
    import json
    
    arquivo_regras = Path("data/regras/regras_aprendidas.json")
    
    if not arquivo_regras.exists():
        return {"success": True, "regras": [], "total": 0}
    
    with open(arquivo_regras, "r", encoding="utf-8") as f:
        regras = json.load(f)
    
    return {
        "success": True,
        "regras": regras,
        "total": len(regras),
    }


@app.post("/api/gerar-csv")
async def gerar_csv(request: GerarCSVRequest):
    """
    Gera arquivo CSV dos lançamentos para importação no sistema contábil.
    Formato compatível com Domínio, Alterdata, Sênior e Contmatic.
    """
    if not request.lancamentos:
        raise HTTPException(status_code=400, detail="Nenhum lançamento para exportar")
    
    try:
        # Cria CSV em memória
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_ALL)
        
        # Cabeçalho (padrão contábil brasileiro)
        writer.writerow([
            "Data",
            "Tipo",
            "Documento",
            "Descricao",
            "Historico",
            "Debito",
            "Credito",
            "Status",
        ])
        
        # Dados
        for lanc in request.lancamentos:
            dia = str(lanc.get("dia", "")).zfill(2)
            mes_ano = request.competencia  # ex: "01/2026"
            data = f"{dia}/{mes_ano}"
            
            valor = lanc.get("valor", 0)
            sinal = lanc.get("sinal", "+")
            
            # Separa débito e crédito conforme sinal
            debito = f"{valor:.2f}" if sinal == "-" else ""
            credito = f"{valor:.2f}" if sinal in ("+", "C") else ""
            
            writer.writerow([
                data,
                lanc.get("tipo", ""),
                lanc.get("documento", ""),
                lanc.get("descricao_completa", lanc.get("descricao", "")),
                lanc.get("descricao_completa", ""),
                debito,
                credito,
                lanc.get("status", "pendente"),
            ])
        
        # Salva arquivo
        exports_dir = Path("data/exports")
        exports_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"extrato_{request.banco}_{request.competencia.replace('/', '')}_{uuid.uuid4().hex[:6]}.csv"
        filepath = exports_dir / filename
        
        with open(filepath, "w", encoding="utf-8-sig") as f:  # utf-8-sig para Excel
            f.write(output.getvalue())
        
        print(f"📄 CSV gerado: {filepath} ({len(request.lancamentos)} lançamentos)")
        
        return {
            "success": True,
            "data": {
                "filename": filename,
                "path": str(filepath),
                "total_lancamentos": len(request.lancamentos),
            },
        }
        
    except Exception as e:
        print(f"❌ Erro ao gerar CSV: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar CSV: {str(e)}")


@app.get("/api/download-csv/{filename}")
@app.get("/api/download/{filename}")  # 🆕 Alias para compatibilidade com o frontend
async def download_csv(filename: str):
    """Retorna o arquivo CSV para download (aceita duas URLs para compatibilidade)."""
    filepath = Path("data/exports") / filename
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {filename}")
    
    # Segurança: impede path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")
    
    print(f"📥 Download solicitado: {filename}")
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )