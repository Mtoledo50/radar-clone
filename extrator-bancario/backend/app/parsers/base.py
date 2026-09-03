"""
Interface base para todos os parsers de extratos bancários.

PRINCÍPIO: Todo parser deve seguir este contrato para ser compatível
com o ParserFactory e com o pipeline de classificação.

ATENÇÃO LGPD:
  - Todos os parsers devem mascarar nomes em logs
  - Nomes completos NUNCA devem aparecer em respostas de API
  - PDFs devem ser deletados após processamento
"""
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from app.models.lancamento import ExtratoBancario


class BaseParser(ABC):
    """
    Classe abstrata que DEFINE o contrato para todos os parsers.
    
    Qualquer novo parser (Itaú, Bradesco, BB, etc.) DEVE:
      1. Herdar de BaseParser
      2. Implementar o método parse()
      3. Implementar o método detecta_banco()
      4. Retornar um objeto ExtratoBancario padronizado
    """
    
    @abstractmethod
    def parse(self, caminho_pdf: str | Path) -> ExtratoBancario:
        """
        Faz o parse completo do PDF e retorna um ExtratoBancario padronizado.
        
        Args:
            caminho_pdf: Caminho para o arquivo PDF
            
        Returns:
            ExtratoBancario com todos os lançamentos extraídos
            
        Raises:
            Exception: Se o PDF não for válido ou estiver corrompido
        """
        pass
    
    @abstractmethod
    def detecta_banco(self, texto_pdf: str) -> bool:
        """
        Verifica se este parser é compatível com o PDF fornecido.
        
        Estratégia: Busca por "assinaturas" únicas de cada banco no texto
        (ex: "BANRISUL", "ITAÚ UNIBANCO", "BRADESCO", etc.)
        
        Args:
            texto_pdf: Texto bruto extraído das primeiras páginas do PDF
            
        Returns:
            True se este parser serve para este PDF, False caso contrário
        """
        pass
    
    @property
    @abstractmethod
    def nome_banco(self) -> str:
        """
        Nome legível do banco (ex: "BANRISUL", "ITAÚ", "BRADESCO").
        Usado para logs e interface do usuário.
        """
        pass
    
    @property
    @abstractmethod
    def codigo_banco(self) -> str:
        """
        Código único do banco (usado como chave em configurações).
        Ex: "banrisul", "itau", "bradesco"
        """
        pass
    
    def extrair_texto_inicial(self, caminho_pdf: Path, max_paginas: int = 2) -> str:
        """
        Extrai texto das primeiras páginas do PDF (para detecção).
        
        OTIMIZAÇÃO: Não precisa ler o PDF inteiro só para detectar o banco.
        Lê no máximo 2 páginas (geralmente o cabeçalho está na primeira).
        
        Args:
            caminho_pdf: Caminho para o arquivo PDF
            max_paginas: Número máximo de páginas para ler
            
        Returns:
            Texto bruto das primeiras páginas
        """
        import pdfplumber
        
        texto_parts = []
        with pdfplumber.open(caminho_pdf) as pdf:
            for i, pagina in enumerate(pdf.pages):
                if i >= max_paginas:
                    break
                texto = pagina.extract_text()
                if texto:
                    texto_parts.append(texto)
        
        return "\n".join(texto_parts)
    
    def mascarar_nome(self, nome: Optional[str]) -> Optional[str]:
        """
        Mascara nomes para LGPD (ex: "MARIA LUIZA" → "M*** L***").
        
        Usado em logs e respostas de API para proteger dados pessoais.
        
        Args:
            nome: Nome completo a ser mascarado
            
        Returns:
            Nome mascarado ou None se o nome for None/vazio
        """
        if not nome:
            return None
        
        partes = nome.strip().split()
        partes_mascaradas = []
        for parte in partes:
            if len(parte) <= 2:
                partes_mascaradas.append(parte[0] + "***")
            else:
                partes_mascaradas.append(parte[0] + "***")
        
        return " ".join(partes_mascaradas)