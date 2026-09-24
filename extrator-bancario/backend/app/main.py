"""
Main FastAPI application for the Bank Statement Extractor.
Versão completa com endpoints de classificação, salvamento de regras e geração de CSV.

📝 ATUALIZAÇÃO SET/2026 (Motor V4 + Fallback Inteligente + Correção de Sintaxe):
    - /api/classificar: Loop corrigido e blindagem total de conta (re.sub).
    - /api/gerar-csv: Inclui colunas Conta_Debito e Conta_Credito.
    - /api/parse-extrato: Suporte a data_completa (Itaú multimes).
    - Helpers unificados (removida duplicidade que causava conflito).
"""

import re
import json
import uuid
import csv
import io
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.ocr_service import MistralOCRService
from app.parsers.ocr_parser import OCRParser
from app.parsers.parser_factory import ParserFactory

# =============================================================================
# INICIALIZAÇÃO DO FASTAPI E CORS
# =============================================================================

app = FastAPI(title="Extrator Bancário Inteligente")

# 🛡️ CORS BLINDADO: Aceita 5173 (Vite padrão), 5174, 3000 (SaaS) e 8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",  # SaaS Principal (Next.js)
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
# HELPERS BLINDADOS (UNIFICADOS)
# =============================================================================

def get_caminho_regras() -> Path:
    """
    🛡️ GARANTE CAMINHO ABSOLUTO PARA O JSON DE REGRAS.
    Resolve o problema do Windows onde o caminho relativo muda dependendo
    de onde o terminal foi aberto.
    """
    base_dir = Path(__file__).resolve().parent.parent
    regras_dir = base_dir / "data" / "regras"
    regras_dir.mkdir(parents=True, exist_ok=True)
    return regras_dir / "regras_aprendidas.json"

def normalizar_texto(texto: str) -> str:
    """
    🧹 NORMALIZAÇÃO PADRÃO RADAR CONTA CERTA.
    Usada TANTO no salvamento QUANTO na leitura para garantir 100% de match.
    """
    if not texto:
        return ""
    limpo = " ".join(str(texto).upper().split())
    return limpo.strip(" -")

def mascarar_documento(doc: str) -> str:
    """Aplica mascaramento LGPD em documentos sensíveis."""
    if not doc or doc == "000000" or len(doc) < 4:
        return doc
    return "*" * (len(doc) - 3) + doc[-3:]

def carregar_regras_aprendidas() -> List[Dict[str, Any]]:
    """Carrega regras com log detalhado do que foi encontrado."""
    arquivo_regras = get_caminho_regras()
    
    print(f"\n📂 [DB] Tentando carregar regras de: {arquivo_regras}")
    
    if not arquivo_regras.exists():
        print("   ⚠️ Arquivo de regras NÃO existe. Memória vazia.")
        return []
    
    try:
        with open(arquivo_regras, "r", encoding="utf-8") as f:
            regras = json.load(f)
            print(f"   ✅ {len(regras)} regras carregadas do disco.")
            for i, r in enumerate(regras[:3]):
                print(f"      [{i+1}] '{normalizar_texto(r.get('descricao_parcial'))}' | Conta: {r.get('conta')} | D:{r.get('debito')} C:{r.get('credito')}")
            if len(regras) > 3:
                print(f"      ... e mais {len(regras) - 3} regras.")
            return regras
    except Exception as e:
        print(f"   ❌ ERRO CRÍTICO ao ler JSON: {e}")
        return []

def salvar_regras_em_arquivo(regras: list, criado_por: str) -> Path:
    """Salva regras usando a MESMA normalização do motor de classificação."""
    arquivo_regras = get_caminho_regras()
    regras_existentes = carregar_regras_aprendidas()

    timestamp = datetime.now().isoformat()
    
    for regra in regras:
        # 🛡️ NORMALIZA ANTES DE SALVAR
        regra["descricao_parcial"] = normalizar_texto(regra.get('descricao_parcial', ''))
        # Blindagem da conta: remove tudo que não for número
        regra["conta"] = re.sub(r'\D', '', str(regra.get('conta', ''))) 
        regra["criado_em"] = timestamp
        regra["criado_por"] = criado_por
        regra["ativa"] = True

    # Merge inteligente
    chaves_existentes = {
        f"{r.get('descricao_parcial')}__{r.get('conta')}" for r in regras_existentes
    }

    for nova_regra in regras:
        chave = f"{nova_regra.get('descricao_parcial')}__{nova_regra.get('conta')}"
        
        if chave not in chaves_existentes:
            regras_existentes.append(nova_regra)
            print(f"   ➕ NOVA REGRA SALVA: '{nova_regra.get('descricao_parcial')}'")
        else:
            for i, existente in enumerate(regras_existentes):
                exc_chave = f"{existente.get('descricao_parcial')}__{existente.get('conta')}"
                if exc_chave == chave:
                    regras_existentes[i] = nova_regra
                    print(f"   🔄 REGRA ATUALIZADA: '{nova_regra.get('descricao_parcial')}'")
                    break

    with open(arquivo_regras, "w", encoding="utf-8") as f:
        json.dump(regras_existentes, f, ensure_ascii=False, indent=2)
    
    print(f"   💾 Total de {len(regras_existentes)} regras persistidas em {arquivo_regras}")
    return arquivo_regras

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Extrator Bancário Inteligente",
        "timestamp": datetime.now().isoformat(),
    }

@app.post("/api/parse-extrato")
async def parse_extrato(file: UploadFile = File(...), forcar_banco: str = None):
    """Recebe o PDF, extrai texto, parseia e retorna dados formatados."""
    try:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo muito grande (máximo 10MB)")

        temp_dir = Path("data/uploads")
        temp_dir.mkdir(parents=True, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        temp_file = temp_dir / unique_filename

        with open(temp_file, "wb") as buffer:
            buffer.write(content)

        print(f"\n{'='*80}")
        print(f"📥 ARQUIVO RECEBIDO: {file.filename}")
        
        extrato = None

        if not forcar_banco:
            try:
                factory = ParserFactory()
                parser = factory.criar_parser(temp_file)
                extrato = parser.parse(temp_file)
                print(f"✅ Parser específico funcionou: {extrato.banco}")
            except Exception as e:
                print(f"⚠️ Parser específico falhou: {e}")
                print("🔄 Tentando Mistral OCR como fallback...")

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
                    "data_completa": lanc.data_completa,
                    "tipo": lanc.tipo,
                    "documento": mascarar_documento(lanc.documento),
                    "valor": lanc.valor,
                    "sinal": lanc.sinal.value,
                    "descricao": lanc.descricao_completa,
                    "descricao_completa": lanc.descricao_completa,
                    "conta_debito": None,
                    "conta_credito": None,
                    "status": "pendente",
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
    🧠 MOTOR DE REGRAS V4 - BLINDADO COM AUDITORIA E LOOP CORRIGIDO
    """
    try:
        regras_db = carregar_regras_aprendidas()
        
        # Ordena: Regras mais longas (específicas) primeiro
        regras_ordenadas = sorted(
            [r for r in regras_db if r.get('ativa', True)], 
            key=lambda r: len(normalizar_texto(r.get('descricao_parcial', ''))), 
            reverse=True
        )
        
        print(f"\n{'='*80}")
        print(f"🧠 [MOTOR V4] Iniciando classificação...")
        
        # Normaliza a conta do extrato atual (SÓ NÚMEROS)
        conta_atual_limpa = re.sub(r'\D', '', str(request.conta))
        print(f"   🏦 Conta do Extrato Atual (Apenas Números): '{conta_atual_limpa}'")

        lancamentos_classificados = []
        matches = 0
        revisoes = 0

        # 🔄 LOOP PRINCIPAL CORRIGIDO (Estava faltando no código anterior)
        for idx, lanc in enumerate(request.lancamentos):
            lanc_classificado = {**lanc}
            
            # Normaliza os dados do lançamento
            tipo_lanc_norm = normalizar_texto(lanc.get('tipo', ''))
            desc_lanc_norm = normalizar_texto(lanc.get('descricao_completa', ''))
            
            regra_aplicada = False
            
            # Ignora saldos
            if "SALDO" in desc_lanc_norm or not desc_lanc_norm:
                lanc_classificado['status'] = 'ignorado'
                lancamentos_classificados.append(lanc_classificado)
                continue

            # ==========================================
            # PASSO A: Match Específico (Ex: Receita Federal)
            # ==========================================
            for regra in regras_ordenadas:
                regra_desc_norm = normalizar_texto(regra.get('descricao_parcial', ''))
                # Blindagem da conta da regra (SÓ NÚMEROS)
                regra_conta_limpa = re.sub(r'\D', '', str(regra.get('conta', '')))
                
                # Valida Conta (DEVE ser exata após normalização)
                if regra_conta_limpa != conta_atual_limpa:
                    continue

                # Se a regra tem sufixo (ex: "- RECEITA FEDERAL")
                if "-" in regra_desc_norm:
                    sufixo = regra_desc_norm.split("-", 1)[1].strip()
                    # Verifica se o sufixo está na descrição do lançamento
                    if sufixo and sufixo in desc_lanc_norm:
                        lanc_classificado['conta_debito'] = regra.get('debito')
                        lanc_classificado['conta_credito'] = regra.get('credito')
                        lanc_classificado['status'] = 'match'
                        matches += 1
                        regra_aplicada = True
                        print(f"   ⚡ [MATCH ESPECÍFICO] Linha {idx+1} '{desc_lanc_norm[:35]}...' -> D:{regra.get('debito')} C:{regra.get('credito')}")
                        break
            
            # ==========================================
            # PASSO B: Fallback Genérico
            # ==========================================
            if not regra_aplicada:
                for regra in regras_ordenadas:
                    regra_desc_norm = normalizar_texto(regra.get('descricao_parcial', ''))
                    regra_conta_limpa = re.sub(r'\D', '', str(regra.get('conta', '')))
                    
                    if regra_conta_limpa != conta_atual_limpa:
                        continue

                    # Regra genérica NÃO tem hífen de sufixo
                    if "-" not in regra_desc_norm:
                        # Match exato no tipo OU início da descrição
                        if tipo_lanc_norm == regra_desc_norm or desc_lanc_norm.startswith(regra_desc_norm):
                            lanc_classificado['conta_debito'] = regra.get('debito')
                            lanc_classificado['conta_credito'] = regra.get('credito')
                            lanc_classificado['status'] = 'match'
                            matches += 1
                            regra_aplicada = True
                            print(f"   🔄 [FALLBACK GENÉRICO] Linha {idx+1} '{desc_lanc_norm[:35]}...' herdou de '{regra_desc_norm}'")
                            break

            if not regra_aplicada:
                lanc_classificado['status'] = 'pendente'
                revisoes += 1
                # Log detalhado APENAS para os primeiros 3 pendentes para ajudar no debug
                if revisoes <= 3:
                    print(f"   ❓ [PENDENTE] Linha {idx+1} '{desc_lanc_norm[:35]}...' (Tipo: '{tipo_lanc_norm}') NÃO encontrou regra compatível.")

            lancamentos_classificados.append(lanc_classificado)

        print(f"   📊 RESULTADO FINAL: {matches} automáticos | {revisoes} manuais")
        print(f"{'='*80}\n")

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
            "summary": {"matches": matches, "revisoes": revisoes},
        }

    except Exception as e:
        import traceback
        print(f"\n❌ ERRO CRÍTICO EM /api/classificar: {str(e)}")
        traceback.print_exc()
        # Retorna os dados originais para não quebrar o frontend, mas loga o erro
        return {
            "success": False,
            "error": str(e),
            "data": request.model_dump(),
            "summary": {"matches": 0, "revisoes": request.total_lancamentos}
        }


@app.post("/api/salvar-regras-lote")
async def salvar_regras_lote(request: SalvarRegrasLoteRequest):
    """Salva regras aprendidas de classificação automática em lote."""
    if not request.regras:
        raise HTTPException(status_code=400, detail="Nenhuma regra para salvar")

    try:
        arquivo_regras = salvar_regras_em_arquivo(request.regras, request.criado_por)
        print(f"\n💾 {len(request.regras)} regras salvas/atualizadas por '{request.criado_por}'")
        
        return {
            "success": True,
            "message": f"{len(request.regras)} regra(s) salva(s) com sucesso. Próximos extratos já virão classificados!",
            "regras_salvas": len(request.regras),
            "arquivo": str(arquivo_regras),
        }
    except Exception as e:
        print(f"❌ Erro ao salvar regras: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao salvar regras: {str(e)}")


@app.get("/api/regras")
async def listar_regras():
    """Lista todas as regras aprendidas."""
    regras = carregar_regras_aprendidas()
    return {
        "success": True,
        "regras": regras,
        "total": len(regras),
    }


@app.post("/api/gerar-csv")
async def gerar_csv(request: GerarCSVRequest):
    """Gera arquivo CSV incluindo as colunas Conta Débito e Conta Crédito."""
    if not request.lancamentos:
        raise HTTPException(status_code=400, detail="Nenhum lançamento para exportar")

    try:
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_ALL)

        writer.writerow([
            "Data", "Dia", "Tipo", "Documento", "Descricao", "Historico", 
            "Conta_Debito", "Conta_Credito", "Debito", "Credito", "Status"
        ])

        for lanc in request.lancamentos:
            data_str = lanc.get("data_completa")
            if not data_str:
                dia = str(lanc.get("dia", "")).zfill(2)
                mes_ano = request.competencia
                if "/" in mes_ano and len(mes_ano.split("/")[0]) <= 3:
                     meses_map = {"JAN":"01", "FEV":"02", "MAR":"03", "ABR":"04", "MAI":"05", "JUN":"06", "JUL":"07", "AGO":"08", "SET":"09", "OUT":"10", "NOV":"11", "DEZ":"12"}
                     partes = mes_ano.split("/")
                     mes_num = meses_map.get(partes[0].upper(), "01")
                     data_str = f"{dia}/{mes_num}/{partes[1]}"
                else:
                    data_str = f"{dia}/{mes_ano}"

            valor = lanc.get("valor", 0)
            sinal = lanc.get("sinal", "+")

            debito = f"{valor:.2f}" if sinal == "-" else ""
            credito = f"{valor:.2f}" if sinal in ("+", "C") else ""

            cta_deb = lanc.get("conta_debito", "")
            cta_cred = lanc.get("conta_credito", "")

            writer.writerow([
                data_str, lanc.get("dia", ""), lanc.get("tipo", ""), lanc.get("documento", ""),
                lanc.get("descricao_completa", lanc.get("descricao", "")), lanc.get("descricao_completa", ""),
                cta_deb, cta_cred, debito, credito, lanc.get("status", "pendente"),
            ])

        exports_dir = Path("data/exports")
        exports_dir.mkdir(parents=True, exist_ok=True)
        
        banco_safe = request.banco.replace(" ", "_").upper()
        comp_safe = request.competencia.replace("/", "").replace(" ", "")
        filename = f"extrato_{banco_safe}_{comp_safe}_{uuid.uuid4().hex[:6]}.csv"
        
        filepath = exports_dir / filename

        with open(filepath, "w", encoding="utf-8-sig") as f:
            f.write(output.getvalue())

        print(f"📄 CSV gerado: {filepath} ({len(request.lancamentos)} lançamentos c/ contas contábeis)")

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
@app.get("/api/download/{filename}")
async def download_csv(filename: str):
    """Retorna o arquivo CSV para download."""
    filepath = Path("data/exports") / filename
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {filename}")

    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )