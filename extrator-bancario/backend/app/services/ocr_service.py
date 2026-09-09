"""
Serviço de OCR usando Mistral AI.
Extrai texto de PDFs e retorna em formato markdown estruturado.
"""
import os
import base64
import requests
from pathlib import Path
from dotenv import load_dotenv

# Carrega .env
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class MistralOCRService:
    def __init__(self):
        self.api_key = os.getenv("MISTRAL_API_KEY")
        if not self.api_key or len(self.api_key) < 20:
            raise ValueError(f"MISTRAL_API_KEY inválida ou ausente")
        
        self.api_url = "https://api.mistral.ai/v1/ocr"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def extract_text(self, file_path: str | Path) -> str:
        """
        Extrai texto de um PDF usando Mistral OCR.
        Retorna o texto formatado em Markdown (tabelas estruturadas).
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
        
        print(f"📤 Enviando PDF para Mistral OCR: {file_path.name}")
        
        # Lê o arquivo e converte para base64
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        base64_content = base64.b64encode(file_content).decode('utf-8')
        
        # Monta o payload
        payload = {
            "model": "mistral-ocr-latest",
            "document": {
                "type": "document_url",
                "document_url": f"data:application/pdf;base64,{base64_content}"
            }
        }
        
        # Faz a requisição HTTP
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        
        # Verifica erros
        if response.status_code != 200:
            raise Exception(f"Erro na API da Mistral ({response.status_code}): {response.text}")
        
        data = response.json()
        
        # Extrai o markdown de todas as páginas
        full_text = "\n\n".join([
            page.get("markdown", "") for page in data.get("pages", [])
        ])
        
        print(f"✅ Mistral OCR extraiu {len(full_text)} caracteres")
        return full_text