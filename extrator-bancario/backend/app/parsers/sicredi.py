"""
Parser de extratos bancários do SICREDI.
Versão que extrai ~90 lançamentos com nomes completos.
"""
import re
import pdfplumber
from pathlib import Path
from typing import Optional
from datetime import datetime
from app.models.lancamento import (
    ExtratoBancario,
    LancamentoBancario,
    SinalMovimento,
)
from app.parsers.base import BaseParser


class ParserSicrediError(Exception):
    pass


class ParserSicredi(BaseParser):
    
    @property
    def nome_banco(self) -> str:
        return "SICREDI"
    
    @property
    def codigo_banco(self) -> str:
        return "sicredi"
    
    REGEX_COOPERATIVA = re.compile(r'Cooperativa[:\s]+(\d{4})')
    REGEX_CONTA = re.compile(r'Conta(?:\s+Corrente)?[:\s]+([\d\-=\s]+)')
    REGEX_PERIODO = re.compile(
        r'(?:Extrato\s*\(Período de|Extrato\s+Dados referentes ao período|Dados referentes ao periodo)\s+'
        r'(\d{2}/\d{2}/\d{4})\s+a\s+(\d{2}/\d{2}/\d{4})'
    )
    REGEX_ASSOCIADO = re.compile(r'Associado[:\s]*(.+?)(?:\n|$)')
    
    REGEX_LANCAMENTO = re.compile(
        r'^(\d{2}/\d{2}/\d{4})\s+'
        r'(RECEBIMENTO\s+PIX|PAGAMENTO\s+PIX|TED|LIQUIDACAO\s+BOLETO|'
        r'CESTA\s+DE\s+RELACIONAMENTO|DEBITO\s+TED/IB|'
        r'DOC/TED\s+INTERNET\s+PJ|DEBITO\s+CONVENIOS|DEP\s+DINHEIRO)\s+'
        r'(\d{11,14})\s+'
        r'(.+?)\s+'
        r'(PIX_CRED|PIX_DEB|PIX_CRE|CX\d+|\d+)?\s*'
        r'(-?[\d.,]+)\s+'
        r'([\d.,]+)\s*$'
    )
    
    REGEX_SIMPLES = re.compile(
        r'^(\d{2}/\d{2}/\d{4})\s+'
        r'(CESTA\s+DE\s+RELACIONAMENTO|DOC/TED\s+INTERNET\s+PJ)\s+'
        r'(-?[\d.,]+)\s+'
        r'([\d.,]+)\s*$'
    )
    
    def detecta_banco(self, texto_pdf: str) -> bool:
        texto_upper = texto_pdf.upper()
        return "SICREDI" in texto_upper and ("COOPERATIVA:" in texto_upper or "CONTA:" in texto_upper)
    
    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
        caminho_pdf = Path(caminho_pdf)
        if not caminho_pdf.exists():
            raise ParserSicrediError(f"Arquivo não encontrado: {caminho_pdf}")
        
        texto = self._extrair_texto_pdf(caminho_pdf)
        texto = self._limpar_texto(texto)
        
        if not self.detecta_banco(texto):
            raise ParserSicrediError("O PDF não parece ser um extrato do Sicredi")
        
        cabecalho = self._extrair_cabecalho(texto)
        lancamentos = self._extrair_lancamentos(texto)
        
        return ExtratoBancario(
            banco=self.nome_banco,
            agencia=cabecalho["cooperativa"],
            conta=cabecalho["conta"].replace('=', '-').strip(),
            nome_cliente=cabecalho["associado"],
            competencia=cabecalho["competencia"],
            lancamentos=lancamentos,
        )
    
    def _limpar_texto(self, texto: str) -> str:
        texto = texto.replace('：', ':')
        texto = texto.replace('‐', '-')
        texto = texto.replace('−', '-')
        texto = texto.replace('–', '-')
        texto = texto.replace('—', '-')
        texto = texto.replace('，', ',')
        texto = texto.replace('。', '.')
        texto = texto.replace('√', '')
        # PRESERVA quebras de linha e barras!
        texto = re.sub(r'[ \t]+', ' ', texto)
        return texto
    
    def _extrair_texto_pdf(self, caminho_pdf: Path) -> str:
        texto_parts = []
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages:
                texto = pagina.extract_text()
                if texto:
                    texto_parts.append(texto)
        return "\n".join(texto_parts)
    
    def _extrair_cabecalho(self, texto: str) -> dict:
        match_coop = self.REGEX_COOPERATIVA.search(texto)
        match_conta = self.REGEX_CONTA.search(texto)
        match_periodo = self.REGEX_PERIODO.search(texto)
        match_associado = self.REGEX_ASSOCIADO.search(texto)
        
        if not all([match_coop, match_conta, match_periodo]):
            raise ParserSicrediError("Erro ao extrair cabeçalho")
        
        data_inicio = match_periodo.group(1)
        data_obj = datetime.strptime(data_inicio, "%d/%m/%Y")
        meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
        competencia = f"{meses[data_obj.month - 1]}/{data_obj.year}"
        
        return {
            "cooperativa": match_coop.group(1),
            "conta": match_conta.group(1).strip(),
            "associado": match_associado.group(1).strip() if match_associado else "N/A",
            "competencia": competencia,
        }
    
    def _extrair_lancamentos(self, texto: str) -> list[LancamentoBancario]:
        linhas = texto.split("\n")
        lancamentos = []
        
        for linha in linhas:
            linha = linha.strip().lstrip('|').strip()
            if not linha:
                continue
            
            if any(p in linha.upper() for p in [
                "DATA", "SALDO", "LANÇAMENTOS", "VALORES",
                "SICREDI FONE", "COOPERATIVA", "ASSOCIADO",
                "EXTRATO", "DADOS REFERENTES", "---"
            ]):
                continue
            
            lanc = self._parsear_completo(linha)
            if lanc:
                lancamentos.append(lanc)
                continue
            
            lanc = self._parsear_simples(linha)
            if lanc:
                lancamentos.append(lanc)
        
        return lancamentos
    
    def _parsear_completo(self, linha: str) -> Optional[LancamentoBancario]:
        match = self.REGEX_LANCAMENTO.match(linha)
        if not match:
            return None
        
        try:
            data_str, tipo, documento, nome, codigo, valor_str, saldo_str = match.groups()
            dia = int(data_str.split("/")[0])
            valor_limpo = valor_str.replace(".", "").replace(",", ".")
            valor = abs(float(valor_limpo))
            sinal = SinalMovimento.SAIDA if valor_str.startswith("-") or (codigo and "DEB" in codigo.upper()) else SinalMovimento.ENTRADA
            descricao = f"{tipo} - {nome}"
            
            return LancamentoBancario(
                dia=dia,
                tipo=tipo,
                documento=documento,
                valor=valor,
                sinal=sinal,
                descricao_completa=descricao,
            )
        except Exception as e:
            return None
    
    def _parsear_simples(self, linha: str) -> Optional[LancamentoBancario]:
        match = self.REGEX_SIMPLES.match(linha)
        if not match:
            return None
        
        try:
            data_str, tipo, valor_str, saldo_str = match.groups()
            dia = int(data_str.split("/")[0])
            valor_limpo = valor_str.replace(".", "").replace(",", ".")
            valor = abs(float(valor_limpo))
            sinal = SinalMovimento.SAIDA if valor_str.startswith("-") else SinalMovimento.ENTRADA
            
            return LancamentoBancario(
                dia=dia,
                tipo=tipo,
                documento="000000",
                valor=valor,
                sinal=sinal,
                descricao_completa=tipo,
            )
        except Exception as e:
            return None