"""
ParserFactory — Detecta automaticamente o banco e retorna o parser correto.
Com fallback inteligente para Mistral OCR.
"""
from pathlib import Path
import pdfplumber

from app.parsers.base import BaseParser
from app.parsers.banrisul import ParserBanrisul
from app.parsers.sicredi import ParserSicredi
from app.parsers.bb import ParserBB


class ParserNaoDetectadoError(Exception):
    def __init__(self, mensagem: str, parsers_disponiveis: list[str]):
        super().__init__(mensagem)
        self.parsers_disponiveis = parsers_disponiveis


class ParserFactory:
    def __init__(self):
        self.parsers_registrados = [
            ParserBanrisul(),
            ParserSicredi(),
            ParserBB(),
        ]
        
        # Tenta inicializar o serviço de OCR de forma segura
        self.ocr_service = None
        try:
            from app.services.ocr_service import MistralOCRService
            self.ocr_service = MistralOCRService()
            print("✅ Mistral OCR configurado e pronto para fallback.")
        except Exception as e:
            # Falha silenciosa é aceitável aqui, o fallback simplesmente não estará disponível
            print(f"⚠️ Mistral OCR não será usado como fallback: {e}")

    def criar_parser(self, caminho_pdf: str | Path) -> BaseParser:
        caminho_pdf = Path(caminho_pdf)
        
        if not caminho_pdf.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {caminho_pdf}")
        
        # 1. Tenta extrair texto com pdfplumber (rápido e gratuito)
        texto_inicial = ""
        try:
            with pdfplumber.open(caminho_pdf) as pdf:
                for pagina in pdf.pages[:2]:
                    texto = pagina.extract_text()
                    if texto:
                        texto_inicial += texto + "\n"
        except Exception as e:
            print(f"⚠️ pdfplumber falhou na extração: {e}")
            
        # 2. FALLBACK: Se pdfplumber não extraiu nada, usa Mistral OCR
        if not texto_inicial.strip() and self.ocr_service:
            print("🔄 pdfplumber retornou texto vazio. Acionando Mistral OCR como fallback...")
            try:
                texto_inicial = self.ocr_service.extract_text(caminho_pdf)
            except Exception as e:
                print(f"❌ Mistral OCR também falhou: {e}")
                raise ParserNaoDetectadoError(
                    f"Falha em todas as tentativas de extração de texto: {str(e)}",
                    [p.nome_banco for p in self.parsers_registrados]
                )
        
        # 3. Validação final
        if not texto_inicial.strip():
            raise ParserNaoDetectadoError(
                "Não foi possível extrair texto do PDF. Verifique se é um PDF válido ou imagem escaneada.",
                [p.nome_banco for p in self.parsers_registrados]
            )
        
        # 4. Testa cada parser com o texto extraído
        for parser in self.parsers_registrados:
            try:
                if parser.detecta_banco(texto_inicial):
                    print(f"✅ Banco detectado: {parser.nome_banco}")
                    return parser
            except Exception as e:
                print(f"⚠️ Erro ao testar {parser.nome_banco}: {e}")
                continue
        
        raise ParserNaoDetectadoError(
            f"Nenhum parser identificou o banco.",
            [p.nome_banco for p in self.parsers_registrados]
        )
    
    def forcar_parser(self, codigo_banco: str) -> BaseParser:
        for parser in self.parsers_registrados:
            if parser.codigo_banco == codigo_banco:
                print(f"⚠️ Parser forçado manualmente: {parser.nome_banco}")
                return parser
        
        raise ValueError(
            f"Parser não encontrado: {codigo_banco}. "
            f"Disponíveis: {[p.codigo_banco for p in self.parsers_registrados]}"
        )
    
    def listar_parsers_disponiveis(self) -> list[dict]:
        return [
            {
                "codigo": p.codigo_banco,
                "nome": p.nome_banco,
                "classe": p.__class__.__name__,
            }
            for p in self.parsers_registrados
        ]