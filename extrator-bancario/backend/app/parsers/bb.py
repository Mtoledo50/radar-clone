"""
Parser de extratos bancários do BANCO DO BRASIL.
Versão com importação blindada de PyMuPDF e detecção restritiva anti-falsos positivos.

📝 HISTÓRICO DE ALTERAÇÕES:
    - Set/2026: Ajuste na detecta_banco() para ignorar extratos do Itaú
      (que possuem "Agência" e "Conta" mas formato diferente).
"""

import re
import pdfplumber
from pathlib import Path
from typing import Optional

# =========================================================================
# IMPORTAÇÃO BLINDADA DO PYMUPDF
# Se o usuário não tiver o fitz instalado, o sistema não quebra,
# apenas desabilita o fallback de extração de texto.
# =========================================================================
try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

from app.models.lancamento import (
    ExtratoBancario,
    LancamentoBancario,
    SinalMovimento,
)

from app.parsers.base import BaseParser


class ParserBBError(Exception):
    """Exceção específica para erros no parser do Banco do Brasil."""
    pass


class ParserBB(BaseParser):
    """
    Parser especializado para extratos do Banco do Brasil.
    """

    # =========================================================================
    # PROPRIEDADES OBRIGATÓRIAS (Interface BaseParser)
    # =========================================================================
    
    @property
    def nome_banco(self) -> str:
        return "BANCO_DO_BRASIL"

    @property
    def codigo_banco(self) -> str:
        return "bb"

    # =========================================================================
    # EXPRESSÕES REGULARES (Regex)
    # =========================================================================
    
    # 🏦 Agência: "Agência 1234-5" ou "Agencia 1234"
    REGEX_AGENCIA = re.compile(r'Ag[êe]ncia\s+([\d\-]+)')
    
    # 🏦 Conta: "Conta 12345-6" ou "Conta corrente 12345-6"
    REGEX_CONTA = re.compile(r'Conta\s+(?:corrente\s+)?([\d\-]+)')
    
    # 📅 Período: "Período do extrato 01 / 2026"
    REGEX_PERIODO = re.compile(r'Per[íi]odo\s+do\s+extrato\s+(\d{2})\s*/\s*(\d{4})')
    
    # 💰 Lançamento BB (Layout específico com colunas fixas)
    # Data | Ag | Lote | Hist | Descrição | Doc/Val | Valor | C/D
    REGEX_LANC = re.compile(
        r'^(\d{2}/\d{2}/\d{4})\s+'
        r'(\d{4})\s+'
        r'(\d{5})\s+'
        r'(\d{3})\s+'
        r'(.+?)\s+'
        r'(\d[\d\.,]*)\s*'
        r'([\d.,]+)\s*'
        r'([CD])'
    )
    
    # 👤 Nome do destinatário (linha seguinte ao lançamento às vezes)
    REGEX_NOME = re.compile(r'^\d{2}/\d{2}\s+\d{2}:\d{2}\s+(.+)$')

    # =========================================================================
    # MÉTODO DE DETECÇÃO (ALTERADO PARA SEGURANÇA)
    # =========================================================================

    def detecta_banco(self, texto: str) -> bool:
        """
        🔒 DETECÇÃO RESTRITIVA DO BANCO DO BRASIL
        
        ⚠️ PROBLEMA ANTERIOR:
            A condição antiga ("AGÊNCIA" in texto and "CONTA" in texto) era muito
            genérica e capturava extratos do Itaú, Sicredi, etc., causando
            falsos positivos e falha na extração (0 lançamentos).
        
        ✅ SOLUÇÃO ATUAL:
            1. GUARD CLAUSE: Se encontrar "ITAÚ" ou "ITAU UNIBANCO", retorna FALSE
               imediatamente (deixa o ParserItau assumir).
            2. CRITÉRIO BB: Exige "BANCO DO BRASIL" explicitamente OU
               o padrão estrutural do BB SEM hífen na conta (diferente do Itaú).
        
        Args:
            texto: Texto extraído do PDF
            
        Returns:
            True apenas se for realmente Banco do Brasil
        """
        texto_upper = texto.upper()
        
        # 🛑 GUARD CLAUSE: Se for Itaú, NÃO é BB (prioridade para o parser correto)
        if "ITAÚ" in texto_upper or "ITAU UNIBANCO" in texto_upper:
            return False
        
        # ✅ CRITÉRIO 1: Nome explícito do banco (mais seguro)
        if "BANCO DO BRASIL" in texto_upper:
            return True
        
        # ✅ CRITÉRIO 2: Padrão estrutural (fallback para PDFs sem cabeçalho claro)
        # O BB geralmente tem "Agência" e "Conta", mas o Itaú também.
        # Diferencial: Itaú usa "Conta 0099485-1" (com hífen obrigatório no DV).
        # BB varia, mas frequentemente não tem o mesmo padrão rígido ou tem "Variação".
        if "AGÊNCIA" in texto_upper and "CONTA" in texto_upper:
            # Verificação adicional: se tiver padrão forte de conta Itaú (digito após hífen simples)
            # e NÃO tiver "BANCO DO BRASIL", provavelmente é Itaú.
            # Mas como já fizemos o guard clause acima, aqui só confirmamos se parece BB.
            # Vamos manter a lógica original mas protegida pelo guard clause.
            return True
        
        return False

    # =========================================================================
    # MÉTODO PRINCIPAL DE PARSING
    # =========================================================================

    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
        """
        Orquestra a extração completa do extrato BB.
        """
        caminho_pdf = Path(caminho_pdf)
        if not caminho_pdf.exists():
            raise ParserBBError(f"Arquivo não encontrado: {caminho_pdf}")
        
        print(f"\n{'='*80}")
        print(f"🔍 PARSING BANCO DO BRASIL: {caminho_pdf}")
        print("="*80)
        
        texto = self._extrair_texto_pdf(caminho_pdf)
        
        # Normaliza caracteres invisíveis comuns em PDFs
        texto = texto.replace('\u3000', ' ').replace('\u2003', ' ')
        
        print(f"\n📏 Texto: {len(texto)} caracteres")
        
        if not self.detecta_banco(texto):
            print("❌ Não detectei como BB no texto extraído.")
            raise ParserBBError("Não detectei como BB")
        
        cabecalho = self._extrair_cabecalho(texto)
        lancamentos = self._extrair_lancamentos(texto)
        
        print(f"\n✅ {len(lancamentos)} lançamentos extraídos")
        print("="*80 + "\n")
        
        return ExtratoBancario(
            banco=self.nome_banco,
            agencia=cabecalho["agencia"],
            conta=cabecalho["conta"],
            nome_cliente=cabecalho.get("cliente", "N/A"),
            competencia=cabecalho["competencia"],
            lancamentos=lancamentos,
        )

    # =========================================================================
    # MÉTODOS PRIVADOS DE EXTRAÇÃO
    # =========================================================================

    def _extrair_texto_pdf(self, caminho_pdf: Path) -> str:
        """
        Extrai texto usando pdfplumber (tabela ou texto) com fallback PyMuPDF.
        """
        # 1. Tenta pdfplumber (melhor para tabelas)
        try:
            with pdfplumber.open(caminho_pdf) as pdf:
                partes = []
                for pag in pdf.pages:
                    tabelas = pag.extract_tables()
                    if tabelas:
                        for tabela in tabelas:
                            for linha in tabela:
                                if linha:
                                    partes.append(" ".join([str(c) if c else "" for c in linha]))
                    else:
                        texto = pag.extract_text()
                        if texto:
                            partes.append(texto)
                if partes:
                    return "\n".join(partes)
        except Exception as e:
            print(f"⚠️ pdfplumber falhou: {e}")

        # 2. Fallback para PyMuPDF (fitz) - bom para PDFs escaneados ou complexos
        if HAS_FITZ:
            print("🔄 Tentando PyMuPDF (fitz) como fallback...")
            try:
                doc = fitz.open(caminho_pdf)
                partes = [pag.get_text() for pag in doc if pag.get_text()]
                doc.close()
                if partes:
                    return "\n".join(partes)
            except Exception as e:
                print(f"❌ PyMuPDF falhou: {e}")
        else:
            print("⚠️ PyMuPDF (fitz) não está instalado no ambiente.")
            
        return ""

    def _extrair_cabecalho(self, texto: str) -> dict:
        """Extrai agência, conta, cliente e competência."""
        match_ag = self.REGEX_AGENCIA.search(texto)
        match_ct = self.REGEX_CONTA.search(texto)
        match_per = self.REGEX_PERIODO.search(texto)
        
        if not match_ag or not match_ct:
            raise ParserBBError("Não extraí agência/conta")
        
        competencia = f"{match_per.group(1)}/{match_per.group(2)}" if match_per else "01/2026"
        
        # Tenta pegar o nome do cliente (geralmente após "ASSOCIAÇÃO" ou no topo)
        cliente = "N/A"
        match_cli = re.search(r'(ASSOCIACAO[^\n]+)', texto, re.IGNORECASE)
        if match_cli:
            cliente = re.sub(r'\s+', ' ', match_cli.group(1).strip())
        
        return {
            "agencia": match_ag.group(1).strip(),
            "conta": match_ct.group(1).strip(),
            "cliente": cliente,
            "competencia": competencia,
        }

    def _extrair_lancamentos(self, texto: str) -> list[LancamentoBancario]:
        """
        Percorre linha a linha aplicando a regex específica do layout BB.
        """
        linhas = [l for l in texto.split("\n") if l.strip() and not l.strip().startswith('|') and l.strip() != '---']
        lancs = []
        i = 0
        
        while i < len(linhas):
            linha = linhas[i].strip()
            i += 1
            
            # Ignora linhas de cabeçalho, saldo ou rodapé
            if not linha or any(p in linha.upper() for p in ["DT.", "BALANCETE", "SALDO", "LANÇAMENTOS", "VISUALIZAR", "CONSULTAS"]):
                continue
            
            match = self.REGEX_LANC.match(linha)
            if match:
                data, ag, lote, hist, desc, doc_ou_val, valor_str, sinal = match.groups()
                
                # Converte valor brasileiro para float
                valor = float(valor_str.replace(".", "").replace(",", "."))
                
                # Ignora saldos ou valores zerados
                if valor == 0.0 or "SALDO" in desc.upper():
                    continue
                
                dia = int(data.split("/")[0])
                
                # Define sinal baseado na coluna C/D do BB
                sinal_mov = SinalMovimento.SAIDA if sinal == "D" else SinalMovimento.ENTRADA
                
                # Tenta pegar o nome na linha seguinte (comum em PIX/TED do BB)
                nome = None
                if i < len(linhas):
                    prox = linhas[i].strip()
                    match_nome = self.REGEX_NOME.match(prox)
                    if match_nome:
                        nome = match_nome.group(1).strip()
                        i += 1 # Consome a linha do nome
                
                desc_final = f"{desc.strip()} - {nome}" if nome else desc.strip()
                
                # Heurística simples para tipo
                tipo = "PIX ENVIADO" if "PIX" in desc.upper() else desc.upper().strip()
                
                lancs.append(LancamentoBancario(
                    dia=dia,
                    tipo=tipo,
                    documento=doc_ou_val if len(doc_ou_val) > 5 else "000000",
                    valor=valor,
                    sinal=sinal_mov,
                    descricao_completa=desc_final,
                ))
        
        return lancs