"""
Teste do ParserSicredi
"""
from pathlib import Path
from app.parsers.sicredi import ParserSicredi
from app.models.lancamento import SinalMovimento  # ← ADICIONE ESTA LINHA


pdf_path = Path("data/uploads/extrato Sicredi 052026.pdf")

print("=" * 80)
print("TESTE: ParserSicredi")
print("=" * 80)

parser = ParserSicredi()
extrato = parser.parse(pdf_path)

print(f"\n✅ Banco: {extrato.banco}")
print(f"✅ Cooperativa: {extrato.agencia}")
print(f"✅ Conta: {extrato.conta}")
print(f"✅ Associado: {extrato.nome_cliente}")
print(f"✅ Competência: {extrato.competencia}")
print(f"✅ Total de lançamentos: {extrato.total_lancamentos}")
print(f"✅ Total entradas: R$ {extrato.total_entradas:,.2f}")
print(f"✅ Total saídas: R$ {extrato.total_saidas:,.2f}")

print("\n📋 Lançamentos extraídos:")
print("-" * 100)
for i, lanc in enumerate(extrato.lancamentos[:10], 1):  # Mostra só os 10 primeiros
    sinal_str = "+" if lanc.sinal == SinalMovimento.ENTRADA else "-"
    print(f"{i:3d} | Dia {lanc.dia:02d} | {sinal_str} R$ {lanc.valor:>10,.2f} | {lanc.tipo:<25} | {lanc.descricao_completa[:40]}")

print("\n" + "=" * 80)