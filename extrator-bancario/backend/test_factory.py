"""
Teste do ParserFactory com detecção automática.
"""
from pathlib import Path
from app.parsers import ParserFactory, ParserNaoDetectadoError

# Caminho do PDF de teste
pdf_path = Path("data/uploads/extrato Sicredi 052026.pdf")

print("=" * 80)
print("TESTE: ParserFactory - Detecção Automática")
print("=" * 80)

# 1. Lista parsers disponíveis
factory = ParserFactory()
print("\n📋 Parsers registrados:")
for p in factory.listar_parsers_disponiveis():
    print(f"   - {p['nome']} ({p['codigo']})")

# 2. Testa detecção automática
print(f"\n Detectando banco do PDF: {pdf_path.name}")
try:
    parser = factory.criar_parser(pdf_path)
    print(f"   ✅ Banco detectado: {parser.nome_banco}")
    print(f"   ✅ Código: {parser.codigo_banco}")
    
    # 3. Faz o parse
    print(f"\n📄 Parseando extrato...")
    extrato = parser.parse(pdf_path)
    print(f"   ✅ {extrato.total_lancamentos} lançamentos extraídos")
    print(f"   ✅ Agência: {extrato.agencia}")
    print(f"   ✅ Conta: {extrato.conta}")
    print(f"   ✅ Competência: {extrato.competencia}")
    
    # 4. Testa mascaramento LGPD
    print(f"\n🔐 Teste LGPD:")
    print(f"   Nome original: {extrato.nome_cliente}")
    print(f"   Nome mascarado: {parser.mascarar_nome(extrato.nome_cliente)}")
    
except ParserNaoDetectadoError as e:
    print(f"   ❌ Erro: {e}")
    print(f"   Parsers disponíveis: {e.parsers_disponiveis}")
except Exception as e:
    print(f"    Erro inesperado: {e}")

print("\n" + "=" * 80)
print("TESTE CONCLUÍDO")
print("=" * 80)