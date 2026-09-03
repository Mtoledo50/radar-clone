"""
Motor de Matching — Compara lançamentos extraídos com histórico contábil.

Responsável por:
  1. Carregar regras de mapeamento (configuráveis)
  2. Carregar histórico de lançamentos (CSV Aurora)
  3. Para cada lançamento novo, buscar match por valor + descrição (95% similaridade)
  4. Aplicar regras fixas para tipos conhecidos (tarifas, resgastes)
  5. Classificar: MATCH_AUTOMATICO ou REVISAO_MANUAL
  6. Retornar lançamentos classificados prontos para revisão humana

ATENÇÃO:
  - NUNCA decide sozinho. Sempre marca como REVISAO se não houver match.
  - Usa rapidfuzz para comparação fuzzy de descrições.
  - Threshold de 95% de similaridade (configurável).
  - Regras de mapeamento são EDITÁVEIS (não hardcoded).
"""
import json
import pandas as pd
from pathlib import Path
from typing import Optional
from rapidfuzz import fuzz

from app.models.lancamento import (
    ExtratoBancario,
    LancamentoBancario,
    StatusClassificacao,
)


class MatchingEngine:
    """
    Motor de matching entre lançamentos novos e histórico contábil.
    
    Uso:
        engine = MatchingEngine("data/historico/PLANILHA AURORA 2025 12 MANU.csv")
        extrato_classificado = engine.classificar(extrato)
    """
    
    def __init__(
        self,
        caminho_historico: str | Path,
        caminho_regras: str | Path = "app/config/regras_mapeamento.json",
        threshold: float = 95.0,
    ):
        """
        Inicializa o motor de matching.
        
        Args:
            caminho_historico: Caminho para o CSV de histórico (formato Aurora)
            caminho_regras: Caminho para o arquivo de regras de mapeamento
            threshold: Percentual mínimo de similaridade para considerar match (0-100)
        """
        self.caminho_historico = Path(caminho_historico)
        self.caminho_regras = Path(caminho_regras)
        self.threshold = threshold
        
        # Carrega regras de mapeamento
        self.regras = self._carregar_regras()
        
        # Carrega histórico
        self.historico = self._carregar_historico()
    
    def _carregar_regras(self) -> dict:
        """
        Carrega regras de mapeamento do arquivo JSON.
        
        Exemplo de regra:
        {
          "TARIFA MAN.CC/ATIVA": {
            "debito": "565",
            "credito": "615"
          }
        }
        """
        if not self.caminho_regras.exists():
            print(f"⚠️  Arquivo de regras não encontrado: {self.caminho_regras}")
            print("   Usando regras padrão vazias.")
            return {}
        
        with open(self.caminho_regras, "r", encoding="utf-8") as f:
            dados = json.load(f)
        
        # Retorna apenas as regras do Banrisul (por enquanto)
        return dados.get("banrisul", {}).get("regras", {})
    
    def _carregar_historico(self) -> pd.DataFrame:
        """
        Carrega o histórico de lançamentos do CSV Aurora.
        
        Formato esperado:
        Data;Débito;Crédito;Valor;Histórico;Complemento
        01/12/2025;565;615;R$ 60,00;;RENOVAÇÃO DE CADASTRO
        """
        if not self.caminho_historico.exists():
            raise FileNotFoundError(f"Histórico não encontrado: {self.caminho_historico}")
        
        # Lê o CSV com separador ;
        df = pd.read_csv(self.caminho_historico, sep=";", encoding="utf-8")
        
        # Remove linhas vazias
        df = df.dropna(subset=["Data", "Valor"])
        
        # Converte valor brasileiro para float
        # "R$ 60,00" → 60.00
        df["Valor_float"] = df["Valor"].apply(self._converter_valor_br)
        
        # Preenche descrições vazias
        df["Descricao"] = df["Complemento"].fillna("") + " " + df["Histórico"].fillna("")
        df["Descricao"] = df["Descricao"].str.strip().str.upper()
        
        return df
    
    def _converter_valor_br(self, valor_str: str) -> float:
        """
        Converte valor brasileiro para float.
        
        Exemplo:
            "R$ 60,00" → 60.00
            "R$ 1.068,90" → 1068.90
        """
        if pd.isna(valor_str):
            return 0.0
        
        # Remove "R$" e espaços
        valor_limpo = str(valor_str).replace("R$", "").strip()
        
        # Remove separador de milhar (.) e converte decimal (,)
        valor_limpo = valor_limpo.replace(".", "").replace(",", ".")
        
        try:
            return float(valor_limpo)
        except ValueError:
            return 0.0
    
    def classificar(self, extrato: ExtratoBancario) -> ExtratoBancario:
        """
        Classifica todos os lançamentos do extrato comparando com o histórico.
        
        Para cada lançamento:
          1. Verifica se existe regra fixa para o tipo (ex: TARIFA MAN.CC/ATIVA)
          2. Se existir → aplica regra automaticamente (MATCH_AUTOMATICO)
          3. Se não existir → busca match no histórico por valor + descrição
          4. Se encontrar match (95%+) → sugere D/C do histórico
          5. Se não encontrar → marca como REVISAO_MANUAL
        
        Args:
            extrato: Extrato bancário com lançamentos extraídos
            
        Returns:
            Extrato com lançamentos classificados (status, conta_debito, conta_credito)
        """
        for lanc in extrato.lancamentos:
            self._classificar_lancamento(lanc)
        
        return extrato
    
    def _classificar_lancamento(self, lanc: LancamentoBancario) -> None:
        """
        Classifica um único lançamento.
        
        Estratégia:
          1. Primeiro verifica regras fixas (tipos conhecidos)
          2. Se não encontrar, busca no histórico por valor + descrição
        """
        # 1. Verifica regras fixas (tipos conhecidos)
        if lanc.tipo in self.regras:
            regra = self.regras[lanc.tipo]
            lanc.status = StatusClassificacao.MATCH_AUTOMATICO
            lanc.conta_debito = regra["debito"]
            lanc.conta_credito = regra["credito"]
            lanc.match_encontrado = f"Regra fixa: {lanc.tipo}"
            lanc.similaridade = 100.0
            return
        
        # 2. Busca no histórico por valor + descrição
        self._buscar_match_historico(lanc)
    
    def _buscar_match_historico(self, lanc: LancamentoBancario) -> None:
        """
        Busca match no histórico comparando valor e descrição.
        
        Estratégia melhorada:
          1. Filtra histórico por valor exato
          2. Compara descrição COMPLETA (incluindo nome do destinatário)
          3. Se encontrar → sugere D/C do histórico
          4. Se não encontrar → marca como REVISAO_MANUAL
          
        Para PIX: a descrição inclui o nome do destinatário,
        o que aumenta muito a precisão do matching.
        """
        # Busca candidatos com o mesmo valor
        candidatos = self.historico[self.historico["Valor_float"] == lanc.valor]
        
        if candidatos.empty:
            lanc.status = StatusClassificacao.REVISAO_MANUAL
            return
        
        # Compara descrição com cada candidato
        melhor_match = None
        melhor_similaridade = 0.0
        
        # Usa descrição completa (inclui nome do destinatário para PIX)
        descricao_nova = lanc.descricao_completa.upper()
        
        for _, row in candidatos.iterrows():
            descricao_historico = row["Descricao"]
            
            # Calcula similaridade fuzzy (0-100)
            # Usamos token_sort_ratio para ignorar ordem das palavras
            similaridade = fuzz.token_sort_ratio(descricao_nova, descricao_historico)
            
            if similaridade > melhor_similaridade:
                melhor_similaridade = similaridade
                melhor_match = row
        
        # Verifica se atingiu o threshold
        if melhor_match is not None and melhor_similaridade >= self.threshold:
            lanc.status = StatusClassificacao.MATCH_AUTOMATICO
            lanc.conta_debito = str(melhor_match["Débito"])
            lanc.conta_credito = str(melhor_match["Crédito"])
            lanc.match_encontrado = melhor_match["Descricao"]
            lanc.similaridade = melhor_similaridade
        else:
            lanc.status = StatusClassificacao.REVISAO_MANUAL
            if melhor_match is not None:
                lanc.match_encontrado = f"{melhor_match['Descricao']} ({melhor_similaridade:.1f}%)"
                lanc.similaridade = melhor_similaridade