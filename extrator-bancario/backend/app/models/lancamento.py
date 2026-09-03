"""
Modelos de dados (Pydantic) para os lançamentos bancários.
Pydantic valida automaticamente os tipos e garante consistência.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from enum import Enum


class SinalMovimento(str, Enum):
    """Define se o movimento é entrada (+) ou saída (-)"""
    ENTRADA = "+"    # Entra dinheiro na conta (ex: resgate CDB)
    SAIDA = "-"      # Sai dinheiro da conta (ex: PIX, boleto, tarifa)


class StatusClassificacao(str, Enum):
    """Status do matching com o histórico"""
    PENDENTE = "pendente"           # Ainda não foi classificado
    MATCH_AUTOMATICO = "match"      # Encontrou match no histórico (95%+)
    REVISAO_MANUAL = "revisao"      # Não encontrou match, humano decide
    APROVADO = "aprovado"           # Humano aprovou a classificação


class LancamentoBancario(BaseModel):
    """
    Representa UM lançamento extraído do extrato bancário.
    
    Exemplo:
        PIX ENVIADO 531968 352,00-NOME: MARIA LUIZA DUTRA MATTOS
        
    Vira:
        LancamentoBancario(
            dia=4, tipo="PIX ENVIADO", documento="531968",
            valor=352.00, sinal=SAIDA, nome_destinatario="MARIA..."
        )
    """
    dia: int = Field(..., ge=1, le=31, description="Dia do mês (1-31)")
    tipo: str = Field(..., description="Tipo do lançamento (PIX ENVIADO, PGTO BOLETO, etc)")
    documento: str = Field(..., description="Número do documento")
    valor: float = Field(..., gt=0, description="Valor absoluto (sem sinal)")
    sinal: SinalMovimento = Field(..., description="Entrada (+) ou Saída (-)")
    nome_destinatario: Optional[str] = Field(None, description="Nome no PIX (se houver)")
    descricao_completa: str = Field(..., description="Descrição completa para matching")
    
    # Campos preenchidos DEPOIS pelo matching engine (FASE 2)
    conta_debito: Optional[str] = Field(None, description="Código da conta a débito")
    conta_credito: Optional[str] = Field(None, description="Código da conta a crédito")
    status: StatusClassificacao = Field(default=StatusClassificacao.PENDENTE)
    match_encontrado: Optional[str] = Field(None, description="Descrição do match encontrado")
    similaridade: Optional[float] = Field(None, ge=0, le=100, description="% de similaridade")


class ExtratoBancario(BaseModel):
    """
    Representa o extrato COMPLETO de um banco (cabeçalho + lançamentos).
    """
    banco: str = Field(..., description="Nome do banco (ex: BANRISUL)")
    agencia: str = Field(..., description="Número da agência")
    conta: str = Field(..., description="Número da conta")
    nome_cliente: str = Field(..., description="Nome do cliente (mascarar!)")
    competencia: str = Field(..., description="Mês/ano de referência (ex: MAI/2026)")
    saldo_inicial: Optional[float] = Field(None, description="Saldo inicial")
    saldo_final: Optional[float] = Field(None, description="Saldo final")
    lancamentos: list[LancamentoBancario] = Field(default_factory=list)
    
    @property
    def total_entradas(self) -> float:
        """Soma de todos os valores com sinal +"""
        return sum(l.valor for l in self.lancamentos if l.sinal == SinalMovimento.ENTRADA)
    
    @property
    def total_saidas(self) -> float:
        """Soma de todos os valores com sinal -"""
        return sum(l.valor for l in self.lancamentos if l.sinal == SinalMovimento.SAIDA)
    
    @property
    def total_lancamentos(self) -> int:
        return len(self.lancamentos)