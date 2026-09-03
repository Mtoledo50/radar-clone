"""
Teste integrado do pipeline completo:
  1. Parser extrai lançamentos do PDF
  2. Matching Engine classifica com histórico + regras fixas
  3. CSV Builder gera arquivo Aurora
"""
from pathlib import Path
from app.parsers.banrisul import ParserBanrisul
from app.services.matching import MatchingEngine
from app.services.csv_builder import CSVBuilder

# Caminhos
pdf_path = Path("data/uploads/Extrato_Banrisul Mes 05PS.pdf")
historico_path = Path("data/historico/PLANILHA AURORA 2025 12 MANU.csv")
regras_path = Path("app/config/regras_mapeamento.json")
output_path = Path("data/output/extrato_mai_2026_aurora.csv")

print("=" * 100)
print("PIPELINE COMPLETO: Parser → Matching → CSV Builder")
print("=" * 100)

# 1. Parser
print("\n📄 PASSO 1: Extraindo lançamentos do PDF...")
parser = ParserBanrisul()
extrato = parser.parse(pdf_path)
print(f"   ✅ {extrato.total_lancamentos} lançamentos extraídos")

# 2. Matching
print("\n🔍 PASSO 2: Classificando com histórico + regras fixas...")
matching = MatchingEngine(historico_path, regras_path, threshold=95.0)
extrato_classificado = matching.classificar(extrato)

# Conta resultados
matches = sum(1 for l in extrato_classificado.lancamentos if l.status.value == "match")
revisoes = sum(1 for l in extrato_classificado.lancamentos if l.status.value == "revisao")
print(f"   ✅ {matches} matches automáticos")
print(f"   ⚠️  {revisoes} lançamentos para revisão manual")

# 3. CSV Builder
print("\n📊 PASSO 3: Gerando CSV Aurora...")
builder = CSVBuilder()
caminho_csv = builder.gerar(extrato_classificado, output_path)
print(f"   ✅ CSV gerado em: {caminho_csv}")

# 4. Resumo
print("\n" + "=" * 100)
print("RESUMO")
print("=" * 100)
print(f"Total de lançamentos: {extrato.total_lancamentos}")
print(f"Matches automáticos: {matches} ({matches/extrato.total_lancamentos*100:.1f}%)")
print(f"Revisão manual: {revisoes} ({revisoes/extrato.total_lancamentos*100:.1f}%)")
print(f"CSV gerado: {caminho_csv}")

# 5. Preview dos lançamentos classificados
print("\n" + "=" * 100)
print("LANÇAMENTOS CLASSIFICADOS")
print("=" * 100)
for i, lanc in enumerate(extrato_classificado.lancamentos, 1):
    status_icon = "✅" if lanc.status.value == "match" else "⚠️"
    dc_str = f"D:{lanc.conta_debito} C:{lanc.conta_credito}" if lanc.conta_debito else "PENDENTE"
    print(f"{i:3d} {status_icon} | Dia {lanc.dia:02d} | R$ {lanc.valor:>10,.2f} | {dc_str:<20} | {lanc.tipo}")
    if lanc.match_encontrado:
        print(f"     └─ Match: {lanc.match_encontrado[:60]}... ({lanc.similaridade:.1f}%)")