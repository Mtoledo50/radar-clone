"""
Parser de extratos bancários do BANRISUL.
Versão com importação blindada de PyMuPDF.
"""
import re
import pdfplumber
from pathlib import Path
from typing import Optional

# Importação blindada do PyMuPDF
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


class ParserBanrisulError(Exception):
    pass


class ParserBanrisul(BaseParser):
    
    @property
    def nome_banco(self) -> str:
        return "BANRISUL"
    
    @property
    def codigo_banco(self) -> str:
        return "banrisul"
    
    REGEX_AGENCIA = re.compile(r'AGENCIA[：:]\s*(\d{4})')
    REGEX_CONTA = re.compile(r'CONTA[.：:]+\s*([\d.\-]+)')
    REGEX_NOME = re.compile(r'NOME[.：:]+\s*(.+?)(?:\n|$)')
    REGEX_COMPETENCIA = re.compile(r'MOVIMENTOS\s+(\w{3}/\d{4})')
    
    REGEX_INICIO_DIA = re.compile(r'^(\d{2})\s+(.+)$')
    REGEX_FIM_DIA = re.compile(r'^SALDO NA DATA\s+([\d.,]+)')
    REGEX_LANCAMENTO = re.compile(
        r'^(?P<tipo>[A-Z][A-Z\s./]+?)\s+'
        r'(?P<doc>\d{6})\s+'
        r'(?P<valor>[\d.,]+)'
        r'(?P<sinal>-)?'
        r'\s*$'
    )
    REGEX_CPF_CNPJ = re.compile(r'^CPF/CNPJ[：:]\s*(\d{11,14})\s*$', re.IGNORECASE)
    REGEX_NOME_DEST = re.compile(r'^NOME[：:]\s*(.+?)\s*$', re.IGNORECASE)

    def detecta_banco(self, texto_pdf: str) -> bool:
        texto_upper = texto_pdf.upper()
        return "BANRISUL" in texto_upper and ("AGENCIA" in texto_upper or "CONTA" in texto_upper)

    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
        caminho_pdf = Path(caminho_pdf)
        if not caminho_pdf.exists():
            raise ParserBanrisulError(f"Arquivo não encontrado: {caminho_pdf}")
        
        print(f"\n{'='*80}")
        print(f"🔍 PARSING BANRISUL: {caminho_pdf}")
        print("="*80)
        
        texto = self._extrair_texto_pdf(caminho_pdf)
        texto = texto.replace('：', ':').replace('，', ',').replace('。', '.').replace('√', '')
        
        print(f"\n📏 Texto extraído: {len(texto)} caracteres")
        
        if not self.detecta_banco(texto):
            print("❌ Não detectei como Banrisul no texto extraído.")
            raise ParserBanrisulError("Não detectei como extrato do Banrisul")
        
        cabecalho = self._extrair_cabecalho(texto)
        lancamentos = self._extrair_lancamentos(texto)
        
        print(f"\n✅ {len(lancamentos)} lançamentos extraídos")
        print("="*80 + "\n")
        
        return ExtratoBancario(
            banco=self.nome_banco,
            agencia=cabecalho["agencia"],
            conta=cabecalho["conta"],
            nome_cliente=cabecalho["nome"],
            competencia=cabecalho["competencia"],
            lancamentos=lancamentos,
        )

    def _extrair_texto_pdf(self, caminho_pdf: Path) -> str:
        # 1. Tenta pdfplumber
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

        # 2. Fallback para PyMuPDF (fitz)
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
        match_agencia = self.REGEX_AGENCIA.search(texto)
        match_conta = self.REGEX_CONTA.search(texto)
        match_nome = self.REGEX_NOME.search(texto)
        match_comp = self.REGEX_COMPETENCIA.search(texto)
        
        if not all([match_agencia, match_conta, match_nome, match_comp]):
            raise ParserBanrisulError("Não extraí todos os dados do cabeçalho")
        
        return {
            "agencia": match_agencia.group(1),
            "conta": match_conta.group(1).strip(),
            "nome": match_nome.group(1).strip(),
            "competencia": match_comp.group(1),
        }

    def _extrair_lancamentos(self, texto: str) -> list[LancamentoBancario]:
        linhas = [l for l in texto.split("\n") if not l.strip().startswith('|') and l.strip() != '---']
        lancamentos = []
        dia_atual = None
        i = 0
        
        while i < len(linhas):
            linha = linhas[i].strip()
            i += 1
            
            if not linha:
                continue
            
            match_dia = self.REGEX_INICIO_DIA.match(linha)
            if match_dia:
                dia_atual = int(match_dia.group(1))
                resto = match_dia.group(2)
                lanc = self._parsear_lancamento(dia_atual, resto)
                if lanc:
                    self._buscar_destinatario(linhas, i, lanc)
                    lancamentos.append(lanc)
            else:
                if dia_atual and not self.REGEX_FIM_DIA.match(linha):
                    if not linha.startswith("SALDO") and not linha.startswith("++"):
                        lanc = self._parsear_lancamento(dia_atual, linha)
                        if lanc:
                            self._buscar_destinatario(linhas, i, lanc)
                            lancamentos.append(lanc)
        
        return lancamentos

    def _buscar_destinatario(self, linhas: list, pos: int, lanc: LancamentoBancario):
        i = pos
        while i < len(linhas) and i < pos + 3:
            linha = linhas[i].strip()
            match_cpf = self.REGEX_CPF_CNPJ.match(linha)
            if match_cpf:
                lanc.documento = match_cpf.group(1)
                i += 1
                continue
            match_nome = self.REGEX_NOME_DEST.match(linha)
            if match_nome:
                lanc.nome_destinatario = match_nome.group(1).strip()
                lanc.descricao_completa = f"{lanc.tipo} - {lanc.nome_destinatario}"
                i += 1
                continue
            break

    def _parsear_lancamento(self, dia: int, linha: str) -> Optional[LancamentoBancario]:
        match = self.REGEX_LANCAMENTO.match(linha)
        if not match:
            return None
        
        dados = match.groupdict()
        tipo = " ".join(dados["tipo"].split())
        valor = float(dados["valor"].replace(".", "").replace(",", "."))
        sinal = SinalMovimento.SAIDA if dados["sinal"] == "-" else SinalMovimento.ENTRADA
        
        return LancamentoBancario(
            dia=dia,
            tipo=tipo,
            documento=dados["doc"],
            valor=valor,
            sinal=sinal,
            descricao_completa=tipo,
        )