"""
Serviço de Mapeamento de Contas Bancárias para Contábeis.

PRINCÍPIO: "Fórmulas Configuráveis"
- Mapeamento em JSON editável (sem tocar no código)
- Suporte a contas específicas e padrão por banco
- Normalização de strings para evitar falhas por espaços

LGPD: Não armazena dados pessoais, apenas mapeamento técnico.
"""
import json
from pathlib import Path
from typing import Optional


class MapeamentoService:
    """
    Consulta o mapeamento de contas bancárias para contas contábeis.
    
    Uso:
        service = MapeamentoService()
        conta_contabil = service.buscar_conta_contabil("BANRISUL", "06.255491.0-6")
        # Retorna: "822"
    """
    
    def __init__(self, caminho_arquivo: str = "app/config/mapeamento_contas_bancarias.json"):
        self.caminho_arquivo = Path(caminho_arquivo)
        self.dados = self._carregar_dados()
    
    def _carregar_dados(self) -> dict:
        """Carrega mapeamento do arquivo JSON"""
        if not self.caminho_arquivo.exists():
            print(f"⚠️  Arquivo de mapeamento não encontrado: {self.caminho_arquivo}")
            return {"mapeamento": {}}
        
        with open(self.caminho_arquivo, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def _normalizar_conta(self, conta: str) -> str:
        """Remove espaços e normaliza para comparação"""
        return str(conta).strip().replace(" ", "")
    
    def buscar_conta_contabil(self, banco: str, conta_bancaria: str) -> Optional[str]:
        """
        Busca a conta contábil correspondente à conta bancária.
        
        Args:
            banco: Nome do banco (ex: "BANRISUL", "SICREDI")
            conta_bancaria: Número da conta bancária (ex: "06.255491.0-6")
            
        Returns:
            Código da conta contábil (ex: "822") ou None se não encontrar
        """
        banco_upper = banco.upper().strip()
        conta_normalizada = self._normalizar_conta(conta_bancaria)
        
        # Verifica se o banco existe no mapeamento
        if banco_upper not in self.dados["mapeamento"]:
            print(f"⚠️  Banco não encontrado no mapeamento: {banco_upper}")
            return None
        
        mapeamento_banco = self.dados["mapeamento"][banco_upper]
        
        # 1. Tenta encontrar conta específica
        contas_especificas = mapeamento_banco.get("contas_especificas", {})
        for conta_mapeada, dados in contas_especificas.items():
            if self._normalizar_conta(conta_mapeada) == conta_normalizada:
                return dados["conta_contabil"]
        
        # 2. Se não encontrou específica, usa conta padrão
        conta_padrao = mapeamento_banco.get("conta_padrao")
        if conta_padrao:
            return conta_padrao["conta_contabil"]
        
        return None
    
    def get_resumo(self) -> dict:
        """Retorna resumo do mapeamento"""
        resumo = {}
        for banco, dados in self.dados["mapeamento"].items():
            resumo[banco] = {
                "contas_especificas": len(dados.get("contas_especificas", {})),
                "conta_padrao": dados.get("conta_padrao", {}).get("conta_contabil", "N/A")
            }
        return resumo