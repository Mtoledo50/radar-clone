"""
Serviço de Gerenciamento de Regras Aprendidas.
Versão com normalização robusta de strings para evitar falhas por espaços em branco.
"""
import json
from pathlib import Path
from typing import Optional
from datetime import datetime
import uuid


class RegrasService:
    def __init__(self, caminho_arquivo: str = "app/config/regras_aprendidas.json"):
        self.caminho_arquivo = Path(caminho_arquivo)
        self.dados = self._carregar_dados()
    
    def _carregar_dados(self) -> dict:
        if not self.caminho_arquivo.exists():
            return {
                "regras": [],
                "metadata": {"ultima_atualizacao": None, "total_regras": 0, "versao": "1.1"}
            }
        with open(self.caminho_arquivo, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def _salvar_dados(self):
        self.caminho_arquivo.parent.mkdir(parents=True, exist_ok=True)
        self.dados["metadata"]["ultima_atualizacao"] = datetime.now().isoformat()
        self.dados["metadata"]["total_regras"] = len(self.dados["regras"])
        with open(self.caminho_arquivo, "w", encoding="utf-8") as f:
            json.dump(self.dados, f, indent=2, ensure_ascii=False)
    
    def _normalizar_conta(self, conta: str) -> str:
        """Remove TODOS os espaços da conta para garantir match perfeito"""
        return str(conta).strip().replace(" ", "")

    def buscar_regra(self, conta: str, descricao_parcial: str) -> Optional[dict]:
        descricao_parcial = str(descricao_parcial).upper().strip()
        conta_normalizada = self._normalizar_conta(conta)
        
        for regra in self.dados["regras"]:
            regra_conta_normalizada = self._normalizar_conta(regra["conta_origem"])
            if (regra_conta_normalizada == conta_normalizada and 
                regra["descricao_parcial"].upper().strip() == descricao_parcial):
                return regra
        return None
    
    def salvar_regra(self, conta: str, banco: str, descricao_parcial: str, 
                    debito: Optional[str], credito: Optional[str],
                    criado_por: str = "sistema") -> dict:
        
        conta_normalizada = self._normalizar_conta(conta)
        descricao_normalizada = str(descricao_parcial).upper().strip()
        
        regra_existente = self.buscar_regra(conta_normalizada, descricao_normalizada)
        
        if regra_existente:
            regra_existente["debito"] = str(debito).strip() if debito else None
            regra_existente["credito"] = str(credito).strip() if credito else None
            regra_existente["ultima_atualizacao"] = datetime.now().isoformat()
            regra_existente["vezes_usado"] += 1
            return regra_existente
        else:
            nova_regra = {
                "id": f"rule_{uuid.uuid4().hex[:8]}",
                "descricao_parcial": descricao_normalizada,
                "conta_origem": conta_normalizada,  # Salva já normalizada
                "banco": str(banco).strip().lower(),
                "debito": str(debito).strip() if debito else None,
                "credito": str(credito).strip() if credito else None,
                "criado_em": datetime.now().isoformat(),
                "criado_por": criado_por,
                "ultima_atualizacao": datetime.now().isoformat(),
                "vezes_usado": 1
            }
            self.dados["regras"].append(nova_regra)
            self._salvar_dados()
            return nova_regra
    
    def listar_regras_por_conta(self, conta: str) -> list:
        conta_normalizada = self._normalizar_conta(conta)
        return [r for r in self.dados["regras"] if self._normalizar_conta(r["conta_origem"]) == conta_normalizada]
    
    def excluir_regra(self, regra_id: str) -> bool:
        for i, regra in enumerate(self.dados["regras"]):
            if regra["id"] == regra_id:
                del self.dados["regras"][i]
                self._salvar_dados()
                return True
        return False
    
    def get_resumo(self) -> dict:
        contas = {}
        for regra in self.dados["regras"]:
            conta = self._normalizar_conta(regra["conta_origem"])
            contas[conta] = contas.get(conta, 0) + 1
        return {
            "total_regras": len(self.dados["regras"]),
            "regras_por_conta": contas,
            "ultima_atualizacao": self.dados["metadata"]["ultima_atualizacao"]
        }