"""
Parser de extratos bancários do SICREDI.
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
    
    # Regex para extrair cabeçalho (VERSÕES FLEXÍVEIS)
    REGEX_COOPERATIVA = re.compile(r'Cooperativa[:\s]+(\d{4})')
    REGEX_CONTA = re.compile(r'Conta(?:\s+Corrente)?[:\s]+([\d\-=\s]+)')  # Aceita hífen ou igual
    REGEX_PERIODO = re.compile(
        r'(?:Extrato\s*\(Período de|Extrato\s+Dados referentes ao período|Dados referentes ao periodo)\s+'
        r'(\d{2}/\d{2}/\d{4})\s+a\s+(\d{2}/\d{2}/\d{4})'
    )
    REGEX_ASSOCIADO = re.compile(r'Associado[:\s]*(.+?)(?:\n|$)')   
    
    # ✅ CORREÇÃO AQUI: \S+ no grupo do Código para aceitar underlines (PIX_CRED)
    REGEX_LANCAMENTO = re.compile(
        r'^(\d{2}/\d{2}/\d{4})\s+'                           # Data
        r'(.+?)\s+'                                            # Tipo (RECEBIMENTO PIX, etc)
        r'(\d{11,14}|\d{6,})\s+'                              # Documento (CPF/CNPJ)
        r'(.+?)\s+'                                            # Descrição (Nome da pessoa)
        r'(\S+)\s+'                                            # Código (PIX_CRED, CX943633, etc)
        r'(-?[\d.,]+)\s+'                                      # Valor
        r'([\d.,]+)$'                                          # Saldo
    )
    
    # Regex para lançamentos simples (ex: tarifas sem nome)
    REGEX_LANCAMENTO_SIMPLES = re.compile(
        r'^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+(-?[\d.,]+)\s+([\d.,]+)$'
    )
    
    TIPOS_ENTRADA = ['RECEBIMENTO PIX', 'TED']
    TIPOS_SAIDA = [
        'PAGAMENTO PIX', 'LIQUIDACAO BOLETO', 'CESTA DE RELACIONAMENTO', 
        'DEBITO TED/IB', 'DOC/TED INTERNET PJ', 'DEBITO CONVENIOS'
    ]
    def _limpar_texto(self, texto: str) -> str:
    """
    Limpa caracteres especiais e normaliza o texto.
    """
    # Substitui caracteres especiais por versões normais
    texto = texto.replace('：', ':')  # Dois pontos chinês
    texto = texto.replace('=', '-')   # Igual por hífen
    texto = texto.replace('‐', '-')   # Hífen diferente
    texto = texto.replace('−', '-')   # Menos
    texto = texto.replace('–', '-')   # En dash
    texto = texto.replace('—', '-')   # Em dash
    
    # Remove espaços múltiplos
    import re
    texto = re.sub(r'\s+', ' ', texto)
    
    return texto

    def detecta_banco(self, texto_pdf: str) -> bool:
        texto_upper = texto_pdf.upper()
        return "SICREDI" in texto_upper and ("COOPERATIVA:" in texto_upper or "CONTA:" in texto_upper)
    
    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
    caminho_pdf = Path(caminho_pdf)
    
    if not caminho_pdf.exists():
        raise ParserSicrediError(f"Arquivo não encontrado: {caminho_pdf}")
    
    # 1. Extrai texto bruto do PDF
    texto_completo = self._extrair_texto_pdf(caminho_pdf)
    
    # 2. LIMPA o texto (normaliza caracteres)
    texto_completo = self._limpar_texto(texto_completo)
    
    # 3. Valida se é realmente um extrato do Sicredi
    if not self.detecta_banco(texto_completo):
        raise ParserSicrediError("O PDF não parece ser um extrato do Sicredi")
    
    # 4. Extrai cabeçalho
    cabecalho = self._extrair_cabecalho(texto_completo)
    
    # 5. Extrai lançamentos
    lancamentos = self._extrair_lancamentos(texto_completo)
    
    # 6. Monta o objeto final
    return ExtratoBancario(
        banco=self.nome_banco,
        agencia=cabecalho["cooperativa"],
        conta=cabecalho["conta"].replace('=', '-').strip(),  # Normaliza conta
        nome_cliente=cabecalho["associado"],
        competencia=cabecalho["competencia"],
        lancamentos=lancamentos,
    )
    
    def _extrair_texto_pdf(self, caminho_pdf: Path) -> str:
        texto_parts = []
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages:
                texto = pagina.extract_text()
                if texto: texto_parts.append(texto)
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
            linha = linha.strip()
            if not linha: continue
            
            # Filtros de linhas inúteis
            if any(linha.startswith(p) for p in ["Data Descrição", "SALDO ANTERIOR", "Lançamentos Futuros", "Valores das", "Sicredi Fone", "SAC ", "Ouvidoria"]):
                continue
            
            # Tenta regex completa primeiro
            lanc = self._parsear_lancamento_completo(linha)
            if lanc:
                lancamentos.append(lanc)
                continue
            
            # Tenta regex simples
            lanc = self._parsear_lancamento_simples(linha)
            if lanc:
                lancamentos.append(lanc)
        
        return lancamentos
    
    def _parsear_lancamento_completo(self, linha: str) -> Optional[LancamentoBancario]:
        match = self.REGEX_LANCAMENTO.match(linha)
        if not match: return None
        
        data_str, tipo_desc, documento, descricao, codigo, valor_str, saldo_str = match.groups()
        
        try:
            dia = datetime.strptime(data_str, "%d/%m/%Y").day
        except ValueError: return None
        
        tipo = self._identificar_tipo(tipo_desc)
        
        valor_limpo = valor_str.replace(".", "").replace(",", ".")
        try:
            valor = abs(float(valor_limpo))
        except ValueError: return None
        
        # Define sinal baseado no valor negativo ou código de débito
        if valor_str.startswith("-") or "DEB" in codigo.upper():
            sinal = SinalMovimento.SAIDA
        else:
            sinal = SinalMovimento.ENTRADA
        
        # Limpeza final de segurança (caso o tipo venha duplicado na descrição)
        descricao_limpa = descricao.strip()
        if descricao_limpa.upper().startswith(tipo):
            descricao_limpa = descricao_limpa[len(tipo):].strip()
        
        # Remove documento se tiver sobrado no início da descrição
        partes = descricao_limpa.split()
        if partes and len(partes[0]) >= 10 and partes[0].replace(".", "").replace("-", "").isdigit():
            descricao_limpa = " ".join(partes[1:])
            
        descricao_final = descricao_limpa if descricao_limpa else tipo
        
        return LancamentoBancario(
            dia=dia, tipo=tipo, documento=documento,
            valor=valor, sinal=sinal, descricao_completa=descricao_final,
        )
    
    def _parsear_lancamento_simples(self, linha: str) -> Optional[LancamentoBancario]:
        match = self.REGEX_LANCAMENTO_SIMPLES.match(linha)
        if not match: return None
        
        data_str, descricao, valor_str, saldo_str = match.groups()
        
        try:
            dia = datetime.strptime(data_str, "%d/%m/%Y").day
        except ValueError: return None
        
        valor_limpo = valor_str.replace(".", "").replace(",", ".")
        try:
            valor = abs(float(valor_limpo))
        except ValueError: return None
        
        sinal = SinalMovimento.SAIDA if valor_str.startswith("-") else SinalMovimento.ENTRADA
        tipo = self._identificar_tipo(descricao)
        
        return LancamentoBancario(
            dia=dia, tipo=tipo, documento="000000",
            valor=valor, sinal=sinal, descricao_completa=descricao,
        )
    
    def _identificar_tipo(self, texto: str) -> str:
        texto_upper = texto.upper()
        for tipo in self.TIPOS_ENTRADA + self.TIPOS_SAIDA:
            if tipo in texto_upper:
                return tipo
        partes = texto.split()
        return " ".join(partes[:3]) if len(partes) >= 3 else texto