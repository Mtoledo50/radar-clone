import os
from pathlib import Path
from dotenv import load_dotenv

# Define o caminho exato do arquivo .env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Lê a variável de ambiente
api_key = os.getenv("MISTRAL_API_KEY")

print("=" * 60)
print("🔍 TESTE DE LEITURA DO ARQUIVO .ENV")
print("=" * 60)
print(f"Caminho do arquivo : {env_path}")
print(f"Arquivo existe     : {env_path.exists()}")
print(f"Chave lida pelo Python: {api_key}")
print(f"Tamanho da chave   : {len(api_key) if api_key else 0} caracteres")
print("=" * 60)

# Verifica se a chave existe e tem um tamanho mínimo razoável (>= 20)
if api_key and len(api_key) >= 20:
    print("✅ SUCESSO! A chave foi lida corretamente pelo Python.")
    print("   Você pode prosseguir com a integração do Mistral OCR.")
else:
    print("❌ FALHA! A chave não foi lida ou é muito curta.")