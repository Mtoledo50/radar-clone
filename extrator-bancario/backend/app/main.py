"""
API FastAPI para o Extrator Bancário.

Endpoints:
  POST /api/parse-extrato - Recebe PDF e retorna lançamentos extraídos
  POST /api/classificar - Classifica lançamentos com histórico
  POST /api/gerar-csv - Gera CSV Aurora a partir de lançamentos classificados
  GET /api/health - Health check
"""
import uuid
import time
from typing import Optional
from pathlib import Path
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.parsers import ParserFactory, ParserNaoDetectadoError
from app.services.matching import MatchingEngine
from app.services.csv_builder import CSVBuilder
from app.models.lancamento import ExtratoBancario

# Inicializa FastAPI
app = FastAPI(
    title="Extrator Bancário API",
    description="API para extração e classificação de extratos bancários",
    version="1.0.0",
)

# Configura CORS (permite frontend React consumir a API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restrinja para domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caminhos padrão
HISTORICO_PATH = Path("data/historico/PLANILHA AURORA 2025 12 MANU.csv")
REGRAS_PATH = Path("app/config/regras_mapeamento.json")
UPLOAD_DIR = Path("data/uploads")
OUTPUT_DIR = Path("data/output")

# Garante que as pastas existam
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Inicializa o factory (global, reutilizado)
parser_factory = ParserFactory()


@app.get("/api/health")
def health_check():
    """Health check da API"""
    return {"status": "ok", "message": "Extrator Bancário API está funcionando"}


@app.post("/api/parse-extrato")
async def parse_extrato(file: UploadFile = File(...), forcar_banco: Optional[str] = None):
    """
    Recebe um PDF de extrato bancário e retorna os lançamentos extraídos.
    Aceita QUALQUER nome de arquivo .pdf.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")
    
    # ✅ CORREÇÃO: Usa UUID para nome único (evita conflitos de nomes e locks do Windows)
    temp_filename = f"temp_{uuid.uuid4().hex}.pdf"
    temp_path = UPLOAD_DIR / temp_filename
    
    try:
        # Salva o arquivo com nome temporário único
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Aguarda Windows liberar lock do arquivo
        time.sleep(0.1)
        
        # Detecta o parser automaticamente (ou usa o forçado)
        if forcar_banco:
            parser = parser_factory.forcar_parser(forcar_banco)
        else:
            parser = parser_factory.criar_parser(temp_path)
        
        # Faz o parse
        extrato = parser.parse(temp_path)
        
        # ⚠️ ALERTA LGPD: Mascara nome do cliente na resposta
        nome_mascarado = parser.mascarar_nome(extrato.nome_cliente)
        
        return {
            "success": True,
            "data": extrato.model_dump(),
            "banco_detectado": {
                "codigo": parser.codigo_banco,
                "nome": parser.nome_banco,
            },
            "cliente_mascarado": nome_mascarado,  # LGPD: nunca enviar nome completo
            "message": f"{extrato.total_lancamentos} lançamentos extraídos com sucesso",
        }
    except ParserNaoDetectadoError as e:
        # Retorna lista de parsers disponíveis para o usuário escolher
        raise HTTPException(
            status_code=400,
            detail={
                "erro": str(e),
                "parsers_disponiveis": e.parsers_disponiveis,
                "acao": "Escolha manualmente um parser usando o parâmetro 'forcar_banco'",
            }
        )
    except Exception as e:
        # Log do erro real no terminal para facilitar o debug do erro 500
        print(f"❌ ERRO CRÍTICO AO PROCESSAR PDF: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao processar PDF: {str(e)}")
    finally:
        # Limpa arquivo temporário de forma robusta
        if temp_path.exists():
            try:
                temp_path.unlink()
            except PermissionError:
                time.sleep(0.5)
                try:
                    temp_path.unlink()
                except Exception:
                    pass  # Ignora falha na deleção para não quebrar a resposta ao usuário


@app.post("/api/classificar")
async def classificar_lancamentos(extrato_data: dict):
    """Classifica lançamentos comparando com histórico e regras fixas."""
    try:
        extrato = ExtratoBancario(**extrato_data)
        
        if not HISTORICO_PATH.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Arquivo de histórico não encontrado: {HISTORICO_PATH}",
            )
        
        matching = MatchingEngine(HISTORICO_PATH, REGRAS_PATH, threshold=95.0)
        extrato_classificado = matching.classificar(extrato)
        
        matches = sum(1 for l in extrato_classificado.lancamentos if l.status.value == "match")
        revisoes = sum(1 for l in extrato_classificado.lancamentos if l.status.value == "revisao")
        
        return {
            "success": True,
            "data": extrato_classificado.model_dump(),
            "summary": {
                "total": extrato_classificado.total_lancamentos,
                "matches": matches,
                "revisoes": revisoes,
            },
            "message": f"{matches} matches automáticos, {revisoes} para revisão manual",
        }
    except Exception as e:
        print(f"❌ ERRO AO CLASSIFICAR: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao classificar: {str(e)}")


@app.post("/api/gerar-csv")
async def gerar_csv(extrato_data: dict):
    """Gera CSV no formato Aurora a partir de lançamentos classificados."""
    try:
        extrato = ExtratoBancario(**extrato_data)
        
        competencia = extrato.competencia.replace("/", "_").lower()
        output_filename = f"extrato_{competencia}_aurora.csv"
        output_path = OUTPUT_DIR / output_filename
        
        builder = CSVBuilder()
        builder.gerar(extrato, output_path)
        
        return {
            "success": True,
            "data": {
                "filename": output_filename,
                "download_url": f"/api/download/{output_filename}",
            },
            "message": f"CSV gerado com sucesso: {output_filename}",
        }
    except Exception as e:
        print(f"❌ ERRO AO GERAR CSV: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar CSV: {str(e)}")


@app.get("/api/download/{filename}")
async def download_csv(filename: str):
    """Download do CSV gerado."""
    file_path = OUTPUT_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/csv",
    )


# ============================================================
# Execução local (para desenvolvimento)
# ============================================================
if __name__ == "__main__":
    import uvicorn
    
    print("=" * 80)
    print("🚀 Iniciando Extrator Bancário API")
    print("=" * 80)
    print("📍 URL: http://localhost:8000")
    print("📚 Documentação: http://localhost:8000/docs")
    print("=" * 80)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)