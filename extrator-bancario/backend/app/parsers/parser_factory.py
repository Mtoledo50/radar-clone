"""
ParserFactory — Detecta automaticamente o banco e retorna o parser correto.

PRINCÍPIO: "Fórmulas Configuráveis"
  - A detecção é baseada em um arquivo JSON configurável
  - Para adicionar um novo banco, basta:
    1. Criar o parser (herdando de BaseParser)
    2. Adicionar a configuração no JSON
    3. Registrar no factory

HUMAN-IN-THE-LOOP:
  - Se não detectar o banco, retorna lista de parsers disponíveis
  - O usuário pode escolher manualmente qual parser usar
  - O sistema aprende com as escolhas (futuro: salvar preferência por cliente)

ATENÇÃO LGPD:
  - O texto extraído para detecção NUNCA é logado
  - Nomes de clientes são mascarados em todas as respostas
"""
import json
from pathlib import Path
from typing import Optional

from app.parsers.base import BaseParser
from app.parsers.banrisul import ParserBanrisul
from app.parsers.sicredi import ParserSicredi


class ParserNaoDetectadoError(Exception):
    """Erro quando nenhum parser consegue identificar o banco"""
    
    def __init__(self, mensagem: str, parsers_disponiveis: list[str]):
        super().__init__(mensagem)
        self.parsers_disponiveis = parsers_disponiveis


class ParserFactory:
    """
    Fábrica que detecta automaticamente o banco e retorna o parser correto.
    
    Uso:
        factory = ParserFactory()
        parser = factory.criar_parser("extrato.pdf")
        extrato = parser.parse("extrato.pdf")
    
    Fluxo:
      1. Lê as primeiras 2 páginas do PDF
      2. Compara com "assinaturas" de cada banco registrado
      3. Retorna o primeiro parser que detectar compatibilidade
      4. Se nenhum detectar → levanta ParserNaoDetectadoError com lista de parsers
    """
    
    def __init__(self, caminho_config: Optional[str | Path] = None):
        """
        Inicializa o factory com os parsers registrados.
        
        Args:
            caminho_config: Caminho para o arquivo de configuração JSON
                           (opcional, usa padrão se não fornecido)
        """
        self.parsers_registrados: list[BaseParser] = []
        self.config = self._carregar_config(caminho_config)
        self._registrar_parsers_padrao()
    
    def _carregar_config(self, caminho_config: Optional[str | Path]) -> dict:
        """
        Carrega configuração de parsers do JSON.
        
        Formato esperado:
        {
          "parsers": {
            "banrisul": {
              "ativo": true,
              "assinaturas": ["BANRISUL", "AGENCIA:", "CONTA..:"],
              "classe": "app.parsers.banrisul.ParserBanrisul"
            }
          }
        }
        """
        if caminho_config is None:
            caminho_config = Path("app/config/parsers_config.json")
        else:
            caminho_config = Path(caminho_config)
        
        if not caminho_config.exists():
            # Retorna config padrão se arquivo não existir
            return self._config_padrao()
        
        with open(caminho_config, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def _config_padrao(self) -> dict:
        """Configuração padrão (fallback)"""
        return {
            "parsers": {
                "banrisul": {
                    "ativo": True,
                    "assinaturas": ["BANRISUL", "AGENCIA:", "CONTA..:"],
                    "classe": "app.parsers.banrisul.ParserBanrisul"
                }
            }
        }
    
    def _registrar_parsers_padrao(self):
        """Registra os parsers padrão (hardcoded para começar)"""
        # Parser Banrisul (sempre ativo)
        self.parsers_registrados.append(ParserBanrisul())
        self.parsers_registrados.append(ParserSicredi())  # ← ADICIONAR ESTA LINHA
        
        # Futuro: carregar dinamicamente baseado no config
        # for codigo, config in self.config["parsers"].items():
        #     if config["ativo"]:
        #         parser = self._instanciar_parser(config["classe"])
        #         self.parsers_registrados.append(parser)
    
    def criar_parser(self, caminho_pdf: str | Path) -> BaseParser:
        """
        Detecta o banco e retorna o parser correto.
        
        Args:
            caminho_pdf: Caminho para o arquivo PDF
            
        Returns:
            Parser específico do banco detectado
            
        Raises:
            ParserNaoDetectadoError: Se nenhum parser conseguir identificar o banco
            FileNotFoundError: Se o PDF não existir
        """
        caminho_pdf = Path(caminho_pdf)
        
        if not caminho_pdf.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {caminho_pdf}")
        
        # 1. Extrai texto inicial (primeiras 2 páginas)
        parser_temporario = ParserBanrisul()  # Só para usar o método helper
        texto_inicial = parser_temporario.extrair_texto_inicial(caminho_pdf, max_paginas=2)
        
        if not texto_inicial.strip():
            raise ParserNaoDetectadoError(
                "Não foi possível extrair texto do PDF. Verifique se é um PDF válido.",
                [p.nome_banco for p in self.parsers_registrados]
            )
        
        # 2. Testa cada parser registrado
        for parser in self.parsers_registrados:
            try:
                if parser.detecta_banco(texto_inicial):
                    print(f"✅ Banco detectado: {parser.nome_banco}")
                    return parser
            except Exception as e:
                # Se um parser der erro na detecção, continua para o próximo
                print(f"⚠️  Erro ao testar parser {parser.nome_banco}: {e}")
                continue
        
        # 3. Nenhum parser detectou
        raise ParserNaoDetectadoError(
            f"Nenhum parser conseguiu identificar o banco. "
            f"Parsers disponíveis: {', '.join(p.nome_banco for p in self.parsers_registrados)}",
            [p.nome_banco for p in self.parsers_registrados]
        )
    
    def listar_parsers_disponiveis(self) -> list[dict]:
        """
        Lista todos os parsers registrados (para interface do usuário).
        
        Returns:
            Lista de dicionários com informações dos parsers
        """
        return [
            {
                "codigo": p.codigo_banco,
                "nome": p.nome_banco,
                "classe": p.__class__.__name__,
            }
            for p in self.parsers_registrados
        ]
    
    def forcar_parser(self, codigo_banco: str) -> BaseParser:
        """
        Força o uso de um parser específico (override manual).
        
        Usado quando a detecção automática falha e o usuário escolhe manualmente.
        
        Args:
            codigo_banco: Código do banco (ex: "banrisul", "itau")
            
        Returns:
            Parser específico
            
        Raises:
            ValueError: Se o código não corresponder a nenhum parser registrado
        """
        for parser in self.parsers_registrados:
            if parser.codigo_banco == codigo_banco:
                print(f"⚠️  Parser forçado manualmente: {parser.nome_banco}")
                return parser
        
        raise ValueError(
            f"Parser não encontrado para código: {codigo_banco}. "
            f"Disponíveis: {[p.codigo_banco for p in self.parsers_registrados]}"
        )