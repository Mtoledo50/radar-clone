"""
Parser de extratos bancários do BANRISUL.

Responsável por:
  1. Ler o PDF nativo (não escaneado)
  2. Extrair cabeçalho (agência, conta, nome, competência)
  3. Extrair cada lançamento (dia, tipo, valor, sinal, nome do PIX)
  4. Retornar estrutura ExtratoBancario pronta para o matching engine

ATENÇÃO LGPD:
  - Nomes de pessoas físicas são capturados APENAS para matching
  - Devem ser mascarados na interface (ex: MARIA L*** D*** M****)
  - Nunca devem aparecer em logs
"""
import re
import pdfplumber
from pathlib import Path
from typing import Optional

from app.models.lancamento import (
    ExtratoBancario,
    LancamentoBancario,
    SinalMovimento,
)
from app.parsers.base import BaseParser


class ParserBanrisulError(Exception):
    """Erro específico do parser Banrisul"""
    pass


class ParserBanrisul(BaseParser):
    """
    Parser para extratos do Banrisul em PDF nativo.
    
    Uso:
        parser = ParserBanrisul()
        extrato = parser.parse("Extrato_Banrisul Mes 05PS.pdf")
        print(extrato.total_lancamentos)  # ex: 32
    """
    
    @property
    def nome_banco(self) -> str:
        return "BANRISUL"
    
    @property
    def codigo_banco(self) -> str:
        return "banrisul"
    
    # Regex para identificar o início de um novo DIA no extrato
    REGEX_INICIO_DIA = re.compile(r'^(\d{2})\s+(.+)$')
    
    # Regex para identificar o fim de um dia
    REGEX_FIM_DIA = re.compile(r'^SALDO NA DATA\s+([\d.,]+)')
    
    # Regex para extrair cabeçalho
    REGEX_AGENCIA = re.compile(r'AGENCIA:\s*(\d{4})')
    REGEX_CONTA = re.compile(r'CONTA\.\.:\s*([\d.\-]+)')
    REGEX_NOME = re.compile(r'NOME\.\.\.:\s*(.+?)(?:\n|$)')
    REGEX_COMPETENCIA = re.compile(r'MOVIMENTOS\s+(\w{3}/\d{4})')
    
    # Regex para extrair um lançamento individual
    REGEX_LANCAMENTO = re.compile(
        r'^(?P<tipo>[A-Z][A-Z\s./]+?)\s+'
        r'(?P<doc>\d{6})\s+'
        r'(?P<valor>[\d.,]+)'
        r'(?P<sinal>-)?'
        r'\s*$'
    )
    
    # Regex para linha de nome (aparece na linha seguinte ao PIX)
    REGEX_NOME_DESTINATARIO = re.compile(r'^NOME:\s*(.+?)\s*$')
    
    def detecta_banco(self, texto_pdf: str) -> bool:
        """
        Detecta se o PDF é do Banrisul buscando assinaturas únicas.
        
        Assinaturas do Banrisul:
          - "BANRISUL" no cabeçalho
          - "AGENCIA:" e "CONTA..:" (formato específico)
          - "MOVIMENTOS DA CONTA CORRENTE"
        """
        texto_upper = texto_pdf.upper()
        
        # Precisa ter "BANRISUL" E pelo menos uma das outras assinaturas
        tem_banrisul = "BANRISUL" in texto_upper
        tem_agencia = "AGENCIA:" in texto_upper
        tem_conta = "CONTA..:" in texto_upper
        
        return tem_banrisul and (tem_agencia or tem_conta)
    
    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
        """
        Faz o parse completo de um PDF do Banrisul.
        
        Args:
            caminho_pdf: Caminho para o arquivo PDF
            
        Returns:
            ExtratoBancario com todos os lançamentos extraídos
            
        Raises:
            ParserBanrisulError: Se o PDF não for do Banrisul ou estiver corrompido
        """
        caminho_pdf = Path(caminho_pdf)
        
        if not caminho_pdf.exists():
            raise ParserBanrisulError(f"Arquivo não encontrado: {caminho_pdf}")
        
        # 1. Extrai texto bruto do PDF
        texto_completo = self._extrair_texto_pdf(caminho_pdf)
        
        # 2. Valida se é realmente um extrato do Banrisul
        if not self.detecta_banco(texto_completo):
            raise ParserBanrisulError("O PDF não parece ser um extrato do Banrisul")
        
        # 3. Extrai cabeçalho
        cabecalho = self._extrair_cabecalho(texto_completo)
        
        # 4. Extrai lançamentos
        lancamentos = self._extrair_lancamentos(texto_completo)
        
        # 5. Monta o objeto final
        return ExtratoBancario(
            banco=self.nome_banco,
            agencia=cabecalho["agencia"],
            conta=cabecalho["conta"],
            nome_cliente=cabecalho["nome"],
            competencia=cabecalho["competencia"],
            lancamentos=lancamentos,
        )
    
    def _extrair_texto_pdf(self, caminho_pdf: Path) -> str:
        """Extrai todo o texto do PDF usando pdfplumber"""
        texto_parts = []
        
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages:
                texto = pagina.extract_text()
                if texto:
                    texto_parts.append(texto)
        
        return "\n".join(texto_parts)
    
    def _extrair_cabecalho(self, texto: str) -> dict:
        """Extrai dados do cabeçalho (agência, conta, nome, competência)"""
        match_agencia = self.REGEX_AGENCIA.search(texto)
        match_conta = self.REGEX_CONTA.search(texto)
        match_nome = self.REGEX_NOME.search(texto)
        match_comp = self.REGEX_COMPETENCIA.search(texto)
        
        if not all([match_agencia, match_conta, match_nome, match_comp]):
            raise ParserBanrisulError("Não foi possível extrair todos os dados do cabeçalho")
        
        return {
            "agencia": match_agencia.group(1),
            "conta": match_conta.group(1).strip(),
            "nome": match_nome.group(1).strip(),
            "competencia": match_comp.group(1),
        }
    
    def _extrair_lancamentos(self, texto: str) -> list[LancamentoBancario]:
        """Extrai todos os lançamentos do extrato"""
        linhas = texto.split("\n")
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
                resto_linha = match_dia.group(2)
                
                lanc = self._parsear_lancamento(dia_atual, resto_linha)
                if lanc:
                    if i < len(linhas):
                        proxima_linha = linhas[i].strip()
                        match_nome = self.REGEX_NOME_DESTINATARIO.match(proxima_linha)
                        if match_nome:
                            lanc.nome_destinatario = match_nome.group(1).strip()
                            lanc.descricao_completa = f"{lanc.tipo} - {lanc.nome_destinatario}"
                            i += 1
                    
                    lancamentos.append(lanc)
            else:
                if dia_atual is not None:
                    if self.REGEX_FIM_DIA.match(linha):
                        continue
                    if linha.startswith("SALDO ANT") or linha.startswith("SALDO DISP"):
                        continue
                    if linha.startswith("++") or linha.startswith("--"):
                        continue
                    
                    lanc = self._parsear_lancamento(dia_atual, linha)
                    if lanc:
                        if i < len(linhas):
                            proxima_linha = linhas[i].strip()
                            match_nome = self.REGEX_NOME_DESTINATARIO.match(proxima_linha)
                            if match_nome:
                                lanc.nome_destinatario = match_nome.group(1).strip()
                                lanc.descricao_completa = f"{lanc.tipo} - {lanc.nome_destinatario}"
                                i += 1
                        
                        lancamentos.append(lanc)
        
        return lancamentos
    
    def _parsear_lancamento(self, dia: int, linha: str) -> Optional[LancamentoBancario]:
        """Converte uma linha de texto em um LancamentoBancario"""
        match = self.REGEX_LANCAMENTO.match(linha)
        if not match:
            return None
        
        dados = match.groupdict()
        tipo = " ".join(dados["tipo"].split())
        
        valor_str = dados["valor"].replace(".", "").replace(",", ".")
        try:
            valor = float(valor_str)
        except ValueError:
            return None
        
        sinal = SinalMovimento.SAIDA if dados["sinal"] == "-" else SinalMovimento.ENTRADA
        nome = dados.get("nome")
        if nome:
            nome = nome.strip()
        
        descricao_completa = tipo
        
        return LancamentoBancario(
            dia=dia,
            tipo=tipo,
            documento=dados["doc"],
            valor=valor,
            sinal=sinal,
            descricao_completa=descricao_completa,
        )