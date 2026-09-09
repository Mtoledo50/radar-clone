"""
Parser de extratos bancários do BANCO DO BRASIL.
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


class ParserBBError(Exception):
    pass


class ParserBB(BaseParser):
    
    @property
    def nome_banco(self) -> str:
        return "BANCO_DO_BRASIL"
    
    @property
    def codigo_banco(self) -> str:
        return "bb"
    
    REGEX_AGENCIA = re.compile(r'Ag[êe]ncia\s+([\d\-]+)')
    REGEX_CONTA = re.compile(r'Conta\s+(?:corrente\s+)?([\d\-]+)')
    REGEX_PERIODO = re.compile(r'Per[íi]odo\s+do\s+extrato\s+(\d{2})\s*/\s*(\d{4})')
    
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
    
    REGEX_NOME = re.compile(r'^\d{2}/\d{2}\s+\d{2}:\d{2}\s+(.+)$')

    def detecta_banco(self, texto: str) -> bool:
        return "BANCO DO BRASIL" in texto.upper() or ("AGÊNCIA" in texto.upper() and "CONTA" in texto.upper())

    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
        caminho_pdf = Path(caminho_pdf)
        if not caminho_pdf.exists():
            raise ParserBBError(f"Arquivo não encontrado: {caminho_pdf}")
        
        print(f"\n{'='*80}")
        print(f"🔍 PARSING BANCO DO BRASIL: {caminho_pdf}")
        print("="*80)
        
        texto = self._extrair_texto_pdf(caminho_pdf)
        
        # Normaliza caracteres
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
        match_ag = self.REGEX_AGENCIA.search(texto)
        match_ct = self.REGEX_CONTA.search(texto)
        match_per = self.REGEX_PERIODO.search(texto)
        
        if not match_ag or not match_ct:
            raise ParserBBError("Não extraí agência/conta")
        
        competencia = f"{match_per.group(1)}/{match_per.group(2)}" if match_per else "01/2026"
        
        cliente = "N/A"
        match_cli = re.search(r'(ASSOCIACAO[^\\n]+)', texto, re.IGNORECASE)
        if match_cli:
            cliente = re.sub(r'\s+', ' ', match_cli.group(1).strip())
        
        return {
            "agencia": match_ag.group(1).strip(),
            "conta": match_ct.group(1).strip(),
            "cliente": cliente,
            "competencia": competencia,
        }

    def _extrair_lancamentos(self, texto: str) -> list[LancamentoBancario]:
        linhas = [l for l in texto.split("\n") if l.strip() and not l.strip().startswith('|') and l.strip() != '---']
        lancs = []
        i = 0
        
        while i < len(linhas):
            linha = linhas[i].strip()
            i += 1
            
            if not linha or any(p in linha.upper() for p in ["DT.", "BALANCETE", "SALDO", "LANÇAMENTOS", "VISUALIZAR", "CONSULTAS"]):
                continue
            
            match = self.REGEX_LANC.match(linha)
            if match:
                data, ag, lote, hist, desc, doc_ou_val, valor_str, sinal = match.groups()
                valor = float(valor_str.replace(".", "").replace(",", "."))
                
                if valor == 0.0 or "SALDO" in desc.upper():
                    continue
                
                dia = int(data.split("/")[0])
                sinal_mov = SinalMovimento.SAIDA if sinal == "D" else SinalMovimento.ENTRADA
                
                nome = None
                if i < len(linhas):
                    prox = linhas[i].strip()
                    match_nome = self.REGEX_NOME.match(prox)
                    if match_nome:
                        nome = match_nome.group(1).strip()
                        i += 1
                
                desc_final = f"{desc.strip()} - {nome}" if nome else desc.strip()
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