"""
CSV Builder — Gera o CSV no formato Aurora para importação no SaaS contábil.

Responsável por:
  1. Receber extrato classificado (com D/C definidos)
  2. Converter para o formato CSV Aurora
  3. Salvar em arquivo pronto para upload

Formato de saída:
Data;Débito;Crédito;Valor;Histórico;Complemento
01/12/2025;565;615;R$ 60,00;;RENOVAÇÃO DE CADASTRO
"""
import pandas as pd
from pathlib import Path
from datetime import datetime

from app.models.lancamento import ExtratoBancario, SinalMovimento


class CSVBuilder:
    """
    Construtor de CSV no formato Aurora.
    
    Uso:
        builder = CSVBuilder()
        builder.gerar(extrato_classificado, "output/extrato_mai_2026.csv")
    """
    
    def gerar(self, extrato: ExtratoBancario, caminho_saida: str | Path) -> Path:
        """
        Gera o CSV no formato Aurora a partir do extrato classificado.
        
        Args:
            extrato: Extrato com lançamentos classificados (status, D/C)
            caminho_saida: Caminho onde salvar o CSV
            
        Returns:
            Caminho do arquivo CSV gerado
        """
        caminho_saida = Path(caminho_saida)
        caminho_saida.parent.mkdir(parents=True, exist_ok=True)
        
        # Extrai ano e mês da competência (ex: "MAI/2026" → 2026, 5)
        ano, mes = self._parsear_competencia(extrato.competencia)
        
        # Monta lista de linhas
        linhas = []
        for lanc in extrato.lancamentos:
            # Pula lançamentos não classificados (REVISAO_MANUAL sem D/C)
            if lanc.conta_debito is None or lanc.conta_credito is None:
                continue
            
            # Formata data (DD/MM/AAAA)
            data_str = f"{lanc.dia:02d}/{mes:02d}/{ano}"
            
            # Formata valor brasileiro (R$ X.XXX,XX)
            valor_str = self._formatar_valor_br(lanc.valor)
            
            # Define histórico e complemento
            historico = ""  # Vazio por enquanto
            complemento = lanc.descricao_completa
            
            linhas.append({
                "Data": data_str,
                "Débito": lanc.conta_debito,
                "Crédito": lanc.conta_credito,
                "Valor": valor_str,
                "Histórico": historico,
                "Complemento": complemento,
            })
        
        # Cria DataFrame e salva CSV
        df = pd.DataFrame(linhas)
        df.to_csv(caminho_saida, sep=";", index=False, encoding="utf-8")
        
        return caminho_saida
    
    def _parsear_competencia(self, competencia: str) -> tuple[int, int]:
        """
        Extrai ano e mês da competência.
        
        Exemplo:
            "MAI/2026" → (2026, 5)
        """
        meses = {
            "JAN": 1, "FEV": 2, "MAR": 3, "ABR": 4,
            "MAI": 5, "JUN": 6, "JUL": 7, "AGO": 8,
            "SET": 9, "OUT": 10, "NOV": 11, "DEZ": 12,
        }
        
        partes = competencia.split("/")
        mes_str = partes[0].upper()
        ano = int(partes[1])
        mes = meses.get(mes_str, 1)
        
        return ano, mes
    
    def _formatar_valor_br(self, valor: float) -> str:
        """
        Formata valor no padrão brasileiro.
        
        Exemplo:
            60.00 → "R$ 60,00"
            1068.90 → "R$ 1.068,90"
        """
        # Formata com 2 casas decimais e separador de milhar
        valor_formatado = f"{valor:,.2f}"
        
        # Troca vírgula por ponto e ponto por vírgula (padrão BR)
        valor_formatado = valor_formatado.replace(",", "X").replace(".", ",").replace("X", ".")
        
        return f"R$ {valor_formatado}"