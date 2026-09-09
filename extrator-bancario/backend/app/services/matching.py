"""
Motor de Matching — Compara lançamentos extraídos com histórico contábil.

CAMADAS DE CLASSIFICAÇÃO (ordem de prioridade):
  0. 🆕 Mapeamento Direto por Conta Bancária (mapeamento_contas_bancarias.json)
  1. Regras Fixas (regras_mapeamento.json) — Tarifas conhecidas
  2. 🆕 Regras Aprendidas (regras_aprendidas.json) — Aprendizado contínuo POR CONTA
  3. Histórico Contábil (PLANILHA AURORA) — Matching fuzzy (95%)
  4. Revisão Manual — Fallback quando não há match

ATENÇÃO:
  - NUNCA decide sozinho. Sempre marca como REVISAO se não houver match.
  - Usa rapidfuzz para comparação fuzzy de descrições.
  - Threshold de 95% de similaridade (configurável).
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

# 🆕 NOVO: Importação do serviço de regras aprendidas
from app.services.regras_service import RegrasService
# 🆕 NOVO: Importação do serviço de mapeamento de contas bancárias
from app.services.mapeamento_service import MapeamentoService


class MatchingEngine:
    """
    Motor de matching entre lançamentos novos e histórico contábil.
    """
    
    def __init__(
        self,
        caminho_historico: str | Path,
        caminho_regras: str | Path = "app/config/regras_mapeamento.json",
        threshold: float = 95.0,
    ):
        self.caminho_historico = Path(caminho_historico)
        self.caminho_regras = Path(caminho_regras)
        self.threshold = threshold
        
        # Carrega regras de mapeamento fixas
        self.regras = self._carregar_regras()
        
        # 🆕 NOVO: Inicializa o serviço de regras aprendidas
        self.regras_service = RegrasService()
        
        # 🆕 NOVO: Inicializa o serviço de mapeamento de contas bancárias
        self.mapeamento_service = MapeamentoService()
        
        # Carrega histórico
        self.historico = self._carregar_historico()
    
    def _carregar_regras(self) -> dict:
        if not self.caminho_regras.exists():
            print(f"⚠️  Arquivo de regras não encontrado: {self.caminho_regras}")
            return {}
        
        with open(self.caminho_regras, "r", encoding="utf-8") as f:
            dados = json.load(f)
        
        return dados.get("banrisul", {}).get("regras", {})
    
    def _carregar_historico(self) -> pd.DataFrame:
        if not self.caminho_historico.exists():
            raise FileNotFoundError(f"Histórico não encontrado: {self.caminho_historico}")
        
        df = pd.read_csv(self.caminho_historico, sep=";", encoding="utf-8")
        df = df.dropna(subset=["Data", "Valor"])
        df["Valor_float"] = df["Valor"].apply(self._converter_valor_br)
        df["Descricao"] = df["Complemento"].fillna("") + " " + df["Histórico"].fillna("")
        df["Descricao"] = df["Descricao"].str.strip().str.upper()
        
        return df
    
    def _converter_valor_br(self, valor_str: str) -> float:
        if pd.isna(valor_str):
            return 0.0
        
        valor_limpo = str(valor_str).replace("R$", "").strip()
        valor_limpo = valor_limpo.replace(".", "").replace(",", ".")
        
        try:
            return float(valor_limpo)
        except ValueError:
            return 0.0
    
    def classificar(self, extrato: ExtratoBancario) -> ExtratoBancario:
        """Classifica todos os lançamentos do extrato."""
        for lanc in extrato.lancamentos:
            # 🆕 NOVO: Passamos o número da conta E o banco para mapeamento direto
            self._classificar_lancamento(lanc, extrato.conta, extrato.banco)
        
        return extrato
    
    def _classificar_lancamento(self, lanc: LancamentoBancario, conta: str, banco: str = None) -> None:
        """Classifica um único lançamento seguindo a hierarquia de 5 camadas."""
        
        # 🆕 NOVO - CAMADA 0: Mapeamento direto por conta bancária (aplica crédito padrão)
        if banco:
            self._aplicar_mapeamento_conta(lanc, banco, conta)
        
        # CAMADA 1: Regras fixas (tipos conhecidos) - sobrescreve se existir
        if lanc.tipo in self.regras:
            regra = self.regras[lanc.tipo]
            lanc.status = StatusClassificacao.MATCH_AUTOMATICO
            lanc.conta_debito = regra["debito"]
            lanc.conta_credito = regra["credito"]
            lanc.match_encontrado = f"Regra fixa: {lanc.tipo}"
            lanc.similaridade = 100.0
            return
        
        # 🆕 NOVO - CAMADA 2: Regras aprendidas (específicas por conta) - sobrescreve se existir
        if self._aplicar_regra_aprendida(lanc, conta):
            return
        
        # CAMADA 3: Busca no histórico por valor + descrição
        self._buscar_match_historico(lanc)
        
        # CAMADA 4: Fallback para revisão manual
        if lanc.status != StatusClassificacao.MATCH_AUTOMATICO:
            lanc.status = StatusClassificacao.REVISAO_MANUAL

    # 🆕 NOVO: Método para aplicar mapeamento direto por conta bancária
    def _aplicar_mapeamento_conta(self, lanc: LancamentoBancario, banco: str, conta: str) -> bool:
        """
        Busca conta contábil diretamente pelo número da conta bancária.
        Aplica APENAS o crédito padrão (não sobrescreve débito).
        Retorna True se aplicou, False caso contrário.
        """
        conta_contabil = self.mapeamento_service.buscar_conta_contabil(banco, conta)
        
        if conta_contabil:
            # Define a conta contábil como crédito padrão
            lanc.conta_credito = conta_contabil
            lanc.match_encontrado = f"Mapeamento direto: Conta {conta} → {conta_contabil}"
            lanc.similaridade = 100.0
            return True
        
        return False

    #  NOVO: Método para aplicar regras aprendidas
    def _aplicar_regra_aprendida(self, lanc: LancamentoBancario, conta: str) -> bool:
        """
        Busca regra aprendida para esta conta e tipo de lançamento.
        Retorna True se aplicou, False caso contrário.
        """
        regra = self.regras_service.buscar_regra(conta, lanc.tipo)
        
        if regra:
            lanc.status = StatusClassificacao.MATCH_AUTOMATICO
            lanc.conta_debito = regra.get("debito")
            lanc.conta_credito = regra.get("credito")
            lanc.match_encontrado = f"Regra aprendida: {regra['descricao_parcial']} (Conta: {conta})"
            lanc.similaridade = 100.0
            return True
        
        return False
    
    def _buscar_match_historico(self, lanc: LancamentoBancario) -> None:
        candidatos = self.historico[self.historico["Valor_float"] == lanc.valor]
        
        if candidatos.empty:
            return
        
        melhor_match = None
        melhor_similaridade = 0.0
        descricao_nova = lanc.descricao_completa.upper()
        
        for _, row in candidatos.iterrows():
            descricao_historico = row["Descricao"]
            similaridade = fuzz.token_sort_ratio(descricao_nova, descricao_historico)
            
            if similaridade > melhor_similaridade:
                melhor_similaridade = similaridade
                melhor_match = row
        
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